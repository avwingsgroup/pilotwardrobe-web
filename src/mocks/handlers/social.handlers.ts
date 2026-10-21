import type { Offer, SwapRequest } from '@/types/swap'
import type { Message } from '@/types/messaging'
import type { Dispute } from '@/types/dispute'
import type { Money } from '@/types/api'
import { DISPUTE_REASONS } from '@/constants/labels'
import { db } from '../db'
import { created, fail, id, noContent, notFound, num, ok, on, paginate, requirePermission, requireUser, str, validation } from '../server'

const usd = (amount: number): Money => ({ amount, currency: 'USD' })

/* ── Offers ─────────────────────────────────────────────────────── */
on('POST', '/listings/:id/offers', ({ params, body }) => {
  const user = requirePermission('offers.create')
  const listing = db.listings.find((l) => l.id === params.id)
  if (!listing || listing.status !== 'active') throw notFound('Listing')
  if (listing.seller.id === user.id) throw fail(409, 'CONFLICT', "You can't make an offer on your own listing.")
  if (!listing.negotiable) throw fail(409, 'CONFLICT', 'This seller is not accepting offers.')
  const amount = num(body.amount)
  if (amount <= 0) throw validation({ amount: 'The amount must be greater than zero.' })
  if (amount >= listing.price.amount) throw validation({ amount: 'Offer below the asking price, or use Buy now.' })
  if (listing.minimumOffer && amount < listing.minimumOffer.amount)
    throw validation({ amount: `The seller doesn't accept offers below ${(listing.minimumOffer.amount / 100).toFixed(2)}.` })
  const offer: Offer = {
    id: id('off'),
    kind: 'offer',
    direction: 'sent',
    status: 'pending',
    listing: { id: listing.id, slug: listing.slug, title: listing.title, image: listing.images[0] ?? null, price: listing.price, condition: listing.condition },
    amount: { amount, currency: listing.price.currency },
    belowAskingPercent: Math.round(((listing.price.amount - amount) / listing.price.amount) * 1000) / 10,
    message: str(body.message) || null,
    counterparty: { id: listing.seller.id, displayName: listing.seller.displayName, initials: listing.seller.displayName.slice(0, 2).toUpperCase(), username: listing.seller.username, verified: listing.seller.verified, rating: listing.seller.rating, trades: listing.seller.totalSales ?? 0, memberSince: '2024-01-01T00:00:00Z' },
    expiresAt: new Date(Date.now() + 24 * 3600_000).toISOString(),
    createdAt: new Date().toISOString(),
    history: [],
    allowedActions: ['cancel', 'message'],
  }
  db.offers.unshift(offer)
  listing.offersCount = (listing.offersCount ?? 0) + 1
  return created(offer, 'Offer sent. The seller has 24h to respond.')
})

on('GET', '/me/offers', ({ query }) => {
  requireUser()
  const box = str(query.box) || 'received'
  const archived = (o: Offer) => ['declined', 'expired', 'cancelled', 'accepted'].includes(o.status)
  return ok(db.offers.filter((o) => (box === 'archived' ? archived(o) : o.direction === box && !archived(o))))
})

function offerAction(action: 'accept' | 'decline' | 'counter' | 'cancel') {
  return ({ params, body }: { params: Record<string, string>; body: Record<string, unknown> }) => {
    requireUser()
    const offer = db.offers.find((o) => o.id === params.id)
    if (!offer) throw notFound('Offer')
    if (offer.status !== 'pending') throw fail(409, 'INVALID_STATE_TRANSITION', `This offer is already ${offer.status}.`)
    if (action === 'accept') {
      offer.status = 'accepted'
      offer.allowedActions = ['message']
      const listing = db.listings.find((l) => l.id === offer.listing.id)
      if (listing) listing.status = 'reserved'
    } else if (action === 'decline') {
      offer.status = 'declined'
      offer.allowedActions = []
    } else if (action === 'cancel') {
      offer.status = 'cancelled'
      offer.allowedActions = []
    } else {
      const amount = num(body.amount)
      if (amount <= offer.amount.amount) throw validation({ amount: 'Your counter must be above their offer.' })
      if (amount >= offer.listing.price.amount) throw validation({ amount: 'Your counter must be below the asking price.' })
      offer.status = 'countered'
      offer.counterAmount = { amount, currency: offer.amount.currency }
      offer.allowedActions = ['message']
      offer.history.unshift({ id: id('h'), label: `Counter sent · $${(amount / 100).toFixed(2)}`, detail: 'Buyer has 24h to respond', occurredAt: new Date().toISOString(), kind: 'counter' })
    }
    return ok(offer)
  }
}

on('POST', '/offers/:id/accept', offerAction('accept'))
on('POST', '/offers/:id/decline', offerAction('decline'))
on('POST', '/offers/:id/counter', offerAction('counter'))
on('POST', '/offers/:id/cancel', offerAction('cancel'))

/* ── Swaps ──────────────────────────────────────────────────────── */
on('POST', '/listings/:id/swap-requests', ({ params, body }) => {
  const user = requirePermission('swaps.create')
  if (user.verification.kycStatus !== 'approved') throw fail(403, 'KYC_REQUIRED', 'Verify your identity to propose swaps.')
  const target = db.listings.find((l) => l.id === params.id)
  if (!target || target.status !== 'active') throw notFound('Listing')
  if (!target.swappable) throw fail(409, 'CONFLICT', 'This listing is not open to swaps.')
  const ids = (body.offeredListingIds as string[]) ?? []
  if (!ids.length) throw validation({ offered_listing_ids: 'Choose at least one item from your hangar.' })
  const offered = db.listings.filter((l) => ids.includes(l.id))
  const cash = (body.cashAdjustment as Money | null)?.amount ?? 0
  const value = offered.reduce((s, l) => s + l.price.amount, 0) + cash
  const swap: SwapRequest = {
    id: id('swp'),
    kind: 'swap',
    direction: 'sent',
    status: 'pending',
    targetListing: { id: target.id, slug: target.slug, title: target.title, image: target.images[0] ?? null, price: target.price, condition: target.condition },
    offeredItems: offered.map((l) => ({ listing: { id: l.id, slug: l.slug, title: l.title, image: l.images[0] ?? null, price: l.price }, estimatedValue: l.price })),
    cashAdjustment: cash ? usd(cash) : null,
    swapFee: usd(Math.round(value * 0.04)),
    message: str(body.message) || null,
    counterparty: { id: target.seller.id, displayName: target.seller.displayName, initials: target.seller.displayName.slice(0, 2).toUpperCase(), username: target.seller.username, verified: target.seller.verified, rating: target.seller.rating, trades: target.seller.totalSales ?? 0, memberSince: '2024-01-01T00:00:00Z' },
    expiresAt: new Date(Date.now() + 48 * 3600_000).toISOString(),
    createdAt: new Date().toISOString(),
    history: [],
    allowedActions: ['cancel', 'message'],
  }
  db.swaps.unshift(swap)
  return created(swap, 'Swap proposal sent.')
})

on('GET', '/me/swap-requests', ({ query }) => {
  requireUser()
  const box = str(query.box) || 'received'
  const archived = (s: SwapRequest) => !['pending', 'countered'].includes(s.status)
  return ok(db.swaps.filter((s) => (box === 'archived' ? archived(s) : s.direction === box && !archived(s))))
})

for (const action of ['accept', 'reject', 'cancel'] as const) {
  on('POST', `/swap-requests/:id/${action}`, ({ params }) => {
    requireUser()
    const swap = db.swaps.find((s) => s.id === params.id)
    if (!swap) throw notFound('Swap request')
    if (swap.status !== 'pending') throw fail(409, 'INVALID_STATE_TRANSITION', `This swap is already ${swap.status}.`)
    swap.status = action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : 'cancelled'
    swap.allowedActions = ['message']
    return ok(swap)
  })
}

/* ── Messaging ──────────────────────────────────────────────────── */
on('GET', '/conversations', ({ query }) => {
  requireUser()
  const ctx = str(query.context)
  const search = str(query.search).toLowerCase()
  return ok(
    db.conversations
      .filter((c) => (ctx === 'unread' ? c.unreadCount > 0 : !ctx || ctx === 'all' || c.context === ctx))
      .filter((c) => !search || `${c.participant.displayName} ${c.listing?.title ?? ''} ${c.lastMessagePreview}`.toLowerCase().includes(search))
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt)),
  )
})

on('GET', '/conversations/:id', ({ params }) => {
  requireUser()
  const c = db.conversations.find((x) => x.id === params.id)
  if (!c) throw notFound('Conversation')
  return ok(c)
})

on('GET', '/conversations/:id/messages', ({ params, query }) => {
  requireUser()
  return paginate(db.messages.filter((m) => m.conversationId === params.id), query, {}, 100)
})

on('POST', '/conversations/:id/messages', ({ params, body }) => {
  const user = requirePermission('messages.send')
  const c = db.conversations.find((x) => x.id === params.id)
  if (!c) throw notFound('Conversation')
  const text = str(body.body).trim()
  if (!text) throw validation({ body: 'Write a message first.' })
  if (text.length > 2000) throw validation({ body: 'Messages are limited to 2,000 characters.' })
  const message: Message = { id: id('msg'), conversationId: c.id, senderId: user.id, mine: true, kind: 'text', body: text, sentAt: new Date().toISOString() }
  db.messages.push(message)
  c.lastMessagePreview = text
  c.lastMessageAt = message.sentAt
  return created(message)
})

on('POST', '/conversations', ({ body }) => {
  const user = requirePermission('messages.send')
  const listing = body.listingId ? db.listings.find((l) => l.id === body.listingId) : null
  const sellerName = listing?.seller.username ?? str(body.sellerUsername)
  const existing = db.conversations.find((c) => (listing ? c.listing?.id === listing.id : c.participant.username === sellerName) && c.context === 'buying')
  if (existing) return ok(existing)
  const seller = listing?.seller
  const conversation = {
    id: id('cnv'),
    context: 'buying' as const,
    participant: { id: seller?.id ?? id('usr'), displayName: seller?.displayName ?? sellerName, initials: (seller?.displayName ?? sellerName).slice(0, 2).toUpperCase(), username: sellerName, verified: seller?.verified ?? true, kycVerified: true, rating: seller?.rating ?? null },
    listing: listing ? { id: listing.id, slug: listing.slug, title: listing.title, image: listing.images[0] ?? null, price: listing.price, conditionLabel: listing.condition.replace('_', ' '), offersCount: listing.offersCount ?? 0, reserved: listing.status === 'reserved' } : null,
    lastMessagePreview: str(body.body),
    lastMessageAt: new Date().toISOString(),
    unreadCount: 0,
  }
  db.conversations.unshift(conversation)
  if (str(body.body)) db.messages.push({ id: id('msg'), conversationId: conversation.id, senderId: user.id, mine: true, kind: 'text', body: str(body.body), sentAt: conversation.lastMessageAt })
  return created(conversation)
})

on('POST', '/conversations/:id/read', ({ params }) => {
  requireUser()
  const c = db.conversations.find((x) => x.id === params.id)
  if (c) c.unreadCount = 0
  return noContent()
})

on('POST', '/conversations/:id/report', () => {
  requireUser()
  return ok(null, 'Thanks — our Trust & Safety team will review this conversation.')
})

/* ── Notifications ──────────────────────────────────────────────── */
on('GET', '/notifications', ({ query }) => {
  requireUser()
  const category = str(query.category)
  const map: Record<string, string[]> = { orders: ['orders'], offers_swaps: ['offers_swaps'], messages: ['messages'], account: ['account', 'payouts', 'reviews', 'disputes'] }
  return paginate(db.notifications.filter((n) => !category || category === 'all' || (map[category] ?? [category]).includes(n.category)), query)
})

on('GET', '/notifications/unread-count', () => {
  requireUser()
  return ok({ count: db.notifications.filter((n) => !n.readAt).length })
})

on('PATCH', '/notifications/:id/read', ({ params }) => {
  requireUser()
  const n = db.notifications.find((x) => x.id === params.id)
  if (!n) throw notFound('Notification')
  n.readAt ??= new Date().toISOString()
  return ok(n)
})

on('POST', '/notifications/read-all', () => {
  requireUser()
  const now = new Date().toISOString()
  db.notifications.forEach((n) => (n.readAt ??= now))
  return noContent()
})

/* ── Disputes ───────────────────────────────────────────────────── */
on('GET', '/me/disputes', () => {
  requireUser()
  return ok(db.disputes)
})

on('GET', '/disputes/:id', ({ params }) => {
  requireUser()
  const d = db.disputes.find((x) => x.id === params.id || x.number === params.id)
  if (!d) throw notFound('Dispute')
  return ok(d)
})

on('POST', '/disputes', ({ body }) => {
  requirePermission('disputes.create')
  const order = db.orders.find((o) => o.id === body.orderId)
  if (!order) throw notFound('Order')
  if (!order.allowedActions.includes('open_dispute')) throw fail(409, 'INVALID_STATE_TRANSITION', 'The dispute window for this order has closed.')
  const errors: Record<string, string> = {}
  if (!body.reason) errors.reason = 'Tell us what went wrong.'
  if (str(body.description).length < 20) errors.description = 'Describe the issue in at least 20 characters.'
  if (body.requested === 'partial_refund' && !((body.amount as Money | null)?.amount ?? 0)) errors['amount.amount'] = 'Enter the amount you are requesting.'
  if (Object.keys(errors).length) throw validation(errors)
  const reason = body.reason as Dispute['reason']
  const dispute: Dispute = {
    id: id('dsp'),
    number: `DS-${2047 + db.disputes.length}`,
    orderId: order.id,
    orderNumber: order.number,
    reason,
    reasonLabel: DISPUTE_REASONS[reason].label,
    status: 'awaiting_seller',
    requested: body.requested as Dispute['requested'],
    requestedAmount: (body.amount as Money | null) ?? null,
    escrowFrozen: order.totals.items,
    mediator: null,
    openedAt: new Date().toISOString(),
    decisionDueAt: new Date(Date.now() + 5 * 86400_000).toISOString(),
    description: str(body.description),
    evidence: [],
    messages: [{ id: id('dm'), author: { displayName: 'You', initials: 'ME', role: 'buyer' }, body: str(body.description), createdAt: new Date().toISOString() }],
    steps: [
      { label: 'You submit the dispute', detail: 'Escrow freezes', state: 'done' },
      { label: 'Seller responds', detail: 'Within 48h', state: 'current' },
      { label: 'Mediator decides', detail: 'Refund, partial refund or release', state: 'upcoming' },
    ],
    sellerProposal: null,
    viewerRole: 'buyer',
    allowedActions: ['reply', 'withdraw', 'attach'],
    item: { title: order.items[0]!.title, image: order.items[0]!.image ?? null, price: order.items[0]!.total },
    counterpartyName: order.seller.displayName,
  }
  db.disputes.unshift(dispute)
  order.status = 'disputed'
  order.escrowStatus = 'frozen'
  order.disputeId = dispute.id
  order.allowedActions = ['message']
  return created(dispute, 'Dispute opened. Escrow is frozen while we review.')
})

on('POST', '/disputes/:id/messages', ({ params, body }) => {
  requireUser()
  const d = db.disputes.find((x) => x.id === params.id)
  if (!d) throw notFound('Dispute')
  if (!str(body.body).trim()) throw validation({ body: 'Write a reply first.' })
  d.messages.push({ id: id('dm'), author: { displayName: 'You', initials: 'ME', role: d.viewerRole }, body: str(body.body), createdAt: new Date().toISOString() })
  return ok(d)
})

on('POST', '/disputes/:id/withdraw', ({ params }) => {
  requireUser()
  const d = db.disputes.find((x) => x.id === params.id)
  if (!d) throw notFound('Dispute')
  d.status = 'withdrawn'
  d.allowedActions = []
  return ok(d, 'Dispute withdrawn. Escrow will release to the seller.')
})

for (const decision of ['accept', 'decline'] as const) {
  on('POST', `/disputes/:id/proposal/${decision}`, ({ params }) => {
    requireUser()
    const d = db.disputes.find((x) => x.id === params.id)
    if (!d?.sellerProposal) throw notFound('Proposal')
    d.sellerProposal.status = decision === 'accept' ? 'accepted' : 'declined'
    if (decision === 'accept') {
      d.status = 'resolved_buyer'
      d.allowedActions = []
    }
    d.allowedActions = d.allowedActions.filter((a) => a !== 'accept_proposal' && a !== 'decline_proposal')
    return ok(d)
  })
}
