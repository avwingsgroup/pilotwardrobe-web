import type {
  DisputeReason,
  DisputeStatus,
  EscrowStatus,
  KycStatus,
  ListingStatus,
  OfferStatus,
  OrderStatus,
  PaymentStatus,
  ProductCondition,
  SortOption,
  SwapStatus,
  TransactionStatus,
} from '@/types'

/** Badge tones map 1:1 to AppBadge variants (shared with admin so staff see what users see). */
export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'gold' | 'navy'

export interface StatusLabel {
  label: string
  tone: Tone
}

export const CONDITION_LABELS: Record<ProductCondition, { label: string; hint: string }> = {
  new: { label: 'New', hint: 'Unused, tags or seals intact' },
  like_new: { label: 'Like new', hint: 'No visible wear' },
  very_good: { label: 'Very good', hint: 'Minimal signs of use' },
  good: { label: 'Good', hint: 'Light marks, fully working' },
  fair: { label: 'Fair', hint: 'Visible wear, works' },
}

export const LISTING_STATUS: Record<ListingStatus, StatusLabel> = {
  draft: { label: 'Draft', tone: 'neutral' },
  pending_review: { label: 'In review', tone: 'info' },
  active: { label: 'Live', tone: 'success' },
  paused: { label: 'Paused', tone: 'neutral' },
  reserved: { label: 'Reserved', tone: 'info' },
  sold: { label: 'Sold', tone: 'info' },
  swapped: { label: 'Swapped', tone: 'info' },
  archived: { label: 'Archived', tone: 'neutral' },
  needs_changes: { label: 'Needs changes', tone: 'danger' },
  rejected: { label: 'Rejected', tone: 'danger' },
  removed: { label: 'Removed', tone: 'danger' },
}

/** Aviation-flavoured order labels from V5/VB7. */
export const ORDER_STATUS: Record<OrderStatus, StatusLabel> = {
  pending_payment: { label: 'Awaiting payment', tone: 'warning' },
  paid: { label: 'Paid', tone: 'info' },
  awaiting_dispatch: { label: 'Awaiting wheels-up', tone: 'warning' },
  in_transit: { label: 'Airborne', tone: 'info' },
  out_for_delivery: { label: 'Final approach', tone: 'info' },
  delivered: { label: 'Landed', tone: 'success' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  refunded: { label: 'Refunded', tone: 'neutral' },
  partially_refunded: { label: 'Part refunded', tone: 'neutral' },
  disputed: { label: 'Disputed', tone: 'danger' },
  on_hold: { label: 'On hold', tone: 'danger' },
}

export const ESCROW_STATUS: Record<EscrowStatus, StatusLabel> = {
  not_funded: { label: 'Not funded', tone: 'neutral' },
  held: { label: 'Held', tone: 'info' },
  frozen: { label: 'Frozen · dispute', tone: 'danger' },
  releasing: { label: 'Releasing', tone: 'warning' },
  released: { label: 'Released', tone: 'success' },
  refunded: { label: 'Refunded', tone: 'neutral' },
  on_hold: { label: 'On hold · risk', tone: 'danger' },
}

export const PAYMENT_STATUS: Record<PaymentStatus, StatusLabel> = {
  pending: { label: 'Pending', tone: 'warning' },
  processing: { label: 'Processing', tone: 'info' },
  successful: { label: 'Successful', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  refunded: { label: 'Refunded', tone: 'neutral' },
  partially_refunded: { label: 'Partially refunded', tone: 'neutral' },
}

export const OFFER_STATUS: Record<OfferStatus, StatusLabel> = {
  pending: { label: 'Pending', tone: 'warning' },
  accepted: { label: 'Accepted', tone: 'success' },
  declined: { label: 'Declined', tone: 'danger' },
  countered: { label: 'Counter sent', tone: 'info' },
  expired: { label: 'Expired', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

export const SWAP_STATUS: Record<SwapStatus, StatusLabel> = {
  pending: { label: 'Pending', tone: 'warning' },
  accepted: { label: 'Accepted', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  countered: { label: 'Countered', tone: 'info' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  expired: { label: 'Expired', tone: 'neutral' },
  completed: { label: 'Completed', tone: 'success' },
  disputed: { label: 'Disputed', tone: 'danger' },
}

export const KYC_STATUS: Record<KycStatus, StatusLabel> = {
  not_started: { label: 'Not started', tone: 'neutral' },
  pending: { label: 'Pending', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  escalated: { label: 'Escalated', tone: 'warning' },
  expired: { label: 'Expired', tone: 'danger' },
}

export const TRANSACTION_STATUS: Record<TransactionStatus, StatusLabel> = {
  pending: { label: 'Pending', tone: 'warning' },
  in_escrow: { label: 'In escrow', tone: 'info' },
  released: { label: 'Released', tone: 'success' },
  paid: { label: 'Paid', tone: 'success' },
  complete: { label: 'Complete', tone: 'neutral' },
  failed: { label: 'Failed', tone: 'danger' },
  reversed: { label: 'Reversed', tone: 'danger' },
}

export const DISPUTE_STATUS: Record<DisputeStatus, StatusLabel> = {
  open: { label: 'Open', tone: 'warning' },
  awaiting_seller: { label: 'Awaiting seller', tone: 'warning' },
  under_review: { label: 'Under review', tone: 'warning' },
  resolved_buyer: { label: 'Resolved · buyer', tone: 'success' },
  resolved_seller: { label: 'Resolved · seller', tone: 'success' },
  resolved_split: { label: 'Resolved · split', tone: 'success' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral' },
  appealed: { label: 'Appealed', tone: 'info' },
}

export const DISPUTE_REASONS: Record<DisputeReason, { label: string; hint: string }> = {
  not_as_described: { label: 'Item not as described', hint: 'Condition, model or size differs' },
  not_received: { label: "Item didn't arrive", hint: 'No delivery after the ETA' },
  damaged: { label: 'Damaged in transit', hint: 'Packaging or item damaged' },
  counterfeit: { label: 'Counterfeit or not genuine', hint: "Serial or labels don't match" },
}

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'recommended', label: 'Recommended' },
  { value: 'price_asc', label: 'Price low → high' },
  { value: 'price_desc', label: 'Price high → low' },
  { value: 'popular', label: 'Most popular' },
  { value: 'rating', label: 'Best rated' },
  { value: 'nearest', label: 'Nearest' },
]

export const CURRENCIES = ['USD', 'NGN', 'GHS', 'GBP', 'EUR'] as const

export const COUNTRIES: { code: string; name: string }[] = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'AE', name: 'United Arab Emirates' },
]
