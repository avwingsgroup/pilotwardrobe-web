import { UserRole } from '@/types/permissions'
import type { AuthUser } from '@/types/user'
import { db } from '../db'
import { created, currentUser, fail, id, noContent, ok, on, requireUser, str, validation } from '../server'
import { MOCK_OTP, MOCK_PASSWORD } from '../users.mock'

const MAX_ATTEMPTS = 5

const strip = (account: (typeof db.accounts)[number]): AuthUser => {
  const { password: _p, twoFactorSecret: _t, ...user } = account
  return user
}

const findByEmail = (email: string) => db.accounts.find((a) => a.email.toLowerCase() === email.trim().toLowerCase())

on('POST', '/auth/email-lookup', ({ body }) => {
  const email = str(body.email).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw validation({ email: 'Enter a valid email address.' })
  const account = findByEmail(email)
  return ok({ exists: !!account, methods: account ? (email.endsWith('gmail.com') ? ['password', 'google'] : ['password']) : [] })
})

on('POST', '/auth/login', ({ body }) => {
  const email = str(body.email).toLowerCase()
  const attempts = db.failedLogins.get(email) ?? 0
  if (attempts >= MAX_ATTEMPTS) {
    throw fail(423, 'ACCOUNT_LOCKED', 'Too many failed attempts. Your account is locked for 15 minutes.', undefined, { retryAfter: 900 })
  }
  const account = findByEmail(email)
  if (!account || account.password !== str(body.password)) {
    const next = attempts + 1
    db.failedLogins.set(email, next)
    const remaining = MAX_ATTEMPTS - next
    const message =
      remaining <= 2 && remaining > 0
        ? `Incorrect email or password. ${remaining} attempt${remaining === 1 ? '' : 's'} left before a 15-minute lock.`
        : 'Incorrect email or password.'
    throw fail(422, 'VALIDATION_ERROR', message, { email: [message] }, { attemptsRemaining: remaining })
  }
  db.failedLogins.delete(email)
  if (account.twoFactorEnabled && account.role !== UserRole.ADMIN && account.role !== UserRole.SUPER_ADMIN) {
    const challengeId = id('2fa')
    db.twoFactorChallenges.set(challengeId, { userId: account.id, remember: !!body.remember })
    return ok({ status: 'two_factor_required', challengeId, methods: ['totp', 'sms', 'backup_code'], smsHint: '•••• 4417' })
  }
  db.setSession(account.id, !!body.remember)
  return ok({ status: 'authenticated', user: strip(account), accessToken: `mock.${account.id}`, tokenType: 'Bearer', expiresIn: 3600 })
})

on('POST', '/auth/two-factor', ({ body }) => {
  const challenge = db.twoFactorChallenges.get(str(body.challengeId))
  if (!challenge) throw fail(419, 'SESSION_EXPIRED', 'This sign-in attempt expired. Please log in again.')
  const code = str(body.code)
  const valid = body.method === 'backup_code' ? /^[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(code) : code === '123456'
  if (!valid) throw validation({ code: "That code didn't work. Check your authenticator app and try again." })
  db.twoFactorChallenges.delete(str(body.challengeId))
  const account = db.accounts.find((a) => a.id === challenge.userId)!
  db.setSession(account.id, challenge.remember)
  return ok({ status: 'authenticated', user: strip(account), accessToken: `mock.${account.id}`, tokenType: 'Bearer', expiresIn: 3600 })
})

on('POST', '/auth/two-factor/sms', () => ok({ sentTo: '•••• 4417' }, 'Code sent.'))

on('POST', '/auth/register', ({ body }) => {
  const errors: Record<string, string> = {}
  const email = str(body.email).toLowerCase()
  if (!str(body.firstName)) errors.first_name = 'The first name field is required.'
  if (!str(body.lastName)) errors.last_name = 'The last name field is required.'
  if (findByEmail(email)) errors.email = 'An account with this email already exists.'
  if (str(body.password).length < 8) errors.password = 'The password must be at least 8 characters.'
  if (body.password !== body.passwordConfirmation) errors.password_confirmation = "Passwords don't match."
  if (!body.termsAccepted) errors.terms_accepted = 'You must accept the terms.'
  if (Object.keys(errors).length) throw validation(errors)
  const account = {
    ...strip(db.accounts[0]!),
    id: id('usr'),
    firstName: str(body.firstName),
    lastName: str(body.lastName),
    displayName: `${str(body.firstName)} ${str(body.lastName)}`,
    username: email.split('@')[0]!.replace(/[^a-z0-9_]/g, '_').slice(0, 20),
    email,
    phone: str(body.phone) || null,
    role: UserRole.USER,
    verification: { email: false, identity: false, aviator: false, kycStatus: 'not_started' as const },
    countryCode: str(body.countryCode) || 'NG',
    memberSince: new Date().toISOString(),
    twoFactorEnabled: false,
    counters: { unreadMessages: 0, unreadNotifications: 0, cartItems: 0, openOffers: 0, activeOrders: 0, activeListings: 0, openDisputes: 0 },
    password: str(body.password),
  }
  db.accounts.push(account)
  db.emailOtps.set(email, MOCK_OTP)
  db.setSession(account.id)
  return created({ user: strip(account), verification: { required: true, expiresIn: 600, resendAvailableIn: 60 } }, 'Account created. Check your email for a 4-digit code.')
})

on('POST', '/auth/email/verify', ({ body }) => {
  const email = str(body.email).toLowerCase()
  if (str(body.code) !== (db.emailOtps.get(email) ?? MOCK_OTP)) throw validation({ code: "That code isn't right. Check the email and try again." })
  const account = findByEmail(email)
  if (!account) throw fail(404, 'NOT_FOUND', 'Account not found.')
  account.verification = { ...account.verification, email: true }
  db.emailOtps.delete(email)
  db.setSession(account.id)
  return ok(strip(account), 'Email verified.')
})

on('POST', '/auth/email/resend', () => ok({ resendAvailableIn: 60 }, 'A new code is on its way.'))

on('POST', '/auth/password/forgot', () =>
  // Generic copy — never reveal whether the email exists.
  ok({ resendAvailableIn: 60 }, 'If an account exists for that email, a reset link is on its way.'),
)

on('GET', '/auth/password/reset/:token', ({ params }) => {
  const token = db.resetTokens.get(params.token!)
  if (!token) return ok({ valid: false, reason: 'invalid' })
  if (token.used) return ok({ valid: false, reason: 'used' })
  if (token.expiresAt < Date.now()) return ok({ valid: false, reason: 'expired' })
  return ok({ valid: true, email: token.email })
})

on('POST', '/auth/password/reset', ({ body }) => {
  const token = db.resetTokens.get(str(body.token))
  if (!token || token.used || token.expiresAt < Date.now()) throw fail(410, 'TOKEN_EXPIRED', 'This link has expired.')
  if (str(body.password).length < 8) throw validation({ password: 'The password must be at least 8 characters.' })
  if (body.password !== body.passwordConfirmation) throw validation({ password_confirmation: "Passwords don't match." })
  const account = findByEmail(token.email)
  if (account) account.password = str(body.password)
  token.used = true
  return ok({ reset: true }, 'Password updated. Log in with your new password.')
})

on('GET', '/auth/me', () => {
  const user = currentUser()
  if (!user) throw fail(401, 'UNAUTHENTICATED', 'Unauthenticated.')
  return ok(user)
})

on('POST', '/auth/logout', () => {
  db.setSession(null)
  return noContent()
})

on('GET', '/auth/username-availability', ({ query }) => {
  const name = str(query.username).toLowerCase()
  const taken = db.accounts.some((a) => a.username === name) || ['admin', 'support', 'pilotwardrobe'].includes(name)
  return ok({ available: !taken, suggestion: taken ? `${name}_${Math.floor(Math.random() * 90 + 10)}` : null })
})

/* ── Social (Google) — mock simulates the provider round-trip ─────────── */
on('GET', '/auth/social/:provider/redirect', ({ params, query }) => {
  const state = id('st')
  const scenario = str(query.returnUrl).includes('link') ? 'link' : 'new'
  return ok({ url: `/auth/google/callback?provider=${params.provider}&code=mock-${scenario}&state=${state}` })
})

on('POST', '/auth/social/:provider/callback', ({ params, body }) => {
  const code = str(body.code)
  const provider = params.provider as 'google'
  if (code === 'mock-existing') {
    const account = findByEmail('pilot@example.com')!
    db.setSession(account.id)
    return ok({ status: 'authenticated', provider, user: strip(account) })
  }
  const pendingToken = id('sp')
  if (code === 'mock-link') {
    db.socialPending.set(pendingToken, { email: 'pilot@example.com', firstName: 'Nehemiah', lastName: 'Okoye', existingId: 'usr_10422' })
    return ok({
      status: 'link_required',
      provider,
      pendingToken,
      profile: { firstName: 'Nehemiah', lastName: 'Okoye', email: 'pilot@example.com' },
      existingAccount: { displayName: 'Nehemiah Okafor', memberSince: '2025-03-12T00:00:00Z', verified: true },
    })
  }
  db.socialPending.set(pendingToken, { email: 'airboy@gmail.com', firstName: 'Nehemiah', lastName: 'Okafor' })
  return ok({ status: 'new_account', provider, pendingToken, profile: { firstName: 'Nehemiah', lastName: 'Okafor', email: 'airboy@gmail.com' } })
})

on('POST', '/auth/social/complete', ({ body }) => {
  const pending = db.socialPending.get(str(body.pendingToken))
  if (!pending) throw fail(419, 'SESSION_EXPIRED', 'This sign-up session expired. Please start again.')
  if (!/^[a-z0-9_]{3,20}$/.test(str(body.username))) throw validation({ username: 'Use 3–20 characters: a–z, 0–9 or underscore.' })
  if (!body.termsAccepted) throw validation({ terms_accepted: 'You must accept the terms.' })
  const account = {
    ...strip(db.accounts[4]!),
    id: id('usr'),
    firstName: str(body.firstName),
    lastName: str(body.lastName),
    displayName: `${str(body.firstName)} ${str(body.lastName)}`,
    username: str(body.username),
    email: pending.email,
    verification: { email: true, identity: false, aviator: false, kycStatus: 'not_started' as const },
    password: MOCK_PASSWORD,
  }
  db.accounts.push(account)
  db.socialPending.delete(str(body.pendingToken))
  db.setSession(account.id)
  return created(strip(account))
})

on('POST', '/auth/social/link', ({ body }) => {
  const pending = db.socialPending.get(str(body.pendingToken))
  if (!pending?.existingId) throw fail(419, 'SESSION_EXPIRED', 'This link request expired.')
  const account = db.accounts.find((a) => a.id === pending.existingId)!
  if (account.password !== str(body.password)) throw validation({ password: 'Incorrect password.' })
  db.setSession(account.id)
  return ok(strip(account), 'Google account linked.')
})

/* ── Staff (Control Tower) ─────────────────────────────────────────── */
on('POST', '/admin/auth/google', () =>
  ok({ status: 'security_key_required', challengeId: id('wa'), email: 'tolu.adeyemi@pilotwardrobe.com', publicKey: { challenge: 'mock', timeout: 60000 } }),
)

on('POST', '/admin/auth/webauthn', () => {
  const account = db.accounts.find((a) => a.role === UserRole.SUPER_ADMIN)!
  db.setSession(account.id)
  return ok(strip(account))
})

/* ── Profile basics ─────────────────────────────────────────────── */
on('PATCH', '/me', ({ body }) => {
  const user = requireUser()
  const account = db.accounts.find((a) => a.id === user.id)!
  for (const key of ['firstName', 'lastName', 'username', 'phone', 'countryCode', 'currency', 'locale'] as const) {
    if (typeof body[key] === 'string') (account as unknown as Record<string, unknown>)[key] = body[key]
  }
  account.displayName = `${account.firstName} ${account.lastName}`
  return ok(strip(account), 'Profile updated.')
})
