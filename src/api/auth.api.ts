import type {
  AuthUser,
  EmailLookupResult,
  FinishSocialSetupPayload,
  ForgotPasswordPayload,
  LinkSocialPayload,
  LoginPayload,
  LoginResult,
  RegisterPayload,
  RegisterResult,
  ResetPasswordPayload,
  ResetTokenStatus,
  SocialCallbackResult,
  SocialProvider,
  StaffSignInStart,
  TwoFactorPayload,
  VerifyEmailPayload,
} from '@/types'
import { api, ensureCsrfCookie } from './client'

const quiet = { skipAuthRedirect: true }

/**
 * `status` is an additive field: a backend that returns only `{ user, access_token }`
 * (the brief's minimal login shape) or only `{ challenge_id, methods }` still works.
 */
function normalizeLogin(raw: LoginResult | (Partial<LoginResult> & Record<string, unknown>)): LoginResult {
  if (raw.status) return raw as LoginResult
  if ('challengeId' in raw && raw.challengeId) return { ...(raw as object), status: 'two_factor_required' } as LoginResult
  return { ...(raw as object), status: 'authenticated' } as LoginResult
}

export const authService = {
  async lookupEmail(email: string) {
    await ensureCsrfCookie()
    return api.post<EmailLookupResult>('/auth/email-lookup', { email }, quiet)
  },
  async login(payload: LoginPayload) {
    await ensureCsrfCookie()
    return normalizeLogin(await api.post<LoginResult>('/auth/login', payload, quiet))
  },
  async verifyTwoFactor(payload: TwoFactorPayload) {
    return normalizeLogin(await api.post<LoginResult>('/auth/two-factor', payload, quiet))
  },
  sendTwoFactorSms(challengeId: string) {
    return api.post<{ sentTo: string }>('/auth/two-factor/sms', { challengeId }, quiet)
  },
  async register(payload: RegisterPayload) {
    await ensureCsrfCookie()
    return api.post<RegisterResult>('/auth/register', payload, quiet)
  },
  verifyEmail(payload: VerifyEmailPayload) {
    return api.post<AuthUser>('/auth/email/verify', payload, quiet)
  },
  resendVerification(email: string) {
    return api.post<{ resendAvailableIn: number }>('/auth/email/resend', { email }, quiet)
  },
  async forgotPassword(payload: ForgotPasswordPayload) {
    await ensureCsrfCookie()
    return api.post<{ resendAvailableIn: number }>('/auth/password/forgot', payload, quiet)
  },
  checkResetToken(token: string, email: string) {
    return api.get<ResetTokenStatus>(`/auth/password/reset/${encodeURIComponent(token)}`, { params: { email }, ...quiet })
  },
  resetPassword(payload: ResetPasswordPayload) {
    return api.post<{ reset: true }>('/auth/password/reset', payload, quiet)
  },
  me(signal?: AbortSignal) {
    return api.get<AuthUser>('/auth/me', { signal, ...quiet })
  },
  logout() {
    return api.post<void>('/auth/logout', undefined, quiet)
  },
  usernameAvailable(username: string, signal?: AbortSignal) {
    return api.get<{ available: boolean; suggestion?: string | null }>('/auth/username-availability', {
      params: { username },
      signal,
      ...quiet,
    })
  },

  /* Social sign-in (OAuth 2.0 + PKCE handled by Laravel Socialite). */
  socialRedirectUrl(provider: SocialProvider, returnUrl: string) {
    return api.get<{ url: string }>(`/auth/social/${provider}/redirect`, { params: { returnUrl }, ...quiet })
  },
  socialCallback(provider: SocialProvider, params: { code: string; state: string }) {
    return api.post<SocialCallbackResult>(`/auth/social/${provider}/callback`, params, quiet)
  },
  finishSocialSetup(payload: FinishSocialSetupPayload) {
    return api.post<AuthUser>('/auth/social/complete', payload, quiet)
  },
  linkSocial(payload: LinkSocialPayload) {
    return api.post<AuthUser>('/auth/social/link', payload, quiet)
  },

  /* Staff (Control Tower) — Google Workspace SSO then WebAuthn security key. */
  staffGoogle() {
    return api.post<StaffSignInStart>('/admin/auth/google', undefined, quiet)
  },
  staffWebAuthn(challengeId: string, credential: Record<string, unknown>) {
    return api.post<AuthUser>('/admin/auth/webauthn', { challengeId, credential }, quiet)
  },
}
