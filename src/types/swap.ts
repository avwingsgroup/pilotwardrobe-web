import type { Id, IsoDateTime, Money } from './api'
import type { MediaAsset } from './media'
import type { ProductCondition } from './product'

export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'countered' | 'expired' | 'cancelled'

export type SwapStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'countered'
  | 'cancelled'
  | 'expired'
  | 'completed'
  | 'disputed'

export interface Counterparty {
  id: Id
  displayName: string
  initials: string
  username: string
  verified: boolean
  rating: number
  trades: number
  location?: string | null
  memberSince: IsoDateTime
}

export interface ListingSummary {
  id: Id
  slug: string
  title: string
  image?: MediaAsset | null
  price: Money
  condition?: ProductCondition | null
  minimumOffer?: Money | null
}

export interface OfferHistoryEvent {
  id: Id
  label: string
  detail: string
  occurredAt: IsoDateTime
  kind: 'offer' | 'counter' | 'view' | 'watch' | 'accepted' | 'declined' | 'expired'
}

export interface Offer {
  id: Id
  kind: 'offer'
  direction: 'received' | 'sent'
  status: OfferStatus
  listing: ListingSummary
  amount: Money
  counterAmount?: Money | null
  belowAskingPercent: number
  youReceive?: Money | null
  message?: string | null
  counterparty: Counterparty
  expiresAt: IsoDateTime
  createdAt: IsoDateTime
  history: OfferHistoryEvent[]
  unread?: boolean
  allowedActions: ('accept' | 'decline' | 'counter' | 'cancel' | 'checkout' | 'message')[]
}

export interface CreateOfferPayload {
  amount: number
  currency: Money['currency']
  message?: string
}

export interface CounterOfferPayload {
  amount: number
  currency: Money['currency']
  message?: string
}

export interface SwapItem {
  listing: ListingSummary
  estimatedValue: Money
}

export interface SwapRequest {
  id: Id
  kind: 'swap'
  direction: 'received' | 'sent'
  status: SwapStatus
  targetListing: ListingSummary
  offeredItems: SwapItem[]
  cashAdjustment?: Money | null
  swapFee: Money
  message?: string | null
  counterparty: Counterparty
  expiresAt: IsoDateTime
  createdAt: IsoDateTime
  history: OfferHistoryEvent[]
  unread?: boolean
  allowedActions: ('accept' | 'reject' | 'counter' | 'cancel' | 'message')[]
}

export interface CreateSwapPayload {
  offeredListingIds: Id[]
  cashAdjustment?: { amount: number; currency: Money['currency'] } | null
  message?: string
}

export type InboxItem = Offer | SwapRequest
