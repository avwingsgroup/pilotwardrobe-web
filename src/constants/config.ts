/**
 * Runtime configuration derived from Vite env (non-secret values only).
 * See .env.example. Anything here is visible to every visitor.
 */
const env = import.meta.env

export const appConfig = {
  name: env.VITE_APP_NAME || 'Pilotwardrobe',
  appUrl: (env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, ''),
  apiBaseUrl: (env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, ''),
  apiMode: (env.VITE_API_MODE || 'mock') as 'mock' | 'live',
  authMode: (env.VITE_AUTH_MODE || 'cookie') as 'cookie' | 'token',
  csrfUrl: env.VITE_SANCTUM_CSRF_URL || '/sanctum/csrf-cookie',
  mockLatencyMs: Number(env.VITE_MOCK_LATENCY_MS ?? 350),
  googleClientId: env.VITE_GOOGLE_CLIENT_ID || '',
  requestTimeoutMs: 20_000,
  defaultCurrency: 'USD' as const,
  defaultLocale: 'en',
} as const

/** Compile-time constant so live builds can tree-shake mock-only code paths. */
export const isMockApi = import.meta.env.VITE_API_MODE !== 'live'
