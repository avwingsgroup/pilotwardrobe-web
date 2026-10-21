import type {
  CounterOfferPayload,
  CreateOfferPayload,
  CreateSwapPayload,
  InboxItem,
  Offer,
  SwapRequest,
} from '@/types'
import { api } from './client'

export type TradeBox = 'received' | 'sent' | 'archived'

export const offerService = {
  create(listingId: string, payload: CreateOfferPayload) {
    return api.post<Offer>(`/listings/${listingId}/offers`, payload)
  },
  list(box: TradeBox, signal?: AbortSignal) {
    return api.get<Offer[]>('/me/offers', { params: { box }, signal })
  },
  accept(id: string) {
    return api.post<Offer>(`/offers/${id}/accept`)
  },
  decline(id: string) {
    return api.post<Offer>(`/offers/${id}/decline`)
  },
  counter(id: string, payload: CounterOfferPayload) {
    return api.post<Offer>(`/offers/${id}/counter`, payload)
  },
  cancel(id: string) {
    return api.post<Offer>(`/offers/${id}/cancel`)
  },
}

export const swapService = {
  create(listingId: string, payload: CreateSwapPayload) {
    return api.post<SwapRequest>(`/listings/${listingId}/swap-requests`, payload)
  },
  list(box: TradeBox, signal?: AbortSignal) {
    return api.get<SwapRequest[]>('/me/swap-requests', { params: { box }, signal })
  },
  accept(id: string) {
    return api.post<SwapRequest>(`/swap-requests/${id}/accept`)
  },
  reject(id: string) {
    return api.post<SwapRequest>(`/swap-requests/${id}/reject`)
  },
  cancel(id: string) {
    return api.post<SwapRequest>(`/swap-requests/${id}/cancel`)
  },
}

/** Offers & swaps share one inbox (VB5); merged newest-first. */
export async function loadTradeInbox(box: TradeBox, signal?: AbortSignal): Promise<InboxItem[]> {
  const [offers, swaps] = await Promise.all([offerService.list(box, signal), swapService.list(box, signal)])
  return [...offers, ...swaps].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
