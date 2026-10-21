import type { CountryCode, CurrencyCode, Id, IsoDateTime, Money } from './api'
import type { MediaAsset } from './media'
import type { Permission, UserRole } from './permissions'

export type AccountStatus = 'active' | 'restricted' | 'suspended' | 'deactivated' | 'pending_verification'
export type KycStatus = 'not_started' | 'pending' | 'approved' | 'rejected' | 'escalated' | 'expired'

export interface VerificationState {
  email: boolean
  identity: boolean
  aviator: boolean
  kycStatus: KycStatus
}

export interface AvatarRef {
  url: string
}

/** Session principal returned by GET /auth/me — the frontend's source of truth. */
export interface AuthUser {
  id: Id
  firstName: string
  lastName: string
  displayName: string
  username: string
  email: string
  phone?: string | null
  role: UserRole
  /** Effective permissions resolved by the backend (role defaults + grants − revocations). */
  permissions: Permission[]
  /** Staff sub-role label for admin users, e.g. "Trust & safety". */
  staffRole?: string | null
  avatar?: AvatarRef | null
  verification: VerificationState
  status: AccountStatus
  countryCode: CountryCode
  currency: CurrencyCode
  locale: string
  twoFactorEnabled: boolean
  memberSince: IsoDateTime
  /** Counters used by navigation badges. */
  counters?: {
    unreadMessages: number
    unreadNotifications: number
    cartItems: number
    openOffers: number
    activeOrders: number
    activeListings: number
    openDisputes: number
  }
}

export interface PublicSeller {
  id: Id
  username: string
  displayName: string
  avatar?: AvatarRef | null
  verified: boolean
  isAviator: boolean
  isOfficialStore?: boolean
  isPhotographer?: boolean
  rating: number
  totalReviews: number
  totalSales?: number
  location?: string | null
  dispatchTime?: string | null
}

export interface AviatorCredentials {
  licenceType: 'ppl' | 'cpl' | 'atpl' | 'mpl' | 'amel' | 'cabin_crew' | 'atc' | 'other'
  licenceNumberMasked: string
  issuingAuthority: string
  jobTitle?: string | null
  organisation?: string | null
  typeRatings: string[]
  status: KycStatus
  verifiedAt?: IsoDateTime | null
}

export interface SellerProfile extends PublicSeller {
  bio?: string | null
  coverImage?: MediaAsset | null
  jobTitle?: string | null
  aircraftType?: string | null
  memberSince: IsoDateTime
  responseTime?: string | null
  responseRate?: number | null
  followers: number
  isFollowing?: boolean
  stats: {
    trades: number
    onTimeDispatchRate: number
    listingsCount: number
    soldCount: number
    reviewsCount: number
  }
  ratingBreakdown: Record<'1' | '2' | '3' | '4' | '5', number>
  /** Photographer storefront extras (VB19). */
  photographer?: {
    tagline: string
    printsSold: number
    collectionsCount: number
    licensing: { tier: 'personal' | 'editorial' | 'commercial'; label: string; description: string; price?: Money | null }[]
  } | null
}

export interface Address {
  id: Id
  label?: string | null
  fullName: string
  phone: string
  line1: string
  line2?: string | null
  city: string
  state: string
  postalCode?: string | null
  countryCode: CountryCode
  isDefault: boolean
}

export interface Session {
  id: Id
  device: string
  location: string
  lastActiveAt: IsoDateTime
  current: boolean
}

export interface SignInMethod {
  provider: 'password' | 'google' | 'apple' | 'facebook'
  connected: boolean
  detail?: string | null
}

export interface SecurityOverview {
  methods: SignInMethod[]
  twoFactor: { authenticatorEnabled: boolean; smsBackupMasked?: string | null; backupCodesRemaining: number }
  sessions: Session[]
  passwordChangedAt?: IsoDateTime | null
}

export interface NotificationPreference {
  category: 'offers_swaps' | 'orders' | 'messages' | 'price_drops' | 'newsletter'
  label: string
  email: boolean
  push: boolean
}

export interface FitKitProfile {
  id: Id
  name: string
  forPerson: string
  initials: string
  isDefault: boolean
  unit: 'us_in' | 'eu_cm'
  jacket?: string | null
  collar?: string | null
  sleeve?: string | null
  waist?: string | null
  inseam?: string | null
  shoe?: string | null
  bag?: 'compact' | 'standard' | 'crew' | null
  preferences: {
    filterSearchBySize: boolean
    warnOutsideMeasurements: boolean
    useAtCheckout: boolean
  }
  updatedAt: IsoDateTime
  ordersUsedOn: number
}

export interface UserReview {
  id: Id
  rating: number
  comment: string
  tags: string[]
  author: { displayName: string; initials: string; username?: string }
  createdAt: IsoDateTime
  orderId?: Id
  role: 'buyer' | 'seller'
}
