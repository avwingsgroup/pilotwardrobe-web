/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_APP_URL: string
  readonly VITE_API_BASE_URL: string
  /** `mock` serves contract-accurate fixtures in the browser; `live` calls Laravel. */
  readonly VITE_API_MODE: 'mock' | 'live'
  /** `cookie` = Sanctum SPA session (recommended); `token` = Bearer access token. */
  readonly VITE_AUTH_MODE: 'cookie' | 'token'
  readonly VITE_SANCTUM_CSRF_URL?: string
  readonly VITE_MOCK_LATENCY_MS?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
