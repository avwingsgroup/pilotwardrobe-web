import type { Category, Listing, ListingBadge, ProductCondition, ShippingOption, SizeInfo, BoostPackage } from '@/types/product'
import type { PublicSeller } from '@/types/user'
import type { CurrencyCode } from '@/types/api'
import { mockMedia, type MockMediaSlug } from './media'
import { sellers } from './users.mock'
import { hoursAgo } from './time'

const usd = (amount: number) => ({ amount, currency: 'USD' as CurrencyCode })

export const categories: Category[] = [
  { id: 'cat_official', slug: 'pilotwardrobe', name: 'Pilotwardrobe', listingsCount: 1532, image: mockMedia('uniform-shirt'), sized: true },
  {
    id: 'cat_headsets',
    slug: 'headsets',
    name: 'Headsets & audio',
    listingsCount: 2140,
    image: mockMedia('bose-a20'),
    children: [
      { id: 'cat_anr', slug: 'anr-headsets', name: 'ANR headsets', parentId: 'cat_headsets', listingsCount: 612 },
      { id: 'cat_passive', slug: 'passive-headsets', name: 'Passive headsets', parentId: 'cat_headsets', listingsCount: 340 },
      { id: 'cat_inear', slug: 'in-ear-headsets', name: 'In-ear headsets', parentId: 'cat_headsets', listingsCount: 188 },
      { id: 'cat_audio_acc', slug: 'headset-accessories', name: 'Accessories', parentId: 'cat_headsets', listingsCount: 1000 },
    ],
  },
  { id: 'cat_watches', slug: 'watches', name: 'Watches & wearables', listingsCount: 488, image: mockMedia('altimeter-smartwatch') },
  { id: 'cat_bags', slug: 'flight-bags', name: 'Flight bags', listingsCount: 1006, image: mockMedia('jeppesen-flight-bag'), sized: true },
  { id: 'cat_books', slug: 'books-manuals', name: 'Books & manuals', listingsCount: 963, image: mockMedia('tablet-kneeboard') },
  { id: 'cat_uniforms', slug: 'uniforms', name: 'Uniform & apparel', listingsCount: 3920, image: mockMedia('captain-jacket'), sized: true },
  { id: 'cat_avionics', slug: 'avionics', name: 'Avionics & GPS', listingsCount: 1862, image: mockMedia('garmin-handheld-gps') },
  { id: 'cat_eyewear', slug: 'eyewear', name: 'Eyewear', listingsCount: 980, image: mockMedia('randolph-aviator') },
  { id: 'cat_tools', slug: 'pilot-tools', name: 'Pilot tools & kneeboards', listingsCount: 760, image: mockMedia('e6b-flight-computer') },
  { id: 'cat_safety', slug: 'safety-equipment', name: 'Safety & oxygen', listingsCount: 240, image: mockMedia('portable-oxygen') },
  { id: 'cat_cameras', slug: 'cameras-drones', name: 'Cameras & drones', listingsCount: 410, image: mockMedia('canon-eos-90d') },
  { id: 'cat_photography', slug: 'photography', name: 'Photography prints', listingsCount: 1406, image: mockMedia('photo-gate-sunset') },
]

export const flatCategories = (): Category[] => categories.flatMap((c) => [c, ...(c.children ?? [])])

const cat = (slug: string) => {
  const c = flatCategories().find((x) => x.slug === slug)!
  return { id: c.id, slug: c.slug, name: c.name }
}

const standardShipping: ShippingOption[] = [
  { id: 'shp_std', method: 'standard', label: 'Standard cargo', description: '5–10 business days · tracked', price: usd(2400), estimatedDays: { min: 5, max: 10 } },
  { id: 'shp_exp', method: 'express', label: 'Express airlift', description: '2–3 business days · tracked & signed', price: usd(6200), estimatedDays: { min: 2, max: 3 } },
  { id: 'shp_hand', method: 'airfield_handoff', label: 'Crew hand-off', description: 'Collect at Lagos crew lounge', price: usd(0), estimatedDays: null },
]

const shirtSizes: SizeInfo = {
  available: ['XS', 'S', 'M', 'L'],
  unavailable: ['XL'],
  chart: {
    columns: ['Chest', 'Shoulder', 'Length', 'Sleeve', 'US alpha'],
    rows: [
      { size: 'XS', measurements: { Chest: '84', Shoulder: '37', Length: '64', Sleeve: '19.5', 'US alpha': 'XS' } },
      { size: 'S', measurements: { Chest: '88', Shoulder: '38.5', Length: '66', Sleeve: '20', 'US alpha': 'S' } },
      { size: 'M', measurements: { Chest: '92', Shoulder: '40', Length: '68', Sleeve: '20.5', 'US alpha': 'M' } },
      { size: 'L', measurements: { Chest: '96', Shoulder: '41.5', Length: '70', Sleeve: '21', 'US alpha': 'L' } },
      { size: 'XL', measurements: { Chest: '100', Shoulder: '43', Length: '72', Sleeve: '21.5', 'US alpha': 'XL' } },
    ],
    note: 'Measurements in cm · tolerance ±1.5 cm · Tall +5 cm length · Slim −2.5 cm chest',
  },
  fitMatch: { size: 'M', profileName: 'Uniform fit', summary: 'Collar 15.5″ · sleeve 34–35 · from your saved profile' },
}

interface Seed {
  id: string
  slug: string
  title: string
  category: string
  images: MockMediaSlug[]
  price: number
  compareAt?: number
  condition: ProductCondition
  seller: PublicSeller
  badges?: ListingBadge['kind'][]
  rating?: number
  sold?: number
  swappable?: boolean
  negotiable?: boolean
  promoted?: boolean
  brand?: string
  model?: string
  description?: string
  sizes?: SizeInfo
  format?: Listing['format']
  status?: Listing['status']
  views?: number
  favorites?: number
  offers?: number
  ageHours?: number
  aircraft?: string[]
}

const BADGE_LABEL: Record<ListingBadge['kind'], string> = {
  best_seller: 'Best seller',
  fits_you: 'Fits you · M',
  swap_ok: 'Swap OK',
  free_delivery: 'Free delivery',
  official_store: 'Official store',
  promoted: 'Promoted',
  digital: 'Digital',
  new: 'New',
}

function build(s: Seed): Listing {
  return {
    id: s.id,
    slug: s.slug,
    title: s.title,
    description:
      s.description ??
      `${s.title}. Well looked after and stored in a padded case between flights. Photos show the actual item. Happy to answer questions before you buy — all payments held in escrow until it lands.`,
    category: cat(s.category),
    breadcrumbs: [cat(s.category)],
    condition: s.condition,
    format: s.format ?? 'physical',
    price: usd(s.price),
    compareAtPrice: s.compareAt ? usd(s.compareAt) : null,
    minimumOffer: s.negotiable === false ? null : usd(Math.round(s.price * 0.8)),
    seller: s.seller,
    images: s.images.map((slug) => mockMedia(slug)),
    location: { countryCode: 'NG', state: 'Lagos', city: 'Ikeja', airportCode: 'LOS' },
    shipping: s.format === 'digital' ? [] : standardShipping,
    freightSummary: s.format === 'digital' ? 'Instant download after payment' : '+$24 tracked freight',
    negotiable: s.negotiable ?? true,
    swappable: s.swappable ?? false,
    status: s.status ?? 'active',
    promoted: s.promoted ?? false,
    badges: (s.badges ?? []).map((kind) => ({ kind, label: BADGE_LABEL[kind] })),
    brand: s.brand ?? null,
    model: s.model ?? null,
    attributes: [
      ...(s.brand ? [{ label: 'Brand', value: s.brand }] : []),
      ...(s.model ? [{ label: 'Model', value: s.model }] : []),
      { label: 'Category', value: cat(s.category).name },
    ],
    aircraftTypes: s.aircraft ?? [],
    tags: [],
    sizes: s.sizes ?? null,
    rating: s.rating ?? 4.8,
    soldCount: s.sold ?? 0,
    viewsCount: s.views ?? 412,
    favoritesCount: s.favorites ?? 38,
    offersCount: s.offers ?? 0,
    isFavorited: false,
    createdAt: hoursAgo(s.ageHours ?? 48),
    updatedAt: hoursAgo(s.ageHours ?? 48),
  }
}

const S = sellers

export const listings: Listing[] = [
  build({ id: 'lst_001', slug: 'bose-a20-aviation-headset-dual-ga', title: 'Bose A20 Aviation Headset — dual GA plugs', category: 'anr-headsets', images: ['bose-a20', 'david-clark-onex', 'lightspeed-zulu-3'], price: 74500, compareAt: 91000, condition: 'like_new', seller: S.nehemiah!, badges: ['best_seller'], rating: 4.9, sold: 214, swappable: true, brand: 'Bose', model: 'A20', promoted: true, views: 412, favorites: 38, offers: 5, ageHours: 6, aircraft: ['B737', 'A320', 'C172'], description: 'Used for 140 hrs on a Cessna 172 and Seminole. ANR works on both sides, new ear seals fitted May 2025. Comes with original case and Bluetooth cable.' }),
  build({ id: 'lst_002', slug: 'randolph-aviator-cr-55mm', title: 'Randolph Aviator CR — 55mm, bayonet temples', category: 'eyewear', images: ['randolph-aviator'], price: 21000, compareAt: 24900, condition: 'like_new', seller: S.nehemiah!, rating: 4.8, sold: 96, brand: 'Randolph', model: 'Aviator CR', ageHours: 20 }),
  build({ id: 'lst_003', slug: 'pilotwardrobe-aviator-uniform-shirt', title: 'Pilotwardrobe Aviator Uniform Shirt — epaulette loops, wrinkle-free', category: 'uniforms', images: ['uniform-shirt', 'pilot-chronograph', 'jeppesen-flight-bag', 'tri-fold-kneeboard', 'randolph-aviator'], price: 14500, condition: 'new', seller: S.official!, badges: ['fits_you', 'official_store', 'swap_ok'], rating: 4.9, sold: 1200, swappable: true, negotiable: true, sizes: shirtSizes, brand: 'Pilotwardrobe', ageHours: 30 }),
  build({ id: 'lst_004', slug: 'david-clark-one-x-enc-headset', title: 'David Clark ONE-X ENC headset, carry case', category: 'anr-headsets', images: ['david-clark-onex', 'david-clark-h10'], price: 69000, compareAt: 78000, condition: 'very_good', seller: S.james!, badges: ['swap_ok'], rating: 4.7, sold: 143, swappable: true, brand: 'David Clark', model: 'ONE-X', ageHours: 52, offers: 3 }),
  build({ id: 'lst_005', slug: 'bose-a30-bluetooth-low-clamp', title: 'Bose A30, Bluetooth, low clamp force', category: 'anr-headsets', images: ['bose-a20', 'lightspeed-zulu-3'], price: 105000, compareAt: 119500, condition: 'like_new', seller: S.kunle!, badges: ['swap_ok'], rating: 4.9, sold: 88, swappable: true, brand: 'Bose', model: 'A30', ageHours: 70 }),
  build({ id: 'lst_006', slug: 'david-clark-h10-13-4-passive', title: 'David Clark H10-13.4 passive, new gel seals', category: 'passive-headsets', images: ['david-clark-h10'], price: 29500, compareAt: 34000, condition: 'very_good', seller: S.bello!, rating: 4.8, sold: 311, brand: 'David Clark', model: 'H10-13.4', ageHours: 90 }),
  build({ id: 'lst_007', slug: 'lightspeed-zulu-3-carry-case', title: 'Lightspeed Zulu 3 with carry case', category: 'anr-headsets', images: ['lightspeed-zulu-3', 'bose-a20'], price: 78000, condition: 'good', seller: S.richard!, badges: ['free_delivery'], rating: 4.9, sold: 127, brand: 'Lightspeed', model: 'Zulu 3', ageHours: 100 }),
  build({ id: 'lst_008', slug: 'garmin-gdl-52-ads-b-receiver', title: 'Garmin GDL 52 ADS-B receiver', category: 'avionics', images: ['garmin-handheld-gps', 'com-radio'], price: 62000, compareAt: 69900, condition: 'like_new', seller: S.bello!, rating: 4.7, sold: 64, brand: 'Garmin', model: 'GDL 52', ageHours: 120 }),
  build({ id: 'lst_009', slug: 'captains-uniform-jacket-4-bar', title: "Captain's uniform jacket — 4-bar, double-breasted", category: 'uniforms', images: ['captain-jacket'], price: 32000, condition: 'like_new', seller: S.official!, badges: ['official_store'], rating: 4.9, sold: 302, sizes: { ...shirtSizes, fitMatch: null }, brand: 'Pilotwardrobe', ageHours: 140 }),
  build({ id: 'lst_010', slug: 'jeppesen-captain-flight-bag-leather', title: 'Jeppesen Captain Flight Bag, leather trim', category: 'flight-bags', images: ['jeppesen-flight-bag', 'pilot-flight-bag'], price: 18000, condition: 'good', seller: S.nehemiah!, rating: 4.8, sold: 41, brand: 'Jeppesen', model: 'Captain', ageHours: 150, swappable: true }),
  build({ id: 'lst_011', slug: 'altimeter-smartwatch-sapphire', title: 'Altimeter smartwatch, sapphire', category: 'watches', images: ['altimeter-smartwatch'], price: 41000, condition: 'good', seller: S.richard!, rating: 4.6, sold: 18, ageHours: 160 }),
  build({ id: 'lst_012', slug: 'pilot-chronograph-blue-dial', title: 'Pilot chronograph, blue dial, steel bracelet', category: 'watches', images: ['pilot-chronograph'], price: 38500, condition: 'very_good', seller: S.james!, rating: 4.8, sold: 12, ageHours: 170 }),
  build({ id: 'lst_013', slug: 'tri-fold-aviation-kneeboard', title: 'Aviation kneeboard, tri-fold', category: 'pilot-tools', images: ['tri-fold-kneeboard'], price: 6200, condition: 'good', seller: S.nehemiah!, rating: 4.7, sold: 55, ageHours: 180 }),
  build({ id: 'lst_014', slug: 'ipad-mini-kneeboard-folio', title: 'Kneeboard, iPad mini folio', category: 'pilot-tools', images: ['tablet-kneeboard'], price: 4200, condition: 'good', seller: S.nehemiah!, rating: 4.7, sold: 21, ageHours: 190 }),
  build({ id: 'lst_015', slug: 'e6b-flight-computer', title: 'E6B flight computer', category: 'pilot-tools', images: ['e6b-flight-computer'], price: 6000, condition: 'good', seller: S.nehemiah!, rating: 4.9, sold: 1, ageHours: 400, status: 'sold' }),
  build({ id: 'lst_016', slug: 'garmin-handheld-aviation-gps', title: 'Garmin aera 760 handheld GPS', category: 'avionics', images: ['garmin-handheld-gps'], price: 99900, condition: 'like_new', seller: S.richard!, rating: 4.8, sold: 9, ageHours: 210, brand: 'Garmin', model: 'aera 760' }),
  build({ id: 'lst_017', slug: 'panel-mount-com-radio', title: 'Panel-mount COM radio with handheld mic', category: 'avionics', images: ['com-radio'], price: 85000, condition: 'very_good', seller: S.bello!, rating: 4.6, sold: 4, ageHours: 220 }),
  build({ id: 'lst_018', slug: 'portable-aviation-oxygen-kit', title: 'Portable aviation oxygen kit with cannula & mask', category: 'safety-equipment', images: ['portable-oxygen'], price: 54000, condition: 'like_new', seller: S.james!, rating: 4.9, sold: 7, ageHours: 230 }),
  build({ id: 'lst_019', slug: 'fuel-sampler-tester', title: 'Fuel sampler tester, GATS jar', category: 'pilot-tools', images: ['fuel-tester'], price: 2500, condition: 'new', seller: S.official!, badges: ['official_store'], rating: 4.8, sold: 140, ageHours: 240, negotiable: false }),
  build({ id: 'lst_020', slug: 'pilot-flight-bag-wings', title: 'Pilot flight bag with wings emblem', category: 'flight-bags', images: ['pilot-flight-bag'], price: 12900, condition: 'new', seller: S.official!, badges: ['official_store', 'free_delivery'], rating: 4.9, sold: 330, ageHours: 250, negotiable: false }),
  build({ id: 'lst_021', slug: 'gopro-hero-7-cockpit-mount', title: 'Action camera with cockpit suction mount', category: 'cameras-drones', images: ['action-camera'], price: 18500, condition: 'very_good', seller: S.kunle!, rating: 4.6, sold: 3, ageHours: 260 }),
  build({ id: 'lst_022', slug: 'canon-eos-90d-18-135', title: 'Canon EOS 90D with 18–135mm lens', category: 'cameras-drones', images: ['canon-eos-90d'], price: 92000, condition: 'like_new', seller: S.tunde!, rating: 4.9, sold: 2, ageHours: 270 }),
  build({ id: 'lst_023', slug: 'compact-folding-drone', title: 'Compact folding drone with controller', category: 'cameras-drones', images: ['compact-drone'], price: 47500, condition: 'good', seller: S.kunle!, rating: 4.5, sold: 5, ageHours: 280 }),
  build({ id: 'lst_024', slug: 'digital-multimeter-avionics', title: 'Digital multimeter for avionics work', category: 'pilot-tools', images: ['digital-multimeter'], price: 9800, condition: 'good', seller: S.bello!, rating: 4.7, sold: 11, ageHours: 290 }),
  build({ id: 'lst_025', slug: '20000mah-power-bank-4-port', title: '20,000 mAh power bank, 4-port (flight-deck safe)', category: 'pilot-tools', images: ['power-bank-black', 'power-bank-desk'], price: 4500, condition: 'new', seller: S.official!, badges: ['official_store'], rating: 4.8, sold: 220, ageHours: 300, negotiable: false }),
  build({ id: 'lst_026', slug: 'leg-strap-kneeboard', title: 'Leg-strap kneeboard, elastic', category: 'pilot-tools', images: ['leg-kneeboard'], price: 3500, condition: 'good', seller: S.nehemiah!, rating: 4.6, sold: 9, ageHours: 310 }),
  // Photography prints & digital products (VB19)
  build({ id: 'lst_101', slug: 'print-warbird-formation-bw', title: 'Warbird Formation, B&W', category: 'photography', images: ['photo-warbird-formation'], price: 2400, condition: 'new', seller: S.tunde!, badges: ['best_seller', 'digital'], rating: 5, sold: 61, format: 'print', negotiable: false, ageHours: 400 }),
  build({ id: 'lst_102', slug: 'print-formation-pair-dusk', title: 'Formation Pair, Dusk', category: 'photography', images: ['photo-formation-pair'], price: 1800, condition: 'new', seller: S.tunde!, badges: ['digital'], rating: 4.9, sold: 34, format: 'print', negotiable: false, ageHours: 410 }),
  build({ id: 'lst_103', slug: 'print-gate-sunset-lagos', title: 'Gate Sunset, Lagos', category: 'photography', images: ['photo-gate-sunset'], price: 1800, condition: 'new', seller: S.tunde!, badges: ['digital'], rating: 4.9, sold: 52, format: 'print', negotiable: false, ageHours: 420 }),
  build({ id: 'lst_104', slug: 'print-santorini-rollout', title: 'Santorini Rollout', category: 'photography', images: ['photo-santorini-rollout'], price: 1800, condition: 'new', seller: S.tunde!, badges: ['digital'], rating: 4.8, sold: 29, format: 'print', negotiable: false, ageHours: 430 }),
  build({ id: 'lst_105', slug: 'digital-wing-view-snowfields', title: 'Wing View over Snowfields — digital licence', category: 'photography', images: ['photo-wing-view'], price: 1500, condition: 'new', seller: S.tunde!, badges: ['digital'], rating: 4.8, sold: 17, format: 'digital', negotiable: false, ageHours: 440 }),
]

/** Owner-side listings for the signed-in demo seller (VB4). */
export const myListingExtras: Listing[] = [
  { ...build({ id: 'lst_201', slug: 'a320-fcom-binder-set', title: 'A320 FCOM binder set', category: 'books-manuals', images: ['tablet-kneeboard'], price: 15000, condition: 'good', seller: S.nehemiah!, views: 88, favorites: 4, ageHours: 24 * 80 }), status: 'paused' },
  { ...build({ id: 'lst_202', slug: 'randolph-aviator-cr-55mm-draft', title: 'Randolph Aviator CR — 55mm', category: 'eyewear', images: ['randolph-aviator'], price: 21000, condition: 'like_new', seller: S.nehemiah!, views: 0, favorites: 0 }), status: 'draft' },
  { ...build({ id: 'lst_203', slug: 'altimeter-smartwatch-nehemiah', title: 'Altimeter smartwatch', category: 'watches', images: ['altimeter-smartwatch'], price: 21000, condition: 'good', seller: S.nehemiah!, views: 0, favorites: 0 }), status: 'needs_changes', moderation: { reason: 'Removed by moderator', note: 'missing serial' } },
]

export const boostPackages: BoostPackage[] = [
  { code: 'none', label: 'No boost', description: 'Standard placement', durationDays: 0, price: usd(0) },
  { code: 'runway', label: 'Runway · 3 days', description: 'Top of category', durationDays: 3, price: usd(499) },
  { code: 'jetstream', label: 'Jetstream · 7 days', description: 'Top of search + home feed', durationDays: 7, price: usd(999) },
]
