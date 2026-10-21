import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { appConfig } from '@/constants/config'
import type { ApiResponse, PaginatedResponse } from '@/types/api'
import { toCamel, toSnake } from './case'
import { toApiError } from './errors'
import { tokenStore } from './token'

/* ── Global HTTP events (auth store / router subscribe in main.ts) ───────── */
export type HttpEvent = 'unauthenticated' | 'session-expired' | 'maintenance' | 'forbidden'
type Listener = (detail: { url?: string }) => void
const listeners = new Map<HttpEvent, Set<Listener>>()

export const httpEvents = {
  on(event: HttpEvent, listener: Listener) {
    if (!listeners.has(event)) listeners.set(event, new Set())
    listeners.get(event)!.add(listener)
    return () => listeners.get(event)?.delete(listener)
  },
  emit(event: HttpEvent, detail: { url?: string } = {}) {
    listeners.get(event)?.forEach((fn) => fn(detail))
  },
}

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Skip global 401 redirect (e.g. for /auth/me probes and login attempts). */
    skipAuthRedirect?: boolean
    /** Send the body as-is (FormData uploads) — no snake_case conversion. */
    rawBody?: boolean
  }
}

const requestId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

function createClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: appConfig.apiBaseUrl,
    timeout: appConfig.requestTimeoutMs,
    withCredentials: appConfig.authMode === 'cookie',
    // Laravel Sanctum sets XSRF-TOKEN; axios echoes it as X-XSRF-TOKEN for same-site requests.
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
    withXSRFToken: appConfig.authMode === 'cookie',
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  })

  // In mock mode, route every request to the in-browser contract fixtures.
  // The condition reads import.meta.env directly so live builds tree-shake the mocks out.
  if (import.meta.env.VITE_API_MODE !== 'live') {
    instance.defaults.adapter = async (config) => {
      const { mockAdapter } = await import('@/mocks/adapter')
      return mockAdapter(config)
    }
  }

  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    config.headers.set('X-Request-Id', requestId())
    config.headers.set('Accept-Language', document.documentElement.lang || appConfig.defaultLocale)

    const token = tokenStore.get()
    if (appConfig.authMode === 'token' && token) {
      config.headers.set('Authorization', `Bearer ${token}`)
    }
    if (config.params) config.params = toSnake(stripEmpty(config.params as Record<string, unknown>))
    if (config.data && !config.rawBody && !(config.data instanceof FormData)) {
      config.data = toSnake(config.data)
    }
    return config
  })

  instance.interceptors.response.use(
    (response) => {
      if (response.data && typeof response.data === 'object' && !(response.data instanceof Blob)) {
        response.data = toCamel(response.data)
      }
      return response
    },
    (error) => {
      const apiError = toApiError(error)
      const config = (error as { config?: AxiosRequestConfig }).config
      if (apiError.status === 401 && !config?.skipAuthRedirect) {
        tokenStore.clear()
        httpEvents.emit('unauthenticated', { url: config?.url })
      } else if (apiError.status === 419) {
        httpEvents.emit('session-expired', { url: config?.url })
      } else if (apiError.status === 503 && apiError.code === 'MAINTENANCE') {
        httpEvents.emit('maintenance', { url: config?.url })
      } else if (apiError.status === 403) {
        httpEvents.emit('forbidden', { url: config?.url })
      }
      return Promise.reject(apiError)
    },
  )

  return instance
}

function stripEmpty(params: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value) && value.length === 0) continue
    out[key] = Array.isArray(value) ? value.join(',') : value
  }
  return out
}

export const http = createClient()

/** Fetch the Sanctum CSRF cookie before state-changing auth calls (cookie mode only). */
let csrfPromise: Promise<void> | null = null
export function ensureCsrfCookie(): Promise<void> {
  if (appConfig.authMode !== 'cookie' || import.meta.env.VITE_API_MODE !== 'live') return Promise.resolve()
  csrfPromise ??= axios
    .get(appConfig.csrfUrl, { withCredentials: true })
    .then(() => undefined)
    .finally(() => {
      csrfPromise = null
    })
  return csrfPromise
}

/* ── Typed helpers: return the unwrapped envelope payload ───────────────── */
type Cfg = AxiosRequestConfig & { signal?: AbortSignal }

export const api = {
  async get<T>(url: string, config?: Cfg): Promise<T> {
    const res = await http.get<ApiResponse<T>>(url, config)
    return res.data.data
  },
  async list<T>(url: string, config?: Cfg): Promise<PaginatedResponse<T>> {
    const res = await http.get<PaginatedResponse<T>>(url, config)
    return res.data
  },
  async post<T>(url: string, body?: unknown, config?: Cfg): Promise<T> {
    const res = await http.post<ApiResponse<T>>(url, body, config)
    return res.data?.data as T
  },
  async put<T>(url: string, body?: unknown, config?: Cfg): Promise<T> {
    const res = await http.put<ApiResponse<T>>(url, body, config)
    return res.data?.data as T
  },
  async patch<T>(url: string, body?: unknown, config?: Cfg): Promise<T> {
    const res = await http.patch<ApiResponse<T>>(url, body, config)
    return res.data?.data as T
  },
  async delete<T = void>(url: string, config?: Cfg): Promise<T> {
    const res = await http.delete<ApiResponse<T>>(url, config)
    return res.data?.data as T
  },
  /** Request with the full envelope (when `message` matters). */
  async postEnvelope<T>(url: string, body?: unknown, config?: Cfg): Promise<ApiResponse<T>> {
    const res = await http.post<ApiResponse<T>>(url, body, config)
    return res.data
  },
}
