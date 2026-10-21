import type { ApiErrorCode } from '@/types/api'
import type { Permission } from '@/types/permissions'
import type { AuthUser } from '@/types/user'
import { can } from '@/utils/permissions'
import { db } from './db'

export interface MockRequest {
  method: string
  path: string
  params: Record<string, string>
  query: Record<string, string | undefined>
  body: Record<string, unknown>
  form: FormData | null
}

export class MockResponse {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {}
}

/** Binary payload (PDF invoices, CSV exports) — served as a Blob by the adapter. */
export class MockBlob {
  constructor(
    readonly content: string,
    readonly type: string,
  ) {}
}

export type Handler = (req: MockRequest) => unknown | Promise<unknown>

export interface Route {
  method: string
  pattern: RegExp
  keys: string[]
  handler: Handler
}

const routes: Route[] = []

/** Register a route: `on('GET', '/listings/:slug', handler)`. */
export function on(method: string, path: string, handler: Handler) {
  const keys: string[] = []
  const pattern = new RegExp(
    '^' +
      path.replace(/:([a-zA-Z_]+)/g, (_, key: string) => {
        keys.push(key)
        return '([^/]+)'
      }) +
      '/?$',
  )
  routes.push({ method: method.toUpperCase(), pattern, keys, handler })
}

/** Most specific route wins: fewer path params beats more (literal `/favorite` over `/:action`). */
export function match(method: string, path: string): { route: Route; params: Record<string, string> } | null {
  let best: { route: Route; params: Record<string, string> } | null = null
  for (const route of routes) {
    if (route.method !== method.toUpperCase()) continue
    const m = route.pattern.exec(path)
    if (!m) continue
    if (best && best.route.keys.length <= route.keys.length) continue
    const params: Record<string, string> = {}
    route.keys.forEach((key, i) => (params[key] = decodeURIComponent(m[i + 1] ?? '')))
    best = { route, params }
  }
  return best
}

/* ── Response helpers (mirror Laravel's envelope exactly) ───────────── */
export const ok = (data: unknown, message?: string, status = 200) =>
  new MockResponse(status, { success: true, ...(message ? { message } : {}), data })

export const created = (data: unknown, message = 'Created successfully.') => ok(data, message, 201)

export const noContent = () => new MockResponse(204, null)

export function paginate<T>(items: T[], query: Record<string, string | undefined>, extraMeta: Record<string, unknown> = {}, perPageDefault = 20) {
  const perPage = Math.min(100, Number(query.perPage) || perPageDefault)
  const total = items.length
  const lastPage = Math.max(1, Math.ceil(total / perPage))
  const page = Math.min(lastPage, Math.max(1, Number(query.page) || 1))
  const slice = items.slice((page - 1) * perPage, page * perPage)
  const link = (p: number | null) => (p ? `?page=${p}` : null)
  return new MockResponse(200, {
    success: true,
    data: slice,
    meta: {
      currentPage: page,
      perPage,
      total,
      lastPage,
      from: total ? (page - 1) * perPage + 1 : null,
      to: total ? (page - 1) * perPage + slice.length : null,
      ...extraMeta,
    },
    links: {
      first: link(1),
      last: link(lastPage),
      next: link(page < lastPage ? page + 1 : null),
      prev: link(page > 1 ? page - 1 : null),
    },
  })
}

export class MockHttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: ApiErrorCode,
    message: string,
    readonly errors?: Record<string, string[]>,
    readonly meta?: Record<string, unknown>,
  ) {
    super(message)
  }

  toResponse() {
    return new MockResponse(this.status, {
      success: false,
      message: this.message,
      code: this.code,
      ...(this.errors ? { errors: this.errors } : {}),
      ...(this.meta ? { meta: this.meta } : {}),
    })
  }
}

export const fail = (status: number, code: ApiErrorCode, message: string, errors?: Record<string, string[]>, meta?: Record<string, unknown>) =>
  new MockHttpError(status, code, message, errors, meta)

/** 422 with field errors keyed by snake_case path (as Laravel would send). */
export function validation(errors: Record<string, string>) {
  const out: Record<string, string[]> = {}
  for (const [k, v] of Object.entries(errors)) out[k] = [v]
  return fail(422, 'VALIDATION_ERROR', 'The submitted data is invalid.', out)
}

export const notFound = (what = 'Resource') => fail(404, 'NOT_FOUND', `${what} not found.`)

/* ── Auth helpers ───────────────────────────────────────────────────── */
export function currentUser(): AuthUser | null {
  const id = db.session.userId
  if (!id) return null
  const account = db.accounts.find((a) => a.id === id)
  if (!account) return null
  const { password: _p, twoFactorSecret: _t, ...user } = account
  return user
}

export function requireUser(): AuthUser {
  const user = currentUser()
  if (!user) throw fail(401, 'UNAUTHENTICATED', 'Unauthenticated.')
  if (user.status === 'suspended') throw fail(403, 'FORBIDDEN', 'Your account is suspended.')
  return user
}

export function requirePermission(permission: Permission | Permission[]): AuthUser {
  const user = requireUser()
  if (!can(user, permission)) throw fail(403, 'FORBIDDEN', 'This action is unauthorized.')
  return user
}

export const str = (v: unknown) => (typeof v === 'string' ? v : v === undefined || v === null ? '' : String(v))
export const num = (v: unknown) => (typeof v === 'number' ? v : Number(v) || 0)
export const id = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`
