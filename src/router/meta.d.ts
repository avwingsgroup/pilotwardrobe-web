import 'vue-router'
import type { Permission, RoleOrVisitor } from '@/types/permissions'

declare module 'vue-router' {
  interface RouteMeta {
    /** Route needs an authenticated session (redirects visitors to /auth/login?next=). */
    requiresAuth?: boolean
    /** Only for visitors (login/signup); signed-in users are sent home. */
    guestOnly?: boolean
    /** Allowed principal roles. Omit for any authenticated role. */
    roles?: readonly RoleOrVisitor[]
    /** Required permission(s); all must be present. */
    permission?: Permission | Permission[]
    /** Requires approved KYC (sell/swap/withdraw) — redirects to verification. */
    requiresKyc?: boolean
    /** Document title (page components may override via useSeo). */
    title?: string
    /** Exclude from search indexing. */
    noindex?: boolean
    /** Active top-nav item. */
    nav?: 'marketplace' | 'sell' | 'hangar' | 'photographers'
    /** Hangar pages designed without the sidebar (sell wizard VB1–3). */
    fullWidth?: boolean
    /** Auth split-screen hero variant (VA1 cockpit, VA5 headset, VA3 shirt). */
    authPanel?: 'cockpit' | 'headset' | 'shirt'
    /** Information-centre page (VC1–VC13): shows the guides/policies/support sub-nav and info footer. */
    info?: boolean
  }
}

export {}
