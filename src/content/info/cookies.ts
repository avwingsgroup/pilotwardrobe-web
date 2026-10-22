import type { ConsentCategory } from '@/utils/cookieConsent'

/** Consent categories as worded in VC15 (`functional` is shown as "Preferences"). */
export const CONSENT_CATEGORIES: { key: ConsentCategory | 'essential'; title: string; body: string }[] = [
  { key: 'essential', title: 'Essential', body: 'Sign-in, security, basket, escrow checkout and fraud prevention.' },
  { key: 'functional', title: 'Preferences', body: 'Remember your currency, units and recently viewed listings.' },
  { key: 'analytics', title: 'Analytics', body: 'Anonymous usage data that helps us improve search and listings.' },
  { key: 'marketing', title: 'Marketing', body: 'Measure campaigns and show relevant gear on partner sites.' },
]
