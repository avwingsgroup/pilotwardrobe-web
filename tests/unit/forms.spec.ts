import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { useForm } from '@/composables/useForm'
import { required } from '@/utils/validators'
import { CONSENT_VERSION, hasConsent, hasDecided, readConsent, saveConsent } from '@/utils/cookieConsent'
import { registerAnalyticsSink, track } from '@/utils/analytics'
import { ApiError } from '@/api/errors'
import { toSession } from '@/api/auth.api'

describe('useForm', () => {
  it('clears a shown error as soon as the field is fixed, without waiting for blur', async () => {
    const form = useForm({ subject: '', message: '' }, { subject: [required('Add a subject.')], message: [required('Add a message.')] })
    await form.submit(async () => 'sent')
    expect(form.fieldError('subject')).toBe('Add a subject.')

    form.values.subject = 'Tracking stuck'
    await nextTick()
    expect(form.fieldError('subject')).toBeUndefined()
    // The other field keeps its error until it is edited too.
    expect(form.fieldError('message')).toBe('Add a message.')
  })

  it('does not show new errors while typing in an untouched field', async () => {
    const form = useForm({ subject: 'x' }, { subject: [required('Add a subject.')] })
    form.values.subject = ''
    await nextTick()
    expect(form.fieldError('subject')).toBeUndefined()
  })

  it('keeps server errors on fields the user has not changed', async () => {
    const form = useForm({ email: 'a@b.co', name: 'Ada' })
    form.applyServerErrors(new ApiError({ status: 422, code: 'VALIDATION_ERROR', message: 'Invalid', fieldErrors: { email: ['Already taken.'] } }))
    form.values.name = 'Ada Obi'
    await nextTick()
    expect(form.fieldError('email')).toBe('Already taken.')
  })
})

describe('cookie consent', () => {
  it('defaults optional categories to off', () => {
    expect(readConsent()).toMatchObject({ functional: false, analytics: false, marketing: false, updatedAt: null })
    expect(hasConsent('analytics')).toBe(false)
  })

  it('persists a choice and announces it', () => {
    let announced: unknown = null
    window.addEventListener('pw:consent', (e) => (announced = (e as CustomEvent).detail), { once: true })
    saveConsent({ functional: true, analytics: true, marketing: false })
    expect(hasConsent('analytics')).toBe(true)
    expect(readConsent().updatedAt).not.toBeNull()
    expect(announced).toMatchObject({ analytics: true, marketing: false })
  })

  it('treats a choice from an older policy version as undecided', () => {
    localStorage.setItem('pw.cookie-consent', JSON.stringify({ functional: true, analytics: true, marketing: true, updatedAt: '2025-01-01T00:00:00Z', version: CONSENT_VERSION - 1 }))
    expect(hasDecided()).toBe(false)
    expect(hasConsent('analytics')).toBe(false)
  })

  it('only sends analytics events after analytics consent', () => {
    const seen: string[] = []
    const off = registerAnalyticsSink((name) => seen.push(name))
    track('favorite_added', { listingId: 'lst_1' })
    expect(seen).toEqual([])
    saveConsent({ functional: false, analytics: true, marketing: false })
    track('favorite_added', { listingId: 'lst_1' })
    expect(seen).toEqual(['favorite_added'])
    off()
  })

  it('ignores corrupted storage', () => {
    localStorage.setItem('pw.cookie-consent', '{nope')
    expect(readConsent().analytics).toBe(false)
  })
})

describe('toSession (social / staff sign-in responses)', () => {
  const user = { id: 'usr_1', email: 'a@b.co' } as unknown as import('@/types').AuthUser

  it('accepts a bare user (cookie mode)', () => {
    expect(toSession(user)).toEqual({ user })
  })

  it('keeps the bearer token from { user, access_token } (token mode, e.g. the mobile app)', () => {
    expect(toSession({ user, accessToken: 'tok_123' })).toEqual({ user, accessToken: 'tok_123' })
  })
})
