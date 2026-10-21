<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BadgeCheck, MapPin, MessageCircle, MoreHorizontal, Plus, Check, Flag } from '@lucide/vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppTabs from '@/components/common/AppTabs.vue'
import AppImage from '@/components/common/AppImage.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppDropdown from '@/components/common/AppDropdown.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import RatingStars from '@/components/common/RatingStars.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import ProductGrid from '@/components/products/ProductGrid.vue'
import { sellerService } from '@/api/account.api'
import { messageService } from '@/api/messages.api'
import { toApiError } from '@/api/errors'
import { useResource } from '@/composables/useResource'
import { useFollow } from '@/composables/useFollow'
import { useGatedAction } from '@/composables/useGatedAction'
import { useSeo } from '@/composables/useSeo'
import { useUiStore } from '@/stores/ui.store'
import { useMarketplaceStore } from '@/stores/marketplace.store'
import { formatMonthYear, formatShortDate } from '@/utils/date'

/** VB18 — public seller profile. */
const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const gate = useGatedAction()
const marketplace = useMarketplaceStore()
const username = computed(() => String(route.params.username))
const tab = ref<'listings' | 'sold' | 'reviews' | 'about'>('listings')

const { data: profile, state, error, reload } = useResource((s) => sellerService.profile(username.value, s), { watch: [username] })
const { data: listings, state: listState } = useResource(
  async (s) => {
    const res = await sellerService.listings(username.value, { status: tab.value === 'sold' ? 'sold' : 'active' }, s)
    marketplace.hydrate(res.data)
    return res
  },
  { watch: [username, () => tab.value === 'sold'] },
)
const { data: reviews } = useResource((s) => sellerService.reviews(username.value, 1, s), { watch: [username] })
const { toggle: toggleFollow, busy: followBusy } = useFollow(profile)

const tabs = computed(() => [
  { value: 'listings' as const, label: `Listings ${profile.value?.stats.listingsCount ?? ''}` },
  { value: 'sold' as const, label: `Sold ${profile.value?.stats.soldCount ?? ''}` },
  { value: 'reviews' as const, label: `Reviews ${profile.value?.stats.reviewsCount ?? ''}` },
  { value: 'about' as const, label: 'About' },
])

const breakdown = computed(() => {
  const b = profile.value?.ratingBreakdown
  if (!b) return []
  const total = Object.values(b).reduce((s, n) => s + n, 0) || 1
  return (['5', '4', '3', '2', '1'] as const).map((k) => ({ star: k, pct: Math.round((b[k] / total) * 100) }))
})

function message() {
  const p = profile.value
  if (!p) return
  gate(
    async () => {
      try {
        const c = await messageService.startWithSeller(p.username, '')
        await router.push({ name: 'messages', params: { conversationId: c.id } })
      } catch (e) {
        ui.error("Couldn't open a conversation", toApiError(e).message)
      }
    },
    { intent: `To message ${p.displayName}` },
  )
}

function report() {
  gate(() => ui.info('Report received', 'Our Trust & Safety team will review this profile.'), { intent: 'To report this profile' })
}

useSeo(() => ({
  title: profile.value ? `${profile.value.displayName} — verified aviation seller` : 'Seller',
  description: profile.value?.bio ?? undefined,
  type: 'profile',
  canonicalPath: `/seller/${username.value}`,
}))
</script>

<template>
  <div class="pw-sp">
    <ErrorState v-if="state === 'error'" :error="error" not-found-title="We couldn't find that seller" class="pw-container" @retry="reload" />

    <template v-else>
      <div class="pw-sp__cover">
        <AppImage v-if="profile?.coverImage" :media="profile.coverImage" ratio="auto" fit="cover" sizes="100vw" priority />
      </div>
      <div class="pw-container">
        <header class="pw-sp__head">
          <AppAvatar :name="profile?.displayName ?? ''" :size="96" class="pw-sp__avatar" />
          <div class="pw-sp__id">
            <template v-if="profile">
              <h1 class="pw-sp__name">
                {{ profile.displayName }}
                <AppBadge v-if="profile.verified" tone="gold" solid size="sm"><BadgeCheck :size="12" /> Verified seller</AppBadge>
                <AppBadge v-if="profile.isAviator" tone="navy" size="sm">Aviator</AppBadge>
              </h1>
              <p class="pw-sp__meta">
                <span v-if="profile.location"><MapPin :size="14" aria-hidden="true" /> {{ profile.location }}</span>
                <span v-if="profile.jobTitle">{{ profile.jobTitle }}<template v-if="profile.aircraftType"> · {{ profile.aircraftType }}</template></span>
                <span>Member since {{ formatMonthYear(profile.memberSince) }}</span>
                <span v-if="profile.responseTime">Replies in {{ profile.responseTime }}</span>
              </p>
            </template>
            <AppSkeleton v-else width="320px" height="28px" />
          </div>
          <div v-if="profile" class="pw-sp__actions">
            <AppButton variant="secondary" @click="message"><template #icon><MessageCircle :size="16" /></template>Message</AppButton>
            <AppButton :loading="followBusy" @click="toggleFollow">
              <template #icon><Check v-if="profile.isFollowing" :size="16" /><Plus v-else :size="16" /></template>
              {{ profile.isFollowing ? 'Following' : 'Follow' }}
            </AppButton>
            <AppDropdown label="More actions">
              <template #trigger="{ toggle, attrs }">
                <AppButton variant="secondary" icon-only label="More actions" v-bind="attrs" @click="toggle"><MoreHorizontal :size="18" /></AppButton>
              </template>
              <template #items>
                <button type="button" role="menuitem" @click="report"><Flag :size="16" /> Report profile</button>
              </template>
            </AppDropdown>
          </div>
        </header>

        <div v-if="profile" class="pw-sp__stats">
          <StatCard label="Rating" :value="profile.rating.toFixed(1)" :caption="`From ${profile.stats.reviewsCount} reviews`">
            <template #value>{{ profile.rating.toFixed(1) }} <RatingStars :value="profile.rating" :size="13" /></template>
          </StatCard>
          <StatCard label="Trades" :value="String(profile.stats.trades)" :caption="`${profile.stats.onTimeDispatchRate}% on-time dispatch`" />
          <StatCard label="Followers" :value="profile.followers.toLocaleString()" />
          <StatCard label="Response rate" :value="`${profile.responseRate ?? 0}%`" />
        </div>

        <div class="pw-sp__body">
          <div class="pw-sp__main">
            <AppTabs v-model="tab" :items="tabs" label="Seller sections" />
            <div class="pw-sp__panel" role="tabpanel">
              <template v-if="tab === 'listings' || tab === 'sold'">
                <AppEmptyState v-if="listState === 'success' && !listings?.data.length" compact :title="tab === 'sold' ? 'No sold items yet' : 'No live listings'" />
                <ProductGrid v-else :listings="listings?.data ?? []" :loading="listState === 'loading'" variant="compact" :skeletons="8" />
              </template>
              <ul v-else-if="tab === 'reviews'" class="pw-sp__reviews" role="list">
                <li v-for="r in reviews?.data ?? []" :key="r.id" class="pw-card pw-card-pad">
                  <div class="pw-between">
                    <span class="pw-row"><AppAvatar :name="r.author.displayName" :initials="r.author.initials" :size="28" /> <strong>{{ r.author.displayName }}</strong></span>
                    <RatingStars :value="r.rating" />
                  </div>
                  <p class="pw-sp__review-body">{{ r.comment }}</p>
                  <p class="pw-sp__review-date">{{ formatShortDate(r.createdAt) }}</p>
                </li>
              </ul>
              <div v-else class="pw-card pw-card-pad pw-sp__about">
                <p>{{ profile?.bio }}</p>
              </div>
            </div>
          </div>

          <aside v-if="profile" class="pw-card pw-card-pad pw-sp__aside" aria-labelledby="recent-reviews">
            <div class="pw-between">
              <h2 id="recent-reviews" class="pw-card-title">Recent reviews</h2>
              <button type="button" class="pw-link-btn" @click="tab = 'reviews'">See all {{ profile.stats.reviewsCount }}</button>
            </div>
            <div class="pw-sp__score">
              <span class="pw-sp__score-big">{{ profile.rating.toFixed(1) }}</span>
              <ul role="list" class="pw-sp__bars" aria-label="Rating breakdown">
                <li v-for="b in breakdown" :key="b.star">
                  <span>{{ b.star }}</span>
                  <span class="pw-sp__bar"><span :style="{ width: `${b.pct}%` }" /></span>
                  <span class="sr-only">{{ b.pct }}%</span>
                </li>
              </ul>
            </div>
            <ul role="list" class="pw-sp__mini">
              <li v-for="r in (reviews?.data ?? []).slice(0, 3)" :key="r.id">
                <div class="pw-between">
                  <span class="pw-row"><AppAvatar :name="r.author.displayName" :initials="r.author.initials" :size="24" /> {{ r.author.displayName }}</span>
                  <RatingStars :value="r.rating" :size="11" />
                </div>
                <p>{{ r.comment }}</p>
                <small>{{ formatShortDate(r.createdAt) }}</small>
              </li>
            </ul>
          </aside>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.pw-sp {
  padding-bottom: var(--pw-space-16);
}

.pw-sp__cover {
  position: relative;
  height: 140px;
  overflow: hidden;
  background: var(--pw-navy-900);
}

.pw-sp__cover :deep(.pw-img) {
  height: 100%;
}

.pw-sp__cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgb(13 42 87 / 72%);
}

.pw-sp__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--pw-space-4) var(--pw-space-5);
  margin-top: -48px;
  position: relative;
  z-index: 1;
}

.pw-sp__avatar {
  border: 4px solid var(--pw-surface);
  box-shadow: var(--pw-shadow-md);
  font-size: 2rem !important;
}

.pw-sp__id {
  flex: 1 1 320px;
  padding-bottom: var(--pw-space-2);
}

.pw-sp__name {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--pw-space-3);
  font-size: var(--pw-text-2xl);
}

.pw-sp__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pw-space-1) var(--pw-space-4);
  margin-top: var(--pw-space-2);
  font-size: var(--pw-text-sm);
  color: var(--pw-muted);
}

.pw-sp__meta span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.pw-sp__actions {
  display: flex;
  gap: var(--pw-space-2);
  padding-bottom: var(--pw-space-2);
}

.pw-sp__stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--pw-space-4);
  margin: var(--pw-space-6) 0;
}

.pw-sp__body {
  display: grid;
  gap: var(--pw-space-6);
}

.pw-sp__main {
  min-width: 0;
}

.pw-sp__panel {
  padding-top: var(--pw-space-5);
}

.pw-sp__reviews {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-3);
}

.pw-sp__review-body {
  margin-top: var(--pw-space-3);
  color: var(--pw-ink-2);
}

.pw-sp__review-date {
  margin-top: var(--pw-space-2);
  font-size: var(--pw-text-xs);
  color: var(--pw-subtle);
}

.pw-sp__about {
  line-height: var(--pw-leading-relaxed);
}

.pw-sp__aside {
  align-self: start;
}

.pw-sp__score {
  display: flex;
  align-items: center;
  gap: var(--pw-space-5);
  margin: var(--pw-space-4) 0;
  padding-bottom: var(--pw-space-4);
  border-bottom: 1px solid var(--pw-border);
}

.pw-sp__score-big {
  font-family: var(--pw-font-display);
  font-size: 2.5rem;
  font-weight: var(--pw-weight-bold);
}

.pw-sp__bars {
  flex: 1;
  font-size: var(--pw-text-2xs);
  color: var(--pw-muted);
}

.pw-sp__bars li {
  display: flex;
  align-items: center;
  gap: var(--pw-space-2);
}

.pw-sp__bar {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: var(--pw-border);
  overflow: hidden;
}

.pw-sp__bar span {
  display: block;
  height: 100%;
  background: var(--pw-gold-500);
}

.pw-sp__mini {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-4);
  font-size: var(--pw-text-sm);
}

.pw-sp__mini p {
  margin-top: var(--pw-space-2);
  color: var(--pw-ink-2);
}

.pw-sp__mini small {
  color: var(--pw-subtle);
  font-size: var(--pw-text-2xs);
}

@media (min-width: 768px) {
  .pw-sp__cover {
    height: 180px;
  }
  .pw-sp__stats {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1024px) {
  .pw-sp__body {
    grid-template-columns: minmax(0, 1fr) 320px;
  }
}
</style>
