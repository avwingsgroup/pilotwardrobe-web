/**
 * Cookie / tracking consent (VC9). Strictly necessary storage is always on;
 * the optional categories default to off until the visitor opts in. Stored on
 * the device so the choice applies before sign-in. Analytics and marketing
 * integrations must check `hasConsent()` before loading.
 */
export type ConsentCategory = 'functional' | 'analytics' | 'marketing'
export type ConsentState = Record<ConsentCategory, boolean> & { updatedAt: string | null }

const KEY = 'pw.cookie-consent'
const DEFAULTS: ConsentState = { functional: false, analytics: false, marketing: false, updatedAt: null }

export function readConsent(): ConsentState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<ConsentState>
    return {
      functional: parsed.functional === true,
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function saveConsent(choice: Record<ConsentCategory, boolean>): ConsentState {
  const next: ConsentState = { ...choice, updatedAt: new Date().toISOString() }
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage blocked — choice applies for this page view only */
  }
  window.dispatchEvent(new CustomEvent('pw:consent', { detail: next }))
  return next
}

export const hasConsent = (category: ConsentCategory) => readConsent()[category]
