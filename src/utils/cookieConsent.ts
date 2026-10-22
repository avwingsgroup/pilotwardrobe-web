/**
 * Cookie / tracking consent (VC9, VC14, VC15). Strictly necessary storage is
 * always on; the optional categories default to off until the visitor opts in.
 * Stored on the device so the choice applies before sign-in. Analytics and
 * marketing integrations must check `hasConsent()` before loading.
 *
 * Bump CONSENT_VERSION when the cookie policy adds categories or purposes: every
 * visitor is asked again because their earlier choice no longer covers it.
 */
export type ConsentCategory = 'functional' | 'analytics' | 'marketing'
export type ConsentChoice = Record<ConsentCategory, boolean>
export type ConsentState = ConsentChoice & { updatedAt: string | null; version: number }

export const CONSENT_VERSION = 1
const KEY = 'pw.cookie-consent'
const DEFAULTS: ConsentState = { functional: false, analytics: false, marketing: false, updatedAt: null, version: CONSENT_VERSION }

export function readConsent(): ConsentState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<ConsentState>
    // A choice made under an older policy version doesn't count; fall back to defaults.
    if (parsed.version !== CONSENT_VERSION) return { ...DEFAULTS }
    return {
      functional: parsed.functional === true,
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
      version: CONSENT_VERSION,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveConsent(choice: ConsentChoice): ConsentState {
  const next: ConsentState = { functional: choice.functional, analytics: choice.analytics, marketing: choice.marketing, updatedAt: new Date().toISOString(), version: CONSENT_VERSION }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage blocked — choice applies for this page view only */
  }
  window.dispatchEvent(new CustomEvent('pw:consent', { detail: next }))
  return next
}

/** True once the visitor has made a choice under the current policy version. */
export const hasDecided = () => readConsent().updatedAt !== null

export const hasConsent = (category: ConsentCategory) => readConsent()[category]
