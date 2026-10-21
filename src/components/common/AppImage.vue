<script setup lang="ts">
import { computed, ref } from 'vue'
import { ImageOff } from '@lucide/vue'
import type { MediaAsset, MediaSource } from '@/types/media'

/**
 * Responsive image for Cloudinary-backed MediaAssets.
 *  - <picture> with AVIF → WebP → JPEG sources when the API provides `sources`
 *  - otherwise srcset from fixed-width `variants`
 *  - intrinsic width/height + aspect-ratio box prevent CLS
 *  - lazy by default; pass `priority` for LCP images (eager + fetchpriority=high)
 * Never loads the original upload for cards — `sizes` tells the browser which width fits.
 */
const props = withDefaults(
  defineProps<{
    media: MediaAsset | null | undefined
    sizes?: string
    /** CSS aspect-ratio for the frame, e.g. "4/3" or "1". Defaults to the image's own ratio. */
    ratio?: string
    fit?: 'cover' | 'contain'
    priority?: boolean
    alt?: string
    rounded?: boolean
    /** Fill the parent box (parent sets the size, e.g. masonry tiles) instead of reserving an aspect ratio. */
    fill?: boolean
  }>(),
  { sizes: '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw', fit: 'cover' },
)

const loaded = ref(false)
const failed = ref(false)

const byFormat = computed(() => {
  const groups: Record<string, MediaSource[]> = {}
  for (const s of props.media?.sources ?? []) (groups[s.format] ??= []).push(s)
  return groups
})

const srcset = (list: MediaSource[] | undefined) => list?.map((s) => `${s.url} ${s.width}w`).join(', ')

const fallbackSrcset = computed(() => {
  const m = props.media
  if (!m) return undefined
  if (byFormat.value.jpg?.length) return srcset(byFormat.value.jpg)
  const v = m.variants
  const w = m.width
  const set = [
    [v.small, Math.min(320, w)],
    [v.medium, Math.min(640, w)],
    [v.large, Math.min(1440, w)],
  ] as const
  return [...new Set(set.map(([url, width]) => `${url} ${width}w`))].join(', ')
})

const frameRatio = computed(() => props.ratio ?? (props.media ? `${props.media.width} / ${props.media.height}` : '4 / 3'))
</script>

<template>
  <div class="pw-img" :class="{ 'pw-img--rounded': rounded, 'pw-img--fill': fill, 'is-loaded': loaded }" :style="{ aspectRatio: fill ? undefined : frameRatio, backgroundColor: media?.placeholder ?? (fit === 'contain' ? '#fff' : 'var(--pw-surface-sunken)') }">
    <picture v-if="media && !failed">
      <source v-if="byFormat.avif" type="image/avif" :srcset="srcset(byFormat.avif)" :sizes="sizes" />
      <source v-if="byFormat.webp" type="image/webp" :srcset="srcset(byFormat.webp)" :sizes="sizes" />
      <img
        :src="media.variants.medium || media.secureUrl"
        :srcset="fallbackSrcset"
        :sizes="sizes"
        :alt="alt ?? media.alt"
        :width="media.width"
        :height="media.height"
        :loading="priority ? 'eager' : 'lazy'"
        :fetchpriority="priority ? 'high' : 'auto'"
        decoding="async"
        :style="{ objectFit: fit }"
        @load="loaded = true"
        @error="failed = true"
      />
    </picture>
    <div v-else class="pw-img__fallback" role="img" :aria-label="alt ?? media?.alt ?? 'Image unavailable'">
      <ImageOff :size="22" aria-hidden="true" />
    </div>
  </div>
</template>

<style scoped>
.pw-img {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.pw-img--fill {
  height: 100%;
}

.pw-img--rounded {
  border-radius: var(--pw-radius-lg);
}

.pw-img picture,
.pw-img img {
  display: block;
  width: 100%;
  height: 100%;
}

.pw-img img {
  opacity: 0;
  transition: opacity var(--pw-duration-slow) var(--pw-ease);
}

.pw-img.is-loaded img {
  opacity: 1;
}

.pw-img__fallback {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--pw-subtle);
}
</style>
