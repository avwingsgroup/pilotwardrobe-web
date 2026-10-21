import type { RouteLocationRaw } from 'vue-router'

/**
 * Information-centre navigation (VC1–VC13). One source for the sub-nav bar and
 * the info footer so labels and destinations never drift.
 */
export interface InfoLink {
  label: string
  name: string
}

export interface InfoGroup {
  key: 'guides' | 'policies' | 'support'
  title: string
  links: InfoLink[]
}

export const INFO_GROUPS: InfoGroup[] = [
  {
    key: 'guides',
    title: 'Guides',
    links: [
      { label: 'How to swap', name: 'how-to-swap' },
      { label: 'How to sell', name: 'how-to-sell' },
      { label: 'Freight guides', name: 'freight-guide' },
      { label: 'Seller fees', name: 'seller-fees' },
    ],
  },
  {
    key: 'policies',
    title: 'Policies',
    links: [
      { label: 'Terms of service', name: 'terms' },
      { label: 'Privacy policy', name: 'privacy' },
      { label: 'Returns & refunds', name: 'returns' },
      { label: 'Escrow & disputes', name: 'escrow-disputes' },
      { label: 'Cookies', name: 'cookies' },
    ],
  },
  {
    key: 'support',
    title: 'Support',
    links: [
      { label: 'Help Center', name: 'help-center' },
      { label: 'Contact us', name: 'contact' },
      { label: 'FAQs', name: 'faq' },
      { label: 'About us', name: 'about' },
    ],
  },
]

export const INFO_MARKETPLACE_LINKS: { label: string; to: RouteLocationRaw }[] = [
  { label: 'Headsets', to: '/category/headsets' },
  { label: 'Flight bags', to: '/category/flight-bags' },
  { label: 'Avionics & EFB', to: '/category/avionics' },
  { label: 'Uniforms', to: '/category/uniforms' },
  { label: 'Photography', to: '/photographers' },
]

/**
 * Platform timings and rates quoted across guides, policies and FAQs. The backend
 * is authoritative (AD13 escrow timings, commission rules); these are the
 * published defaults the copy refers to.
 */
export const PLATFORM = {
  dispatchDays: 5,
  inspectionHours: 72,
  sellerReplyHours: 48,
  mediationBusinessDays: 5,
  commissionPercent: 8,
  buyerFeePercent: 4,
  swapProtectionPerSide: '$3',
  supportEmail: 'support@pilotwardrobe.com',
  legalEmail: 'legal@pilotwardrobe.com',
  privacyEmail: 'privacy@pilotwardrobe.com',
  supportPhone: '+234 1 700 4400',
  chatHours: '7am–11pm WAT',
} as const
