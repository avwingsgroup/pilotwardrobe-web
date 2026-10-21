/** Principal roles. `visitor` is the implicit role of an unauthenticated session. */
export enum UserRole {
  USER = 'user',
  AVIATOR = 'aviator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

/** Enum member or its string value (templates can't import enums ergonomically). */
export type RoleOrVisitor = UserRole | `${UserRole}` | 'visitor'

/**
 * Permission catalogue. The backend is authoritative and returns the effective
 * permission list for the session on /auth/me. The frontend only uses these to
 * shape UX (hide/disable controls, guard routes); every endpoint re-checks.
 */
export const PERMISSIONS = [
  // Marketplace (consumer)
  'listings.create',
  'listings.update',
  'listings.promote',
  'offers.create',
  'swaps.create',
  'orders.create',
  'payouts.request',
  'reviews.create',
  'disputes.create',
  'messages.send',

  // Aviator
  'aviator.credentials.manage',
  'listings.unlimited',

  // Admin — operations
  'admin.access',
  'dashboard.view',
  'users.view',
  'users.create',
  'users.update',
  'users.suspend',
  'users.impersonate',
  'kyc.view',
  'kyc.review',
  'listings.view',
  'listings.approve',
  'listings.reject',
  'orders.view',
  'orders.manage',
  'transactions.view',
  'transactions.refund',
  'disputes.view',
  'disputes.resolve',
  'reports.view',
  'reports.manage',

  // Admin — money
  'payouts.view',
  'payouts.approve',
  'fees.view',
  'fees.manage',

  // Admin — growth
  'promotions.manage',
  'broadcasts.manage',
  'content.manage',

  // Admin — platform
  'catalogue.manage',
  'analytics.view',
  'team.view',
  'roles.manage',
  'permissions.manage',
  'audit.view',
  'settings.manage',
  'payment_gateways.manage',
] as const

export type Permission = (typeof PERMISSIONS)[number]

export const STAFF_ROLES: readonly UserRole[] = [UserRole.ADMIN, UserRole.SUPER_ADMIN]
