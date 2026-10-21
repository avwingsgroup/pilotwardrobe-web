import type { FitKitProfile } from '@/types/user'
import { UserRole } from '@/types/permissions'
import { db } from '../db'
import { created, fail, id, noContent, notFound, ok, on, paginate, requireUser, str, validation } from '../server'

/* ── Security & sessions ────────────────────────────────────────── */
on('GET', '/me/security', () => {
  requireUser()
  return ok(db.security)
})

on('PUT', '/me/password', ({ body }) => {
  const user = requireUser()
  const account = db.accounts.find((a) => a.id === user.id)!
  if (account.password !== str(body.currentPassword)) throw validation({ current_password: 'Your current password is incorrect.' })
  if (str(body.password).length < 8) throw validation({ password: 'The password must be at least 8 characters.' })
  if (body.password !== body.passwordConfirmation) throw validation({ password_confirmation: "Passwords don't match." })
  account.password = str(body.password)
  db.security.methods[0]!.detail = 'changed just now'
  return ok(null, 'Password changed. Other sessions were logged out.')
})

on('DELETE', '/me/sessions/:id', ({ params }) => {
  requireUser()
  const s = db.security.sessions.find((x) => x.id === params.id)
  if (!s) throw notFound('Session')
  if (s.current) throw fail(409, 'CONFLICT', 'Use Log out to end this session.')
  db.security.sessions = db.security.sessions.filter((x) => x.id !== params.id)
  return noContent()
})

on('POST', '/me/sessions/logout-others', () => {
  requireUser()
  db.security.sessions = db.security.sessions.filter((s) => s.current)
  return noContent()
})

on('DELETE', '/me/social/:provider', ({ params }) => {
  requireUser()
  const m = db.security.methods.find((x) => x.provider === params.provider)
  if (!m) throw notFound('Sign-in method')
  if (db.security.methods.filter((x) => x.connected).length <= 1) throw fail(409, 'CONFLICT', 'Add another sign-in method before disconnecting this one.')
  m.connected = false
  m.detail = 'Not connected'
  return noContent()
})

on('POST', '/me/deactivate', () => {
  requireUser()
  return ok(null, 'Account deactivated. Log in again any time to reactivate.')
})

on('DELETE', '/me', () => {
  requireUser()
  if (db.orders.some((o) => ['paid', 'awaiting_dispatch', 'in_transit', 'delivered', 'disputed'].includes(o.status)))
    throw fail(409, 'CONFLICT', 'Open orders and escrow must be settled before you can delete your account.')
  return noContent()
})

on('GET', '/me/notification-preferences', () => {
  requireUser()
  return ok(db.notificationPreferences)
})

on('PUT', '/me/notification-preferences', ({ body }) => {
  requireUser()
  db.notificationPreferences = body.preferences as typeof db.notificationPreferences
  return ok(db.notificationPreferences, 'Preferences saved.')
})

on('GET', '/me/reviews', ({ query }) => {
  requireUser()
  return paginate(str(query.role) === 'given' ? db.reviews.slice(0, 1).map((r) => ({ ...r, role: 'seller' as const, author: { displayName: 'You', initials: 'ME' } })) : db.reviews, query)
})

/* ── Fit Kit ────────────────────────────────────────────────────── */
on('GET', '/me/fit-kit', () => {
  requireUser()
  return ok(db.fitKits)
})

on('POST', '/me/fit-kit', ({ body }) => {
  requireUser()
  if (!str(body.name)) throw validation({ name: 'Give this profile a name.' })
  const profile = { ...(body as unknown as FitKitProfile), id: id('fit'), updatedAt: new Date().toISOString(), ordersUsedOn: 0 }
  if (profile.isDefault) db.fitKits.forEach((f) => (f.isDefault = false))
  db.fitKits.push(profile)
  return created(profile, 'Fit profile created.')
})

on('PATCH', '/me/fit-kit/:id', ({ params, body }) => {
  requireUser()
  const profile = db.fitKits.find((f) => f.id === params.id)
  if (!profile) throw notFound('Fit profile')
  if (body.isDefault) db.fitKits.forEach((f) => (f.isDefault = false))
  Object.assign(profile, body, { updatedAt: new Date().toISOString() })
  return ok(profile, 'Profile saved.')
})

on('DELETE', '/me/fit-kit/:id', ({ params }) => {
  requireUser()
  db.fitKits = db.fitKits.filter((f) => f.id !== params.id)
  if (db.fitKits.length && !db.fitKits.some((f) => f.isDefault)) db.fitKits[0]!.isDefault = true
  return noContent()
})

/* ── KYC & aviator verification ─────────────────────────────────── */
let selfieStartedAt = 0

const kycFor = () => {
  const user = requireUser()
  if (user.verification.kycStatus === 'approved') return { ...db.kyc, status: 'approved' as const, step: 'review' as const }
  // Simulates the KYC provider webhook completing liveness a few seconds after hand-off.
  if (db.kyc.step === 'selfie' && selfieStartedAt && Date.now() - selfieStartedAt > 6000) db.kyc = { ...db.kyc, step: 'review' }
  return db.kyc
}

on('GET', '/me/kyc', () => ok(kycFor()))

on('POST', '/me/kyc/personal', ({ body }) => {
  requireUser()
  const errors: Record<string, string> = {}
  for (const [k, w] of [['legalFirstName', 'legal_first_name'], ['legalLastName', 'legal_last_name'], ['dateOfBirth', 'date_of_birth'], ['nationality', 'nationality']] as const)
    if (!str(body[k])) errors[w] = 'This field is required.'
  if (Object.keys(errors).length) throw validation(errors)
  db.kyc = { ...db.kyc, personal: body as never, step: 'id_document', status: 'pending' }
  return ok(db.kyc)
})

on('POST', '/me/kyc/document', ({ body }) => {
  requireUser()
  if (!body.frontMediaId) throw validation({ front_media_id: 'Upload a photo of your document.' })
  db.kyc = {
    ...db.kyc,
    documentType: body.documentType as never,
    documentFront: { mediaId: str(body.frontMediaId), checks: [{ label: 'All four corners visible', passed: true }, { label: 'No glare or blur', passed: true }, { label: 'Not expired', passed: true }] },
    step: 'selfie',
  }
  selfieStartedAt = Date.now()
  return ok(db.kyc)
})

on('POST', '/me/kyc/submit', () => {
  const user = requireUser()
  db.kyc = { ...db.kyc, step: 'review', status: 'pending', submittedAt: new Date().toISOString() }
  const account = db.accounts.find((a) => a.id === user.id)!
  account.verification = { ...account.verification, kycStatus: 'pending' }
  return ok(db.kyc, 'Submitted. Our compliance team usually reviews within 24 hours.')
})

on('GET', '/me/aviator', () => {
  const user = requireUser()
  return ok(user.role === UserRole.AVIATOR ? db.aviator : null)
})

on('POST', '/me/aviator', ({ body }) => {
  const user = requireUser()
  if (user.verification.kycStatus !== 'approved') throw fail(403, 'KYC_REQUIRED', 'Verify your identity before applying for Aviator status.')
  const errors: Record<string, string> = {}
  if (!str(body.licenceNumber)) errors.licence_number = 'Enter your licence number.'
  if (!str(body.issuingAuthority)) errors.issuing_authority = 'Enter the issuing authority.'
  if (!body.licenceMediaId) errors.licence_media_id = 'Upload a photo of your licence.'
  if (Object.keys(errors).length) throw validation(errors)
  return created({
    licenceType: body.licenceType,
    licenceNumberMasked: `••••${str(body.licenceNumber).slice(-2)}`,
    issuingAuthority: body.issuingAuthority,
    jobTitle: body.jobTitle ?? null,
    organisation: body.organisation ?? null,
    typeRatings: body.typeRatings ?? [],
    status: 'pending',
    verifiedAt: null,
  }, 'Application received. Credential checks usually take 1–2 business days.')
})

/* ── Hangar summary (V5) ────────────────────────────────────────── */
on('GET', '/me/hangar', () => {
  const user = requireUser()
  const usd = (amount: number) => ({ amount, currency: 'USD' as const })
  const mine = db.listings.filter((l) => l.seller.username === 'nehemiah_o' || l.seller.id === user.id)
  const sales = db.orders.filter((o) => o.role === 'seller' || o.seller.username === 'nehemiah_o')
  const pendingOffers = db.offers.filter((o) => o.direction === 'received' && o.status === 'pending')
  const top = [...pendingOffers].sort((a, b) => b.amount.amount - a.amount.amount)[0]
  const fmt = (n: number) => `$${(n / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  return ok({
    sellerSince: user.memberSince,
    verifiedSeller: user.verification.kycStatus === 'approved',
    stats: {
      inEscrow: db.wallet.inEscrow,
      escrowOrders: db.wallet.escrowOrders,
      availableToPayOut: db.wallet.available,
      weekDelta: usd(48200),
      liveListings: mine.filter((l) => l.status === 'active').length,
      listingsNeedPhotos: 4,
      sellerRating: 4.9,
      previousRating: 4.8,
    },
    wallet: { total: db.wallet.total, available: db.wallet.available, inEscrow: db.wallet.inEscrow },
    attention: [
      { id: 'att1', tone: 'warning', title: '2 orders awaiting wheels-up', detail: 'Dispatch by tomorrow to keep your on-time rate', to: '/hangar/orders?role=seller' },
      ...(pendingOffers.length ? [{ id: 'att2', tone: 'info', title: `${pendingOffers.length} open offers`, detail: top ? `Highest: ${fmt(top.amount.amount)} on the ${top.listing.title.split(' — ')[0]} — expires in 9h` : '', to: '/hangar/offers' }] : []),
      { id: 'att3', tone: 'success', title: '1 order landed', detail: 'Escrow releases automatically in 71h', to: '/hangar/orders/ord_4468' },
    ],
    feed: [
      ...mine.filter((l) => l.status === 'active').slice(0, 1).map((l) => ({ id: `f-${l.id}`, kind: 'listing', title: l.title, subtitle: `Listed ${new Date(l.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${l.viewsCount} views · ${l.offersCount ?? 0} offers`, image: l.images[0] ?? null, price: l.price, status: { label: 'Live', tone: 'success' }, bucket: 'live', nextAction: top ? `Review highest offer — ${fmt(top.amount.amount)}` : 'Share your listing', to: '/hangar/offers' })),
      ...sales.slice(0, 3).map((o) => ({
        id: `f-${o.id}`,
        kind: 'order',
        title: o.items[0]!.title,
        subtitle: `Order #${o.number} · buyer ${o.buyer.displayName}`,
        image: o.items[0]!.image ?? null,
        price: o.items[0]!.total,
        status: o.status === 'in_transit' ? { label: 'Airborne', tone: 'info' } : o.status === 'delivered' ? { label: 'Landed', tone: 'success' } : o.status === 'awaiting_dispatch' ? { label: 'Awaiting wheels-up', tone: 'warning' } : { label: 'Completed', tone: 'neutral' },
        bucket: o.status === 'in_transit' ? 'airborne' : o.status === 'delivered' ? 'landed' : 'live',
        nextAction: o.status === 'in_transit' ? 'En route — Lagos hub · ETA in 2–4 days' : o.status === 'delivered' ? 'Escrow releases in 71h' : o.status === 'awaiting_dispatch' ? 'Print freight label by tomorrow' : 'Funds released',
        to: `/hangar/orders/${o.id}`,
      })),
      ...mine.filter((l) => l.status === 'draft').map((l) => ({ id: `f-${l.id}`, kind: 'listing', title: l.title, subtitle: 'Draft · 2 of 8 photos added', image: l.images[0] ?? null, price: l.price, status: { label: 'Draft', tone: 'neutral' }, bucket: 'drafts', nextAction: 'Finish listing to publish', to: `/hangar/listings/${l.id}/edit` })),
    ],
  })
})
