import type { Id } from './api'

export type MediaVariantName = 'thumbnail' | 'small' | 'medium' | 'large' | 'original'

/** A responsive rendition the backend generated (Cloudinary transformation URL). */
export interface MediaSource {
  url: string
  width: number
  format: 'avif' | 'webp' | 'jpg' | 'png'
}

/**
 * Media contract. Laravel owns upload + Cloudinary. The frontend never sees
 * Cloudinary credentials; it only renders the URLs below.
 */
export interface MediaAsset {
  id: Id
  publicId: string
  url: string
  secureUrl: string
  width: number
  height: number
  format: string
  bytes: number
  alt: string
  /** Named fixed-width renditions (thumbnail 160, small 320, medium 640, large 1440, original). */
  variants: Record<MediaVariantName, string>
  /**
   * Optional explicit srcset sources per format. When present the frontend builds a
   * <picture> with AVIF → WebP → JPEG fallback. When absent it uses `variants`.
   */
  sources?: MediaSource[]
  /** Dominant colour placeholder (#rrggbb) to avoid flashes before load. */
  placeholder?: string
}

export type MediaPurpose = 'listing' | 'avatar' | 'cover' | 'kyc' | 'dispute_evidence' | 'message' | 'content'
