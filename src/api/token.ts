/**
 * Bearer token persistence — used only when VITE_AUTH_MODE=token.
 *
 * In the recommended cookie mode (Laravel Sanctum SPA auth) the session lives in an
 * httpOnly, Secure, SameSite cookie that JavaScript cannot read, and this store stays
 * empty.
 *
 * Token mode keeps the token in memory and mirrors it to sessionStorage (tab-scoped)
 * or, when "Keep me signed in" is ticked, localStorage. Tokens should be short-lived
 * and rotated by the backend.
 */
const KEY = 'pw.at'
let memoryToken: string | null = null

function storage(kind: 'session' | 'local'): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

export const tokenStore = {
  get(): string | null {
    if (memoryToken) return memoryToken
    memoryToken = storage('session')?.getItem(KEY) ?? storage('local')?.getItem(KEY) ?? null
    return memoryToken
  },
  set(token: string, remember: boolean) {
    memoryToken = token
    storage(remember ? 'local' : 'session')?.setItem(KEY, token)
    storage(remember ? 'session' : 'local')?.removeItem(KEY)
  },
  clear() {
    memoryToken = null
    storage('session')?.removeItem(KEY)
    storage('local')?.removeItem(KEY)
  },
}
