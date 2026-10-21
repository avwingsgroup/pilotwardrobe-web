import type { Listing } from '@/types/product'
import { CONDITION_LABELS } from '@/constants/labels'
import { db } from '../db'
import { categories, flatCategories, boostPackages } from '../products.mock'
import { sellerProfiles, sellers } from '../users.mock'
import { heroSlides } from '../admin.mock'
import { mockMedia } from '../media'
import { created, currentUser, noContent, notFound, ok, on, paginate, requireUser, str, validation } from '../server'

const publicListings = () => db.listings.filter((l) => l.status === 'active' && !l.id.startsWith('lst_2'))

const withViewer = (l: Listing): Listing => ({ ...l, isFavorited: db.favorites.has(l.id) })

function matchesCategory(l: Listing, slugs: string[]) {
  if (!slugs.length) return true
  return slugs.some((slug) => {
    if (l.category.slug === slug) return true
    const parent = categories.find((c) => c.slug === slug)
    return !!parent?.children?.some((child) => child.slug === l.category.slug)
  })
}

on('GET', '/home', () => {
  const live = publicListings().map(withViewer)
  const physical = live.filter((l) => l.format === 'physical')
  return ok({
    heroSlides: db.admin.heroSlides.filter((s) => s.status === 'live').length ? db.admin.heroSlides : heroSlides,
    categories: categories.filter((c) => ['pilotwardrobe', 'headsets', 'watches', 'flight-bags', 'books-manuals', 'avionics', 'uniforms', 'eyewear'].includes(c.slug)),
    sections: [
      { key: 'fresh', title: 'Fresh on the flightline', subtitle: 'Recently listed by verified sellers', viewAllTo: '/marketplace?sort=newest', listings: [live[0], live[1], live[2], live[3]].filter(Boolean) },
      {
        key: 'headsets',
        title: 'Source flight deck audio & headsets',
        subtitle: 'Authentic Bose, David Clark and Lightspeed gear from verified sellers',
        viewAllTo: '/category/headsets',
        // Curated rail from V1: Bose A30, David Clark H10-13.4, Lightspeed Zulu 3, Garmin GDL 52.
        listings: ['lst_005', 'lst_006', 'lst_007', 'lst_008'].map((id) => physical.find((l) => l.id === id)).filter((l) => !!l),
      },
    ],
    gallery: [
      { id: 'g1', title: 'Santorini Rollout', photographer: 'Tunde Shot Aviation', image: mockMedia('photo-santorini-rollout'), to: '/marketplace/print-santorini-rollout' },
      { id: 'g2', title: 'Warbird Formation, B&W', photographer: 'Tunde Shot Aviation', image: mockMedia('photo-warbird-formation'), to: '/marketplace/print-warbird-formation-bw' },
      { id: 'g3', title: 'Gate Sunset, Lagos', photographer: 'Tunde Shot Aviation', image: mockMedia('photo-gate-sunset'), to: '/marketplace/print-gate-sunset-lagos' },
      { id: 'g4', title: 'Gate Sunset II', photographer: 'Tunde Shot Aviation', image: mockMedia('photo-gate-sunset'), to: '/marketplace/print-gate-sunset-lagos' },
      { id: 'g5', title: 'Formation Pair, Dusk', photographer: 'Tunde Shot Aviation', image: mockMedia('photo-formation-pair'), to: '/marketplace/print-formation-pair-dusk' },
      { id: 'g6', title: 'Left Seat', photographer: 'Captain James', image: mockMedia('hero-cockpit'), to: '/photographers' },
    ],
    trustedCount: 18400,
  })
})

on('GET', '/listings', ({ query }) => {
  const search = str(query.search).toLowerCase().trim()
  const cats = str(query.category).split(',').filter(Boolean)
  const conditions = str(query.condition).split(',').filter(Boolean)
  const dealTypes = str(query.dealType).split(',').filter(Boolean)
  const min = query.minPrice ? Number(query.minPrice) : null
  const max = query.maxPrice ? Number(query.maxPrice) : null

  let items = publicListings().filter((l) => {
    if (search && !`${l.title} ${l.brand ?? ''} ${l.model ?? ''} ${l.category.name}`.toLowerCase().includes(search)) return false
    if (!matchesCategory(l, cats)) return false
    if (conditions.length && !conditions.includes(l.condition)) return false
    if (min !== null && l.price.amount < min) return false
    if (max !== null && l.price.amount > max) return false
    if (query.verifiedOnly === 'true' && !l.seller.verified) return false
    if (query.minRating && (l.rating ?? 0) < Number(query.minRating)) return false
    if (query.freeDelivery === 'true' && !l.badges.some((b) => b.kind === 'free_delivery')) return false
    if (dealTypes.includes('offers') && !l.negotiable) return false
    if (dealTypes.includes('swaps') && !l.swappable) return false
    if (query.format && l.format !== query.format && !(query.format === 'digital' && l.format === 'print')) return false
    if (query.seller && l.seller.username !== query.seller) return false
    if (query.aircraftType && !(l.aircraftTypes ?? []).includes(str(query.aircraftType))) return false
    if (query.promoted === 'true' && !l.promoted) return false
    return true
  })

  const sorters: Record<string, (a: Listing, b: Listing) => number> = {
    newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
    price_asc: (a, b) => a.price.amount - b.price.amount,
    price_desc: (a, b) => b.price.amount - a.price.amount,
    popular: (a, b) => (b.soldCount ?? 0) - (a.soldCount ?? 0),
    rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
    recommended: (a, b) => Number(b.promoted) - Number(a.promoted) || (b.favoritesCount ?? 0) - (a.favoritesCount ?? 0),
    nearest: (a, b) => a.id.localeCompare(b.id),
  }
  items = [...items].sort(sorters[str(query.sort)] ?? sorters.newest)

  const pool = publicListings()
  const facet = (values: string[], label: (v: string) => string, count: (v: string) => number) =>
    values.map((v) => ({ value: v, label: label(v), count: count(v) }))
  // Drill into sub-categories when a parent (or one of its children) is selected.
  const parent = categories.find((c) => cats.includes(c.slug) || c.children?.some((ch) => cats.includes(ch.slug)))
  const categoryFacet = (parent?.children ?? categories).map((c) => ({ value: c.slug, label: c.name, count: c.listingsCount }))

  return paginate(items.map(withViewer), query, {
    facets: {
      categories: categoryFacet,
      conditions: facet(['new', 'like_new', 'very_good', 'good'], (v) => CONDITION_LABELS[v as keyof typeof CONDITION_LABELS].label, (v) => pool.filter((l) => l.condition === v).length * 23 + 50),
      dealTypes: [
        { value: 'buy_now', label: 'Buy now', count: 498 },
        { value: 'offers', label: 'Accepts offers', count: 286 },
        { value: 'swaps', label: 'Open to swaps', count: 131 },
      ],
      seller: [
        { value: 'verified_only', label: 'KYC verified only', count: 524 },
        { value: 'rating_45', label: 'Rating 4.5+', count: 470 },
        { value: 'free_delivery', label: 'Free delivery', count: 212 },
      ],
      priceRange: { min: 0, max: 200000, currency: 'USD' },
      fitsSavedSizes: currentUser() ? 24 : undefined,
    },
    appliedCurrency: 'USD',
  }, 12)
})

on('GET', '/listings/:slug/related', ({ params }) => {
  const listing = db.listings.find((l) => l.slug === params.slug)
  if (!listing) throw notFound('Listing')
  return ok(publicListings().filter((l) => l.id !== listing.id).slice(0, 4).map(withViewer))
})

on('GET', '/listings/:slug', ({ params }) => {
  const listing = db.listings.find((l) => l.slug === params.slug || l.id === params.slug)
  if (!listing || ['draft', 'removed', 'rejected'].includes(listing.status)) throw notFound('Listing')
  listing.viewsCount += 1
  return ok(withViewer(listing))
})

on('GET', '/categories', () => ok(categories))

on('GET', '/categories/:slug', ({ params }) => {
  const found = flatCategories().find((c) => c.slug === params.slug)
  if (!found) throw notFound('Category')
  return ok(found)
})

on('GET', '/boost-packages', () => ok(boostPackages))

/* ── Favorites ─────────────────────────────────────────────────── */
on('GET', '/me/favorites', ({ query }) => {
  requireUser()
  return paginate(db.listings.filter((l) => db.favorites.has(l.id)).map(withViewer), query)
})

on('POST', '/listings/:id/favorite', ({ params }) => {
  requireUser()
  const listing = db.listings.find((l) => l.id === params.id)
  if (!listing) throw notFound('Listing')
  if (!db.favorites.has(listing.id)) listing.favoritesCount += 1
  db.favorites.add(listing.id)
  return ok({ favoritesCount: listing.favoritesCount })
})

on('DELETE', '/listings/:id/favorite', ({ params }) => {
  requireUser()
  const listing = db.listings.find((l) => l.id === params.id)
  if (!listing) throw notFound('Listing')
  if (db.favorites.delete(listing.id)) listing.favoritesCount = Math.max(0, listing.favoritesCount - 1)
  return ok({ favoritesCount: listing.favoritesCount })
})

/* ── Sellers ───────────────────────────────────────────────────── */
on('GET', '/sellers', ({ query }) => {
  const type = str(query.type)
  const list = Object.values(sellers).filter((s) => (type === 'aviator' ? s.isAviator : type === 'photographer' ? s.isPhotographer : true))
  return paginate(list, query)
})

on('GET', '/sellers/:username', ({ params }) => {
  const profile = sellerProfiles[params.username!]
  if (!profile) throw notFound('Seller')
  return ok({ ...profile, isFollowing: db.following.has(profile.username) })
})

on('GET', '/sellers/:username/listings', ({ params, query }) => {
  const status = str(query.status) || 'active'
  const items = db.listings
    .filter((l) => l.seller.username === params.username && (status === 'sold' ? l.status === 'sold' : l.status === 'active'))
    .map(withViewer)
  return paginate(items, query)
})

on('GET', '/sellers/:username/reviews', ({ query }) => paginate(db.reviews, query))

on('POST', '/sellers/:username/follow', ({ params }) => {
  requireUser()
  const profile = sellerProfiles[params.username!]
  if (!profile) throw notFound('Seller')
  if (!db.following.has(profile.username)) profile.followers += 1
  db.following.add(profile.username)
  return ok({ followers: profile.followers })
})

on('DELETE', '/sellers/:username/follow', ({ params }) => {
  requireUser()
  const profile = sellerProfiles[params.username!]
  if (!profile) throw notFound('Seller')
  if (db.following.delete(profile.username)) profile.followers -= 1
  return ok({ followers: profile.followers })
})

/* ── Content ───────────────────────────────────────────────────── */
/** CMS help articles served at /help/:slug (AD15). Guides and policies have their own designed pages (VC1–VC13). */
const PAGES: Record<string, { title: string; html: string }> = {
  'prohibited-items': {
    title: 'Prohibited items',
    html: '<p>To keep the marketplace safe and legal, these items can’t be listed, sold or swapped on Pilotwardrobe.</p><h2>Never allowed</h2><ul><li><strong>Counterfeit or replica gear</strong>, including copies of branded headsets, watches and uniforms.</li><li><strong>Airline IDs, crew badges, passes</strong> and any item that grants airside or flight-deck access.</li><li><strong>Security or restricted items</strong>, including export-controlled avionics without authorisation.</li><li><strong>Current chart subscriptions</strong> and other licences that can’t be transferred.</li><li><strong>Stolen or company-owned kit</strong> you don’t have the right to sell.</li><li><strong>Dangerous goods</strong>: oxygen cylinders, flares, life-vest CO₂ cartridges and loose lithium batteries.</li></ul><h2>What happens if you list one</h2><p>We remove the listing and notify you. Repeat or deliberate breaches can lead to suspension. If you spot a prohibited item, use Report on the listing.</p>',
  },
  'buyer-protection': {
    title: 'Buyer protection',
    html: '<p>Every order on Pilotwardrobe is covered from checkout to landing.</p><ul><li><strong>Escrow on every order.</strong> Your payment is held, not sent to the seller, until you confirm the item landed or 72 hours pass after delivery.</li><li><strong>Automatic refunds.</strong> If the seller doesn’t add tracking within 5 days, you’re refunded automatically.</li><li><strong>Fair disputes.</strong> If the item isn’t as described, open a dispute within 72 hours. A mediator decides within 5 business days if you can’t agree.</li></ul><p>Trades paid outside Pilotwardrobe aren’t covered.</p>',
  },
}

on('GET', '/pages/:slug', ({ params }) => {
  const page = PAGES[params.slug!]
  if (!page) throw notFound('Page')
  return ok({ slug: params.slug, title: page.title, html: page.html, updatedAt: '2026-07-01T00:00:00Z' })
})

const CONTACT_TOPICS = ['order', 'escrow', 'dispute', 'selling', 'account', 'trust_safety', 'callback', 'other']

on('POST', '/contact', ({ body }) => {
  const errors: Record<string, string> = {}
  if (!str(body.name)) errors.name = 'Please tell us your name.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(str(body.email))) errors.email = 'Enter a valid email address.'
  if (!CONTACT_TOPICS.includes(str(body.topic))) errors.topic = 'Choose a topic.'
  if (!str(body.subject).trim()) errors.subject = 'Add a short subject.'
  if (str(body.message).length < 10) errors.message = 'Please add a little more detail (10+ characters).'
  if (body.topic === 'callback' && !/^\+?[\d\s()-]{7,}$/.test(str(body.phone))) errors.phone = 'Enter a phone number we can call.'
  if (Array.isArray(body.attachmentIds) && body.attachmentIds.length > 5) errors.attachment_ids = 'Attach up to 5 files.'
  if (Object.keys(errors).length) throw validation(errors)
  const reply = body.topic === 'trust_safety' ? 'Our Trust & Safety team is on it.' : body.topic === 'callback' ? 'We’ll call you back within 2 hours.' : 'We’ll reply within 24 hours.'
  return created({ ticket: `SUP-${Math.floor(Math.random() * 90000 + 10000)}` }, `Message received. ${reply}`)
})

on('GET', '/help/summary', () =>
  ok({
    popular: [
      { faqId: 'confirm-landed', question: 'How long do I have to confirm goods landed?', tag: 'Escrow', views: 4100 },
      { faqId: 'payout-pending', question: 'Why is my payout still pending?', tag: 'Wallet', views: 3300 },
      { faqId: 'verify-licence', question: 'How do I verify my pilot licence?', tag: 'Verification', views: 3000 },
      { faqId: 'swap-cancel-accepted', question: 'Can I cancel an offer after it’s accepted?', tag: 'Offers', views: 2100 },
      { faqId: 'holding-pattern', question: 'What does “Holding pattern” mean?', tag: 'Freight', views: 1800 },
    ],
    status: {
      overall: 'operational',
      windowDays: 30,
      uptimePercent: 99.97,
      components: ['Payments', 'Messaging', 'Verification', 'Tracking'].map((name) => ({
        name,
        days: Array.from({ length: 30 }, (_, i) => (name === 'Tracking' && i === 21 ? 'degraded' : 'up')),
      })),
    },
  }),
)

on('GET', '/support/contact-info', () =>
  ok({
    chatLoad: [3, 2, 1, 1, 1, 1, 4, 13, 26, 34, 31, 26, 23, 24, 28, 30, 28, 22, 20, 15, 12, 8, 5, 3],
    avgChatReplyMinutes: 4,
    offices: [
      { name: 'Lagos · HQ', address: '14 Kofo Abayomi St, Victoria Island' },
      { name: 'London', address: 'Hangar 3, Biggin Hill Airport, TN16 3BH' },
    ],
  }),
)

on('POST', '/newsletter', ({ body }) => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(str(body.email))) throw validation({ email: 'Enter a valid email address.' })
  return noContent()
})
