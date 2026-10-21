<script setup lang="ts">
import { Scale } from '@lucide/vue'
import AppImage from '@/components/common/AppImage.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import { disputeService } from '@/api/account.api'
import { useResource } from '@/composables/useResource'
import { useSeo } from '@/composables/useSeo'
import { DISPUTE_STATUS } from '@/constants/labels'
import { formatMoney } from '@/utils/money'
import { formatShortDate } from '@/utils/date'

useSeo({ title: 'Disputes', noindex: true })
const { data, state, error, reload } = useResource((s) => disputeService.list(s))
</script>

<template>
  <div>
    <header class="pw-page-head">
      <div>
        <h1 class="pw-page-title">Disputes</h1>
        <p class="pw-page-sub">Escrow stays frozen while a mediator reviews. Most cases close within 5 days.</p>
      </div>
    </header>
    <ErrorState v-if="state === 'error'" :error="error" class="pw-card" @retry="reload" />
    <div v-else-if="state === 'loading'" class="pw-stack"><AppSkeleton v-for="n in 2" :key="n" height="88px" radius="var(--pw-radius-lg)" /></div>
    <AppEmptyState v-else-if="!data?.length" :icon="Scale" title="No disputes" body="If an item doesn't arrive or isn't as described, open a dispute from the order within 72 hours of landing." class="pw-card" />
    <ul v-else class="pw-stack" role="list">
      <li v-for="d in data" :key="d.id">
        <RouterLink :to="{ name: 'hangar-dispute', params: { id: d.id } }" class="pw-card pw-card-pad pw-dl-row">
          <AppImage :media="d.item.image" ratio="1" sizes="56px" class="pw-dl-row__img" />
          <span class="pw-dl-row__text">
            <strong>{{ d.reasonLabel }} · #{{ d.number }}</strong>
            <small>{{ d.item.title }} · order #{{ d.orderNumber }} · opened {{ formatShortDate(d.openedAt) }}</small>
          </span>
          <span class="pw-dl-row__right">
            <StatusBadge :status="DISPUTE_STATUS[d.status]" />
            <small>{{ formatMoney(d.escrowFrozen) }} frozen</small>
          </span>
        </RouterLink>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.pw-dl-row {
  display: flex;
  align-items: center;
  gap: var(--pw-space-4);
  color: var(--pw-ink);
}

.pw-dl-row:hover {
  text-decoration: none;
  box-shadow: var(--pw-shadow-md);
}

.pw-dl-row__img {
  width: 56px;
  flex: none;
  border-radius: var(--pw-radius-md);
}

.pw-dl-row__text,
.pw-dl-row__right {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pw-dl-row__text {
  flex: 1;
  min-width: 0;
}

.pw-dl-row__right {
  align-items: flex-end;
}

.pw-dl-row small {
  color: var(--pw-muted);
  font-size: var(--pw-text-xs);
}
</style>
