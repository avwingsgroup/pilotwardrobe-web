<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, Expand, X, ZoomIn, ZoomOut } from '@lucide/vue'
import type { MediaAsset } from '@/types/media'
import type { ListingBadge } from '@/types/product'
import AppImage from '@/components/common/AppImage.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import { useFocusTrap } from '@/composables/useFocusTrap'

/**
 * Product gallery (V3): high-res main image, thumbnails, swipe, keyboard arrows,
 * image counter, click-to-zoom and a fullscreen lightbox with focus trap.
 * Main image uses `large` renditions via srcset; only the lightbox requests
 * the largest available width.
 */
const props = defineProps<{ images: MediaAsset[]; title: string; badges?: ListingBadge[] }>()

const index = ref(0)
const lightbox = ref(false)
const zoom = ref(false)
const lbPanel = ref<HTMLElement | null>(null)
const current = computed(() => props.images[index.value] ?? null)
const count = computed(() => props.images.length)

watch(
  () => props.images,
  () => (index.value = 0),
)

function go(delta: number) {
  if (!count.value) return
  index.value = (index.value + delta + count.value) % count.value
  zoom.value = false
}

let touchX = 0
function onTouchStart(e: TouchEvent) {
  touchX = e.touches[0]?.clientX ?? 0
}
function onTouchEnd(e: TouchEvent) {
  const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX
  if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowRight') go(1)
  else if (e.key === 'ArrowLeft') go(-1)
}

useFocusTrap(lbPanel, lightbox, () => (lightbox.value = false))
</script>

<template>
  <section class="pw-gallery" aria-roledescription="carousel" :aria-label="`${title} photos`">
    <div class="pw-gallery__stage" tabindex="0" :aria-label="`Image ${index + 1} of ${count}. Use arrow keys to browse.`" @keydown="onKey" @touchstart.passive="onTouchStart" @touchend="onTouchEnd">
      <div class="pw-gallery__badges">
        <AppBadge v-for="b in badges" :key="b.kind" :tone="b.kind === 'official_store' ? 'navy' : 'gold'" solid size="sm">{{ b.label }}</AppBadge>
      </div>
      <button type="button" class="pw-gallery__main" :aria-label="`Open fullscreen view of image ${index + 1}`" @click="lightbox = true">
        <AppImage :media="current" ratio="4 / 3" fit="contain" priority sizes="(min-width: 1024px) 640px, 100vw" />
      </button>
      <template v-if="count > 1">
        <button type="button" class="pw-gallery__nav pw-gallery__nav--prev" aria-label="Previous image" @click="go(-1)"><ChevronLeft :size="20" /></button>
        <button type="button" class="pw-gallery__nav pw-gallery__nav--next" aria-label="Next image" @click="go(1)"><ChevronRight :size="20" /></button>
      </template>
      <span class="pw-gallery__counter" aria-hidden="true">{{ index + 1 }} / {{ count }}</span>
      <button type="button" class="pw-gallery__expand" aria-label="Open fullscreen" @click="lightbox = true"><Expand :size="16" /></button>
    </div>

    <ul v-if="count > 1" class="pw-gallery__thumbs" role="list">
      <li v-for="(img, i) in images" :key="img.id">
        <button type="button" class="pw-gallery__thumb" :class="{ 'is-active': i === index }" :aria-label="`Show image ${i + 1}: ${img.alt}`" :aria-current="i === index" @click="index = i">
          <AppImage :media="img" ratio="1" fit="contain" sizes="100px" />
        </button>
      </li>
    </ul>

    <Teleport to="body">
      <div v-if="lightbox" ref="lbPanel" class="pw-lightbox" role="dialog" aria-modal="true" :aria-label="`${title} — fullscreen gallery`" tabindex="-1" @keydown="onKey">
        <div class="pw-lightbox__bar">
          <span>{{ index + 1 }} / {{ count }}</span>
          <div class="pw-lightbox__tools">
            <button type="button" :aria-label="zoom ? 'Zoom out' : 'Zoom in'" @click="zoom = !zoom">
              <ZoomOut v-if="zoom" :size="20" />
              <ZoomIn v-else :size="20" />
            </button>
            <button type="button" aria-label="Close fullscreen" data-autofocus @click="lightbox = false"><X :size="22" /></button>
          </div>
        </div>
        <div class="pw-lightbox__stage" :class="{ 'is-zoomed': zoom }" @touchstart.passive="onTouchStart" @touchend="onTouchEnd" @dblclick="zoom = !zoom">
          <AppImage :media="current" fit="contain" sizes="100vw" class="pw-lightbox__img" />
        </div>
        <template v-if="count > 1">
          <button type="button" class="pw-lightbox__nav pw-lightbox__nav--prev" aria-label="Previous image" @click="go(-1)"><ChevronLeft :size="28" /></button>
          <button type="button" class="pw-lightbox__nav pw-lightbox__nav--next" aria-label="Next image" @click="go(1)"><ChevronRight :size="28" /></button>
        </template>
        <p class="sr-only" aria-live="polite">{{ current?.alt }}</p>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.pw-gallery__stage {
  position: relative;
  overflow: hidden;
  border-radius: var(--pw-radius-lg);
  background: var(--pw-surface-sunken);
}

.pw-gallery__main {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  cursor: zoom-in;
}

.pw-gallery__badges {
  position: absolute;
  top: var(--pw-space-4);
  left: var(--pw-space-4);
  z-index: 1;
  display: flex;
  gap: var(--pw-space-2);
}

.pw-gallery__nav,
.pw-gallery__expand {
  position: absolute;
  z-index: 1;
  display: grid;
  place-items: center;
  width: var(--pw-touch);
  height: var(--pw-touch);
  border: 1px solid var(--pw-border);
  border-radius: 50%;
  background: rgb(255 255 255 / 92%);
  color: var(--pw-ink);
  box-shadow: var(--pw-shadow-sm);
}

.pw-gallery__nav {
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity var(--pw-duration) var(--pw-ease);
}

.pw-gallery__stage:hover .pw-gallery__nav,
.pw-gallery__nav:focus-visible {
  opacity: 1;
}

.pw-gallery__nav--prev {
  left: var(--pw-space-3);
}
.pw-gallery__nav--next {
  right: var(--pw-space-3);
}

.pw-gallery__expand {
  right: var(--pw-space-3);
  bottom: var(--pw-space-3);
  width: 36px;
  height: 36px;
}

.pw-gallery__counter {
  position: absolute;
  left: var(--pw-space-3);
  bottom: var(--pw-space-3);
  padding: 3px 8px;
  border-radius: var(--pw-radius-full);
  background: rgb(16 26 45 / 70%);
  color: #fff;
  font-size: var(--pw-text-xs);
  font-variant-numeric: tabular-nums;
}

.pw-gallery__thumbs {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: var(--pw-space-3);
  margin-top: var(--pw-space-4);
}

.pw-gallery__thumb {
  display: block;
  width: 100%;
  padding: 4px;
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-surface);
  overflow: hidden;
}

.pw-gallery__thumb.is-active {
  border: 2px solid var(--pw-navy-700);
  padding: 3px;
}

@media (hover: none) {
  .pw-gallery__nav {
    opacity: 1;
  }
}

.pw-lightbox {
  position: fixed;
  inset: 0;
  z-index: var(--pw-z-modal);
  display: flex;
  flex-direction: column;
  background: rgb(10 18 33 / 96%);
  color: #fff;
  outline: none;
}

.pw-lightbox__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--pw-space-3) var(--pw-space-4);
  font-variant-numeric: tabular-nums;
}

.pw-lightbox__tools {
  display: flex;
  gap: var(--pw-space-2);
}

.pw-lightbox__tools button,
.pw-lightbox__nav {
  display: grid;
  place-items: center;
  width: var(--pw-touch);
  height: var(--pw-touch);
  border: 0;
  border-radius: 50%;
  background: rgb(255 255 255 / 10%);
  color: #fff;
}

.pw-lightbox__stage {
  flex: 1;
  display: grid;
  place-items: center;
  min-height: 0;
  padding: var(--pw-space-4);
  overflow: auto;
  cursor: zoom-in;
}

.pw-lightbox__img {
  max-width: min(1400px, 100%);
  max-height: 100%;
  background: transparent !important;
}

.pw-lightbox__stage.is-zoomed {
  cursor: zoom-out;
  place-items: start center;
}

.pw-lightbox__stage.is-zoomed .pw-lightbox__img {
  max-width: none;
  width: 200%;
}

.pw-lightbox__nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}

.pw-lightbox__nav--prev {
  left: var(--pw-space-4);
}
.pw-lightbox__nav--next {
  right: var(--pw-space-4);
}
</style>
