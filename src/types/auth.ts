import type { CountryCode } from './api'
import type { AuthUser } from './user'

export type SocialProvider = 'google' | 'apple' | 'facebook'

export interface EmailLookupResult {
  exists: boolean
  /** Which sign-in methods the account has. Never returned for unknown emails beyond `exists: false`. */
  methods: ('password' | SocialProvider)[]
}

export interface LoginPayload {
  email: string
  password: string
  remember: boolean
}

/** Login may finish immediately or require a second factor. */
export type LoginResult =
  | { status: 'authenticated'; user: AuthUser; accessToken?: string; tokenType?: 'Bearer'; expiresIn?: number }
  | { status: 'two_factor_required'; challengeId: string; methods: ('totp' | 'sms' | 'backup_code')[]; smsHint?: string }

export interface TwoFactorPayload {
  challengeId: string
  code: string
  method: 'totp' | 'sms' | 'backup_code'
  trustDevice: boolean
}

export interface RegisterPayload {
  firstName: string
  lastName: string
  email: string
  phone?: string
  password: string
  passwordConfirmation: string
  countryCode: CountryCode
  accountType: 'user' | 'aviator'
  termsAccepted: boolean
  marketingOptIn?: boolean
}

export interface RegisterResult {
  user: AuthUser
  /** Email verification challenge (4-digit OTP, 10-minute expiry). */
  verification: { required: boolean; expiresIn: number; resendAvailableIn: number }
  accessToken?: string
}

export interface VerifyEmailPayload {
  email: string
  code: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  email: string
  password: string
  passwordConfirmation: string
  logoutOtherDevices: boolean
}

export interface ResetTokenStatus {
  valid: boolean
  email?: string
  reason?: 'expired' | 'used' | 'invalid'
}

export interface SocialCallbackResult {
  /** new → finish setup (VA3); link_required → link accounts (VA8); authenticated → done. */
  status: 'new_account' | 'link_required' | 'authenticated' | 'two_factor_required'
  provider: SocialProvider
  pendingToken?: string
  profile?: { firstName: string; lastName: string; email: string; avatarUrl?: string | null }
  existingAccount?: { displayName: string; memberSince: string; verified: boolean }
  user?: AuthUser
  challengeId?: string
}

export interface FinishSocialSetupPayload {
  pendingToken: string
  firstName: string
  lastName: string
  username: string
  countryCode: CountryCode
  marketingOptIn: boolean
  termsAccepted: boolean
}

export interface LinkSocialPayload {
  pendingToken: string
  password: string
}

export interface StaffSignInStart {
  status: 'security_key_required'
  challengeId: string
  email: string
  publicKey: Record<string, unknown>
}
