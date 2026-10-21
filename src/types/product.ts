import type { CountryCode, Id, IsoDateTime, ListQuery, Money } from './api'
import type { MediaAsset } from './media'
import type { PublicSeller } from './user'

export type ProductCondition = 'new' | 'like_new' | 'very_good' | 'good' | 'fair'

/**
 * Listing lifecycle. Transitions are backend-enforced; the frontend only offers
 * actions listed in `Listing.allowedActions`.
 */
export type ListingStatus =
  | 'draft'
  | 'pending_review'
  | 'active'
  | 'paused'
  | 'reserved'
  | 'sold'
  | 'swapped'
  | 'archived'
  | 'needs_changes'
  | 'rejected'
  | 'removed'

export type ListingAction =
  | 'edit'
  | 'preview'
  | 'promote'
  | 'pause'
  | 'resume'
  | 'archive'
  | 'delete'
  | 'mark_sold'
  | 'mark_unavailable'
  | 'relist'
  | 'resubmit'
  | 'finish'

export type ProductFormat = 'physical' | 'digital' | 'print'

export type DealType = 'buy_now' | 'offers' | 'swaps'

export interface Category {
  id: Id
  slug: string
  name: string
  parentId?: Id | null
  listingsCount: number
  image?: MediaAsset | null
  children?: Category[]
  /** Category supports a size chart & Fit Kit matching. */
  sized?: boolean
}

export interface ListingLocation {
  countryCode: CountryCode
  state?: string | null
  city?: string | null
  airportCode?: string | null
}

export type FreightMethod = 'pilotwardrobe_freight' | 'self_ship' | 'airfield_handoff'

export interface ShippingOption {
  id: Id
  method: FreightMethod | 'express' | 'standard'
  label: string
  description: string
  price: Money
  estimatedDays?: { min: number; max: number } | null
}

export interface SizeChartRow {
  size: string
  measurements: Record<string, string>
}

export interface SizeInfo {
  available: string[]
  unavailable: string[]
  chart?: { columns: string[]; rows: SizeChartRow[]; note?: string } | null
  /** Size matched against the viewer's default Fit Kit profile (server-computed). */
  fitMatch?: { size: string; profileName: string; summary: string } | null
}

export interface ListingBadge {
  kind: 'best_seller' | 'fits_you' | 'swap_ok' | 'free_delivery' | 'official_store' | 'promoted' | 'digital' | 'new'
  label: string
}

/** Marketplace listing (a.k.a. product). */
export interface Listing {
  id: Id
  slug: string
  title: string
  description: string
  category: Pick<Category, 'id' | 'slug' | 'name'>
  breadcrumbs?: Pick<Category, 'id' | 'slug' | 'name'>[]
  condition: ProductCondition
  format: ProductFormat
  price: Money
  compareAtPrice?: Money | null
  minimumOffer?: Money | null
  seller: PublicSeller
  images: MediaAsset[]
  location?: ListingLocation | null
  shipping?: ShippingOption[]
  freightSummary?: string | null
  negotiable: boolean
  swappable: boolean
  status: ListingStatus
  promoted: boolean
  badges: ListingBadge[]
  brand?: string | null
  model?: string | null
  attributes?: { label: string; value: string }[]
  aircraftTypes?: string[]
  tags?: string[]
  sizes?: SizeInfo | null
  rating?: number | null
  soldCount?: number
  viewsCount: number
  favoritesCount: number
  offersCount?: number
  isFavorited?: boolean
  /** Owner-only: actions the backend currently permits. */
  allowedActions?: ListingAction[]
  moderation?: { reason?: string | null; note?: string | null } | null
  boost?: { package: BoostPackageCode; endsAt: IsoDateTime } | null
  createdAt: IsoDateTime
  updatedAt: IsoDateTime
}

export type Product = Listing

export type SortOption =
  | 'recommended'
  | 'newest'
  | 'price_asc'
  | 'price_desc'
  | 'popular'
  | 'rating'
  | 'nearest'

export interface ListingFilters extends ListQuery {
  search?: string
  category?: string[]
  condition?: ProductCondition[]
  minPrice?: number
  maxPrice?: number
  currency?: string
  aircraftType?: string
  location?: string
  verifiedOnly?: boolean
  minRating?: number
  freeDelivery?: boolean
  dealType?: DealType[]
  format?: ProductFormat
  available?: boolean
  promoted?: boolean
  fitsMySize?: boolean
  seller?: string
  sort?: SortOption
}

export interface FacetValue {
  value: string
  label: string
  count: number
}

export interface ListingFacets {
  categories: FacetValue[]
  conditions: FacetValue[]
  dealTypes: FacetValue[]
  seller: FacetValue[]
  priceRange: { min: number; max: number; currency: string }
  fitsSavedSizes?: number
}

export type BoostPackageCode = 'none' | 'runway' | 'jetstream' | 'featured_home'

export interface BoostPackage {
  code: BoostPackageCode
  label: string
  description: string
  durationDays: number
  price: Money
}

/** Write model for POST/PATCH /listings (draft-friendly: all optional except on publish). */
export interface ListingDraft {
  id?: Id
  title: string
  description: string
  categoryId: Id | ''
  brand: string
  model: string
  attributes: Record<string, string>
  serialNumber: string
  yearPurchased: string
  tags: string[]
  condition: ProductCondition | ''
  format: ProductFormat
  price: Money
  negotiable: boolean
  minimumOffer: Money | null
  autoDeclineBelowMinimum: boolean
  swappable: boolean
  aircraftTypes: string[]
  mediaIds: Id[]
  location: ListingLocation
  shipping: {
    method: FreightMethod
    pickup: boolean
    domestic: boolean
    international: boolean
    shipsFrom: string
    parcelSize: 'small' | 'medium' | 'large'
    weightKg: number | null
    payer: 'buyer' | 'seller'
    price: Money | null
  }
  boost: BoostPackageCode
  attestations: { ownsItem: boolean; notCounterfeit: boolean; dispatchCommitment: boolean }
}

export interface PriceCheck {
  low: Money
  high: Money
  sampleSize: number
  basis: string
  position: 'below' | 'fast_sell' | 'above'
}

export interface FeeQuote {
  platformFeeRate: number
  platformFee: Money
  sellerReceives: Money
}
