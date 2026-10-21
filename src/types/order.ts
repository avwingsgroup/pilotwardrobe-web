import type { Id, IsoDateTime, Money } from './api'
import type { MediaAsset } from './media'
import type { PaymentGateway, PaymentStatus } from './payment'
import type { Address, PublicSeller } from './user'
import type { ProductCondition, ShippingOption } from './product'

/**
 * Order lifecycle (aviation-themed labels in UI):
 *  pending_payment → paid (escrow held) → awaiting_dispatch ("awaiting wheels-up")
 *  → in_transit ("airborne") → delivered ("landed") → completed (escrow released)
 *  Side states: cancelled, refunded, partially_refunded, disputed (escrow frozen), on_hold.
 */
export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'awaiting_dispatch'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded'
  | 'disputed'
  | 'on_hold'

export type EscrowStatus = 'not_funded' | 'held' | 'frozen' | 'releasing' | 'released' | 'refunded' | 'on_hold'

export type OrderAction =
  | 'pay'
  | 'cancel'
  | 'confirm_delivery'
  | 'open_dispute'
  | 'review'
  | 'mark_dispatched'
  | 'print_label'
  | 'download'
  | 'message'

export interface OrderItem {
  id: Id
  listingId: Id
  listingSlug: string
  title: string
  image?: MediaAsset | null
  condition?: ProductCondition | null
  size?: string | null
  sizeFromFitKit?: boolean
  quantity: number
  unitPrice: Money
  total: Money
  digitalAssets?: { id: Id; name: string; sizeLabel: string }[]
}

export interface OrderTotals {
  items: Money
  freight: Money
  buyerProtection: Money
  duties?: Money | null
  discount?: Money | null
  total: Money
}

export interface TrackingEvent {
  id: Id
  code: 'payment_secured' | 'dispatched' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'released'
  label: string
  detail?: string | null
  occurredAt?: IsoDateTime | null
  state: 'done' | 'current' | 'upcoming'
}

export interface Order {
  id: Id
  number: string
  status: OrderStatus
  escrowStatus: EscrowStatus
  role: 'buyer' | 'seller'
  items: OrderItem[]
  totals: OrderTotals
  seller: PublicSeller
  buyer: { id: Id; displayName: string; initials: string }
  shippingAddress?: Address | null
  shipping?: ShippingOption | null
  carrier?: { name: string; trackingNumber: string; trackingUrl?: string | null } | null
  route?: { from: string; to: string; progress: number } | null
  estimatedDelivery?: { from: IsoDateTime; to: IsoDateTime } | null
  dispatchBy?: IsoDateTime | null
  autoReleaseAt?: IsoDateTime | null
  disputeWindowEndsAt?: IsoDateTime | null
  tracking: TrackingEvent[]
  payment?: { gateway: PaymentGateway; status: PaymentStatus; reference: string; methodLabel?: string | null } | null
  allowedActions: OrderAction[]
  disputeId?: Id | null
  placedAt: IsoDateTime
  updatedAt: IsoDateTime
}

export interface CartItem {
  id: Id
  listingId: Id
  listingSlug: string
  title: string
  image?: MediaAsset | null
  condition?: ProductCondition | null
  size?: string | null
  sizeFromFitKit?: boolean
  price: Money
  seller: Pick<PublicSeller, 'id' | 'displayName' | 'username' | 'verified'>
  available: boolean
}

export interface Cart {
  id: Id
  items: CartItem[]
  subtotal: Money
  currency: Money['currency']
}

export interface CheckoutQuote {
  items: CartItem[]
  shippingOptions: ShippingOption[]
  selectedShippingId?: Id | null
  totals: OrderTotals
  dispatchNote?: string | null
  escrowNote: string
}

export interface CreateOrderPayload {
  /** Buy-now path (single listing) or cart checkout. */
  listingId?: Id
  size?: string | null
  cartId?: Id
  /** When the order results from an accepted offer/swap. */
  offerId?: Id
  swapId?: Id
  addressId: Id
  shippingOptionId: Id
  promoCode?: string | null
}

export interface ReviewPayload {
  rating: number
  tags: string[]
  comment: string
}

export interface ConfirmDeliveryPayload {
  review?: ReviewPayload | null
}
