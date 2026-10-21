/**
 * Transport-level contracts shared by every endpoint.
 *
 * Laravel returns snake_case JSON. The HTTP client converts keys to camelCase on the
 * way in and back to snake_case on the way out (see src/api/case.ts), so all types in
 * src/types are expressed in camelCase. docs/backend-api-contract.md documents the
 * wire (snake_case) shape.
 */

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
}

export interface PaginationMeta {
  currentPage: number
  perPage: number
  total: number
  lastPage: number
  from?: number | null
  to?: number | null
}

export interface PaginationLinks {
  first: string | null
  last: string | null
  next: string | null
  prev: string | null
}

export interface PaginatedResponse<T> {
  success: boolean
  message?: string
  data: T[]
  meta: PaginationMeta
  links: PaginationLinks
}

/** Machine-readable error codes. Mirrors docs/frontend-backend-handoff.md §Error codes. */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'SESSION_EXPIRED'
  | 'ACCOUNT_LOCKED'
  | 'TWO_FACTOR_REQUIRED'
  | 'EMAIL_NOT_VERIFIED'
  | 'KYC_REQUIRED'
  | 'INVALID_STATE_TRANSITION'
  | 'PAYMENT_FAILED'
  | 'GATEWAY_UNAVAILABLE'
  | 'TOKEN_EXPIRED'
  | 'MAINTENANCE'
  | 'SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'CANCELLED'
  | 'UNKNOWN'

export interface ApiErrorBody {
  success: false
  message: string
  code: ApiErrorCode
  errors?: Record<string, string[]>
  /** Optional structured context, e.g. { attempts_remaining: 2 } */
  meta?: Record<string, unknown>
}

export interface ListQuery {
  page?: number
  perPage?: number
  sort?: string
  search?: string
}

export type Id = string
/** ISO-8601 timestamp in UTC, e.g. 2026-07-31T10:42:08Z */
export type IsoDateTime = string
/** ISO-4217 code */
export type CurrencyCode = 'USD' | 'NGN' | 'GHS' | 'GBP' | 'EUR'
/** ISO-3166-1 alpha-2 */
export type CountryCode = string

/** Money is always integer minor units (cents / kobo). */
export interface Money {
  amount: number
  currency: CurrencyCode
  /** Server-formatted display string; frontend falls back to Intl if absent. */
  formatted?: string
}
