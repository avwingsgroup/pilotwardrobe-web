import type {
  InitializePaymentPayload,
  Payment,
  PaymentInitialization,
  PaymentMethod,
  PaymentMethodsQuery,
} from '@/types'
import { api } from './client'
import { cached } from './cache'

/**
 * Gateway-agnostic payment service. The backend decides which gateways are
 * enabled per currency/country, initialises sessions with secret keys, verifies
 * callbacks + webhooks and owns the final payment status. The frontend never
 * marks an order paid on its own.
 */
export const paymentService = {
  methods(query: PaymentMethodsQuery) {
    return cached(`payment-methods:${query.currency}:${query.country}`, 60_000, () =>
      api.get<PaymentMethod[]>('/payment-methods', { params: query }),
    )
  },
  initialize(payload: InitializePaymentPayload) {
    return api.post<PaymentInitialization>('/payments/initialize', payload)
  },
  /** Server-side verification status; poll until terminal. */
  verify(reference: string, signal?: AbortSignal) {
    return api.get<Payment>(`/payments/${encodeURIComponent(reference)}`, { signal })
  },
}
