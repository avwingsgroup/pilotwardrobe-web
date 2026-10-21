import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { useForm } from '@/composables/useForm'
import { required } from '@/utils/validators'
import { hasConsent, readConsent, saveConsent } from '@/utils/cookieConsent'
import { ApiError } from '@/api/errors'

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

  it('ignores corrupted storage', () => {
    localStorage.setItem('pw.cookie-consent', '{nope')
    expect(readConsent().analytics).toBe(false)
  })
})
