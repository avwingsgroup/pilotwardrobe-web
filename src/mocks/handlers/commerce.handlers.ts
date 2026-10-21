import type { Listing, ListingDraft, ListingStatus, ListingAction } from '@/types/product'
import type { Order, CartItem } from '@/types/order'
import type { PaymentGateway, PaymentMethod } from '@/types/payment'
import type { CurrencyCode, Money } from '@/types/api'
import type { MediaAsset } from '@/types/media'
import { db } from '../db'
import { flatCategories } from '../products.mock'
import { sellers } from '../users.mock'
import { mockMedia } from '../media'
import { created, fail, id, MockBlob, noContent, notFound, num, ok, on, paginate, requirePermission, requireUser, str, validation } from '../server'

const usd = (amount: number): Money => ({ amount, currency: 'USD' })
const PLATFORM_FEE = 0.08
const BUYER_PROTECTION = 0.02

/* ── Owner listings ─────────────────────────────────────────────── */
const ACTIONS: Record<ListingStatus, ListingAction[]> = {
  draft: ['finish', 'preview', 'delete'],
  pending_review: ['preview', 'edit'],
  active: ['edit', 'preview', 'promote', 'pause', 'mark_sold', 'mark_unavailable', 'archive'],
  paused: ['resume', 'edit', 'archive', 'delete'],
  reserved: ['preview', 'mark_sold'],
  sold: ['relist', 'preview'],
  swapped: ['preview'],
  archived: ['relist', 'delete'],
  needs_changes: ['resubmit', 'edit', 'delete'],
  rejected: ['delete'],
  removed: ['preview'],
}

const mine = (userId: string) =>
  db.listings.filter((l) => l.seller.id === userId || (userId === 'usr_10422' && l.seller.username === 'nehemiah_o'))

const withActions = (l: Listing): Listing => ({ ...l, allowedActions: ACTIONS[l.status] })

on('GET', '/me/listings', ({ query }) => {
  const user = requireUser()
  const all = mine(user.id)
  const status = str(query.status) || 'all'
  const search = str(query.search).toLowerCase()
  const filtered = all.filter((l) => {
    if (search && !l.title.toLowerCase().includes(search)) return false
    if (query.promoted === 'true' && !l.promoted) return false
    if (status === 'all') return true
    if (status === 'live') return l.status === 'active' || l.status === 'reserved'
    if (status === 'drafts') return l.status === 'draft'
    if (status === 'removed') return ['removed', 'needs_changes', 'rejected'].includes(l.status)
    return l.status === status
  })
  const count = (fn: (l: Listing) => boolean) => all.filter(fn).length
  return paginate(filtered.map(withActions), query, {
    counts: {
      all: all.length,
      live: count((l) => l.status === 'active'),
      drafts: count((l) => l.status === 'draft'),
      paused: count((l) => l.status === 'paused'),
      sold: count((l) => l.status === 'sold'),
      removed: count((l) => ['removed', 'needs_changes', 'rejected'].includes(l.status)),
    },
  }, 10)
})

on('GET', '/me/listings/:id', ({ params }) => {
  const user = requireUser()
  const listing = mine(user.id).find((l) => l.id === params.id)
  if (!listing) throw notFound('Listing')
  return ok(withActions(listing))
})

function applyDraft(listing: Listing, draft: Partial<ListingDraft>) {
  if (draft.title !== undefined) listing.title = draft.title
  if (draft.description !== undefined) listing.description = draft.description
  if (draft.categoryId) {
    const c = flatCategories().find((x) => x.id === draft.categoryId)
    if (c) listing.category = { id: c.id, slug: c.slug, name: c.name }
  }
  if (draft.condition) listing.condition = draft.condition
  if (draft.price) listing.price = draft.price
  if (draft.negotiable !== undefined) listing.negotiable = draft.negotiable
  if (draft.minimumOffer !== undefined) listing.minimumOffer = draft.minimumOffer
  if (draft.swappable !== undefined) listing.swappable = draft.swappable
  if (draft.brand !== undefined) listing.brand = draft.brand
  if (draft.model !== undefined) listing.model = draft.model
  if (draft.tags) listing.tags = draft.tags
  if (draft.aircraftTypes) listing.aircraftTypes = draft.aircraftTypes
  if (draft.mediaIds) {
    const media = draft.mediaIds.map((mid) => uploads.get(mid) ?? mediaFromId(mid)).filter((m): m is MediaAsset => !!m)
    if (media.length) listing.images = media
  }
  listing.updatedAt = new Date().toISOString()
}

const uploads = new Map<string, MediaAsset>()
const mediaFromId = (mid: string): MediaAsset | null => {
  const slug = mid.replace(/^med_/, '')
  try {
    return mockMedia(slug as Parameters<typeof mockMedia>[0])
  } catch {
    return null
  }
}

on('POST', '/listings', ({ body }) => {
  const user = requirePermission('listings.create')
  const draft = body as Partial<ListingDraft>
  const listing: Listing = {
    ...structuredClone(db.listings[0]!),
    id: id('lst'),
    slug: `${str(draft.title || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60)}-${Math.random().toString(36).slice(2, 6)}`,
    status: 'draft',
    seller: { ...sellers.nehemiah!, id: user.id, username: user.username, displayName: user.displayName },
    images: [],
    badges: [],
    promoted: false,
    viewsCount: 0,
    favoritesCount: 0,
    offersCount: 0,
    soldCount: 0,
    createdAt: new Date().toISOString(),
  }
  applyDraft(listing, draft)
  db.listings.unshift(listing)
  return created(withActions(listing), 'Draft saved.')
})

on('PATCH', '/listings/:id', ({ params, body }) => {
  const user = requirePermission('listings.update')
  const listing = mine(user.id).find((l) => l.id === params.id)
  if (!listing) throw notFound('Listing')
  applyDraft(listing, body as Partial<ListingDraft>)
  return ok(withActions(listing), 'Saved.')
})

on('POST', '/listings/:id/publish', ({ params, body }) => {
  const user = requirePermission('listings.create')
  if (user.verification.kycStatus !== 'approved') {
    const live = mine(user.id).filter((l) => l.status === 'active').length
    if (live >= 3) throw fail(403, 'KYC_REQUIRED', 'Unverified accounts are capped at 3 live listings. Verify your identity to list more.')
  }
  const listing = mine(user.id).find((l) => l.id === params.id)
  if (!listing) throw notFound('Listing')
  const draft = body as Partial<ListingDraft>
  applyDraft(listing, draft)
  const errors: Record<string, string> = {}
  if (listing.title.length < 10) errors.title = 'Add a descriptive title (10+ characters).'
  if (!listing.images.length) errors.media_ids = 'Add at least one photo.'
  if (listing.price.amount <= 0) errors['price.amount'] = 'The price must be greater than zero.'
  if (draft.attestations && !(draft.attestations.ownsItem && draft.attestations.notCounterfeit && draft.attestations.dispatchCommitment))
    errors.attestations = 'Please confirm all three statements.'
  if (Object.keys(errors).length) throw validation(errors)
  listing.status = user.verification.kycStatus === 'approved' ? 'active' : 'pending_review'
  if (draft.boost && draft.boost !== 'none') {
    listing.promoted = true
    listing.boost = { package: draft.boost, endsAt: new Date(Date.now() + (draft.boost === 'runway' ? 3 : 7) * 86400_000).toISOString() }
  }
  return ok(withActions(listing), listing.status === 'active' ? 'Your listing is live.' : 'Submitted for review.')
})

const TRANSITIONS: Record<string, { from: ListingStatus[]; to: ListingStatus }> = {
  pause: { from: ['active'], to: 'paused' },
  resume: { from: ['paused'], to: 'active' },
  archive: { from: ['active', 'paused'], to: 'archived' },
  'mark-sold': { from: ['active', 'reserved', 'paused'], to: 'sold' },
  'mark-unavailable': { from: ['active'], to: 'paused' },
  relist: { from: ['sold', 'archived'], to: 'active' },
  resubmit: { from: ['needs_changes'], to: 'pending_review' },
  promote: { from: ['active'], to: 'active' },
}

on('POST', '/listings/:id/:action', ({ params }) => {
  const user = requirePermission('listings.update')
  const t = TRANSITIONS[params.action!]
  if (!t) throw notFound('Action')
  const listing = mine(user.id).find((l) => l.id === params.id)
  if (!listing) throw notFound('Listing')
  if (!t.from.includes(listing.status)) throw fail(409, 'INVALID_STATE_TRANSITION', `A ${listing.status} listing can't be ${params.action}d.`)
  listing.status = t.to
  if (params.action === 'promote') listing.promoted = true
  return ok(withActions(listing))
})

on('DELETE', '/listings/:id', ({ params }) => {
  const user = requirePermission('listings.update')
  const index = db.listings.findIndex((l) => l.id === params.id && mine(user.id).includes(l))
  if (index < 0) throw notFound('Listing')
  if (['sold', 'reserved'].includes(db.listings[index]!.status)) throw fail(409, 'INVALID_STATE_TRANSITION', 'Listings with orders cannot be deleted.')
  db.listings.splice(index, 1)
  return noContent()
})

on('POST', '/listings/bulk', ({ body }) => {
  const user = requirePermission('listings.update')
  const ids = (body.ids as string[]) ?? []
  let updated = 0
  for (const listing of mine(user.id).filter((l) => ids.includes(l.id))) {
    if (body.action === 'edit_price' && body.adjustPercent !== undefined)
      listing.price = { ...listing.price, amount: Math.max(100, Math.round(listing.price.amount * (1 + Number(body.adjustPercent) / 100))) }
    else if (body.action === 'pause' && listing.status === 'active') listing.status = 'paused'
    else if (body.action === 'promote' && listing.status === 'active') listing.promoted = true
    else if (body.action === 'mark_sold') listing.status = 'sold'
    else if (body.action === 'delete') db.listings.splice(db.listings.indexOf(listing), 1)
    else continue
    updated++
  }
  return ok({ updated }, `${updated} listing${updated === 1 ? '' : 's'} updated.`)
})

on('POST', '/listings/imports', async ({ form }) => {
  requirePermission('listings.create')
  const file = form?.get('file')
  if (!(file instanceof File)) throw validation({ file: 'Choose a CSV file.' })
  if (!/\.csv$/i.test(file.name)) throw validation({ file: 'Upload a .csv file.' })
  const rows = (await file.text()).split(/\r?\n/).filter((l) => l.trim()).slice(1)
  const failed = rows
    .map((r, i) => ({ row: i + 2, cols: r.split(',') }))
    .filter((r) => r.cols.length < 4)
    .map((r) => ({ row: r.row, error: 'Expected title, category, condition, price' }))
  return created({ imported: rows.length - failed.length, drafts: rows.length - failed.length, failed }, 'Import complete — rows were saved as drafts for review.')
})

on('POST', '/listings/price-check', ({ body }) => {
  requireUser()
  const currency = (str(body.currency) || 'USD') as CurrencyCode
  return ok({ low: { amount: 69000, currency }, high: { amount: 78000, currency }, sampleSize: 31, basis: `Based on 31 ${str(body.brand) || 'similar'} ${str(body.model)} sales in the last 90 days, like-new, dual GA.`, position: 'fast_sell' })
})

on('POST', '/listings/fee-quote', ({ body }) => {
  const price = (body.price as Money) ?? usd(0)
  const fee = Math.round(price.amount * PLATFORM_FEE)
  return ok({ platformFeeRate: PLATFORM_FEE * 100, platformFee: { amount: fee, currency: price.currency }, sellerReceives: { amount: price.amount - fee, currency: price.currency } })
})

on('POST', '/listings/:id/reserve', ({ params }) => {
  const user = requireUser()
  const listing = db.listings.find((l) => l.id === params.id)
  if (!listing) throw notFound('Listing')
  if (listing.seller.id !== user.id) throw fail(403, 'FORBIDDEN', 'Only the seller can reserve this listing.')
  if (listing.status !== 'active') throw fail(409, 'INVALID_STATE_TRANSITION', `A ${listing.status} listing can't be reserved.`)
  listing.status = 'reserved'
  return noContent()
})

/* ── Media ──────────────────────────────────────────────────────── */
on('POST', '/media', ({ form }) => {
  requireUser()
  const file = form?.get('file')
  if (!(file instanceof File)) throw validation({ file: 'Choose a file to upload.' })
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)) throw validation({ file: 'Use a JPG, PNG or HEIC image.' })
  if (file.size > 20 * 1024 * 1024) throw validation({ file: 'Images must be 20 MB or smaller.' })
  const url = URL.createObjectURL(file)
  const asset: MediaAsset = {
    id: id('med'),
    publicId: `pilotwardrobe/${str(form?.get('type'))}/${file.name}`,
    url,
    secureUrl: url,
    width: 1600,
    height: 1200,
    format: file.type.split('/')[1] ?? 'jpg',
    bytes: file.size,
    alt: file.name.replace(/\.[a-z]+$/i, '').replace(/[-_]/g, ' '),
    variants: { thumbnail: url, small: url, medium: url, large: url, original: url },
  }
  uploads.set(asset.id, asset)
  return created(asset, 'Uploaded.')
})

on('DELETE', '/media/:id', ({ params }) => {
  requireUser()
  uploads.delete(params.id!)
  return noContent()
})

/* ── Cart & checkout ────────────────────────────────────────────── */
function cartPayload() {
  const items: CartItem[] = db.cart
    .map((c, i): CartItem | null => {
      const l = db.listings.find((x) => x.id === c.listingId)
      if (!l) return null
      return {
        id: `ci_${i}_${l.id}`,
        listingId: l.id,
        listingSlug: l.slug,
        title: l.title,
        image: l.images[0] ?? null,
        condition: l.condition,
        size: c.size,
        sizeFromFitKit: c.sizeFromFitKit,
        price: l.price,
        seller: { id: l.seller.id, displayName: l.seller.displayName, username: l.seller.username, verified: l.seller.verified },
        available: l.status === 'active',
      }
    })
    .filter((x): x is CartItem => !!x)
  return { id: 'cart_me', items, subtotal: usd(items.reduce((s, i) => s + i.price.amount, 0)), currency: 'USD' as const }
}

on('GET', '/cart', () => {
  requireUser()
  return ok(cartPayload())
})

on('POST', '/cart/items', ({ body }) => {
  requirePermission('orders.create')
  const listing = db.listings.find((l) => l.id === body.listingId)
  if (!listing || listing.status !== 'active') throw fail(409, 'CONFLICT', 'This item is no longer available.')
  if (listing.sizes && !body.size) throw validation({ size: 'Choose a size.' })
  if (!db.cart.some((c) => c.listingId === listing.id)) db.cart.push({ listingId: listing.id, size: (body.size as string | null) ?? null, sizeFromFitKit: false })
  return ok(cartPayload(), 'Added to your cart.')
})

on('DELETE', '/cart/items/:id', ({ params }) => {
  requireUser()
  const listingId = params.id!.replace(/^ci_\d+_/, '')
  db.cart = db.cart.filter((c) => c.listingId !== listingId)
  return ok(cartPayload())
})

function quoteFor(items: CartItem[], shippingId?: string | null) {
  const listing = db.listings.find((l) => l.id === items[0]?.listingId)
  const options = listing?.format === 'physical' ? listing.shipping ?? [] : []
  const selected = options.find((o) => o.id === shippingId) ?? options[0] ?? null
  const itemsTotal = items.reduce((s, i) => s + i.price.amount, 0)
  const freight = selected?.price.amount ?? 0
  const protection = Math.min(2500, Math.round(itemsTotal * BUYER_PROTECTION) + 31)
  const duties = options.length ? 1840 : 0
  return {
    items,
    shippingOptions: options,
    selectedShippingId: selected?.id ?? null,
    totals: { items: usd(itemsTotal), freight: usd(freight), buyerProtection: usd(protection), duties: duties ? usd(duties) : null, total: usd(itemsTotal + freight + protection + duties) },
    dispatchNote: options.length ? 'Seller ships within 5 days — estimated arrival in 6–8 days.' : 'Instant download after payment is verified.',
    escrowNote: 'Funds are held in escrow until you confirm arrival — or released automatically 72h after landing.',
  }
}

on('POST', '/checkout/quote', ({ body }) => {
  requirePermission('orders.create')
  let items: CartItem[]
  if (body.listingId) {
    const l = db.listings.find((x) => x.id === body.listingId)
    if (!l || l.status !== 'active') throw fail(409, 'CONFLICT', 'This item is no longer available.')
    const offer = body.offerId ? db.offers.find((o) => o.id === body.offerId && o.status === 'accepted') : null
    items = [{ id: `ci_${l.id}`, listingId: l.id, listingSlug: l.slug, title: l.title, image: l.images[0] ?? null, condition: l.condition, size: (body.size as string) ?? null, sizeFromFitKit: !!body.size, price: offer ? offer.amount : l.price, seller: { id: l.seller.id, displayName: l.seller.displayName, username: l.seller.username, verified: l.seller.verified }, available: true }]
  } else {
    items = cartPayload().items
  }
  if (!items.length) throw fail(409, 'CONFLICT', 'Your cart is empty.')
  return ok(quoteFor(items, body.shippingOptionId as string | null))
})

/* ── Orders ─────────────────────────────────────────────────────── */
on('GET', '/me/orders', ({ query }) => {
  requireUser()
  const role = str(query.role)
  const status = str(query.status)
  const items = db.orders.filter((o) => {
    if (role && o.role !== role) return false
    if (status === 'active') return !['completed', 'cancelled', 'refunded'].includes(o.status)
    if (status === 'completed') return ['completed', 'cancelled', 'refunded'].includes(o.status)
    return true
  })
  return paginate(items, query)
})

on('GET', '/orders/:id', ({ params }) => {
  requireUser()
  const order = db.orders.find((o) => o.id === params.id || o.number === params.id)
  if (!order) throw notFound('Order')
  return ok(order)
})

on('POST', '/orders', ({ body }) => {
  const user = requirePermission('orders.create')
  if (!body.addressId && body.listingId && db.listings.find((l) => l.id === body.listingId)?.format === 'physical') throw validation({ address_id: 'Choose a delivery address.' })
  const quoteItems = body.listingId
    ? (() => {
        const l = db.listings.find((x) => x.id === body.listingId)
        if (!l || l.status !== 'active') throw fail(409, 'CONFLICT', 'This item was just sold or reserved.')
        return [{ id: `ci_${l.id}`, listingId: l.id, listingSlug: l.slug, title: l.title, image: l.images[0] ?? null, condition: l.condition, size: (body.size as string) ?? null, sizeFromFitKit: false, price: l.price, seller: { id: l.seller.id, displayName: l.seller.displayName, username: l.seller.username, verified: l.seller.verified }, available: true }]
      })()
    : cartPayload().items
  const quote = quoteFor(quoteItems, body.shippingOptionId as string)
  const first = db.listings.find((l) => l.id === quoteItems[0]!.listingId)!
  const number = `PW-${4480 + db.orders.length}`
  const order: Order = {
    id: `ord_${number.slice(3)}`,
    number,
    status: 'pending_payment',
    escrowStatus: 'not_funded',
    role: 'buyer',
    items: quoteItems.map((i) => ({ id: `oi_${i.listingId}`, listingId: i.listingId, listingSlug: i.listingSlug, title: i.title, image: i.image, condition: i.condition, size: i.size, sizeFromFitKit: i.sizeFromFitKit, quantity: 1, unitPrice: i.price, total: i.price })),
    totals: quote.totals,
    seller: first.seller,
    buyer: { id: user.id, displayName: user.displayName, initials: `${user.firstName[0]}${user.lastName[0]}` },
    shippingAddress: db.addresses.find((a) => a.id === body.addressId) ?? null,
    shipping: quote.shippingOptions.find((o) => o.id === quote.selectedShippingId) ?? null,
    tracking: [],
    allowedActions: ['pay', 'cancel'],
    placedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  db.orders.unshift(order)
  return created(order, 'Order created. Complete payment to secure it.')
})

on('POST', '/orders/:id/cancel', ({ params }) => {
  requireUser()
  const order = db.orders.find((o) => o.id === params.id)
  if (!order) throw notFound('Order')
  if (order.status !== 'pending_payment') throw fail(409, 'INVALID_STATE_TRANSITION', 'Paid orders must be cancelled via support.')
  order.status = 'cancelled'
  order.allowedActions = []
  return ok(order)
})

on('POST', '/orders/:id/confirm-delivery', ({ params }) => {
  requireUser()
  const order = db.orders.find((o) => o.id === params.id)
  if (!order) throw notFound('Order')
  if (!order.allowedActions.includes('confirm_delivery')) throw fail(409, 'INVALID_STATE_TRANSITION', 'This order cannot be confirmed yet.')
  order.status = 'completed'
  order.escrowStatus = 'released'
  order.allowedActions = ['message']
  order.tracking = order.tracking.map((t) => ({ ...t, state: 'done' }))
  return ok(order, 'Thanks — funds released to the seller.')
})

on('POST', '/orders/:id/dispatch', ({ params, body }) => {
  requireUser()
  const order = db.orders.find((o) => o.id === params.id)
  if (!order) throw notFound('Order')
  if (!str(body.trackingNumber)) throw validation({ tracking_number: 'Enter the tracking number.' })
  order.status = 'in_transit'
  order.carrier = { name: str(body.carrier), trackingNumber: str(body.trackingNumber) }
  order.allowedActions = ['message']
  return ok(order, 'Marked as dispatched. The buyer has been notified.')
})

on('POST', '/orders/:id/reviews', () => {
  requirePermission('reviews.create')
  return noContent()
})

on('GET', '/orders/:id/invoice', ({ params }) => {
  requireUser()
  const order = db.orders.find((o) => o.id === params.id)
  if (!order) throw notFound('Order')
  // Real API streams a PDF; the mock returns a plain-text stand-in with the same content type.
  return new MockBlob(`Pilotwardrobe Ltd — Invoice #${order.number}
Total: ${(order.totals.total.amount / 100).toFixed(2)} ${order.totals.total.currency}
`, 'application/pdf')
})

on('POST', '/orders/:order/downloads/:asset/authorize', ({ params }) => {
  requireUser()
  const order = db.orders.find((o) => o.id === params.order)
  if (!order || order.escrowStatus === 'not_funded') throw fail(403, 'FORBIDDEN', 'Purchase required to download this file.')
  const asset = order.items.flatMap((i) => i.digitalAssets ?? []).find((a) => a.id === params.asset)
  if (!asset) throw notFound('File')
  return ok({ url: `${mockMedia('photo-wing-view').variants.original}?sig=mock&expires=${Date.now() + 300_000}`, expiresAt: new Date(Date.now() + 300_000).toISOString() })
})

/* ── Addresses ──────────────────────────────────────────────────── */
on('GET', '/me/addresses', () => {
  requireUser()
  return ok(db.addresses)
})
on('POST', '/me/addresses', ({ body }) => {
  requireUser()
  const errors: Record<string, string> = {}
  for (const [k, label] of [['fullName', 'full_name'], ['line1', 'line1'], ['city', 'city'], ['phone', 'phone']] as const)
    if (!str(body[k])) errors[label] = 'This field is required.'
  if (Object.keys(errors).length) throw validation(errors)
  const address = { ...(body as object), id: id('adr'), isDefault: db.addresses.length === 0 || !!body.isDefault } as (typeof db.addresses)[number]
  if (address.isDefault) db.addresses.forEach((a) => (a.isDefault = false))
  db.addresses.push(address)
  return created(address)
})
on('PATCH', '/me/addresses/:id', ({ params, body }) => {
  requireUser()
  const a = db.addresses.find((x) => x.id === params.id)
  if (!a) throw notFound('Address')
  if (body.isDefault) db.addresses.forEach((x) => (x.isDefault = false))
  Object.assign(a, body)
  return ok(a)
})
on('DELETE', '/me/addresses/:id', ({ params }) => {
  requireUser()
  db.addresses = db.addresses.filter((a) => a.id !== params.id)
  return noContent()
})

/* ── Payments (gateway-agnostic) ───────────────────────────────── */
const GATEWAYS: Record<PaymentGateway, Omit<PaymentMethod, 'enabled'> & { currencies: CurrencyCode[]; countries: string[] }> = {
  paystack: { code: 'paystack', name: 'Paystack', description: 'Card, bank transfer, USSD', flow: 'redirect', currencies: ['NGN', 'GHS', 'USD'], countries: ['NG', 'GH'] },
  flutterwave: { code: 'flutterwave', name: 'Flutterwave', description: 'Card, bank, mobile money', flow: 'redirect', currencies: ['NGN', 'GHS', 'USD'], countries: ['NG', 'GH', 'KE'] },
  monnify: { code: 'monnify', name: 'Monnify', description: 'Bank transfer & card (NGN)', flow: 'redirect', currencies: ['NGN'], countries: ['NG'] },
  stripe: { code: 'stripe', name: 'Stripe', description: 'Card, Apple Pay, Google Pay', flow: 'redirect', currencies: ['USD', 'GBP', 'EUR'], countries: ['GB', 'US', 'NG', 'GH'] },
  paypal: { code: 'paypal', name: 'PayPal', description: 'PayPal balance or card', flow: 'redirect', currencies: ['USD', 'GBP', 'EUR'], countries: ['GB', 'US'] },
}

on('GET', '/payment-methods', ({ query }) => {
  const currency = (str(query.currency) || 'USD') as CurrencyCode
  const country = str(query.country) || 'NG'
  const settings = db.admin.settings.gateways
  const methods: PaymentMethod[] = Object.values(GATEWAYS)
    .filter((g) => g.currencies.includes(currency))
    .map(({ currencies: _c, countries, ...g }) => {
      const enabled = (settings.find((s) => s.code === g.code)?.enabled ?? true) && countries.includes(country)
      return { ...g, enabled, unavailableReason: enabled ? null : `Not available in ${country} yet` }
    })
  return ok(methods)
})

on('POST', '/payments/initialize', ({ body }) => {
  requirePermission('orders.create')
  const order = db.orders.find((o) => o.id === body.orderId)
  if (!order) throw notFound('Order')
  if (order.status !== 'pending_payment') throw fail(409, 'INVALID_STATE_TRANSITION', 'This order is already paid.')
  const gateway = body.gateway as PaymentGateway
  if (!GATEWAYS[gateway]) throw validation({ gateway: 'Choose a payment method.' })
  const reference = `PW-2026-${Math.floor(Math.random() * 900000 + 100000)}`
  const paymentId = id('pay')
  db.payments.push({ id: paymentId, reference, status: 'pending', gateway, orderId: order.id, amount: order.totals.total, createdAt: Date.now() })
  // Real gateways return their hosted checkout URL; the mock routes to an in-app simulator.
  return ok({ paymentId, gateway, status: 'pending', reference, authorizationUrl: `/payment/mock-gateway?reference=${reference}&gateway=${gateway}&return_url=${encodeURIComponent(str(body.returnUrl))}` })
})

/** Mock-only: the simulated gateway posts its outcome (stands in for the webhook). */
on('POST', '/__mock/gateway/:reference', ({ params, body }) => {
  const payment = db.payments.find((p) => p.reference === params.reference)
  if (!payment) throw notFound('Payment')
  payment.status = body.outcome === 'success' ? 'processing' : body.outcome === 'cancel' ? 'cancelled' : 'failed'
  if (payment.status === 'failed') payment.failureReason = 'Card declined by issuer.'
  return noContent()
})

on('GET', '/payments/:reference', ({ params }) => {
  requireUser()
  const payment = db.payments.find((p) => p.reference === params.reference)
  if (!payment) throw notFound('Payment')
  // Simulate webhook reconciliation: processing → successful after ~1.5s.
  if (payment.status === 'processing' && Date.now() - payment.createdAt > 1500) {
    payment.status = 'successful'
    payment.paidAt = new Date().toISOString()
    const order = db.orders.find((o) => o.id === payment.orderId)
    if (order) {
      order.status = 'paid'
      order.escrowStatus = 'held'
      order.payment = { gateway: payment.gateway, status: 'successful', reference: payment.reference }
      order.allowedActions = ['message']
      order.dispatchBy = new Date(Date.now() + 3 * 86400_000).toISOString()
      order.estimatedDelivery = { from: new Date(Date.now() + 5 * 86400_000).toISOString(), to: new Date(Date.now() + 7 * 86400_000).toISOString() }
      order.tracking = [
        { id: 't1', code: 'payment_secured', label: 'Payment secured in escrow', occurredAt: new Date().toISOString(), state: 'done' },
        { id: 't2', code: 'dispatched', label: 'Seller dispatches · wheels up', detail: null, occurredAt: null, state: 'current' },
        { id: 't3', code: 'in_transit', label: 'In transit', occurredAt: null, state: 'upcoming' },
        { id: 't4', code: 'delivered', label: 'Goods landed · confirm within 72h', occurredAt: null, state: 'upcoming' },
      ]
      for (const item of order.items) {
        const l = db.listings.find((x) => x.id === item.listingId)
        if (l && l.format === 'physical') l.status = 'sold'
      }
      db.cart = db.cart.filter((c) => !order.items.some((i) => i.listingId === c.listingId))
    }
  }
  const { createdAt: _c, ...rest } = payment
  return ok(rest)
})

/* ── Wallet ─────────────────────────────────────────────────────── */
on('GET', '/me/wallet', () => {
  requireUser()
  return ok(db.wallet)
})
on('GET', '/me/wallet/transactions', ({ query }) => {
  requireUser()
  const type = str(query.type)
  const map: Record<string, string[]> = { sales: ['sale'], payouts: ['withdrawal'], fees: ['fee', 'promotion'] }
  return paginate(db.transactions.filter((t) => !type || type === 'all' || (map[type] ?? [type]).includes(t.type)), query)
})
on('GET', '/me/payout-methods', () => {
  requireUser()
  return ok(db.payoutMethods)
})
on('POST', '/me/payout-methods', ({ body }) => {
  requirePermission('payouts.request')
  if (str(body.twoFactorCode) !== '123456') throw validation({ two_factor_code: "That code didn't work. Try again." })
  const number = str(body.accountNumber)
  if (!/^\d{6,18}$/.test(number)) throw validation({ account_number: 'Use 6–18 digits.' })
  const method = { id: id('pm'), kind: body.kind as 'bank', label: `${str(body.institution)} · ${str(body.currency)}`, currency: body.currency as 'NGN', last4: number.slice(-4), isDefault: false }
  db.payoutMethods.push(method)
  return created(method, 'Payout method added. First payout to a new account is held for 24h.')
})

on('GET', '/me/payout-schedule', () => {
  requireUser()
  return ok(db.payoutSchedule)
})
on('PUT', '/me/payout-schedule', ({ body }) => {
  requireUser()
  Object.assign(db.payoutSchedule, body)
  return ok(db.payoutSchedule)
})
on('POST', '/me/withdrawals/quote', ({ body }) => {
  requirePermission('payouts.request')
  const amount = num(body.amount)
  if (amount <= 0) throw validation({ amount: 'Enter an amount greater than zero.' })
  if (amount > db.wallet.available.amount) throw validation({ amount: 'Amount exceeds your available balance.' })
  const method = db.payoutMethods.find((m) => m.id === body.payoutMethodId)
  if (!method) throw validation({ payout_method_id: 'Choose where to send the money.' })
  const rate = method.currency === 'NGN' ? 1532.4 : 1
  return ok({
    amount: usd(amount),
    exchangeRate: method.currency === 'NGN' ? { from: 'USD', to: 'NGN', rate, label: '1 USD = ₦1,532.40' } : null,
    fee: usd(0),
    recipientReceives: { amount: Math.round(amount * rate), currency: method.currency },
    arrivesBetween: { from: new Date(Date.now() + 86400_000).toISOString(), to: new Date(Date.now() + 2 * 86400_000).toISOString() },
    requiresTwoFactor: amount > 200000,
  })
})
on('POST', '/me/withdrawals', ({ body }) => {
  requirePermission('payouts.request')
  const amount = num(body.amount)
  if (amount > 200000 && str(body.twoFactorCode) !== '123456') throw validation({ two_factor_code: "That code didn't work. Try again." })
  if (amount > db.wallet.available.amount) throw validation({ amount: 'Amount exceeds your available balance.' })
  db.wallet.available = usd(db.wallet.available.amount - amount)
  const method = db.payoutMethods.find((m) => m.id === body.payoutMethodId)
  const tx = { id: id('tx'), occurredAt: new Date().toISOString(), description: `Payout to ${method?.label ?? 'bank'} •••• ${method?.last4 ?? ''}`, detail: 'Processing', type: 'withdrawal' as const, status: 'pending' as const, amount: usd(amount), direction: 'debit' as const }
  db.transactions.unshift(tx)
  return created(tx, 'Withdrawal requested.')
})
on('POST', '/me/wallet/statements', ({ body }) => {
  requireUser()
  return ok({ url: `/statements/${str(body.month)}.pdf`, expiresAt: new Date(Date.now() + 300_000).toISOString() })
})
