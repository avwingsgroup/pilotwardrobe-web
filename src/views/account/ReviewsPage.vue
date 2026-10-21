<script setup lang="ts">
import { ref } from 'vue'
import { Star } from '@lucide/vue'
import AppTabs from '@/components/common/AppTabs.vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import RatingStars from '@/components/common/RatingStars.vue'
import { userService } from '@/api/account.api'
import { useResource } from '@/composables/useResource'
import { useSeo } from '@/composables/useSeo'
import { formatShortDate } from '@/utils/date'

useSeo({ title: 'Reviews', noindex: true })
const role = ref<'received' | 'given'>('received')
const { data, state, error, reload } = useResource((s) => userService.reviews(role.value, s), { watch: [role] })
</script>

<template>
  <div>
    <header class="pw-page-head">
      <div>
        <h1 class="pw-page-title">Reviews</h1>
        <p class="pw-page-sub">Reviews are left after an order lands. They can't be edited once published.</p>
      </div>
    </header>
    <AppTabs v-model="role" :items="[{ value: 'received', label: 'Received' }, { value: 'given', label: 'Given' }]" label="Review type" />
    <div class="pw-rev">
      <ErrorState v-if="state === 'error'" :error="error" class="pw-card" @retry="reload" />
      <template v-else-if="state === 'loading'"><AppSkeleton v-for="n in 3" :key="n" height="110px" radius="var(--pw-radius-lg)" /></template>
      <AppEmptyState v-else-if="!data?.data.length" :icon="Star" title="No reviews yet" body="Reviews appear here after a trade lands and the buyer confirms." class="pw-card" />
      <article v-for="r in data?.data ?? []" v-else :key="r.id" class="pw-card pw-card-pad">
        <div class="pw-between">
          <span class="pw-row"><AppAvatar :name="r.author.displayName" :initials="r.author.initials" :size="32" /> <strong>{{ r.author.displayName }}</strong> <AppBadge tone="neutral">{{ r.role === 'buyer' ? 'Buyer' : 'Seller' }}</AppBadge></span>
          <RatingStars :value="r.rating" :size="14" />
        </div>
        <p class="pw-rev__body">{{ r.comment }}</p>
        <div class="pw-rev__foot">
          <span class="pw-rev__tags"><AppBadge v-for="t in r.tags" :key="t" tone="info">{{ t }}</AppBadge></span>
          <span class="pw-muted">{{ formatShortDate(r.createdAt) }}<template v-if="r.orderId"> · <RouterLink :to="{ name: 'hangar-order', params: { id: r.orderId } }">View order</RouterLink></template></span>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.pw-rev {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-3);
  margin-top: var(--pw-space-5);
}

.pw-rev__body {
  margin: var(--pw-space-3) 0;
  color: var(--pw-ink-2);
}

.pw-rev__foot {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--pw-space-2);
  font-size: var(--pw-text-xs);
}

.pw-rev__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
