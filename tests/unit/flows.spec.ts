import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { authService } from '@/api/auth.api'
import { productService } from '@/api/products.api'
import { listingService } from '@/api/listings.api'
import { offerService, swapService } from '@/api/trades.api'
import { checkoutService, orderService } from '@/api/orders.api'
import { paymentService } from '@/api/payments.api'
import { adminService } from '@/api/admin.api'
import { ApiError } from '@/api/errors'
import { http } from '@/api/client'
import { useAuthStore } from '@/stores/auth.store'
import { db } from '@/mocks/db'

/**
 * Integration tests: services → Axios client (case conversion, envelopes, error
 * normalisation) → mock adapter that serves the documented API contract.
 */
async function login(email: string) {
  const auth = useAuthStore()
  const result = await auth.login({ email, password: 'Password1', remember: false })
  return { auth, result }
}

async function expectApiError(promise: Promise<unknown>, status: number) {
  try {
    await promise
    throw new Error('expected request to fail')
  } catch (e) {
    expect(e).toBeInstanceOf(ApiError)
    expect((e as ApiError).status).toBe(status)
    return e as ApiError
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  db.setSession(null)
  db.failedLogins.clear()
})

describe('authentication', () => {
  it('logs in, loads /auth/me and logs out', async () => {
    const { auth, result } = await login('pilot@example.com')
    expect(result.status).toBe('authenticated')
    expect(auth.user?.firstName).toBe('Nehemiah')
    expect(auth.can('listings.create')).toBe(true)
    const me = await authService.me()
    expect(me.email).toBe('pilot@example.com')
    await auth.logout()
    expect(auth.isAuthenticated).toBe(false)
    await expectApiError(authService.me(), 401)
  })

  it('maps invalid credentials to field errors and warns before lockout', async () => {
    const auth = useAuthStore()
    let last: ApiError | undefined
    for (let i = 0; i < 3; i++) last = await expectApiError(auth.login({ email: 'pilot@example.com', password: 'nope', remember: false }), 422)
    expect(last!.isValidation).toBe(true)
    expect(last!.field('email')).toMatch(/2 attempts left/)
  })

  it('requires a second factor for 2FA accounts', async () => {
    const { auth, result } = await login('aviator@example.com')
    expect(result.status).toBe('two_factor_required')
    const err = await expectApiError(auth.completeTwoFactor({ code: '000000', method: 'totp', trustDevice: false }), 422)
    expect(err.field('code')).toBeTruthy()
    await auth.completeTwoFactor({ code: '123456', method: 'totp', trustDevice: true })
    expect(auth.user?.role).toBe('aviator')
  })

  it('registers and verifies email with the OTP', async () => {
    const auth = useAuthStore()
    const email = `new${Date.now()}@example.com`
    await auth.register({ firstName: 'New', lastName: 'Pilot', email, password: 'Delta1Echo', passwordConfirmation: 'Delta1Echo', countryCode: 'NG', accountType: 'user', termsAccepted: true })
    await expectApiError(auth.verifyEmail('9999'), 422)
    const verified = await auth.verifyEmail('1234')
    expect(verified.verification.email).toBe(true)
  })

  it('maps registration validation errors to camelCase field keys', async () => {
    const err = await expectApiError(
      authService.register({ firstName: '', lastName: '', email: 'pilot@example.com', password: 'x', passwordConfirmation: 'y', countryCode: 'NG', accountType: 'user', termsAccepted: false }),
      422,
    )
    expect(Object.keys(err.fieldErrors)).toEqual(expect.arrayContaining(['firstName', 'lastName', 'email', 'password', 'passwordConfirmation', 'termsAccepted']))
  })
})

describe('marketplace', () => {
  it('filters, sorts and paginates on the server', async () => {
    const res = await productService.search({ category: ['headsets'], condition: ['like_new'], sort: 'price_desc', page: 1 })
    expect(res.data.length).toBeGreaterThan(0)
    expect(res.data.every((l) => l.condition === 'like_new')).toBe(true)
    const prices = res.data.map((l) => l.price.amount)
    expect(prices).toEqual([...prices].sort((a, b) => b - a))
    expect(res.meta.currentPage).toBe(1)
    expect(res.meta.facets.categories.length).toBeGreaterThan(0)
  })

  it('serves product detail with responsive media variants', async () => {
    const listing = await productService.getBySlug('bose-a20-aviation-headset-dual-ga')
    expect(listing.price).toMatchObject({ amount: 74500, currency: 'USD' })
    expect(listing.images[0]?.variants.thumbnail).toMatch(/\.webp$/)
    expect(listing.images[0]?.sources?.some((s) => s.format === 'avif')).toBe(true)
  })

  it('returns 404 for unknown listings', async () => {
    await expectApiError(productService.getBySlug('does-not-exist'), 404)
  })
})

describe('selling, offers and swaps', () => {
  it('creates a draft listing and publishes it', async () => {
    await login('pilot@example.com')
    const draft = await listingService.createDraft({ title: 'Test headset for unit test', description: 'A' })
    expect(draft.status).toBe('draft')
    const err = await expectApiError(listingService.publish(draft.id, { price: { amount: 0, currency: 'USD' } }), 422)
    expect(err.fieldErrors['price.amount']).toBeDefined()
    const live = await listingService.publish(draft.id, {
      price: { amount: 50000, currency: 'USD' },
      mediaIds: ['med_bose-a20'],
      attestations: { ownsItem: true, notCounterfeit: true, dispatchCommitment: true },
    })
    expect(live.status).toBe('active')
  })

  it('validates and sends an offer', async () => {
    await login('newbie@example.com')
    await expectApiError(offerService.create('lst_001', { amount: 99999999, currency: 'USD' }), 422)
    const offer = await offerService.create('lst_001', { amount: 70000, currency: 'USD', message: 'Would you take $700?' })
    expect(offer.status).toBe('pending')
    expect(offer.amount.amount).toBe(70000)
  })

  it('blocks swaps for unverified accounts and allows them for verified ones', async () => {
    await login('newbie@example.com')
    const err = await expectApiError(swapService.create('lst_004', { offeredListingIds: ['lst_013'] }), 403)
    expect(err.code).toBe('KYC_REQUIRED')
    db.setSession(null)
    await login('pilot@example.com')
    const swap = await swapService.create('lst_004', { offeredListingIds: ['lst_013'], cashAdjustment: { amount: 10000, currency: 'USD' } })
    expect(swap.status).toBe('pending')
  })
})

describe('checkout and payment verification', () => {
  it('creates an order, initialises payment and only marks paid after server verification', async () => {
    await login('pilot@example.com')
    const quote = await checkoutService.quote({ listingId: 'lst_002' })
    expect(quote.totals.total.amount).toBeGreaterThan(quote.totals.items.amount)
    const order = await orderService.create({ listingId: 'lst_002', addressId: 'adr_1', shippingOptionId: quote.selectedShippingId! })
    expect(order.status).toBe('pending_payment')
    const methods = await paymentService.methods({ currency: 'USD', country: 'NG' })
    expect(methods.map((m) => m.code)).toEqual(expect.arrayContaining(['paystack', 'flutterwave', 'stripe']))
    const init = await paymentService.initialize({ orderId: order.id, gateway: 'paystack', returnUrl: 'http://localhost/payment/callback' })
    expect(init.status).toBe('pending')

    // A forged "success" redirect does nothing: the payment is still pending server-side.
    expect((await paymentService.verify(init.reference)).status).toBe('pending')

    // Gateway webhook (simulated) → processing → server verification → successful.
    await http.post(`/__mock/gateway/${init.reference}`, { outcome: 'success' })
    db.payments.find((p) => p.reference === init.reference)!.createdAt -= 5000
    const verified = await paymentService.verify(init.reference)
    expect(verified.status).toBe('successful')
    const paid = await orderService.get(order.id)
    expect(paid.escrowStatus).toBe('held')
  })

  it('reports failed payments', async () => {
    await login('pilot@example.com')
    const quote = await checkoutService.quote({ listingId: 'lst_011' })
    const order = await orderService.create({ listingId: 'lst_011', addressId: 'adr_1', shippingOptionId: quote.selectedShippingId! })
    const init = await paymentService.initialize({ orderId: order.id, gateway: 'flutterwave', returnUrl: '/payment/callback' })
    await http.post(`/__mock/gateway/${init.reference}`, { outcome: 'fail' })
    const p = await paymentService.verify(init.reference)
    expect(p.status).toBe('failed')
  })
})

describe('admin authorization', () => {
  it('rejects admin APIs for normal users with 403', async () => {
    await login('pilot@example.com')
    const err = await expectApiError(adminService.users({}), 403)
    expect(err.code).toBe('FORBIDDEN')
  })

  it('lets staff use permitted endpoints and blocks others', async () => {
    await login('admin@example.com')
    const users = await adminService.users({ tab: 'all' })
    expect(users.data.length).toBeGreaterThan(0)
    await expectApiError(adminService.settings(), 403)
  })

  it('routes large refunds through dual control', async () => {
    await login('super@example.com')
    const res = await adminService.refund('ord_4479a', { type: 'full', reason: 'fraud_velocity', note: '', suspendBuyer: false })
    expect(res.status).toBe('pending_approval')
  })
})
