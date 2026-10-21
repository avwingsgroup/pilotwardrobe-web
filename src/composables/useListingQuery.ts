import { computed } from 'vue'
import { useRoute, useRouter, type LocationQuery } from 'vue-router'
import type { DealType, ListingFilters, ProductCondition, ProductFormat, SortOption } from '@/types/product'

const list = (v: unknown) => (typeof v === 'string' && v ? v.split(',').filter(Boolean) : [])
const num = (v: unknown) => (typeof v === 'string' && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : undefined)
const bool = (v: unknown) => (v === 'true' || v === '1' ? true : undefined)

/** Parse URL query → typed filters (URL is the single source of truth for search state). */
export function parseListingQuery(query: LocationQuery, categorySlug?: string): ListingFilters {
  const categories = list(query.category)
  return {
    search: typeof query.search === 'string' ? query.search : undefined,
    category: categorySlug && !categories.length ? [categorySlug] : categories,
    condition: list(query.condition) as ProductCondition[],
    dealType: list(query.deal) as DealType[],
    minPrice: num(query.min_price),
    maxPrice: num(query.max_price),
    verifiedOnly: bool(query.verified),
    minRating: num(query.min_rating),
    freeDelivery: bool(query.free_delivery),
    fitsMySize: bool(query.fits),
    format: (typeof query.format === 'string' ? query.format : undefined) as ProductFormat | undefined,
    aircraftType: typeof query.aircraft === 'string' ? query.aircraft : undefined,
    sort: (typeof query.sort === 'string' ? query.sort : 'newest') as SortOption,
    page: num(query.page) ?? 1,
    currency: 'USD',
  }
}

/** Typed filters → compact URL query (defaults omitted). */
export function toListingQuery(f: ListingFilters, categorySlug?: string): Record<string, string | undefined> {
  const cats = (f.category ?? []).filter((c) => c !== categorySlug)
  const join = (v?: string[]) => (v && v.length ? v.join(',') : undefined)
  return {
    search: f.search || undefined,
    category: join(cats),
    condition: join(f.condition),
    deal: join(f.dealType),
    min_price: f.minPrice !== undefined ? String(f.minPrice) : undefined,
    max_price: f.maxPrice !== undefined ? String(f.maxPrice) : undefined,
    verified: f.verifiedOnly ? 'true' : undefined,
    min_rating: f.minRating ? String(f.minRating) : undefined,
    free_delivery: f.freeDelivery ? 'true' : undefined,
    fits: f.fitsMySize ? 'true' : undefined,
    format: f.format,
    aircraft: f.aircraftType,
    sort: f.sort && f.sort !== 'newest' ? f.sort : undefined,
    page: f.page && f.page > 1 ? String(f.page) : undefined,
  }
}

export function useListingQuery() {
  const route = useRoute()
  const router = useRouter()
  const categorySlug = computed(() => (route.name === 'category' ? String(route.params.slug) : undefined))
  const filters = computed(() => parseListingQuery(route.query, categorySlug.value))

  function update(next: Partial<ListingFilters>, resetPage = true) {
    const merged = { ...filters.value, ...next, ...(resetPage && !('page' in next) ? { page: 1 } : {}) }
    void router.push({ query: toListingQuery(merged, categorySlug.value) })
  }

  function clear() {
    void router.push({ query: filters.value.search ? { search: filters.value.search } : {} })
  }

  return { filters, categorySlug, update, clear }
}
