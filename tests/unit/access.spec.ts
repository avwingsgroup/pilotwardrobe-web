import { describe, expect, it } from 'vitest'
import { createRouter, createMemoryHistory } from 'vue-router'
import { resolveAccess } from '@/router/access'
import { routes } from '@/router/routes'
import { can, hasAnyRole } from '@/utils/permissions'
import { mockAccounts, publicAccount } from '@/mocks/users.mock'
import { UserRole } from '@/types/permissions'
import type { AuthUser } from '@/types/user'

const router = createRouter({ history: createMemoryHistory(), routes })
const resolve = (path: string) => router.resolve(path)
const account = (email: string): AuthUser => publicAccount(mockAccounts.find((a) => a.email === email)!)

const user = account('pilot@example.com')
const aviator = account('aviator@example.com')
const admin = account('admin@example.com')
const superAdmin = account('super@example.com')
const unverified = account('newbie@example.com')

describe('permission helpers', () => {
  it('grants only server-provided permissions', () => {
    expect(can(user, 'listings.create')).toBe(true)
    expect(can(user, 'users.view')).toBe(false)
    expect(can(admin, 'users.view')).toBe(true)
    expect(can(admin, 'settings.manage')).toBe(false)
  })

  it('treats super admin as holding every permission', () => {
    expect(can(superAdmin, 'settings.manage')).toBe(true)
    expect(can(superAdmin, ['roles.manage', 'permissions.manage'])).toBe(true)
  })

  it('denies everything to suspended accounts and visitors', () => {
    expect(can({ ...user, status: 'suspended' }, 'listings.create')).toBe(false)
    expect(can(null, 'listings.create')).toBe(false)
  })

  it('checks role membership', () => {
    expect(hasAnyRole(aviator, [UserRole.AVIATOR, UserRole.ADMIN])).toBe(true)
    expect(hasAnyRole(null, ['visitor'])).toBe(true)
  })
})

describe('route guards', () => {
  it('lets visitors browse public pages', () => {
    expect(resolveAccess(resolve('/'), null)).toBe(true)
    expect(resolveAccess(resolve('/marketplace/bose-a20-aviation-headset-dual-ga'), null)).toBe(true)
  })

  it('sends visitors to login with the intended destination preserved', () => {
    expect(resolveAccess(resolve('/checkout?listing=lst_001'), null)).toEqual({ name: 'login', query: { next: '/checkout?listing=lst_001' } })
    expect(resolveAccess(resolve('/hangar/listings/new'), null)).toEqual({ name: 'login', query: { next: '/hangar/listings/new' } })
  })

  it('sends visitors to staff sign-in for the admin area', () => {
    expect(resolveAccess(resolve('/admin/users'), null)).toEqual({ name: 'admin-sign-in', query: { next: '/admin/users' } })
  })

  it('forbids non-staff from the admin area', () => {
    expect(resolveAccess(resolve('/admin/overview'), user)).toMatchObject({ name: 'forbidden' })
    expect(resolveAccess(resolve('/admin/overview'), aviator)).toMatchObject({ name: 'forbidden' })
  })

  it('applies per-route permissions inside the admin area', () => {
    expect(resolveAccess(resolve('/admin/users'), admin)).toBe(true)
    expect(resolveAccess(resolve('/admin/fees'), admin)).toMatchObject({ name: 'forbidden' })
    expect(resolveAccess(resolve('/admin/settings'), admin)).toMatchObject({ name: 'forbidden' })
    expect(resolveAccess(resolve('/admin/settings'), superAdmin)).toBe(true)
  })

  it('requires approved KYC for swaps', () => {
    expect(resolveAccess(resolve('/swap/bose-a20-aviation-headset-dual-ga'), unverified)).toMatchObject({ name: 'hangar-verification' })
    expect(resolveAccess(resolve('/swap/bose-a20-aviation-headset-dual-ga'), user)).toBe(true)
  })

  it('bounces signed-in users away from guest-only pages', () => {
    expect(resolveAccess(resolve('/auth/login?next=/hangar'), user)).toBe('/hangar')
    expect(resolveAccess(resolve('/auth/login?next=https://evil.tld'), user)).toBe('/')
  })
})
