/**
 * Display names for category slugs used in breadcrumbs/titles before the
 * category tree has loaded. The API remains the source of truth (GET /categories).
 */
const NAMES: Record<string, string> = {
  pilotwardrobe: 'Pilotwardrobe',
  headsets: 'Headsets',
  'anr-headsets': 'ANR headsets',
  'passive-headsets': 'Passive headsets',
  'in-ear-headsets': 'In-ear headsets',
  'headset-accessories': 'Headset accessories',
  watches: 'Watches & wearables',
  'flight-bags': 'Flight bags',
  'books-manuals': 'Books & manuals',
  uniforms: 'Uniform & apparel',
  avionics: 'Avionics & GPS',
  eyewear: 'Eyewear',
  'pilot-tools': 'Pilot tools & kneeboards',
  'safety-equipment': 'Safety & oxygen',
  'cameras-drones': 'Cameras & drones',
  photography: 'Photography prints',
}

export function flatCategoryName(slug: string): string {
  return NAMES[slug] ?? slug.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
}
