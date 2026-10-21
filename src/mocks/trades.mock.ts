import type { Offer, SwapRequest, Counterparty, ListingSummary } from '@/types/swap'
import type { CurrencyCode } from '@/types/api'
import { mockMedia } from './media'
import { hoursAgo, inHours, daysAgo } from './time'

const usd = (amount: number) => ({ amount, currency: 'USD' as CurrencyCode })

const boseA20: ListingSummary = {
  id: 'lst_001',
  slug: 'bose-a20-aviation-headset-dual-ga',
  title: 'Bose A20 Aviation Headset — dual GA plugs',
  image: mockMedia('bose-a20'),
  price: usd(74500),
  condition: 'like_new',
  minimumOffer: usd(60000),
}

const onex: ListingSummary = {
  id: 'lst_004',
  slug: 'david-clark-one-x-enc-headset',
  title: 'DC ONE-X ENC',
  image: mockMedia('david-clark-onex'),
  price: usd(61500),
  condition: 'very_good',
}

const fcom: ListingSummary = { id: 'lst_201', slug: 'a320-fcom-binder-set', title: 'FCOM set', image: mockMedia('tablet-kneeboard'), price: usd(15000) }

const person = (id: string, displayName: string, initials: string, extra: Partial<Counterparty> = {}): Counterparty => ({
  id,
  displayName,
  initials,
  username: displayName.toLowerCase().replace(/[^a-z]+/g, '_'),
  verified: true,
  rating: 4.9,
  trades: 27,
  location: 'Abuja',
  memberSince: '2024-01-01T00:00:00Z',
  ...extra,
})

const history = (amount: string, who: string) => [
  { id: 'h1', label: `Offer received · ${amount}`, detail: `Today 09:41 · ${who}`, occurredAt: hoursAgo(0.05), kind: 'offer' as const },
  { id: 'h2', label: 'Listing viewed 6 times', detail: 'Jul 26 – Jul 30', occurredAt: daysAgo(2), kind: 'view' as const },
  { id: 'h3', label: 'Saved to watchlist', detail: 'Jul 26', occurredAt: daysAgo(5), kind: 'watch' as const },
]

export const offers: Offer[] = [
  {
    id: 'off_9281',
    kind: 'offer',
    direction: 'received',
    status: 'pending',
    listing: boseA20,
    amount: usd(71200),
    belowAskingPercent: 4.4,
    youReceive: usd(65504),
    message: 'Can you do $712 if I pay today? Need it before my checkride on the 14th.',
    counterparty: person('usr_09981k', 'Kunle Taiwo', 'KT'),
    expiresAt: inHours(9),
    createdAt: hoursAgo(0.04),
    history: history('$712', 'Kunle T.'),
    unread: true,
    allowedActions: ['accept', 'decline', 'counter', 'message'],
  },
  {
    id: 'off_9282',
    kind: 'offer',
    direction: 'received',
    status: 'countered',
    listing: onex,
    amount: usd(56000),
    counterAmount: usd(59000),
    belowAskingPercent: 8.9,
    message: null,
    counterparty: person('usr_11201', 'Jide O.', 'JO', { rating: 4.6, trades: 8 }),
    expiresAt: inHours(20),
    createdAt: hoursAgo(3),
    history: history('$560', 'Jide O.'),
    allowedActions: ['message'],
  },
  {
    id: 'off_9283',
    kind: 'offer',
    direction: 'received',
    status: 'pending',
    listing: onex,
    amount: usd(54000),
    belowAskingPercent: 12.2,
    message: 'Would you take $540?',
    counterparty: person('usr_10877', 'R. Mensah', 'RM', { location: 'Accra' }),
    expiresAt: inHours(21),
    createdAt: hoursAgo(6),
    history: history('$540', 'R. Mensah'),
    allowedActions: ['accept', 'decline', 'counter', 'message'],
  },
  {
    id: 'off_9284',
    kind: 'offer',
    direction: 'received',
    status: 'declined',
    listing: fcom,
    amount: usd(8000),
    belowAskingPercent: 46.7,
    message: null,
    counterparty: person('usr_09981', 'Capt. Bello', 'CB'),
    expiresAt: daysAgo(0.5),
    createdAt: daysAgo(1),
    history: [{ id: 'h1', label: 'Declined automatically', detail: 'Below your minimum offer', occurredAt: daysAgo(1), kind: 'declined' }],
    allowedActions: [],
  },
  {
    id: 'off_9300',
    kind: 'offer',
    direction: 'sent',
    status: 'pending',
    listing: { id: 'lst_016', slug: 'garmin-handheld-aviation-gps', title: 'Garmin aera 760 handheld GPS', image: mockMedia('garmin-handheld-gps'), price: usd(99900) },
    amount: usd(90000),
    belowAskingPercent: 9.9,
    message: 'Any flexibility on price?',
    counterparty: person('usr_10877', 'Richard Mensah', 'RM', { location: 'Accra' }),
    expiresAt: inHours(30),
    createdAt: hoursAgo(10),
    history: [],
    allowedActions: ['cancel', 'message'],
  },
]

export const swaps: SwapRequest[] = [
  {
    id: 'swp_772',
    kind: 'swap',
    direction: 'received',
    status: 'pending',
    targetListing: boseA20,
    offeredItems: [
      { listing: { id: 'lst_007', slug: 'lightspeed-zulu-3-carry-case', title: 'Lightspeed Zulu 3, LEMO', image: mockMedia('lightspeed-zulu-3'), price: usd(54000) }, estimatedValue: usd(54000) },
    ],
    cashAdjustment: usd(18000),
    swapFee: usd(2880),
    message: 'Zulu 3 is 2023, fresh battery cover. Happy to meet at LOS GA terminal.',
    counterparty: person('usr_11034', 'Ifeoma A.', 'IA', { location: 'Lagos', trades: 6 }),
    expiresAt: inHours(30),
    createdAt: hoursAgo(1),
    history: [{ id: 'h1', label: 'Swap proposed · Zulu 3 + $180', detail: 'Today · Ifeoma A.', occurredAt: hoursAgo(1), kind: 'offer' }],
    unread: true,
    allowedActions: ['accept', 'reject', 'message'],
  },
]
