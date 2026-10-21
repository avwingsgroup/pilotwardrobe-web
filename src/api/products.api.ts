import type {
  BoostPackage,
  Category,
  Listing,
  ListingFacets,
  ListingFilters,
  PaginatedResponse,
  PaginationMeta,
} from '@/types'
import type { MediaAsset } from '@/types/media'
import type { HeroSlide } from '@/types/admin'
import { api, http } from './client'
import { cached } from './cache'

export interface ListingSearchResponse extends PaginatedResponse<Listing> {
  meta: PaginationMeta & { facets: ListingFacets; appliedCurrency: string }
}

export interface HomeSection {
  key: string
  title: string
  subtitle?: string | null
  viewAllTo: string
  listings: Listing[]
}

export interface HomeFeed {
  heroSlides: HeroSlide[]
  categories: Category[]
  sections: HomeSection[]
  gallery: { id: string; title: string; photographer: string; image: MediaAsset; to: string }[]
  trustedCount: number
}

/** Public marketplace reads (visitor-safe). */
export const productService = {
  home(signal?: AbortSignal) {
    return api.get<HomeFeed>('/home', { signal })
  },
  async search(filters: ListingFilters, signal?: AbortSignal): Promise<ListingSearchResponse> {
    const res = await http.get<ListingSearchResponse>('/listings', { params: filters, signal })
    return res.data
  },
  getBySlug(slug: string, signal?: AbortSignal) {
    return api.get<Listing>(`/listings/${encodeURIComponent(slug)}`, { signal })
  },
  related(slug: string, signal?: AbortSignal) {
    return api.get<Listing[]>(`/listings/${encodeURIComponent(slug)}/related`, { signal })
  },
  categories() {
    return cached('categories', 5 * 60_000, () => api.get<Category[]>('/categories'))
  },
  category(slug: string, signal?: AbortSignal) {
    return api.get<Category>(`/categories/${encodeURIComponent(slug)}`, { signal })
  },
  boostPackages() {
    return cached('boost-packages', 10 * 60_000, () => api.get<BoostPackage[]>('/boost-packages'))
  },
}

export const favoriteService = {
  list(page = 1, signal?: AbortSignal) {
    return api.list<Listing>('/me/favorites', { params: { page }, signal })
  },
  add(listingId: string) {
    return api.post<{ favoritesCount: number }>(`/listings/${listingId}/favorite`)
  },
  remove(listingId: string) {
    return api.delete<{ favoritesCount: number }>(`/listings/${listingId}/favorite`)
  },
}
