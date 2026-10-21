import type { CountryCode, CurrencyCode, Id, IsoDateTime, Money } from './api'

export type PaymentGateway = 'stripe' | 'paypal' | 'paystack' | 'flutterwave' | 'monnify'

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'successful'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded'

export const TERMINAL_PAYMENT_STATUSES: readonly PaymentStatus[] = [
  'successful',
  'failed',
  'cancelled',
  'refunded',
  'partially_refunded',
]

export interface PaymentMethod {
  code: PaymentGateway
  name: string
  enabled: boolean
  logo?: string | null
  /** Short helper, e.g. "Cards, bank transfer, USSD". */
  description?: string | null
  /** Hosted redirect vs. gateway-provided inline/popup widget. */
  flow: 'redirect' | 'popup'
  unavailableReason?: string | null
}

export interface PaymentMethodsQuery {
  currency: CurrencyCode
  country: CountryCode
}

export interface InitializePaymentPayload {
  orderId: Id
  gateway: PaymentGateway
  returnUrl: string
}

export interface PaymentInitialization {
  paymentId: Id
  gateway: PaymentGateway
  status: PaymentStatus
  authorizationUrl: string
  reference: string
  /** Only for gateways whose official browser SDK requires a public key (never secrets). */
  publicKey?: string | null
  expiresAt?: IsoDateTime | null
}

export interface Payment {
  id: Id
  reference: string
  status: PaymentStatus
  gateway: PaymentGateway
  orderId: Id
  amount: Money
  failureReason?: string | null
  paidAt?: IsoDateTime | null
}
