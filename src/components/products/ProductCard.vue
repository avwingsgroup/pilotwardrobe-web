<script setup lang="ts">
import { computed } from 'vue'
import { Download, Ruler, ShieldCheck, Truck, BadgeCheck } from '@lucide/vue'
import type { Listing } from '@/types/product'
import AppImage from '@/components/common/AppImage.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import RatingStars from '@/components/common/RatingStars.vue'
import ProductPrice from './ProductPrice.vue'
import FavoriteButton from '@/components/marketplace/FavoriteButton.vue'
import { CONDITION_LABELS } from '@/constants/labels'

/**
 * Listing card. `full` (V1/V2): badge, discount pill, rating · sold, escrow footer.
 * `compact` (VB18): title + price + condition chip.
 * Handles promoted, sold, swapped, unavailable, favourite, verified-seller and
 * digital/print states. Image frame has a fixed aspect ratio → zero CLS.
 */
const props = withDefaults(defineProps<{ listing: Listing; variant?: 'full' | 'compact'; priority?: boolean; sizes?: string; showCondition?: boolean }>(), {
  variant: 'full',
  sizes: '(min-width: 1280px) 300px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw',
})

const unavailable = computed(() => ['sold', 'swapped', 'reserved', 'paused', 'archived'].includes(props.listing.status))
const statusLabel = computed(() => ({ sold: 'Sold', swapped: 'Swapped', reserved: 'Reserved', paused: 'Unavailable', archived: 'Unavailable' })[props.listing.status as 'sold'])
const discount = computed(() => {
  const c = props.listing.compareAtPrice
  if (!c || c.amount <= props.listing.price.amount) return null
  return Math.round(((c.amount - props.listing.price.amount) / c.amount) * 100)
})
const badge = computed(() => props.listing.badges.find((b) => b.kind !== 'official_store' && b.kind !== 'digital') ?? (props.listing.promoted ? { kind: 'promoted' as const, label: 'Promoted' } : null))
const badgeTone = computed(() => {
  const kind = badge.value?.kind
  if (kind === 'best_seller' || kind === 'promoted') return 'gold'
  if (kind === 'free_delivery' || kind === 'fits_you') return 'success'
  return 'info'
})
const isDigital = computed(() => props.listing.format !== 'physical')
const footer = computed(() => {
  if (isDigital.value) return { icon: Download, text: props.listing.format === 'print' ? 'Print + digital' : 'Instant download', tone: 'navy' }
  if (props.listing.badges.some((b) => b.kind === 'fits_you')) return { icon: Ruler, text: 'Fits your saved size · M', tone: 'green' }
  if (props.listing.badges.some((b) => b.kind === 'free_delivery')) return { icon: Truck, text: 'Free delivery', tone: 'green' }
  return { icon: ShieldCheck, text: 'Escrow protected', tone: 'green' }
})
const to = computed(() => ({ name: 'listing', params: { slug: props.listing.slug } }))

/**
 * Fill the frame when the photo's shape is close to it (lifestyle shots); otherwise
 * show the whole product (square/portrait cut-outs) instead of cropping it.
 */
const frameRatio = computed(() => (props.variant === 'compact' ? 1 : 16 / 10.5))
const imageFit = computed<'cover' | 'contain'>(() => {
  const img = props.listing.images[0]
  if (!img?.width || !img.height) return 'cover'
  return Math.abs(Math.log(img.width / img.height / frameRatio.value)) < 0.3 ? 'cover' : 'contain'
})
</script>

<template>
  <article class="pw-card-product" :class="[`pw-card-product--${variant}`, { 'is-unavailable': unavailable }]">
    <div class="pw-card-product__media">
      <AppImage :media="listing.images[0]" :ratio="variant === 'compact' ? '1 / 1' : '16 / 10.5'" :sizes="sizes" :priority="priority" :fit="imageFit" />
      <span v-if="unavailable" class="pw-card-product__status">{{ statusLabel }}</span>
    </div>
    <div class="pw-card-product__overlay">
      <AppBadge v-if="badge && variant === 'full'" :tone="badgeTone" :solid="badgeTone === 'gold'" class="pw-card-product__badge">{{ badge.label }}</AppBadge>
      <FavoriteButton :listing-id="listing.id" :title="listing.title" class="pw-card-product__fav" />
      <span v-if="discount && variant === 'full'" class="pw-card-product__discount">−{{ discount }}%</span>
    </div>

    <div class="pw-card-product__body">
      <h3 class="pw-card-product__title">
        <RouterLink :to="to">{{ listing.title }}</RouterLink>
      </h3>
      <div class="pw-card-product__price-row">
        <ProductPrice :price="listing.price" :compare-at="variant === 'full' && !showCondition ? listing.compareAtPrice : null" :size="variant === 'compact' ? 'sm' : 'md'" :whole="variant === 'compact'" :note="showCondition ? `· ${CONDITION_LABELS[listing.condition].label}` : null" />
        <AppBadge v-if="variant === 'compact'" tone="success">{{ CONDITION_LABELS[listing.condition].label }}</AppBadge>
      </div>
      <template v-if="variant === 'full'">
        <RatingStars v-if="listing.rating && !showCondition" :value="listing.rating" show-value :count="listing.soldCount ? `${listing.soldCount >= 1000 ? `${(listing.soldCount / 1000).toFixed(1)}k` : listing.soldCount} sold` : null" />
        <p class="pw-card-product__footer" :class="`is-${footer.tone}`">
          <component :is="footer.icon" :size="14" aria-hidden="true" />
          {{ footer.text }}
          <span v-if="listing.seller.verified" class="pw-card-product__seller"><BadgeCheck :size="13" aria-hidden="true" /><span class="sr-only">Verified seller</span></span>
        </p>
      </template>
    </div>
  </article>
</template>

<style scoped>
.pw-card-product {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--pw-surface);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
  transition:
    box-shadow var(--pw-duration) var(--pw-ease),
    transform var(--pw-duration) var(--pw-ease);
}

.pw-card-product:hover {
  box-shadow: var(--pw-shadow-md);
}

.pw-card-product:focus-within {
  box-shadow: 0 0 0 2px var(--pw-color-focus);
}

.pw-card-product__media {
  position: relative;
  display: block;
  background: var(--pw-surface-sunken);
}

.pw-card-product__media :deep(img) {
  transition: transform var(--pw-duration-slow) var(--pw-ease);
}

.pw-card-product:hover .pw-card-product__media :deep(img) {
  transform: scale(1.03);
}

.pw-card-product__status {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgb(255 255 255 / 55%);
  font-family: var(--pw-font-display);
  font-size: var(--pw-text-lg);
  font-weight: var(--pw-weight-bold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--pw-navy-700);
}

.pw-card-product__overlay {
  position: absolute;
  inset: 0 0 auto;
  z-index: 1;
  pointer-events: none;
}

.pw-card-product__overlay > * {
  pointer-events: auto;
}

.pw-card-product__badge {
  position: absolute;
  top: 12px;
  left: 12px;
}

.pw-card-product__fav {
  position: absolute;
  top: 10px;
  right: 10px;
}

/* The overlay mirrors the image frame so the pill sits on the image's bottom edge. */
.pw-card-product--full .pw-card-product__overlay {
  aspect-ratio: 16 / 10.5;
}

.pw-card-product--compact .pw-card-product__overlay {
  aspect-ratio: 1 / 1;
}

.pw-card-product__discount {
  position: absolute;
  left: 12px;
  bottom: 12px;
  padding: 3px 7px;
  border-radius: var(--pw-radius-xs);
  background: var(--pw-gold-500);
  color: #fff;
  font-size: var(--pw-text-2xs);
  font-weight: var(--pw-weight-bold);
}

.pw-card-product__body {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-2);
  padding: var(--pw-space-4);
  flex: 1;
}

.pw-card-product--compact .pw-card-product__body {
  padding: var(--pw-space-3);
  gap: 6px;
}

.pw-card-product__title {
  font-family: var(--pw-font-body);
  font-size: var(--pw-text-base);
  font-weight: var(--pw-weight-medium);
  line-height: var(--pw-leading-snug);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 2.7em;
}

.pw-card-product--compact .pw-card-product__title {
  font-size: var(--pw-text-sm);
  min-height: 0;
  -webkit-line-clamp: 1;
  line-clamp: 1;
}

.pw-card-product__title a {
  color: var(--pw-ink);
}

/* Whole card clickable via the title link's pseudo-element. */
.pw-card-product__title a::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 0;
}

.pw-card-product__title a:hover {
  text-decoration: none;
}

.pw-card-product__price-row {
  display: flex;
  align-items: center;
  gap: var(--pw-space-2);
  margin-top: var(--pw-space-1);
}

.pw-card-product__footer {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: auto;
  padding-top: var(--pw-space-3);
  border-top: 1px solid var(--pw-border);
  font-size: var(--pw-text-xs);
  font-weight: var(--pw-weight-medium);
}

.pw-card-product__footer.is-green {
  color: var(--pw-success-600);
}
.pw-card-product__footer.is-navy {
  color: var(--pw-navy-700);
}

.pw-card-product__seller {
  margin-left: auto;
  color: var(--pw-gold-500);
  display: inline-flex;
}

.pw-card-product.is-unavailable .pw-card-product__price-row {
  opacity: 0.6;
}

@media (max-width: 479px) {
  .pw-card-product__body {
    padding: var(--pw-space-3);
  }
  .pw-card-product__title {
    font-size: var(--pw-text-sm);
  }
}
</style>
