import type {
  FeeQuote,
  Listing,
  ListingAction,
  ListingDraft,
  ListingStatus,
  MediaAsset,
  MediaPurpose,
  PaginatedResponse,
  PaginationMeta,
  PriceCheck,
} from '@/types'
import { api, http } from './client'

export interface MyListingsQuery {
  status?: ListingStatus | 'all' | 'live' | 'drafts'
  search?: string
  category?: string
  condition?: string
  promoted?: boolean
  sort?: string
  page?: number
}

export interface MyListingsResponse extends PaginatedResponse<Listing> {
  meta: PaginationMeta & { counts: Record<'all' | 'live' | 'drafts' | 'paused' | 'sold' | 'removed', number> }
}

export type BulkListingAction = 'pause' | 'promote' | 'mark_sold' | 'delete' | 'edit_price'

/** Seller-side listing management (authenticated). */
export const listingService = {
  async mine(query: MyListingsQuery, signal?: AbortSignal): Promise<MyListingsResponse> {
    const res = await http.get<MyListingsResponse>('/me/listings', { params: query, signal })
    return res.data
  },
  get(id: string, signal?: AbortSignal) {
    return api.get<Listing>(`/me/listings/${id}`, { signal })
  },
  createDraft(draft: Partial<ListingDraft>) {
    return api.post<Listing>('/listings', draft)
  },
  update(id: string, draft: Partial<ListingDraft>) {
    return api.patch<Listing>(`/listings/${id}`, draft)
  },
  publish(id: string, draft: Partial<ListingDraft>) {
    return api.post<Listing>(`/listings/${id}/publish`, draft)
  },
  transition(id: string, action: Exclude<ListingAction, 'edit' | 'preview' | 'delete' | 'finish'>) {
    return api.post<Listing>(`/listings/${id}/${action.replace(/_/g, '-')}`)
  },
  remove(id: string) {
    return api.delete(`/listings/${id}`)
  },
  bulk(ids: string[], action: BulkListingAction, payload?: Record<string, unknown>) {
    return api.post<{ updated: number }>('/listings/bulk', { ids, action, ...payload })
  },
  importCsv(file: File) {
    const form = new FormData()
    form.append('file', file)
    return api.post<{ imported: number; drafts: number; failed: { row: number; error: string }[] }>('/listings/imports', form, { rawBody: true, timeout: 120_000 })
  },
  priceCheck(input: { categoryId: string; brand?: string; model?: string; condition?: string; currency: string }) {
    return api.post<PriceCheck>('/listings/price-check', input)
  },
  feeQuote(price: { amount: number; currency: string }) {
    return api.post<FeeQuote>('/listings/fee-quote', { price })
  },
}

/**
 * Media uploads go to Laravel, which forwards to Cloudinary using server-side
 * credentials and returns the normalised MediaAsset. No Cloudinary secrets in Vue.
 */
export const mediaService = {
  upload(file: File, purpose: MediaPurpose, onProgress?: (percent: number) => void, signal?: AbortSignal) {
    const form = new FormData()
    form.append('file', file)
    form.append('type', purpose)
    return api.post<MediaAsset>('/media', form, {
      rawBody: true,
      signal,
      timeout: 120_000,
      onUploadProgress: (event) => {
        if (onProgress && event.total) onProgress(Math.round((event.loaded / event.total) * 100))
      },
    })
  },
  remove(id: string) {
    return api.delete(`/media/${id}`)
  },
}
