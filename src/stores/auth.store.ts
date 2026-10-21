import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import { authService } from '@/api/auth.api'
import { tokenStore } from '@/api/token'
import { invalidate } from '@/api/cache'
import { appConfig } from '@/constants/config'
import type {
  AuthUser,
  LoginPayload,
  LoginResult,
  Permission,
  RegisterPayload,
  RoleOrVisitor,
  TwoFactorPayload,
} from '@/types'
import { can as canFn, hasAnyRole as hasAnyRoleFn, hasRole as hasRoleFn, isKycApproved, isStaff, roleOf } from '@/utils/permissions'
import { track } from '@/utils/analytics'

type Status = 'idle' | 'loading' | 'ready'

/**
 * Session state. `/auth/me` is the single source of truth for identity, role,
 * permissions, account status and verification state.
 */
export const useAuthStore = defineStore('auth', () => {
  const user = shallowRef<AuthUser | null>(null)
  const status = ref<Status>('idle')
  /** Pending 2FA challenge after password login (VA7). */
  const twoFactor = ref<{ challengeId: string; methods: string[]; smsHint?: string; remember: boolean } | null>(null)
  /** Email awaiting OTP verification (VA5). */
  const pendingEmail = ref<string | null>(null)

  let initPromise: Promise<void> | null = null

  const isAuthenticated = computed(() => !!user.value)
  const role = computed<RoleOrVisitor>(() => roleOf(user.value))
  const isAdmin = computed(() => isStaff(user.value))
  const kycApproved = computed(() => isKycApproved(user.value))
  const displayName = computed(() => user.value?.displayName ?? '')
  const initials = computed(() => {
    const u = user.value
    return u ? `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase() : ''
  })

  const can = (permission: Permission | Permission[], mode: 'all' | 'any' = 'all') => canFn(user.value, permission, mode)
  const hasRole = (r: RoleOrVisitor) => hasRoleFn(user.value, r)
  const hasAnyRole = (roles: readonly RoleOrVisitor[]) => hasAnyRoleFn(user.value, roles)

  function setSession(next: AuthUser, token?: string, remember = false) {
    user.value = next
    if (token && appConfig.authMode === 'token') tokenStore.set(token, remember)
    status.value = 'ready'
  }

  /** Resolve the session once at boot (and lazily from the router guard). */
  function init(force = false): Promise<void> {
    if (status.value === 'ready' && !force) return Promise.resolve()
    if (initPromise && !force) return initPromise
    status.value = 'loading'
    initPromise = authService
      .me()
      .then((me) => {
        user.value = me
      })
      .catch(() => {
        user.value = null
      })
      .finally(() => {
        status.value = 'ready'
        initPromise = null
      })
    return initPromise
  }

  const refresh = () => init(true)

  async function login(payload: LoginPayload): Promise<LoginResult> {
    const result = await authService.login(payload)
    if (result.status === 'authenticated') {
      setSession(result.user, result.accessToken, payload.remember)
      track('login_completed', { method: 'email' })
    } else {
      twoFactor.value = { challengeId: result.challengeId, methods: result.methods, smsHint: result.smsHint, remember: payload.remember }
    }
    return result
  }

  async function completeTwoFactor(payload: Omit<TwoFactorPayload, 'challengeId'>) {
    if (!twoFactor.value) throw new Error('No pending two-step challenge')
    const result = await authService.verifyTwoFactor({ ...payload, challengeId: twoFactor.value.challengeId })
    if (result.status === 'authenticated') {
      setSession(result.user, result.accessToken, twoFactor.value.remember)
      twoFactor.value = null
    }
    return result
  }

  async function register(payload: RegisterPayload) {
    const result = await authService.register(payload)
    if (result.accessToken) tokenStore.set(result.accessToken, false)
    pendingEmail.value = payload.email
    user.value = result.user
    track('sign_up_completed', { method: 'email' })
    return result
  }

  async function verifyEmail(code: string) {
    const email = pendingEmail.value ?? user.value?.email
    if (!email) throw new Error('No email to verify')
    const verified = await authService.verifyEmail({ email, code })
    setSession(verified)
    pendingEmail.value = null
    return verified
  }

  /** Clear every user-scoped store and cache so nothing privileged lingers. */
  function clearSession() {
    user.value = null
    twoFactor.value = null
    pendingEmail.value = null
    tokenStore.clear()
    invalidate()
    // Other stores subscribe to this action via $onAction and reset themselves.
  }

  async function logout() {
    try {
      await authService.logout()
    } catch {
      /* session may already be gone server-side */
    }
    clearSession()
  }

  function patchUser(partial: Partial<AuthUser>) {
    if (user.value) user.value = { ...user.value, ...partial }
  }

  return {
    user,
    status,
    twoFactor,
    pendingEmail,
    isAuthenticated,
    role,
    isAdmin,
    kycApproved,
    displayName,
    initials,
    can,
    hasRole,
    hasAnyRole,
    init,
    refresh,
    login,
    completeTwoFactor,
    register,
    verifyEmail,
    setSession,
    logout,
    clearSession,
    patchUser,
  }
})
