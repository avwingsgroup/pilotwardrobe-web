import type {
  Address,
  Cart,
  CheckoutQuote,
  ConfirmDeliveryPayload,
  CreateOrderPayload,
  Order,
  OrderStatus,
  ReviewPayload,
} from '@/types'
import { api, http } from './client'

export interface OrderListQuery {
  role?: 'buyer' | 'seller'
  status?: OrderStatus | 'active' | 'completed'
  page?: number
}

export const cartService = {
  get(signal?: AbortSignal) {
    return api.get<Cart>('/cart', { signal })
  },
  add(listingId: string, size?: string | null) {
    return api.post<Cart>('/cart/items', { listingId, size: size ?? null })
  },
  remove(itemId: string) {
    return api.delete<Cart>(`/cart/items/${itemId}`)
  },
}

export const checkoutService = {
  quote(input: { listingId?: string; cartId?: string; size?: string | null; offerId?: string; addressId?: string; shippingOptionId?: string | null }) {
    return api.post<CheckoutQuote>('/checkout/quote', input)
  },
}

export const orderService = {
  list(query: OrderListQuery, signal?: AbortSignal) {
    return api.list<Order>('/me/orders', { params: query, signal })
  },
  get(id: string, signal?: AbortSignal) {
    return api.get<Order>(`/orders/${id}`, { signal })
  },
  /** Creates the order in `pending_payment`. Payment is initialised separately. */
  create(payload: CreateOrderPayload) {
    return api.post<Order>('/orders', payload)
  },
  cancel(id: string) {
    return api.post<Order>(`/orders/${id}/cancel`)
  },
  confirmDelivery(id: string, payload: ConfirmDeliveryPayload) {
    return api.post<Order>(`/orders/${id}/confirm-delivery`, payload)
  },
  markDispatched(id: string, payload: { carrier: string; trackingNumber: string }) {
    return api.post<Order>(`/orders/${id}/dispatch`, payload)
  },
  review(id: string, payload: ReviewPayload) {
    return api.post<void>(`/orders/${id}/reviews`, payload)
  },
  async invoice(id: string): Promise<Blob> {
    const res = await http.get<Blob>(`/orders/${id}/invoice`, { responseType: 'blob' })
    return res.data
  },
  /** Digital products: Laravel returns a short-lived signed URL only after purchase. */
  authorizeDownload(orderId: string, assetId: string) {
    return api.post<{ url: string; expiresAt: string }>(`/orders/${orderId}/downloads/${assetId}/authorize`)
  },
}

export const addressService = {
  list(signal?: AbortSignal) {
    return api.get<Address[]>('/me/addresses', { signal })
  },
  create(address: Omit<Address, 'id'>) {
    return api.post<Address>('/me/addresses', address)
  },
  update(id: string, address: Partial<Address>) {
    return api.patch<Address>(`/me/addresses/${id}`, address)
  },
  remove(id: string) {
    return api.delete(`/me/addresses/${id}`)
  },
}
