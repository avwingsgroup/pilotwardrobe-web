import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import type { AuthUser } from '@/types/user'
import { can, hasAnyRole, isKycApproved, isStaff } from '@/utils/permissions'
import { safeRedirect } from '@/utils/security'

/**
 * Pure navigation decision used by the global guard (and unit tests).
 * Returns `true` to proceed or a redirect location.
 */
/** Only the fields the resolver reads, so both normalized and `router.resolve()` locations fit. */
export type AccessTarget = Pick<RouteLocationNormalized, 'matched' | 'query' | 'path' | 'fullPath'>

export function resolveAccess(to: AccessTarget, user: AuthUser | null): true | RouteLocationRaw {
  // Merge meta from matched records so children inherit layout-level requirements.
  const meta = to.matched.reduce<Record<string, unknown>>((acc, record) => ({ ...acc, ...record.meta }), {})

  if (meta.guestOnly && user) {
    const next = safeRedirect(to.query.next, isStaff(user) && to.path.startsWith('/admin') ? '/admin/overview' : '/')
    return next
  }

  if (meta.requiresAuth && !user) {
    const isAdminArea = to.path.startsWith('/admin')
    return { name: isAdminArea ? 'admin-sign-in' : 'login', query: { next: to.fullPath } }
  }

  if (!user) return true

  if (user.status === 'suspended' && meta.requiresAuth) {
    return { name: 'forbidden', query: { reason: 'suspended' } }
  }

  const roles = meta.roles as AuthUser['role'][] | undefined
  if (roles && !hasAnyRole(user, roles)) {
    return { name: 'forbidden', query: { from: to.fullPath } }
  }

  const permission = meta.permission as Parameters<typeof can>[1] | undefined
  if (permission && !can(user, permission)) {
    return { name: 'forbidden', query: { from: to.fullPath } }
  }

  if (meta.requiresKyc && !isKycApproved(user)) {
    return { name: 'hangar-verification', query: { next: to.fullPath, reason: 'kyc' } }
  }

  return true
}
