import type { Id, IsoDateTime, Money } from './api'
import type { MediaAsset } from './media'

export interface WalletBalance {
  available: Money
  inEscrow: Money
  pendingRelease: Money
  lifetimeEarnings: Money
  total: Money
  escrowOrders: number
  pendingReleaseIn?: string | null
  thisMonthEarnings?: Money | null
}

export type TransactionType = 'sale' | 'purchase' | 'withdrawal' | 'promotion' | 'refund' | 'fee' | 'swap_topup' | 'adjustment'

export type TransactionStatus = 'pending' | 'in_escrow' | 'released' | 'paid' | 'complete' | 'failed' | 'reversed'

export interface WalletTransaction {
  id: Id
  occurredAt: IsoDateTime
  description: string
  detail?: string | null
  type: TransactionType
  status: TransactionStatus
  amount: Money
  direction: 'credit' | 'debit'
  orderId?: Id | null
  reference?: string | null
}

export interface PayoutMethod {
  id: Id
  kind: 'bank' | 'wise' | 'mobile_money'
  label: string
  currency: Money['currency']
  last4: string
  isDefault: boolean
}

export interface PayoutSchedule {
  enabled: boolean
  frequency: 'weekly' | 'monthly'
  dayLabel: string
  threshold: Money
}

export interface WithdrawalQuote {
  amount: Money
  exchangeRate?: { from: string; to: string; rate: number; label: string } | null
  fee: Money
  recipientReceives: Money
  arrivesBetween: { from: IsoDateTime; to: IsoDateTime }
  requiresTwoFactor: boolean
}

export interface WithdrawalPayload {
  amount: number
  currency: Money['currency']
  payoutMethodId: Id
  twoFactorCode?: string
}

/** GET /me/hangar — aggregated seller dashboard (V5). */
export interface HangarSummary {
  sellerSince: IsoDateTime | null
  verifiedSeller: boolean
  stats: {
    inEscrow: Money
    escrowOrders: number
    availableToPayOut: Money
    weekDelta: Money
    liveListings: number
    listingsNeedPhotos: number
    sellerRating: number
    previousRating: number
  }
  wallet: Pick<WalletBalance, 'total' | 'available' | 'inEscrow'>
  attention: { id: Id; tone: 'warning' | 'info' | 'success'; title: string; detail: string; to: string }[]
  feed: {
    id: Id
    kind: 'listing' | 'order'
    title: string
    subtitle: string
    image: MediaAsset | null
    price: Money
    status: { label: string; tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'gold' | 'navy' }
    bucket: 'live' | 'airborne' | 'landed' | 'drafts'
    nextAction: string
    to: string
  }[]
}
