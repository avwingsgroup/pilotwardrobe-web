<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeftRight, Ruler, ShieldCheck, Truck, RotateCcw, Download } from '@lucide/vue'
import AppBreadcrumb from '@/components/common/AppBreadcrumb.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppTabs from '@/components/common/AppTabs.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppImage from '@/components/common/AppImage.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import AppChoiceChips from '@/components/forms/AppChoiceChips.vue'
import ProductGallery from '@/components/products/ProductGallery.vue'
import ProductPrice from '@/components/products/ProductPrice.vue'
import SellerCard from '@/components/products/SellerCard.vue'
import SizeChartTable from '@/components/products/SizeChartTable.vue'
import OfferModal from '@/components/products/OfferModal.vue'
import FavoriteButton from '@/components/marketplace/FavoriteButton.vue'
import { productService } from '@/api/products.api'
import { messageService } from '@/api/messages.api'
import { toApiError } from '@/api/errors'
import { useResource } from '@/composables/useResource'
import { useGatedAction } from '@/composables/useGatedAction'
import { useSeo } from '@/composables/useSeo'
import { useMarketplaceStore } from '@/stores/marketplace.store'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { CONDITION_LABELS } from '@/constants/labels'
import { appConfig } from '@/constants/config'
import { formatMoney, toMajor } from '@/utils/money'
import { track } from '@/utils/analytics'

const route = useRoute()
const router = useRouter()
const gate = useGatedAction()
const ui = useUiStore()
const auth = useAuthStore()
const marketplace = useMarketplaceStore()
const slug = computed(() => String(route.params.slug))

const { data: listing, state, error, reload } = useResource(
  async (signal) => {
    const l = await productService.getBySlug(slug.value, signal)
    marketplace.hydrate([l])
    track('product_viewed', { listingId: l.id, category: l.category.slug, price: l.price.amount, currency: l.price.currency })
    return l
  },
  { watch: [slug] },
)
const { data: related } = useResource((signal) => productService.related(slug.value, signal), { watch: [slug] })

const size = ref<string | null>(null)
const sizeError = ref<string | null>(null)
const tab = ref<'details' | 'size' | 'freight' | 'returns'>('details')
const offerOpen = ref(false)
const messaging = ref(false)

watch(listing, (l) => {
  size.value = l?.sizes?.fitMatch?.size ?? null
  tab.value = l?.sizes ? 'size' : 'details'
})

const isOwner = computed(() => !!listing.value && listing.value.seller.id === auth.user?.id)
const available = computed(() => listing.value?.status === 'active')
const sizeOptions = computed(() => {
  const s = listing.value?.sizes
  if (!s) return []
  return [...s.available.map((v) => ({ value: v, label: v })), ...s.unavailable.map((v) => ({ value: v, label: v, disabled: true }))].sort((a, b) => order(a.value) - order(b.value))
})
const order = (s: string) => ['XS', 'S', 'M', 'L', 'XL', 'XXL'].indexOf(s)
const tabs = computed(() => [
  { value: 'details' as const, label: 'Details' },
  ...(listing.value?.sizes ? [{ value: 'size' as const, label: 'Size & fit' }] : []),
  { value: 'freight' as const, label: listing.value?.format === 'physical' ? 'Freight' : 'Delivery' },
  { value: 'returns' as const, label: 'Returns' },
])
const crumbs = computed(() => [
  { label: 'Marketplace', to: { name: 'marketplace' } },
  ...(listing.value ? [{ label: listing.value.category.name, to: { name: 'category', params: { slug: listing.value.category.slug } } }] : []),
  { label: listing.value ? shortTitle(listing.value.title) : '…' },
])
const shortTitle = (t: string) => t.split(/\s[—-]\s/)[0] ?? t
const context = computed(() => ({
  title: listing.value?.title,
  priceLabel: listing.value ? formatMoney(listing.value.price) : undefined,
  imageUrl: listing.value?.images[0]?.variants.thumbnail,
}))

function requireSize() {
  if (listing.value?.sizes && !size.value) {
    sizeError.value = 'Choose a size first.'
    document.getElementById('size-picker')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return false
  }
  sizeError.value = null
  return true
}

function buyNow() {
  if (!listing.value || !requireSize()) return
  const l = listing.value
  gate(
    () => {
      track('checkout_started', { listingId: l.id, itemCount: 1, value: l.price.amount, currency: l.price.currency })
      return router.push({ name: 'checkout', query: { listing: l.id, size: size.value ?? undefined } })
    },
    { intent: 'To buy this item', ...context.value, redirect: router.resolve({ name: 'checkout', query: { listing: l.id, size: size.value ?? undefined } }).fullPath },
  )
}

function makeOffer() {
  gate(() => (offerOpen.value = true), { intent: 'To make an offer', ...context.value })
}

function proposeSwap() {
  if (!listing.value) return
  const to = { name: 'swap-builder', params: { slug: listing.value.slug } }
  gate(() => {
    track('swap_started', { listingId: listing.value!.id })
    return router.push(to)
  }, { intent: 'To propose a swap', ...context.value, redirect: router.resolve(to).fullPath })
}

function messageSeller() {
  if (!listing.value) return
  const l = listing.value
  gate(
    async () => {
      messaging.value = true
      try {
        const convo = await messageService.start(l.id, '')
        await router.push({ name: 'messages', params: { conversationId: convo.id } })
      } catch (e) {
        ui.error("Couldn't open a conversation", toApiError(e).message)
      } finally {
        messaging.value = false
      }
    },
    { intent: 'To message the seller', ...context.value },
  )
}

useSeo(() => {
  const l = listing.value
  if (!l) return { title: 'Listing', noindex: state.value === 'error' }
  return {
    title: l.title,
    description: `${CONDITION_LABELS[l.condition].label} · ${formatMoney(l.price)} · sold by ${l.seller.displayName}. ${l.description.slice(0, 120)}`,
    image: l.images[0]?.variants.large,
    type: 'product',
    canonicalPath: `/marketplace/${l.slug}`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: l.title,
      image: l.images.map((i) => i.variants.large),
      description: l.description,
      sku: l.id,
      brand: l.brand ? { '@type': 'Brand', name: l.brand } : undefined,
      itemCondition: l.condition === 'new' ? 'https://schema.org/NewCondition' : 'https://schema.org/UsedCondition',
      offers: {
        '@type': 'Offer',
        url: `${appConfig.appUrl}/marketplace/${l.slug}`,
        priceCurrency: l.price.currency,
        price: toMajor(l.price.amount, l.price.currency).toFixed(2),
        availability: l.status === 'active' ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
        seller: { '@type': 'Person', name: l.seller.displayName },
      },
      aggregateRating: l.rating ? { '@type': 'AggregateRating', ratingValue: l.rating, reviewCount: l.seller.totalReviews } : undefined,
    },
  }
})
</script>

<template>
  <div class="pw-container pw-pdp">
    <AppBreadcrumb :items="crumbs" class="pw-pdp__crumbs" />

    <ErrorState v-if="state === 'error'" :error="error" not-found-title="This listing has landed elsewhere" class="pw-card" @retry="reload" />

    <div v-else-if="state === 'loading' || !listing" class="pw-pdp__grid" aria-busy="true">
      <AppSkeleton height="480px" radius="var(--pw-radius-lg)" />
      <div class="pw-stack">
        <AppSkeleton height="34px" width="85%" />
        <AppSkeleton height="40px" width="40%" />
        <AppSkeleton height="44px" />
        <AppSkeleton height="52px" />
        <AppSkeleton height="80px" />
      </div>
    </div>

    <template v-else>
      <div class="pw-pdp__grid">
        <ProductGallery :images="listing.images" :title="listing.title" :badges="listing.badges.filter((b) => ['official_store', 'swap_ok'].includes(b.kind))" />

        <div class="pw-pdp__info">
          <div class="pw-pdp__title-row">
            <h1 class="pw-pdp__title">{{ listing.title }}</h1>
            <FavoriteButton :listing-id="listing.id" :title="listing.title" size="md" />
          </div>

          <ProductPrice :price="listing.price" size="xl" :note="`${listing.freightSummary ?? ''} · ${CONDITION_LABELS[listing.condition].label}${listing.condition === 'new' ? ' with tags' : ''}`" />

          <p class="pw-pdp__escrow"><ShieldCheck :size="18" aria-hidden="true" /> Escrow protected — the seller is paid only after you confirm arrival.</p>

          <p v-if="!available" class="pw-pdp__unavailable" role="status">This item is {{ listing.status === 'reserved' ? 'reserved for another buyer' : 'no longer available' }}.</p>

          <div v-if="listing.sizes" id="size-picker" class="pw-pdp__sizes">
            <div class="pw-between">
              <span class="pw-pdp__label">Size</span>
              <button type="button" class="pw-link-btn pw-pdp__guide" @click="tab = 'size'"><Ruler :size="14" aria-hidden="true" /> Size guide</button>
            </div>
            <AppChoiceChips v-model="size" :options="sizeOptions" legend="Choose a size" sr-only-legend :error="sizeError" />
            <div v-if="listing.sizes.fitMatch && size === listing.sizes.fitMatch.size" class="pw-pdp__fit">
              <Ruler :size="18" aria-hidden="true" />
              <div>
                <p class="pw-pdp__fit-title">{{ size }} matches your Fit Kit — “{{ listing.sizes.fitMatch.profileName }}”</p>
                <p class="pw-pdp__fit-sub">{{ listing.sizes.fitMatch.summary }}</p>
              </div>
              <RouterLink :to="{ name: 'hangar-fit-kit' }" class="pw-pdp__fit-link">Change profile</RouterLink>
            </div>
          </div>

          <div v-if="!isOwner" class="pw-pdp__actions">
            <AppButton size="lg" class="pw-pdp__buy" :disabled="!available" @click="buyNow">
              <template v-if="listing.format === 'digital'" #icon><Download :size="18" /></template>
              Buy now
            </AppButton>
            <AppButton v-if="listing.negotiable" variant="outline" size="lg" class="pw-pdp__offer" :disabled="!available" @click="makeOffer">Make an offer</AppButton>
            <AppButton v-if="listing.swappable" variant="secondary" size="lg" icon-only label="Propose a swap" :disabled="!available" @click="proposeSwap"><ArrowLeftRight :size="20" /></AppButton>
          </div>
          <div v-else class="pw-pdp__owner">
            <p>This is your listing.</p>
            <AppButton variant="secondary" :to="{ name: 'listing-edit', params: { id: listing.id } }">Edit listing</AppButton>
          </div>

          <SellerCard :seller="listing.seller" @message="messageSeller" />

          <AppTabs v-model="tab" :items="tabs" label="Listing information" />
          <div class="pw-pdp__panel" role="tabpanel">
            <template v-if="tab === 'details'">
              <p class="pw-pdp__desc">{{ listing.description }}</p>
              <dl class="pw-dl pw-pdp__attrs">
                <template v-for="a in listing.attributes" :key="a.label">
                  <dt>{{ a.label }}</dt>
                  <dd>{{ a.value }}</dd>
                </template>
                <dt>Condition</dt>
                <dd>{{ CONDITION_LABELS[listing.condition].label }} — {{ CONDITION_LABELS[listing.condition].hint }}</dd>
                <template v-if="listing.aircraftTypes?.length">
                  <dt>Aircraft</dt>
                  <dd>{{ listing.aircraftTypes.join(', ') }}</dd>
                </template>
              </dl>
            </template>
            <SizeChartTable v-else-if="tab === 'size' && listing.sizes?.chart" :chart="listing.sizes.chart" :fit-size="listing.sizes.fitMatch?.size" />
            <template v-else-if="tab === 'freight'">
              <ul v-if="listing.shipping?.length" class="pw-pdp__ship" role="list">
                <li v-for="s in listing.shipping" :key="s.id">
                  <Truck :size="18" aria-hidden="true" />
                  <span><strong>{{ s.label }}</strong><small>{{ s.description }}</small></span>
                  <span class="pw-tabular">{{ s.price.amount ? formatMoney(s.price) : 'Free' }}</span>
                </li>
              </ul>
              <p v-else class="pw-muted">Digital files are delivered instantly after payment is verified. Downloads use temporary signed links from your order page.</p>
            </template>
            <div v-else class="pw-pdp__returns">
              <RotateCcw :size="18" aria-hidden="true" />
              <p>You have <strong>72 hours after landing</strong> to confirm the item matches the listing or open a dispute. Escrow stays frozen while a mediator reviews. <RouterLink to="/help/returns-refunds">Returns policy</RouterLink></p>
            </div>
          </div>
        </div>
      </div>

      <section v-if="related?.length" class="pw-pdp__related" aria-labelledby="related-title">
        <h2 id="related-title" class="pw-pdp__related-title">Crew also viewed</h2>
        <ul class="pw-pdp__related-list" role="list">
          <li v-for="r in related" :key="r.id">
            <RouterLink :to="{ name: 'listing', params: { slug: r.slug } }" class="pw-pdp__rel">
              <AppImage :media="r.images[0]" ratio="1" sizes="64px" class="pw-pdp__rel-img" />
              <span>
                <span class="pw-pdp__rel-title">{{ r.title }}</span>
                <strong class="pw-tabular">{{ formatMoney(r.price) }}</strong>
              </span>
            </RouterLink>
          </li>
        </ul>
      </section>

      <OfferModal :open="offerOpen" :listing="listing" @close="offerOpen = false" />
    </template>
  </div>
</template>

<style scoped>
.pw-pdp {
  padding-top: var(--pw-space-5);
  padding-bottom: var(--pw-space-16);
}

.pw-pdp__crumbs {
  margin-bottom: var(--pw-space-5);
}

.pw-pdp__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-8);
}

.pw-pdp__info {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-5);
  min-width: 0;
}

.pw-pdp__title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--pw-space-4);
}

.pw-pdp__title {
  font-size: clamp(1.5rem, 2.6vw, 1.875rem);
  font-weight: var(--pw-weight-semibold);
}

.pw-pdp__escrow {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  padding: var(--pw-space-3) var(--pw-space-4);
  border-radius: var(--pw-radius-md);
  background: var(--pw-success-100);
  color: var(--pw-success-700);
  font-size: var(--pw-text-sm);
}

.pw-pdp__unavailable {
  padding: var(--pw-space-3) var(--pw-space-4);
  border-radius: var(--pw-radius-md);
  background: var(--pw-warning-100);
  color: var(--pw-warning-700);
  font-weight: var(--pw-weight-medium);
}

.pw-pdp__sizes {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-3);
}

.pw-pdp__label {
  font-weight: var(--pw-weight-medium);
}

.pw-pdp__guide {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--pw-text-sm);
}

.pw-pdp__fit {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  padding: var(--pw-space-3) var(--pw-space-4);
  border-radius: var(--pw-radius-md);
  background: var(--pw-navy-100);
  color: var(--pw-navy-700);
}

.pw-pdp__fit > div {
  flex: 1;
}

.pw-pdp__fit-title {
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-medium);
}

.pw-pdp__fit-sub {
  font-size: var(--pw-text-xs);
  color: var(--pw-ink-2);
}

.pw-pdp__fit-link {
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-semibold);
  white-space: nowrap;
}

.pw-pdp__actions {
  display: flex;
  gap: var(--pw-space-3);
}

.pw-pdp__buy,
.pw-pdp__offer {
  flex: 1;
}

.pw-pdp__owner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--pw-space-3) var(--pw-space-4);
  border-radius: var(--pw-radius-md);
  background: var(--pw-surface-sunken);
}

.pw-pdp__panel {
  padding-top: var(--pw-space-2);
}

.pw-pdp__desc {
  line-height: var(--pw-leading-relaxed);
  color: var(--pw-ink-2);
  margin-bottom: var(--pw-space-4);
}

.pw-pdp__attrs dd {
  text-align: right;
}

.pw-pdp__ship li {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  padding: var(--pw-space-3) 0;
  border-bottom: 1px solid var(--pw-border);
}

.pw-pdp__ship li > span:nth-child(2) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.pw-pdp__ship small {
  color: var(--pw-muted);
  font-size: var(--pw-text-xs);
}

.pw-pdp__returns {
  display: flex;
  gap: var(--pw-space-3);
  color: var(--pw-ink-2);
  line-height: var(--pw-leading-relaxed);
}

.pw-pdp__related {
  margin-top: var(--pw-space-12);
}

.pw-pdp__related-title {
  margin-bottom: var(--pw-space-5);
  font-size: var(--pw-text-xl);
}

.pw-pdp__related-list {
  display: grid;
  gap: var(--pw-space-4);
  grid-template-columns: minmax(0, 1fr);
}

.pw-pdp__related-list > li {
  min-width: 0;
}

.pw-pdp__rel {
  display: flex;
  align-items: center;
  gap: var(--pw-space-4);
  padding: var(--pw-space-3);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-surface);
  color: var(--pw-ink);
}

.pw-pdp__rel:hover {
  text-decoration: none;
  box-shadow: var(--pw-shadow-md);
}

.pw-pdp__rel-img {
  width: 64px;
  flex: none;
  border-radius: var(--pw-radius-md);
}

.pw-pdp__rel > span {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.pw-pdp__rel-title {
  font-size: var(--pw-text-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (min-width: 640px) {
  .pw-pdp__related-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .pw-pdp__grid {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: var(--pw-space-10);
    align-items: start;
  }
  .pw-pdp__grid > :first-child {
    position: sticky;
    top: calc(var(--pw-header-h) + var(--pw-space-5));
  }
  .pw-pdp__related-list {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 479px) {
  .pw-pdp__actions {
    flex-wrap: wrap;
  }
  .pw-pdp__buy {
    flex-basis: 100%;
  }
  .pw-pdp__fit {
    flex-wrap: wrap;
  }
}
</style>
