import type { MediaAsset, MediaSource } from '@/types/media'
import manifest from './media.manifest.json'

type ManifestEntry = { width: number; height: number; widths: number[]; alt: string; kind: string; edge?: string }
const entries = manifest as Record<string, ManifestEntry>

export type MockMediaSlug = keyof typeof manifest

const base = `${import.meta.env.BASE_URL ?? '/'}media/mock`.replace(/\/{2,}/g, '/')
const url = (slug: string, width: number, ext: string) => `${base}/${slug}-${width}.${ext}`

const PLACEHOLDERS: Record<string, string> = {
  hero: '#2b3442',
  photo: '#7d8796',
  product: '#eef0f4',
}

/**
 * Build a MediaAsset exactly as Laravel's MediaResource would return it after a
 * Cloudinary upload (variants are fixed-width renditions; `sources` lists every
 * width × format so the client can build a <picture> with AVIF/WebP/JPEG).
 */
export function mockMedia(slug: MockMediaSlug, alt?: string): MediaAsset {
  const entry = entries[slug]
  if (!entry) throw new Error(`Unknown mock media: ${slug}`)
  const widths = entry.widths
  const pick = (target: number) => widths.find((w) => w >= target) ?? widths[widths.length - 1]!
  const largest = widths[widths.length - 1]!
  const sources: MediaSource[] = []
  for (const format of ['avif', 'webp', 'jpg'] as const) {
    for (const w of widths) sources.push({ url: url(slug, w, format), width: w, format })
  }
  return {
    id: `med_${slug}`,
    publicId: `pilotwardrobe/${entry.kind === 'photo' ? 'photography' : 'listings'}/${slug}`,
    url: url(slug, largest, 'jpg'),
    secureUrl: url(slug, largest, 'jpg'),
    width: entry.width,
    height: entry.height,
    format: 'jpg',
    bytes: Math.round(entry.width * entry.height * 0.18),
    alt: alt ?? entry.alt,
    variants: {
      thumbnail: url(slug, pick(160), 'webp'),
      small: url(slug, pick(320), 'webp'),
      medium: url(slug, pick(640), 'webp'),
      large: url(slug, pick(1440), 'webp'),
      original: url(slug, largest, 'jpg'),
    },
    sources,
    // Product cut-outs: the photo's own backdrop, so letterboxed frames blend in.
    placeholder: (entry.kind === 'product' ? entry.edge : undefined) ?? PLACEHOLDERS[entry.kind] ?? PLACEHOLDERS.product,
  }
}
