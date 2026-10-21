<script setup lang="ts">
import { computed } from 'vue'
import { ArrowLeftRight, CircleCheck, Ruler, Send, ShieldCheck } from '@lucide/vue'
import HeroSlider from '@/components/marketplace/HeroSlider.vue'
import AppStoreBadge from '@/components/marketplace/AppStoreBadge.vue'
import phoneIosWebp from '@/assets/app/phone-ios.webp'
import phoneIosPng from '@/assets/app/phone-ios.png'
import phoneAndroidWebp from '@/assets/app/phone-android.webp'
import phoneAndroidPng from '@/assets/app/phone-android.png'
import SectionHeader from '@/components/marketplace/SectionHeader.vue'
import CategoryTile from '@/components/marketplace/CategoryTile.vue'
import ProductGrid from '@/components/products/ProductGrid.vue'
import AppImage from '@/components/common/AppImage.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import { productService } from '@/api/products.api'
import { useResource } from '@/composables/useResource'
import { useSeo } from '@/composables/useSeo'
import { useMarketplaceStore } from '@/stores/marketplace.store'
import { appConfig } from '@/constants/config'

const marketplace = useMarketplaceStore()
const { data, state, error, reload } = useResource(async (signal) => {
  const feed = await productService.home(signal)
  marketplace.hydrate(feed.sections.flatMap((s) => s.listings))
  return feed
})

useSeo({
  title: 'Buy, sell or swap premium aviation gear',
  canonicalPath: '/',
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Pilotwardrobe',
    url: appConfig.appUrl,
    potentialAction: { '@type': 'SearchAction', target: `${appConfig.appUrl}/marketplace?search={query}`, 'query-input': 'required name=query' },
  },
})

/** Column c holds shots c and c + 3; weights are the V1 tile heights (px) so columns stagger but end level. */
const GALLERY_WEIGHTS = [
  [208, 257],
  [258, 207],
  [178, 287],
]
const galleryColumns = computed(() => {
  const shots = data.value?.gallery ?? []
  return [0, 1, 2].map((c) => [shots[c], shots[c + 3]].filter((g): g is NonNullable<typeof g> => !!g))
})

const PHONES = [
  { label: 'iOS', webp: phoneIosWebp, png: phoneIosPng },
  { label: 'Android', webp: phoneAndroidWebp, png: phoneAndroidPng },
]

const features = [
  { icon: Send, title: 'Aviation-only platform', body: 'Curated specifically for pilots, crew and engineers.' },
  { icon: CircleCheck, title: 'Verified sellers', body: 'Every seller clears KYC before the first listing goes live.' },
  { icon: ArrowLeftRight, title: 'Peer-to-peer swapping', body: 'Trade item for item, or item plus cash top-up.' },
  { icon: ShieldCheck, title: 'Secure escrow payments', body: 'We hold funds until both sides are satisfied.' },
]
</script>

<template>
  <div class="pw-home">
    <template v-if="state === 'loading'">
      <div class="pw-home__hero-skel"><AppSkeleton height="320px" radius="0" /></div>
      <div class="pw-container pw-home__section"><ProductGrid :listings="[]" loading :skeletons="4" /></div>
    </template>

    <div v-else-if="state === 'error'" class="pw-container pw-home__section">
      <ErrorState :error="error" @retry="reload" />
    </div>

    <template v-else-if="data">
      <HeroSlider :slides="data.heroSlides" />

      <section class="pw-home__features" aria-label="Why Pilotwardrobe">
        <div class="pw-container pw-home__features-grid">
          <div v-for="f in features" :key="f.title" class="pw-home__feature">
            <span class="pw-home__feature-icon" aria-hidden="true"><component :is="f.icon" :size="18" /></span>
            <h2 class="pw-home__feature-title">{{ f.title }}</h2>
            <p>{{ f.body }}</p>
          </div>
        </div>
      </section>

      <section class="pw-home__section pw-home__section--white" aria-labelledby="h-cats">
        <div class="pw-container">
          <SectionHeader id="h-cats" title="Gear by category" link-label="All categories" :to="{ name: 'categories' }" />
          <ul class="pw-home__cats" role="list">
            <li v-for="c in data.categories" :key="c.id"><CategoryTile :category="c" /></li>
          </ul>
        </div>
      </section>

      <template v-for="(section, si) in data.sections" :key="section.key">
        <section class="pw-home__section" :aria-labelledby="`h-${section.key}`">
          <div class="pw-container">
            <SectionHeader :id="`h-${section.key}`" :title="section.title" :subtitle="section.subtitle" :to="section.viewAllTo" />
            <ProductGrid :listings="section.listings" :label="section.title" />
          </div>
        </section>
        <div v-if="si === 0" class="pw-container">
          <aside class="pw-home__fitkit">
            <Ruler :size="20" aria-hidden="true" />
            <p><strong>Save your Fit Kit once and shop apparel with confidence.</strong> Jacket, collar, shoe and bag sizes — listings tell you if they fit before you open them.</p>
            <AppButton variant="outline" :to="{ name: 'hangar-fit-kit' }">Set up my Fit Kit</AppButton>
          </aside>
        </div>
      </template>

      <section class="pw-home__cta" aria-labelledby="h-sell">
        <div class="pw-container pw-home__cta-inner">
          <h2 id="h-sell">Got aviation gear to sell or swap?</h2>
          <p>List in under two minutes and reach a global audience of verified buyers.</p>
          <div class="pw-home__cta-actions">
            <AppButton variant="inverse" size="lg" :to="{ name: 'listing-new' }">Start selling today</AppButton>
            <AppButton variant="inverse-outline" size="lg" to="/how-to-sell">How it works</AppButton>
          </div>
          <Send class="pw-home__cta-plane" :size="160" :stroke-width="0.8" aria-hidden="true" />
        </div>
      </section>

      <section class="pw-home__section pw-home__section--white" aria-labelledby="h-gallery">
        <div class="pw-container">
          <SectionHeader id="h-gallery" title="Flight deck gallery" subtitle="Raw, unfiltered aviation photography captured by pilots — prints and licences available." link-label="Browse photographers" :to="{ name: 'photographers' }" />
          <div class="pw-home__gallery">
            <div v-for="(column, c) in galleryColumns" :key="c" class="pw-home__gallery-col">
              <RouterLink v-for="(g, r) in column" :key="g.id" :to="g.to" class="pw-home__shot" :style="{ flexGrow: GALLERY_WEIGHTS[c]?.[r] ?? 1 }">
                <AppImage :media="g.image" fit="cover" fill sizes="(min-width: 768px) 33vw, 50vw" />
                <span class="sr-only">{{ g.title }} by {{ g.photographer }}</span>
              </RouterLink>
            </div>
          </div>
          <div class="pw-home__more"><AppButton variant="secondary" :to="{ name: 'photographers' }">View all</AppButton></div>
        </div>
      </section>

      <section class="pw-home__app" aria-labelledby="h-app">
        <div class="pw-container pw-home__app-inner">
          <div>
            <h2 id="h-app" class="pw-home__app-title">The hangar in your pocket.</h2>
            <p>Real-time alerts on offers and swaps, in-app messaging with escrow context, and gear alerts the moment something in your size lands.</p>
            <div class="pw-home__stores">
              <AppStoreBadge store="apple" href="https://apps.apple.com" />
              <AppStoreBadge store="google" href="https://play.google.com" />
            </div>
          </div>
          <div class="pw-home__phones">
            <figure v-for="p in PHONES" :key="p.label" class="pw-home__phone">
              <picture>
                <source :srcset="p.webp" type="image/webp" />
                <img :src="p.png" :alt="`Pilotwardrobe ${p.label} app home screen`" width="274" height="494" loading="lazy" decoding="async" />
              </picture>
              <figcaption>{{ p.label }}</figcaption>
            </figure>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.pw-home__section {
  padding: var(--pw-space-10) 0;
}

.pw-home__section--white {
  background: var(--pw-surface);
}

.pw-home__features {
  background: var(--pw-surface);
  border-bottom: 1px solid var(--pw-border);
}

.pw-home__features-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--pw-space-6) var(--pw-space-4);
  padding-top: var(--pw-space-8);
  padding-bottom: var(--pw-space-8);
}

.pw-home__feature {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--pw-space-2);
  text-align: center;
  font-size: var(--pw-text-sm);
  color: var(--pw-muted);
}

.pw-home__feature-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  margin-bottom: var(--pw-space-2);
  border-radius: var(--pw-radius-md);
  background: var(--pw-navy-50);
  color: var(--pw-navy-700);
}

.pw-home__feature-title {
  font-family: var(--pw-font-body);
  font-size: var(--pw-text-base);
  font-weight: var(--pw-weight-semibold);
}

.pw-home__cats {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(150px, 1fr);
  gap: var(--pw-space-5);
  overflow-x: auto;
  padding-bottom: var(--pw-space-4);
  scroll-snap-type: x mandatory;
  scrollbar-color: var(--pw-navy-300) var(--pw-border);
}

.pw-home__cats li {
  scroll-snap-align: start;
}

.pw-home__fitkit {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--pw-space-4);
  margin: var(--pw-space-2) 0;
  padding: var(--pw-space-5) var(--pw-space-6);
  background: var(--pw-surface);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
  color: var(--pw-muted);
}

.pw-home__fitkit svg {
  color: var(--pw-navy-700);
}

.pw-home__fitkit p {
  flex: 1 1 360px;
}

.pw-home__fitkit strong {
  color: var(--pw-ink);
}

.pw-home__cta {
  background: var(--pw-navy-900);
  color: rgb(255 255 255 / 85%);
  text-align: center;
}

.pw-home__cta-inner {
  position: relative;
  padding-top: var(--pw-space-12);
  padding-bottom: var(--pw-space-12);
  overflow: hidden;
}

.pw-home__cta h2 {
  font-size: clamp(1.5rem, 3vw, 2.125rem);
  color: #fff;
}

.pw-home__cta p {
  margin-top: var(--pw-space-3);
}

.pw-home__cta-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--pw-space-3);
  margin-top: var(--pw-space-6);
}

.pw-home__cta-plane {
  position: absolute;
  right: 8%;
  top: 50%;
  transform: translateY(-50%) rotate(8deg);
  color: rgb(255 255 255 / 10%);
  pointer-events: none;
}

/* Phones: a plain 2-up grid of equal tiles (columns flatten via display: contents). */
.pw-home__gallery {
  display: grid;
  gap: var(--pw-space-3);
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.pw-home__gallery-col {
  display: contents;
}

.pw-home__shot {
  display: block;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: var(--pw-radius-lg);
}

.pw-home__shot :deep(img) {
  transition: transform var(--pw-duration-slow) var(--pw-ease);
}

.pw-home__shot:hover :deep(img) {
  transform: scale(1.03);
}

.pw-home__more {
  display: flex;
  justify-content: center;
  margin-top: var(--pw-space-6);
}

.pw-home__app {
  background: var(--pw-surface);
  border-top: 1px solid var(--pw-border);
}

.pw-home__app-inner {
  display: grid;
  gap: var(--pw-space-8);
  align-items: center;
  padding-top: var(--pw-space-12);
  padding-bottom: var(--pw-space-12);
}

.pw-home__app-title {
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  margin-bottom: var(--pw-space-4);
}

.pw-home__app p {
  max-width: 460px;
  color: var(--pw-ink-2);
  font-size: var(--pw-text-md);
  line-height: var(--pw-leading-relaxed);
}

.pw-home__stores {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pw-space-3);
  margin-top: var(--pw-space-5);
}

.pw-home__phones {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: var(--pw-space-4);
}

.pw-home__phone {
  width: min(205px, 44vw);
  margin: 0;
  text-align: center;
}

.pw-home__phone img {
  width: 100%;
  height: auto;
  filter: drop-shadow(0 18px 28px rgb(13 42 87 / 14%));
}

/* V1 staggers the Android device below the iPhone. */
.pw-home__phone:last-child {
  margin-top: var(--pw-space-8);
}

.pw-home__phone figcaption {
  margin-top: var(--pw-space-2);
  font-size: var(--pw-text-sm);
  color: var(--pw-muted);
}

@media (min-width: 768px) {
  .pw-home__features-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  .pw-home__section {
    padding: var(--pw-space-12) 0;
  }
  /* V1 masonry: three equal-height columns, two shots each, staggered heights. */
  .pw-home__gallery {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--pw-space-5);
  }
  .pw-home__gallery-col {
    display: flex;
    flex-direction: column;
    gap: var(--pw-space-5);
    aspect-ratio: 440 / 485;
  }
  .pw-home__shot {
    flex: 1 1 0;
    min-height: 0;
    aspect-ratio: auto;
  }
}

@media (min-width: 1024px) {
  .pw-home__app-inner {
    grid-template-columns: 1fr 1fr;
  }
  .pw-home__phones {
    justify-content: flex-end;
  }
}

@media (max-width: 767px) {
  .pw-home__cta-plane {
    display: none;
  }
}
</style>
