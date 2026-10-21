/**
 * Contract smoke test: drives the mock server through the same adapter the app uses and
 * checks every documented sample returns its intended status (titles ending in "(4xx)" must
 * fail with that status, everything else must succeed).
 *
 * Also the source of docs/api-payloads: `npm run docs:payloads` sets DUMP_OUT and the
 * captured wire-format samples are rendered by scripts/generate-api-payloads.py.
 */
import { writeFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import type { InternalAxiosRequestConfig } from 'axios'
import { mockAdapter } from '@/mocks/adapter'
import { db } from '@/mocks/db'
import { toSnake } from '@/api/case'

interface Call {
  doc: string
  title: string
  method: string
  url: string
  body?: Record<string, unknown>
  params?: Record<string, unknown>
  as?: string | null
}

function trim(v: unknown, depth = 0): unknown {
  if (Array.isArray(v)) {
    const head = v.slice(0, 2).map((x) => trim(x, depth + 1))
    return v.length > head.length ? [...head, `… ${v.length - head.length} more`] : head
  }
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, trim(x, depth + 1)]))
  return v
}

test('mock server honours the documented contract', { timeout: 60_000 }, async () => {
  URL.createObjectURL = () => 'blob:mock'
  const parse = (d: unknown) => (typeof d === 'string' && d ? JSON.parse(d) : d && typeof d === 'object' ? d : null)
  const L = db.listings
  const pub = L.find((l) => l.status === 'active' && l.seller.id !== 'usr_10422')!
  const mine = L.find((l) => l.seller.id === 'usr_10422')!
  const order = db.orders[0]!
  const offer = db.offers[0]!
  const conv = db.conversations[0]!
  const dispute = db.disputes[0]!
  const notif = db.notifications[0]!
  const fit = db.fitKits[0]!
  const addr = db.addresses[0]!
  const au = db.admin.users[0]!
  const kyc = db.admin.kyc[0]!
  const aOrder = db.admin.orders[0]!
  const aDispute = db.admin.disputes[0]!
  const report = db.admin.reports[0]!
  const slide = db.admin.heroSlides[0]!
  const P = 'usr_10422'
  const A = 'usr_20001'
  const SA = 'usr_20000'

  const calls: Call[] = [
    // auth
    { doc: 'auth', title: 'Email lookup', method: 'POST', url: '/auth/email-lookup', body: { email: 'pilot@example.com' }, as: null },
    { doc: 'auth', title: 'Login — authenticated', method: 'POST', url: '/auth/login', body: { email: 'pilot@example.com', password: 'Password1', remember: true }, as: null },
    { doc: 'auth', title: 'Login — two-factor required', method: 'POST', url: '/auth/login', body: { email: 'aviator@example.com', password: 'Password1', remember: false }, as: null },
    { doc: 'auth', title: 'Login — wrong password (422)', method: 'POST', url: '/auth/login', body: { email: 'newbie@example.com', password: 'nope', remember: false }, as: null },
    { doc: 'auth', title: 'Register', method: 'POST', url: '/auth/register', body: { firstName: 'Ada', lastName: 'Obi', email: 'ada.obi@example.com', phone: '+2348030000000', password: 'Password1!', passwordConfirmation: 'Password1!', countryCode: 'NG', accountType: 'user', termsAccepted: true, marketingOptIn: false }, as: null },
    { doc: 'auth', title: 'Register — validation failure (422)', method: 'POST', url: '/auth/register', body: { firstName: '', lastName: 'Obi', email: 'pilot@example.com', password: 'short', passwordConfirmation: 'x', countryCode: 'NG', accountType: 'user', termsAccepted: false }, as: null },
    { doc: 'auth', title: 'Verify email OTP', method: 'POST', url: '/auth/email/verify', body: { email: 'ada.obi@example.com', code: '1234' }, as: null },
    { doc: 'auth', title: 'Resend email OTP', method: 'POST', url: '/auth/email/resend', body: { email: 'ada.obi@example.com' }, as: null },
    { doc: 'auth', title: 'Forgot password', method: 'POST', url: '/auth/password/forgot', body: { email: 'pilot@example.com' }, as: null },
    { doc: 'auth', title: 'Check reset token', method: 'GET', url: '/auth/password/reset/demo-reset-token', as: null },
    { doc: 'auth', title: 'Reset password — expired token (410)', method: 'POST', url: '/auth/password/reset', body: { token: 'expired-token', email: 'pilot@example.com', password: 'Password2!', passwordConfirmation: 'Password2!', logoutOtherDevices: true }, as: null },
    { doc: 'auth', title: 'Current user (/auth/me)', method: 'GET', url: '/auth/me', as: P },
    { doc: 'auth', title: 'Current user — signed out (401)', method: 'GET', url: '/auth/me', as: null },
    { doc: 'auth', title: 'Username availability', method: 'GET', url: '/auth/username-availability', params: { username: 'captain_ada' }, as: null },
    { doc: 'auth', title: 'Social redirect URL', method: 'GET', url: '/auth/social/google/redirect', as: null },
    { doc: 'auth', title: 'Logout', method: 'POST', url: '/auth/logout', as: P },
    // users / profiles
    { doc: 'users', title: 'Update profile', method: 'PATCH', url: '/me', body: { firstName: 'Nehemiah', bio: 'A320 FO' }, as: P },
    { doc: 'users', title: 'Security overview', method: 'GET', url: '/me/security', as: P },
    { doc: 'users', title: 'Change password — validation (422)', method: 'PUT', url: '/me/password', body: { currentPassword: 'wrong', password: 'Password2!', passwordConfirmation: 'Password2!' }, as: P },
    { doc: 'users', title: 'Notification preferences', method: 'GET', url: '/me/notification-preferences', as: P },
    { doc: 'users', title: 'Fit Kit profiles', method: 'GET', url: '/me/fit-kit', as: P },
    { doc: 'users', title: 'Update Fit Kit profile', method: 'PATCH', url: `/me/fit-kit/${fit.id}`, body: { jacket: '40R', collar: '15.5' }, as: P },
    { doc: 'users', title: 'Addresses', method: 'GET', url: '/me/addresses', as: P },
    { doc: 'users', title: 'Create address', method: 'POST', url: '/me/addresses', body: { label: 'Crew house', fullName: 'Nehemiah Okafor', phone: '+2348031234567', line1: '12 Airport Rd', city: 'Ikeja', state: 'Lagos', countryCode: 'NG', isDefault: false }, as: P },
    { doc: 'users', title: 'KYC status', method: 'GET', url: '/me/kyc', as: 'usr_12409' },
    { doc: 'users', title: 'Aviator credentials', method: 'GET', url: '/me/aviator', as: 'usr_102' },
    { doc: 'users', title: 'Hangar summary', method: 'GET', url: '/me/hangar', as: P },
    { doc: 'profiles', title: 'Seller directory', method: 'GET', url: '/sellers', params: { per_page: 2 }, as: null },
    { doc: 'profiles', title: 'Seller profile', method: 'GET', url: `/sellers/${pub.seller.username}`, as: null },
    { doc: 'profiles', title: 'Seller listings', method: 'GET', url: `/sellers/${pub.seller.username}/listings`, params: { per_page: 2 }, as: null },
    { doc: 'profiles', title: 'Follow seller', method: 'POST', url: `/sellers/${pub.seller.username}/follow`, as: P },
    // listings / products
    { doc: 'listings', title: 'Search listings', method: 'GET', url: '/listings', params: { search: 'headset', category: 'headsets', condition: 'like_new,good', min_price: 10000, sort: 'price_asc', page: 1, per_page: 2 }, as: null },
    { doc: 'listings', title: 'My listings', method: 'GET', url: '/me/listings', params: { status: 'active', per_page: 2 }, as: P },
    { doc: 'listings', title: 'Create draft listing', method: 'POST', url: '/listings', body: { title: 'David Clark H10-13.4 headset', description: 'Lightly used, new ear seals, original case and receipt included.', categoryId: 'headsets', brand: 'David Clark', model: 'H10-13.4', attributes: { connector: 'Dual GA' }, serialNumber: '', yearPurchased: '2023', tags: ['headset'], condition: 'good', format: 'physical', price: { amount: 18500, currency: 'USD' }, negotiable: true, minimumOffer: { amount: 16000, currency: 'USD' }, autoDeclineBelowMinimum: true }, as: P },
    { doc: 'listings', title: 'Publish listing — no photos (422)', method: 'POST', url: '/listings/__DRAFT__/publish', as: P },
    { doc: 'listings', title: 'Fee quote', method: 'POST', url: '/listings/fee-quote', body: { price: { amount: 18500, currency: 'USD' } }, as: P },
    { doc: 'listings', title: 'Bulk action', method: 'POST', url: '/listings/bulk', body: { ids: [mine.id], action: 'pause' }, as: P },
    { doc: 'listings', title: 'Upload media (multipart → MediaAsset)', method: 'POST', url: '/media', body: { type: 'listing' }, as: P },
    { doc: 'products', title: 'Listing detail', method: 'GET', url: `/listings/${pub.slug}`, as: null },
    { doc: 'products', title: 'Related listings', method: 'GET', url: `/listings/${pub.slug}/related`, as: null },
    { doc: 'products', title: 'Categories', method: 'GET', url: '/categories', as: null },
    { doc: 'products', title: 'Category detail', method: 'GET', url: '/categories/headsets', as: null },
    { doc: 'products', title: 'Home feed', method: 'GET', url: '/home', as: null },
    { doc: 'products', title: 'Favourite listing', method: 'POST', url: `/listings/${pub.id}/favorite`, as: P },
    { doc: 'products', title: 'Not found (404)', method: 'GET', url: '/listings/does-not-exist', as: null },
    // offers / swaps
    { doc: 'offers', title: 'Make offer', method: 'POST', url: `/listings/${pub.id}/offers`, body: { amount: Math.round(pub.price.amount * 0.85), currency: pub.price.currency, message: 'Would you take this?' }, as: P },
    { doc: 'offers', title: 'Make offer — below floor (422)', method: 'POST', url: `/listings/${pub.id}/offers`, body: { amount: 0, currency: pub.price.currency }, as: P },
    { doc: 'offers', title: 'My offers inbox', method: 'GET', url: '/me/offers', params: { box: 'received' }, as: P },
    { doc: 'offers', title: 'Counter offer', method: 'POST', url: `/offers/${offer.id}/counter`, body: { amount: Math.round((offer.amount.amount + offer.listing.price.amount) / 2), currency: offer.amount.currency, message: 'Meet me in the middle?' }, as: P },
    { doc: 'swaps', title: 'Propose swap', method: 'POST', url: `/listings/${pub.id}/swap-requests`, body: { offeredListingIds: [mine.id], cashAdjustment: { amount: 2000, currency: 'USD' }, message: 'Straight swap plus $20?' }, as: 'usr_102' },
    { doc: 'swaps', title: 'Propose swap — KYC required (403)', method: 'POST', url: `/listings/${pub.id}/swap-requests`, body: { offeredListingIds: [], message: 'hi' }, as: 'usr_12409' },
    { doc: 'swaps', title: 'My swap requests', method: 'GET', url: '/me/swap-requests', as: P },
    // orders
    { doc: 'orders', title: 'Cart', method: 'GET', url: '/cart', as: P },
    { doc: 'orders', title: 'Add to cart', method: 'POST', url: '/cart/items', body: { listingId: pub.id, size: pub.sizes?.available[0] ?? null }, as: P },
    { doc: 'orders', title: 'Checkout quote', method: 'POST', url: '/checkout/quote', body: { listingId: pub.id, size: pub.sizes?.available[0] ?? null, addressId: addr.id, shippingOptionId: 'shp_std' }, as: P },
    { doc: 'orders', title: 'Create order', method: 'POST', url: '/orders', body: { listingId: pub.id, size: pub.sizes?.available[0] ?? null, addressId: addr.id, shippingOptionId: 'shp_std', promoCode: null }, as: P },
    { doc: 'orders', title: 'My orders', method: 'GET', url: '/me/orders', params: { role: 'buying', per_page: 2 }, as: P },
    { doc: 'orders', title: 'Order detail', method: 'GET', url: `/orders/${order.id}`, as: P },
    { doc: 'orders', title: 'Confirm delivery — wrong state (409)', method: 'POST', url: `/orders/${db.orders.find((o) => o.status === 'completed')?.id ?? order.id}/confirm-delivery`, as: P },
    // payments
    { doc: 'payments', title: 'Available payment methods', method: 'GET', url: '/payment-methods', params: { currency: 'NGN', country: 'NG' }, as: P },
    { doc: 'payments', title: 'Initialize payment', method: 'POST', url: '/payments/initialize', body: { orderId: '__ORDER__', gateway: 'paystack', returnUrl: 'https://pilotwardrobe.com/payment/callback' }, as: P },
    { doc: 'payments', title: 'Verify payment (poll)', method: 'GET', url: '/payments/__REF__', as: P },
    { doc: 'payments', title: 'Initialize — unsupported gateway (422)', method: 'POST', url: '/payments/initialize', body: { orderId: '__ORDER__', gateway: '', returnUrl: 'https://pilotwardrobe.com/payment/callback' }, as: P },
    // transactions / wallet
    { doc: 'transactions', title: 'Wallet', method: 'GET', url: '/me/wallet', as: P },
    { doc: 'transactions', title: 'Wallet transactions', method: 'GET', url: '/me/wallet/transactions', params: { per_page: 2 }, as: P },
    { doc: 'transactions', title: 'Payout methods', method: 'GET', url: '/me/payout-methods', as: P },
    { doc: 'transactions', title: 'Withdrawal quote', method: 'POST', url: '/me/withdrawals/quote', body: { amount: 20000, currency: 'USD', payoutMethodId: db.payoutMethods[0]?.id }, as: P },
    { doc: 'transactions', title: 'Request withdrawal', method: 'POST', url: '/me/withdrawals', body: { amount: 20000, currency: 'USD', payoutMethodId: db.payoutMethods[0]?.id, twoFactorCode: '123456' }, as: P },
    // messages
    { doc: 'messages', title: 'Conversations', method: 'GET', url: '/conversations', as: P },
    { doc: 'messages', title: 'Conversation messages', method: 'GET', url: `/conversations/${conv.id}/messages`, as: P },
    { doc: 'messages', title: 'Send message', method: 'POST', url: `/conversations/${conv.id}/messages`, body: { body: 'Is the headset still available?', attachmentIds: [] }, as: P },
    { doc: 'messages', title: 'Send message — empty (422)', method: 'POST', url: `/conversations/${conv.id}/messages`, body: { body: '' }, as: P },
    // reviews
    { doc: 'reviews', title: 'Seller reviews (public)', method: 'GET', url: `/sellers/${pub.seller.username}/reviews`, params: { per_page: 2 }, as: null },
    { doc: 'reviews', title: 'My reviews', method: 'GET', url: '/me/reviews', as: P },
    { doc: 'reviews', title: 'Review an order', method: 'POST', url: `/orders/${order.id}/reviews`, body: { rating: 5, comment: 'Fast dispatch, exactly as described.', tags: ['as_described', 'fast_dispatch'] }, as: P },
    // notifications
    { doc: 'notifications', title: 'Notifications', method: 'GET', url: '/notifications', params: { per_page: 2 }, as: P },
    { doc: 'notifications', title: 'Unread count', method: 'GET', url: '/notifications/unread-count', as: P },
    { doc: 'notifications', title: 'Mark read', method: 'PATCH', url: `/notifications/${notif.id}/read`, as: P },
    { doc: 'notifications', title: 'Mark all read', method: 'POST', url: '/notifications/read-all', as: P },
    // disputes
    { doc: 'disputes', title: 'My disputes', method: 'GET', url: '/me/disputes', as: P },
    { doc: 'disputes', title: 'Dispute case', method: 'GET', url: `/disputes/${dispute.id}`, as: P },
    { doc: 'disputes', title: 'Open dispute — validation (422)', method: 'POST', url: '/disputes', body: { orderId: order.id, reason: '', requested: 'full_refund', amount: null, description: '', evidenceIds: [] }, as: P },
    { doc: 'disputes', title: 'Reply on dispute', method: 'POST', url: `/disputes/${dispute.id}/messages`, body: { body: 'Photos of the damaged ear cup attached.', evidenceIds: [] }, as: P },
    // admin
    { doc: 'admin', title: 'Overview', method: 'GET', url: '/admin/overview', as: SA },
    { doc: 'admin', title: 'Users table', method: 'GET', url: '/admin/users', params: { tab: 'all', per_page: 2, sort: '-joined_at' }, as: A },
    { doc: 'admin', title: 'User detail', method: 'GET', url: `/admin/users/${au.id}`, as: A },
    { doc: 'admin', title: 'Forbidden for staff without permission (403)', method: 'GET', url: '/admin/settings', as: A },
    { doc: 'admin', title: 'KYC review item', method: 'GET', url: `/admin/kyc/${kyc.id}`, as: SA },
    { doc: 'admin', title: 'Moderation decision', method: 'POST', url: '/admin/moderation/decisions', body: { ids: [db.admin.moderation[0]?.id], action: 'request_changes', note: 'Add a photo of the serial plate.' }, as: SA },
    { doc: 'admin', title: 'Admin order detail', method: 'GET', url: `/admin/orders/${aOrder.id}`, as: SA },
    { doc: 'admin', title: 'Refund — dual control', method: 'POST', url: `/admin/orders/${aOrder.id}/refund`, body: { type: 'full', reason: 'not_as_described', note: 'Seller confirmed wrong model shipped.', suspendBuyer: false }, as: SA },
    { doc: 'admin', title: 'Dispute decision', method: 'POST', url: `/admin/disputes/${aDispute.id}/decision`, body: { decision: 'partial_refund', amountToBuyer: 5000, policyReference: 'Buyer protection 4.2 (cosmetic damage)' }, as: SA },
    { doc: 'admin', title: 'Report action', method: 'POST', url: `/admin/reports/${report.id}/actions`, body: { action: 'dismiss', note: 'No violation' }, as: SA },
    { doc: 'admin', title: 'Payouts table', method: 'GET', url: '/admin/payouts', params: { per_page: 2 }, as: SA },
    { doc: 'admin', title: 'Fee rule change — dual control', method: 'POST', url: '/admin/commission-rules', body: { name: 'Headsets', rate: 7.5 }, as: SA },
    { doc: 'admin', title: 'Hero slide update', method: 'PATCH', url: `/admin/content/hero-slides/${slide.id}`, body: { headline: slide.headline, active: true }, as: SA },
    { doc: 'admin', title: 'Roles', method: 'GET', url: '/admin/roles', as: SA },
    { doc: 'admin', title: 'Update role permissions', method: 'PATCH', url: `/admin/roles/${db.admin.roles[1]!.id}`, body: { matrix: { ...db.admin.roles[1]!.matrix, payouts: 'none' } }, as: SA },
    { doc: 'admin', title: 'Audit log', method: 'GET', url: '/admin/audit-logs', params: { per_page: 2 }, as: SA },
    { doc: 'admin', title: 'Platform settings', method: 'GET', url: '/admin/settings', as: SA },
    { doc: 'swaps', title: 'Accept swap', method: 'POST', url: '/swap-requests/__SWAP__/accept', as: P },
    { doc: 'disputes', title: 'Accept seller proposal', method: 'POST', url: `/disputes/${dispute.id}/proposal/accept`, as: P },
    { doc: 'admin', title: 'Suspend user', method: 'POST', url: `/admin/users/${au.id}/suspend`, body: { reason: 'Off-platform payment solicitation', note: 'Second strike' }, as: SA },
    { doc: 'admin', title: 'KYC approve', method: 'POST', url: `/admin/kyc/${kyc.id}/approve`, body: { reason: '' }, as: SA },
    { doc: 'admin', title: 'Hold payout', method: 'POST', url: `/admin/payouts/${db.admin.payouts[0]!.id}/hold`, body: { reason: 'Pending dispute on linked order' }, as: SA },
  ]

  const out: (Call & { status: number; request?: unknown; response: unknown })[] = []
  let orderId = ''
  let reference = ''
  let draftId = ''
  let swapId = ''
  for (const c of calls) {
    db.setSession(c.as ?? null)
    let body = c.body ? JSON.parse(JSON.stringify(c.body).replace('__ORDER__', orderId)) : undefined
    const url = c.url.replace('__REF__', reference).replace('__DRAFT__', draftId).replace('__SWAP__', swapId)
    if (c.url === '/media') {
      const fd = new FormData()
      fd.append('file', new Blob(['x'], { type: 'image/jpeg' }), 'photo.jpg')
      fd.append('type', 'listing')
      body = undefined
      const res = await mockAdapter({ method: 'post', url, baseURL: '/api/v1', data: fd, headers: {} } as unknown as InternalAxiosRequestConfig).catch((e) => e.response)
      out.push({ ...c, status: res.status, request: 'multipart/form-data: file=<binary>, type=listing', response: trim(parse(res.data)) })
      continue
    }
    const res = await mockAdapter({ method: c.method.toLowerCase(), url, baseURL: '/api/v1', params: c.params, data: body ? JSON.stringify(toSnake(body)) : undefined, headers: {} } as unknown as InternalAxiosRequestConfig).catch((e) => e.response)
    const parsed = parse(res.data)
    if (c.title === 'Create order') orderId = parsed?.data?.id ?? ''
    if (c.title === 'Initialize payment') reference = parsed?.data?.reference ?? ''
    if (c.title === 'Create draft listing') draftId = parsed?.data?.id ?? ''
    if (c.title === 'My swap requests') swapId = parsed?.data?.find?.((x: { status: string; id: string }) => x.status === 'pending')?.id ?? ''
    out.push({ ...c, url, status: res.status, request: body ? toSnake(body) : undefined, response: parsed ? trim(parsed) : null })
  }
  for (const c of out) {
    const expected = Number(/\((\d{3})\)$/.exec(c.title)?.[1] ?? 0)
    if (expected) expect(c.status, c.title).toBe(expected)
    else expect(c.status, c.title).toBeLessThan(400)
  }
  if (process.env.DUMP_OUT) writeFileSync(process.env.DUMP_OUT, JSON.stringify(out, null, 1))
})
