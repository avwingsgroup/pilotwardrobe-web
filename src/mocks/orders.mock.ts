import type { Order, OrderItem, TrackingEvent } from '@/types/order'
import type { CurrencyCode } from '@/types/api'
import { mockMedia, type MockMediaSlug } from './media'
import { sellers, addresses } from './users.mock'
import { daysAgo, hoursAgo, inDays, inHours } from './time'

const usd = (amount: number) => ({ amount, currency: 'USD' as CurrencyCode })

function item(id: string, slug: string, title: string, image: MockMediaSlug, price: number, extra: Partial<OrderItem> = {}): OrderItem {
  return {
    id: `oi_${id}`,
    listingId: `lst_${id}`,
    listingSlug: slug,
    title,
    image: mockMedia(image),
    condition: 'good',
    quantity: 1,
    unitPrice: usd(price),
    total: usd(price),
    ...extra,
  }
}

const trackingInTransit: TrackingEvent[] = [
  { id: 't1', code: 'payment_secured', label: 'Payment secured in escrow', detail: '$193.40', occurredAt: daysAgo(3), state: 'done' },
  { id: 't2', code: 'dispatched', label: 'Seller dispatched · wheels up', detail: 'Lagos hub', occurredAt: daysAgo(2), state: 'done' },
  { id: 't3', code: 'in_transit', label: 'In transit', detail: 'departed LOS sort facility', occurredAt: hoursAgo(20), state: 'current' },
  { id: 't4', code: 'out_for_delivery', label: 'Out for delivery', detail: 'Expected in 2 days', occurredAt: null, state: 'upcoming' },
  { id: 't5', code: 'delivered', label: 'Goods landed · confirm within 72h', detail: 'Escrow releases after you confirm or 72h pass', occurredAt: null, state: 'upcoming' },
]

const buyerNehemiah = { id: 'usr_10422', displayName: 'Nehemiah Okoye', initials: 'NO' }

export const orders: Order[] = [
  {
    id: 'ord_4471',
    number: 'PW-4471',
    status: 'in_transit',
    escrowStatus: 'held',
    role: 'buyer',
    items: [item('010', 'jeppesen-captain-flight-bag-leather', 'Jeppesen Captain Flight Bag, leather trim', 'jeppesen-flight-bag', 18000)],
    totals: { items: usd(18000), freight: usd(980), buyerProtection: usd(360), duties: null, total: usd(19340) },
    seller: sellers.nehemiah!,
    buyer: buyerNehemiah,
    shippingAddress: { ...addresses[0]!, fullName: 'Gbenga Ebuko', line1: '14 Aminu Kano Crescent, Wuse II', city: 'Abuja', state: 'FCT', postalCode: '904101' },
    shipping: { id: 'shp_std', method: 'pilotwardrobe_freight', label: 'PW Freight · DHL Express', description: 'Tracked', price: usd(980) },
    carrier: { name: 'PW Freight · DHL Express', trackingNumber: 'JD014600006812345', trackingUrl: null },
    route: { from: 'LOS', to: 'ABV', progress: 0.62 },
    estimatedDelivery: { from: inDays(1), to: inDays(3) },
    tracking: trackingInTransit,
    payment: { gateway: 'paystack', status: 'successful', reference: 'PW-2026-918271', methodLabel: 'Visa •••• 4417' },
    allowedActions: ['message', 'open_dispute'],
    placedAt: daysAgo(3),
    updatedAt: hoursAgo(20),
  },
  {
    id: 'ord_4468',
    number: 'PW-4468',
    status: 'delivered',
    escrowStatus: 'held',
    role: 'buyer',
    items: [item('003', 'pilotwardrobe-aviator-uniform-shirt', 'Aviator Uniform Shirt — size M', 'uniform-shirt', 14500, { size: 'M', sizeFromFitKit: true, condition: 'new' })],
    totals: { items: usd(14500), freight: usd(0), buyerProtection: usd(290), total: usd(14790) },
    seller: sellers.nehemiah!,
    buyer: buyerNehemiah,
    shippingAddress: addresses[0]!,
    carrier: { name: 'DHL Express', trackingNumber: 'JD014600006800001' },
    route: { from: 'LOS', to: 'LOS', progress: 1 },
    estimatedDelivery: { from: daysAgo(1), to: daysAgo(1) },
    autoReleaseAt: inHours(71),
    disputeWindowEndsAt: inHours(71),
    tracking: [
      { id: 't1', code: 'payment_secured', label: 'Payment secured in escrow', occurredAt: daysAgo(5), state: 'done' },
      { id: 't2', code: 'dispatched', label: 'Seller dispatched · wheels up', occurredAt: daysAgo(4), state: 'done' },
      { id: 't3', code: 'in_transit', label: 'In transit', occurredAt: daysAgo(3), state: 'done' },
      { id: 't4', code: 'out_for_delivery', label: 'Out for delivery', occurredAt: daysAgo(1), state: 'done' },
      { id: 't5', code: 'delivered', label: 'Goods landed · confirm within 72h', detail: 'Escrow releases after you confirm or 72h pass', occurredAt: hoursAgo(1), state: 'current' },
    ],
    payment: { gateway: 'paystack', status: 'successful', reference: 'PW-2026-918268', methodLabel: 'Mastercard •••• 0031' },
    allowedActions: ['confirm_delivery', 'open_dispute', 'message'],
    placedAt: daysAgo(5),
    updatedAt: hoursAgo(1),
  },
  {
    id: 'ord_4479',
    number: 'PW-4479',
    status: 'awaiting_dispatch',
    escrowStatus: 'held',
    role: 'seller',
    items: [item('008', 'garmin-gdl-52-ads-b-receiver', 'Garmin GDL 52 ADS-B receiver', 'garmin-handheld-gps', 62000, { condition: 'like_new' })],
    totals: { items: usd(62000), freight: usd(1400), buyerProtection: usd(1240), total: usd(64640) },
    seller: sellers.nehemiah!,
    buyer: { id: 'usr_11001', displayName: 'A. Musa', initials: 'AM' },
    shippingAddress: { ...addresses[0]!, fullName: 'A. Musa', line1: '4 Ahmadu Bello Way', city: 'Kaduna', state: 'Kaduna' },
    dispatchBy: inDays(1),
    tracking: trackingInTransit.map((t, i) => ({ ...t, state: i === 0 ? 'done' : i === 1 ? 'current' : 'upcoming' })),
    payment: { gateway: 'flutterwave', status: 'successful', reference: 'PW-2026-918279' },
    allowedActions: ['mark_dispatched', 'print_label', 'message'],
    placedAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: 'ord_4402',
    number: 'PW-4402',
    status: 'completed',
    escrowStatus: 'released',
    role: 'seller',
    items: [item('015', 'e6b-flight-computer', 'E6B flight computer', 'e6b-flight-computer', 6000)],
    totals: { items: usd(6000), freight: usd(0), buyerProtection: usd(120), total: usd(6120) },
    seller: sellers.nehemiah!,
    buyer: { id: 'usr_11002', displayName: 'P. Eze', initials: 'PE' },
    tracking: [],
    payment: { gateway: 'paystack', status: 'successful', reference: 'PW-2026-911002' },
    allowedActions: ['message'],
    placedAt: daysAgo(100),
    updatedAt: daysAgo(90),
  },
  {
    id: 'ord_4390',
    number: 'PW-4390',
    status: 'completed',
    escrowStatus: 'released',
    role: 'buyer',
    items: [item('105', 'digital-wing-view-snowfields', 'Wing View over Snowfields — digital licence', 'photo-wing-view', 1500, { digitalAssets: [{ id: 'dl_1', name: 'wing-view-6000px.jpg', sizeLabel: '24 MB · 6000×4000' }] })],
    totals: { items: usd(1500), freight: usd(0), buyerProtection: usd(0), total: usd(1500) },
    seller: sellers.tunde!,
    buyer: buyerNehemiah,
    tracking: [],
    payment: { gateway: 'stripe', status: 'successful', reference: 'PW-2026-910111' },
    allowedActions: ['download', 'review'],
    placedAt: daysAgo(30),
    updatedAt: daysAgo(30),
  },
]

export const cartItems = [
  { listingId: 'lst_003', size: 'M', sizeFromFitKit: true },
  { listingId: 'lst_013', size: null, sizeFromFitKit: false },
]
