<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus, Check } from '@lucide/vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppTabs from '@/components/common/AppTabs.vue'
import AppImage from '@/components/common/AppImage.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import { sellerService } from '@/api/account.api'
import { messageService } from '@/api/messages.api'
import { toApiError } from '@/api/errors'
import { useResource } from '@/composables/useResource'
import { useFollow } from '@/composables/useFollow'
import { useGatedAction } from '@/composables/useGatedAction'
import { useSeo } from '@/composables/useSeo'
import { useUiStore } from '@/stores/ui.store'
import { formatMoney } from '@/utils/money'

/**
 * VB19 — photographer storefront. Prints & digital licences. Download URLs are
 * never exposed here; buyers receive signed, time-limited links after purchase.
 */
const route = useRoute()
const router = useRouter()
const gate = useGatedAction()
const ui = useUiStore()
const username = computed(() => String(route.params.username))
const tab = ref<'prints' | 'collections' | 'licensing' | 'reviews' | 'about'>('prints')
const filter = ref<'all' | 'airliners' | 'warbirds' | 'airshows' | 'sunsets' | 'cockpits'>('all')

const { data: profile, state, error, reload } = useResource((s) => sellerService.profile(username.value, s), { watch: [username] })
const { data: prints, state: printState } = useResource(
  (s) => sellerService.listings(username.value, { status: 'active', category: filter.value === 'all' ? undefined : filter.value }, s),
  { watch: [username, filter] },
)
const { toggle, busy } = useFollow(profile)

const tabs = computed(() => [
  { value: 'prints' as const, label: `Prints ${profile.value?.stats.listingsCount ?? ''}` },
  { value: 'collections' as const, label: `Collections ${profile.value?.photographer?.collectionsCount ?? ''}` },
  { value: 'licensing' as const, label: 'Licensing' },
  { value: 'reviews' as const, label: `Reviews ${profile.value?.stats.reviewsCount ?? ''}` },
  { value: 'about' as const, label: 'About' },
])
const filters = [
  { value: 'all' as const, label: 'All' },
  { value: 'airliners' as const, label: 'Airliners' },
  { value: 'warbirds' as const, label: 'Warbirds' },
  { value: 'airshows' as const, label: 'Airshows' },
  { value: 'sunsets' as const, label: 'Sunsets' },
  { value: 'cockpits' as const, label: 'Cockpits' },
]

function commission() {
  const p = profile.value
  if (!p) return
  gate(
    async () => {
      try {
        const c = await messageService.startWithSeller(p.username, 'Hi! I would like to commission a shoot.')
        await router.push({ name: 'messages', params: { conversationId: c.id } })
      } catch (e) {
        ui.error("Couldn't contact the photographer", toApiError(e).message)
      }
    },
    { intent: 'To commission a shoot' },
  )
}

useSeo(() => ({ title: profile.value ? `${profile.value.displayName} — aviation photography` : 'Photographer', description: profile.value?.photographer?.tagline, type: 'profile' }))
</script>

<template>
  <div class="pw-ph">
    <ErrorState v-if="state === 'error'" :error="error" class="pw-container" @retry="reload" />
    <template v-else>
      <header class="pw-ph__hero">
        <AppImage v-if="profile?.coverImage" :media="profile.coverImage" ratio="auto" fit="cover" sizes="100vw" priority class="pw-ph__cover" />
        <div class="pw-container pw-ph__hero-inner">
          <AppAvatar :name="profile?.displayName ?? ''" tone="gold" :size="72" />
          <div class="pw-ph__id">
            <h1 class="pw-ph__name">{{ profile?.displayName }} <AppBadge v-if="profile?.verified" tone="gold" solid>Verified</AppBadge></h1>
            <p v-if="profile">{{ profile.photographer?.tagline }} · {{ profile.photographer?.printsSold }} prints sold</p>
            <AppSkeleton v-else width="280px" />
          </div>
          <div class="pw-ph__actions">
            <AppButton variant="inverse" @click="commission">Commission a shoot</AppButton>
            <AppButton variant="gold" :loading="busy" @click="toggle">
              <template #icon><Check v-if="profile?.isFollowing" :size="16" /><Plus v-else :size="16" /></template>
              {{ profile?.isFollowing ? 'Following' : 'Follow' }}
            </AppButton>
          </div>
        </div>
      </header>

      <div class="pw-container pw-ph__body">
        <AppTabs v-model="tab" :items="tabs" label="Storefront sections" />
        <template v-if="tab === 'prints' || tab === 'collections'">
        <div class="pw-ph__toolbar">
          <AppTabs v-model="filter" :items="filters" variant="pills" label="Filter prints" />
          <span class="pw-muted pw-ph__sort">Sort: Best selling</span>
        </div>

        <ul class="pw-ph__grid" role="list" :aria-busy="printState === 'loading'">
          <template v-if="printState === 'loading'">
            <li v-for="n in 4" :key="n"><AppSkeleton height="240px" radius="var(--pw-radius-lg)" /></li>
          </template>
          <li v-for="p in prints?.data ?? []" v-else :key="p.id">
            <RouterLink :to="{ name: 'listing', params: { slug: p.slug } }" class="pw-ph__card">
              <div class="pw-ph__img">
                <AppImage :media="p.images[0]" ratio="4 / 3" fit="cover" sizes="(min-width: 1024px) 25vw, 50vw" />
                <AppBadge v-if="p.badges.some((b) => b.kind === 'best_seller')" tone="gold" solid class="pw-ph__badge">Best seller</AppBadge>
              </div>
              <div class="pw-ph__meta">
                <p class="pw-ph__title">{{ p.title }}</p>
                <p class="pw-ph__price">from {{ formatMoney(p.price, { whole: true }) }} · 4 sizes · print + digital</p>
              </div>
            </RouterLink>
          </li>
        </ul>
        </template>

        <div v-if="tab === 'about' || tab === 'reviews'" class="pw-card pw-card-pad pw-ph__text">
          <p v-if="tab === 'about'">{{ profile?.bio }}</p>
          <p v-else>
            Rated {{ profile?.rating.toFixed(1) }} from {{ profile?.stats.reviewsCount }} reviews.
            <RouterLink :to="{ name: 'seller', params: { username } }">Read all reviews</RouterLink>
          </p>
        </div>

        <section v-if="profile?.photographer && (tab === 'prints' || tab === 'licensing')" class="pw-card pw-card-pad pw-ph__licensing" aria-labelledby="lic">
          <h2 id="lic" class="pw-card-title">Licensing</h2>
          <ul role="list" class="pw-ph__lic-grid">
            <li v-for="l in profile.photographer.licensing" :key="l.tier" class="pw-ph__lic">
              <p class="pw-ph__lic-label">{{ l.label }}</p>
              <p class="pw-muted">{{ l.description }}</p>
              <p class="pw-ph__lic-price">{{ l.tier === 'personal' ? 'Included' : l.price ? `From ${formatMoney(l.price, { whole: true })}` : 'Quote' }}</p>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.pw-ph {
  padding-bottom: var(--pw-space-16);
}

.pw-ph__hero {
  position: relative;
  min-height: 260px;
  display: flex;
  align-items: flex-end;
  background: var(--pw-navy-900);
  color: #fff;
  overflow: hidden;
}

.pw-ph__cover {
  position: absolute !important;
  inset: 0;
  height: 100%;
}

.pw-ph__hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgb(16 26 45 / 10%) 0%, rgb(16 26 45 / 70%) 100%);
}

.pw-ph__hero-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--pw-space-4);
  padding-top: var(--pw-space-10);
  padding-bottom: var(--pw-space-6);
}

.pw-ph__id {
  flex: 1 1 300px;
}

.pw-ph__name {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--pw-space-3);
  color: #fff;
  font-size: clamp(1.5rem, 3vw, 2rem);
}

.pw-ph__id p {
  margin-top: var(--pw-space-1);
  color: rgb(255 255 255 / 85%);
  font-size: var(--pw-text-sm);
}

.pw-ph__actions {
  display: flex;
  gap: var(--pw-space-3);
}

.pw-ph__body {
  padding-top: var(--pw-space-5);
}

.pw-ph__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--pw-space-3);
  margin: var(--pw-space-5) 0;
}

.pw-ph__sort {
  font-size: var(--pw-text-sm);
}

.pw-ph__grid {
  display: grid;
  gap: var(--pw-space-5);
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.pw-ph__card {
  display: block;
  overflow: hidden;
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-surface);
  color: var(--pw-ink);
}

.pw-ph__card:hover {
  text-decoration: none;
  box-shadow: var(--pw-shadow-md);
}

.pw-ph__img {
  position: relative;
}

.pw-ph__badge {
  position: absolute;
  top: 12px;
  left: 12px;
}

.pw-ph__meta {
  padding: var(--pw-space-3) var(--pw-space-4);
}

.pw-ph__title {
  font-weight: var(--pw-weight-semibold);
  font-size: var(--pw-text-sm);
}

.pw-ph__price {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-ph__text {
  margin-top: var(--pw-space-5);
  line-height: var(--pw-leading-relaxed);
}

.pw-ph__licensing {
  margin-top: var(--pw-space-8);
}

.pw-ph__lic-grid {
  display: grid;
  gap: var(--pw-space-3);
  margin-top: var(--pw-space-4);
}

.pw-ph__lic {
  padding: var(--pw-space-4);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-md);
  font-size: var(--pw-text-sm);
}

.pw-ph__lic-label {
  font-weight: var(--pw-weight-semibold);
}

.pw-ph__lic-price {
  margin-top: var(--pw-space-2);
  font-weight: var(--pw-weight-semibold);
  color: var(--pw-navy-700);
}

@media (min-width: 768px) {
  .pw-ph__lic-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .pw-ph__grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .pw-ph__hero {
    min-height: 320px;
  }
}
</style>
