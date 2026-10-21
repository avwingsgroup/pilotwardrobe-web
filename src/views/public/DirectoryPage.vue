<script setup lang="ts">
import { computed, ref } from 'vue'
import { BadgeCheck, Camera, Plane } from '@lucide/vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import RatingStars from '@/components/common/RatingStars.vue'
import { sellerService } from '@/api/account.api'
import { useResource } from '@/composables/useResource'
import { useSeo } from '@/composables/useSeo'

/** Directory of verified aviators / photographers (derived from VB18/VB19 language). */
const props = defineProps<{ type: 'aviator' | 'photographer' }>()
const page = ref(1)
const copy = computed(() =>
  props.type === 'photographer'
    ? { title: 'Aviation photographers', sub: 'Prints and licences from pilots and spotters who shoot the ramp, airshows and air-to-air.', icon: Camera }
    : { title: 'Verified aviators', sub: 'Licence-verified pilots, crew and engineers trading on Pilotwardrobe.', icon: Plane },
)

const { data, state, error, reload } = useResource((s) => sellerService.directory(props.type, page.value, s), {
  watch: [page, () => props.type],
  isEmpty: (r) => r.data.length === 0,
})

useSeo(() => ({ title: copy.value.title, description: copy.value.sub, canonicalPath: props.type === 'photographer' ? '/photographers' : '/aviators' }))
</script>

<template>
  <div class="pw-container pw-dir">
    <header class="pw-dir__head">
      <h1 class="pw-page-title">{{ copy.title }}</h1>
      <p class="pw-page-sub">{{ copy.sub }}</p>
    </header>

    <ErrorState v-if="state === 'error'" :error="error" @retry="reload" />
    <AppEmptyState v-else-if="state === 'empty'" :icon="copy.icon" title="No profiles yet" body="Check back soon — new sellers are verified every day." class="pw-card" />
    <ul v-else class="pw-dir__grid" role="list" :aria-busy="state === 'loading'">
      <template v-if="state === 'loading'">
        <li v-for="n in 6" :key="n" class="pw-card pw-card-pad"><AppSkeleton :lines="3" /></li>
      </template>
      <li v-for="s in data?.data ?? []" v-else :key="s.id">
        <RouterLink :to="s.isPhotographer ? { name: 'photographer', params: { username: s.username } } : { name: 'seller', params: { username: s.username } }" class="pw-card pw-card-pad pw-dir__card">
          <AppAvatar :name="s.displayName" :initials="s.isOfficialStore ? 'PW' : undefined" :size="52" :tone="s.isPhotographer ? 'gold' : 'navy'" />
          <div class="pw-dir__text">
            <p class="pw-dir__name">{{ s.displayName }} <BadgeCheck v-if="s.verified" :size="16" class="pw-dir__check" aria-label="Verified" /></p>
            <p class="pw-muted">{{ s.location }}</p>
            <RatingStars :value="s.rating" show-value :count="`${s.totalReviews} reviews`" />
          </div>
          <AppBadge v-if="s.isAviator" tone="navy">Aviator</AppBadge>
          <AppBadge v-else-if="s.isPhotographer" tone="gold">Photographer</AppBadge>
        </RouterLink>
      </li>
    </ul>
    <AppPagination v-if="data" class="pw-dir__pages" :page="data.meta.currentPage" :last-page="data.meta.lastPage" @change="page = $event" />
  </div>
</template>

<style scoped>
.pw-dir {
  padding-top: var(--pw-space-8);
  padding-bottom: var(--pw-space-16);
}

.pw-dir__head {
  margin-bottom: var(--pw-space-6);
}

.pw-dir__grid {
  display: grid;
  gap: var(--pw-space-4);
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.pw-dir__card {
  display: flex;
  align-items: center;
  gap: var(--pw-space-4);
  color: var(--pw-ink);
}

.pw-dir__card:hover {
  text-decoration: none;
  box-shadow: var(--pw-shadow-md);
}

.pw-dir__text {
  flex: 1;
  min-width: 0;
  font-size: var(--pw-text-sm);
}

.pw-dir__name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: var(--pw-weight-semibold);
  font-size: var(--pw-text-base);
}

.pw-dir__check {
  color: var(--pw-gold-500);
}

.pw-dir__pages {
  margin-top: var(--pw-space-8);
}
</style>
