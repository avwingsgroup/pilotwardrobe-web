import { AxiosError, AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { appConfig } from '@/constants/config'
import { toCamel, toSnake } from '@/api/case'
import { match, MockBlob, MockHttpError, MockResponse, type MockRequest } from './server'
import { persistCommerce } from './db'
import './handlers/auth.handlers'
import './handlers/marketplace.handlers'
import './handlers/commerce.handlers'
import './handlers/social.handlers'
import './handlers/account.handlers'
import './handlers/admin.handlers'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function parseBody(data: unknown): { body: Record<string, unknown>; form: FormData | null } {
  if (data instanceof FormData) return { body: {}, form: data }
  if (typeof data === 'string' && data.length) {
    try {
      return { body: toCamel<Record<string, unknown>>(JSON.parse(data)), form: null }
    } catch {
      return { body: {}, form: null }
    }
  }
  if (data && typeof data === 'object') return { body: toCamel<Record<string, unknown>>(data), form: null }
  return { body: {}, form: null }
}

function toPath(config: InternalAxiosRequestConfig) {
  const raw = config.url ?? ''
  const base = config.baseURL ?? appConfig.apiBaseUrl
  const full = raw.startsWith('http') ? raw : `${base.replace(/\/$/, '')}/${raw.replace(/^\//, '')}`
  const url = new URL(full, window.location.origin)
  const basePath = new URL(base, window.location.origin).pathname.replace(/\/$/, '')
  const path = url.pathname.startsWith(basePath) ? url.pathname.slice(basePath.length) || '/' : url.pathname
  const query: Record<string, string> = {}
  url.searchParams.forEach((v, k) => (query[k] = v))
  for (const [k, v] of Object.entries((config.params as Record<string, unknown>) ?? {})) {
    if (v !== undefined && v !== null) query[k] = String(v)
  }
  return { path, query: toCamel<Record<string, string>>(query) }
}

/**
 * Axios adapter that serves contract-accurate responses from the in-memory mock
 * server. Responses go through the same snake_case serialisation as Laravel so the
 * client's case conversion, envelope unwrapping and error normalisation are all
 * exercised exactly as in production.
 */
export async function mockAdapter(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
  const method = (config.method ?? 'get').toUpperCase()
  const { path, query } = toPath(config)
  const { body, form } = parseBody(config.data)

  if (config.signal?.aborted) throw new AxiosError('canceled', AxiosError.ERR_CANCELED, config)
  const latency = appConfig.mockLatencyMs
  if (latency > 0) await sleep(latency * (0.6 + Math.random() * 0.8))
  if (config.signal?.aborted) throw new AxiosError('canceled', AxiosError.ERR_CANCELED, config)

  let result: MockResponse
  const found = match(method, path)
  try {
    if (!found) throw new MockHttpError(404, 'NOT_FOUND', `No mock route for ${method} ${path}`)
    const req: MockRequest = { method, path, params: found.params, query, body, form }
    const out = await found.route.handler(req)
    if (out instanceof MockBlob) {
      return {
        data: new Blob([out.content], { type: out.type }),
        status: 200,
        statusText: '200',
        headers: new AxiosHeaders({ 'content-type': out.type }),
        config,
        request: { mock: true },
      }
    }
    result = out instanceof MockResponse ? out : new MockResponse(200, { success: true, data: out })
    persistCommerce()
  } catch (error) {
    if (error instanceof MockHttpError) result = error.toResponse()
    else {
      console.error('[mock] handler crashed', method, path, error)
      result = new MockResponse(500, { success: false, message: 'Server Error', code: 'SERVER_ERROR' })
    }
  }

  const response: AxiosResponse = {
    data: result.body === null ? '' : JSON.stringify(toSnake(result.body)),
    status: result.status,
    statusText: String(result.status),
    headers: new AxiosHeaders({ 'content-type': 'application/json' }),
    config,
    request: { mock: true },
  }

  // Let axios' standard transformResponse parse JSON (adapters receive raw data).
  if (typeof response.data === 'string' && response.data.length) {
    response.data = JSON.parse(response.data)
  }

  if (result.status >= 400) {
    throw new AxiosError(
      `Request failed with status code ${result.status}`,
      result.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
      config,
      response.request,
      response,
    )
  }
  return response
}
