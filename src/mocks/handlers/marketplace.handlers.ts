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
const PAGES: Record<string, { title: string; html: string }> = {
  about: {
    title: 'About Pilotwardrobe',
    html: '<p>Pilotwardrobe is the aviation-only marketplace for pilots, cabin crew, engineers and enthusiasts. We built it because good kit deserves a second flight — and because buying a $700 headset from a stranger should feel as safe as a pre-flight checklist.</p><h2>How we keep trades safe</h2><ul><li><strong>KYC-verified sellers.</strong> Every seller clears identity checks before their first listing goes live.</li><li><strong>Escrow on every order.</strong> Funds are held until you confirm your gear has landed.</li><li><strong>Aviator verification.</strong> Licence-holders can verify credentials for an Aviator badge.</li></ul><h2>Where we fly</h2><p>Nigeria, Ghana and the United Kingdom today, with the United States in beta.</p>',
  },
  'how-it-works': {
    title: 'How it works',
    html: '<h2>Buying</h2><ol><li>Find gear from verified sellers and check it fits with your Fit Kit.</li><li>Pay securely — your money is held in escrow, not sent to the seller.</li><li>Track your order from wheels-up to landing.</li><li>Confirm it arrived as described and the seller gets paid. You have 72 hours to raise a problem.</li></ol><h2>Selling</h2><ol><li>Verify your identity once (about 3 minutes).</li><li>List an item with photos, condition and freight in under two minutes.</li><li>Ship within 3 days of payment. Funds release when the buyer confirms.</li></ol><h2>Swapping</h2><p>Offer one or more items from your hangar, plus a cash top-up if needed. Both sides ship; escrow releases when both confirm.</p>',
  },
  faq: {
    title: 'Frequently asked questions',
    html: '<h3>Is my payment safe?</h3><p>Yes. Every payment is held in escrow until you confirm the item landed as described, or 72 hours pass after delivery.</p><h3>Which payment methods are supported?</h3><p>Cards, bank transfer and wallets via Paystack, Flutterwave, Monnify, Stripe and PayPal depending on your country and currency.</p><h3>What if my item is not as described?</h3><p>Open a dispute from the order within 72 hours of landing. Escrow freezes while a mediator reviews.</p><h3>Do I need to verify my identity?</h3><p>Only to sell, swap, or withdraw more than $500.</p>',
  },
  terms: { title: 'Terms of service', html: '<p>These terms govern your use of Pilotwardrobe. By creating an account you agree to trade honestly, describe items accurately, keep payments on-platform and follow applicable export-control law for avionics.</p><h2>1. Escrow</h2><p>Funds are released to sellers when buyers confirm delivery or after the dispute window closes.</p><h2>2. Fees</h2><p>Sellers pay a commission on completed sales. Buyers pay a buyer-protection fee at checkout.</p><h2>3. Prohibited items</h2><p>Counterfeit goods, stolen equipment, restricted or export-controlled items without authorisation.</p>' },
  privacy: { title: 'Privacy policy', html: '<p>We collect the minimum data needed to run a safe marketplace: account details, identity verification results, transaction records and messages relating to trades.</p><h2>Identity documents</h2><p>Documents are encrypted and deleted 90 days after approval.</p><h2>Payments</h2><p>Card details are handled by our payment partners and never stored by Pilotwardrobe.</p>' },
  cookies: { title: 'Cookie policy', html: '<p>We use essential cookies for sign-in and security, and optional analytics cookies only with your consent.</p>' },
  'returns-refunds': { title: 'Returns & refunds', html: '<p>Raise a problem within 72 hours of delivery. Approved refunds return to your original payment method.</p>' },
  'seller-fees': { title: 'Seller fees', html: '<p>Standard commission is 8% on completed sales (6% for avionics, capped at $120). Swap fee is 4% each side.</p>' },
  'freight-guide': { title: 'Freight guide', html: '<p>Use Pilotwardrobe Freight for prepaid, tracked labels insured to $1,000, ship it yourself with tracking, or hand off at a listed airfield.</p>' },
}

on('GET', '/pages/:slug', ({ params }) => {
  const page = PAGES[params.slug!]
  if (!page) throw notFound('Page')
  return ok({ slug: params.slug, title: page.title, html: page.html, updatedAt: '2026-07-01T00:00:00Z' })
})

on('POST', '/contact', ({ body }) => {
  const errors: Record<string, string> = {}
  if (!str(body.name)) errors.name = 'Please tell us your name.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(str(body.email))) errors.email = 'Enter a valid email address.'
  if (str(body.message).length < 10) errors.message = 'Please add a little more detail (10+ characters).'
  if (Object.keys(errors).length) throw validation(errors)
  return created({ ticket: `SUP-${Math.floor(Math.random() * 90000 + 10000)}` }, 'Thanks — our crew will reply within 4 hours.')
})

on('POST', '/newsletter', ({ body }) => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(str(body.email))) throw validation({ email: 'Enter a valid email address.' })
  return noContent()
})
