import { isAxiosError, isCancel } from 'axios'
import type { ApiErrorBody, ApiErrorCode } from '@/types/api'
import { snakeToCamel } from './case'

const STATUS_TO_CODE: Record<number, ApiErrorCode> = {
  400: 'UNKNOWN',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  419: 'SESSION_EXPIRED',
  422: 'VALIDATION_ERROR',
  423: 'ACCOUNT_LOCKED',
  429: 'RATE_LIMITED',
  500: 'SERVER_ERROR',
  502: 'SERVER_ERROR',
  503: 'MAINTENANCE',
  504: 'TIMEOUT',
}

/** User-safe fallback copy. Raw server/stack messages are never shown for 5xx. */
const FRIENDLY: Partial<Record<ApiErrorCode, string>> = {
  NETWORK_ERROR: "You're offline or the server can't be reached. Check your connection and try again.",
  TIMEOUT: 'The request took too long. Please try again.',
  SERVER_ERROR: 'Something went wrong on our side. Please try again in a moment.',
  MAINTENANCE: 'Pilotwardrobe is down for scheduled maintenance.',
  RATE_LIMITED: 'Too many attempts. Please wait a moment and try again.',
  UNAUTHENTICATED: 'Please log in to continue.',
  FORBIDDEN: "You don't have permission to do that.",
  NOT_FOUND: "We couldn't find what you were looking for.",
  SESSION_EXPIRED: 'Your session expired. Please log in again.',
  UNKNOWN: 'Something went wrong. Please try again.',
}

/**
 * Normalised error thrown by every service call. Components only ever handle
 * ApiError — never raw Axios errors.
 */
export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorCode
  /** Field errors keyed by camelCase field path (first_name → firstName). */
  readonly fieldErrors: Record<string, string[]>
  readonly meta: Record<string, unknown>
  readonly requestId?: string

  constructor(init: {
    message: string
    status: number
    code: ApiErrorCode
    fieldErrors?: Record<string, string[]>
    meta?: Record<string, unknown>
    requestId?: string
  }) {
    super(init.message)
    this.name = 'ApiError'
    this.status = init.status
    this.code = init.code
    this.fieldErrors = init.fieldErrors ?? {}
    this.meta = init.meta ?? {}
    this.requestId = init.requestId
  }

  get isValidation() {
    return this.code === 'VALIDATION_ERROR'
  }

  get isNetwork() {
    return this.code === 'NETWORK_ERROR' || this.code === 'TIMEOUT'
  }

  get isCancelled() {
    return this.code === 'CANCELLED'
  }

  /** First message for a field, convenient for inline form errors. */
  field(name: string): string | undefined {
    return this.fieldErrors[name]?.[0]
  }
}

const camelPath = (path: string) => path.split('.').map(snakeToCamel).join('.')

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (isCancel(error) || (error instanceof DOMException && error.name === 'AbortError')) {
    return new ApiError({ message: 'Request cancelled', status: 0, code: 'CANCELLED' })
  }

  if (isAxiosError(error)) {
    const requestId = (error.config?.headers?.['X-Request-Id'] as string | undefined) ?? undefined
    if (!error.response) {
      const timeout = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
      const code: ApiErrorCode = timeout ? 'TIMEOUT' : 'NETWORK_ERROR'
      return new ApiError({ message: FRIENDLY[code]!, status: 0, code, requestId })
    }
    const { status } = error.response
    // Body may already be camelCased by the response interceptor; accept both shapes.
    const body = (error.response.data ?? {}) as Partial<ApiErrorBody> & { errors?: Record<string, string[]> }
    const code: ApiErrorCode = body.code ?? STATUS_TO_CODE[status] ?? (status >= 500 ? 'SERVER_ERROR' : 'UNKNOWN')
    const fieldErrors: Record<string, string[]> = {}
    for (const [key, messages] of Object.entries(body.errors ?? {})) {
      fieldErrors[camelPath(key)] = Array.isArray(messages) ? messages : [String(messages)]
    }
    // Never surface raw 5xx messages (may leak internals).
    const message =
      status >= 500 ? (FRIENDLY[code] ?? FRIENDLY.SERVER_ERROR!) : (body.message ?? FRIENDLY[code] ?? FRIENDLY.UNKNOWN!)
    return new ApiError({ message, status, code, fieldErrors, meta: body.meta ?? {}, requestId })
  }

  return new ApiError({ message: FRIENDLY.UNKNOWN!, status: 0, code: 'UNKNOWN' })
}

export const friendlyMessage = (code: ApiErrorCode) => FRIENDLY[code] ?? FRIENDLY.UNKNOWN!
