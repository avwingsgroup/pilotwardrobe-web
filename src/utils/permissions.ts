import { UserRole, type Permission, type RoleOrVisitor } from '@/types/permissions'
import type { AuthUser } from '@/types/user'

/**
 * Pure authorization helpers used by the auth store, route guards and v-can.
 * Frontend authorization improves UX; backend authorization provides security.
 * Permissions come exclusively from the server (/auth/me) — never inferred from
 * role in a way that could grant more than the backend returned, with one
 * exception: super_admin is treated as holding every permission for UI display
 * because the backend grants it implicitly (Gate::before).
 */
export function roleOf(user: AuthUser | null | undefined): RoleOrVisitor {
  return user?.role ?? 'visitor'
}

export function can(user: AuthUser | null | undefined, permission: Permission | Permission[], mode: 'all' | 'any' = 'all') {
  if (!user || user.status === 'suspended' || user.status === 'deactivated') return false
  if (user.role === UserRole.SUPER_ADMIN) return true
  const list = Array.isArray(permission) ? permission : [permission]
  const owned = new Set(user.permissions)
  return mode === 'all' ? list.every((p) => owned.has(p)) : list.some((p) => owned.has(p))
}

export function hasRole(user: AuthUser | null | undefined, role: RoleOrVisitor) {
  return roleOf(user) === role
}

export function hasAnyRole(user: AuthUser | null | undefined, roles: readonly RoleOrVisitor[]) {
  return roles.includes(roleOf(user))
}

export const isStaff = (user: AuthUser | null | undefined) =>
  !!user && (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN)

/** Selling/swapping/withdrawing over limits requires approved KYC (VB20 "Verification required"). */
export const isKycApproved = (user: AuthUser | null | undefined) => user?.verification.kycStatus === 'approved'
