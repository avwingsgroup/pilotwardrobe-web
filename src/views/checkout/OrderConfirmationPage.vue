<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Check, Ruler, Send } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import AppImage from '@/components/common/AppImage.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import { orderService } from '@/api/orders.api'
import { useResource } from '@/composables/useResource'
import { useSeo } from '@/composables/useSeo'
import { useAuthStore } from '@/stores/auth.store'
import { CONDITION_LABELS } from '@/constants/labels'
import { formatMoney } from '@/utils/money'
import { formatDayDate, formatShortDate } from '@/utils/date'

/** VB9 — "Cleared for takeoff". Shown only after Laravel verified the payment. */
useSeo({ title: 'Cleared for takeoff', noindex: true })
const route = useRoute()
const auth = useAuthStore()
const id = computed(() => String(route.params.id))
const { data: order, state, error, reload } = useResource((s) => orderService.get(id.value, s))
</script>

<template>
  <div class="pw-container pw-ok">
    <ErrorState v-if="state === 'error'" :error="error" class="pw-card" @retry="reload" />
    <AppSkeleton v-else-if="!order" height="360px" radius="var(--pw-radius-lg)" />
    <div v-else class="pw-ok__inner">
      <span class="pw-ok__check" aria-hidden="true"><Check :size="36" :stroke-width="3" /></span>
      <h1 class="pw-ok__title">Cleared for takeoff</h1>
      <p class="pw-ok__sub">Order #{{ order.number }} is paid and held in escrow. We've emailed your receipt to {{ auth.user?.email }}.</p>
      <div class="pw-card pw-ok__card">
        <div v-for="item in order.items" :key="item.id" class="pw-ok__item">
          <AppImage :media="item.image" ratio="1" sizes="64px" class="pw-ok__img" />
          <div>
            <p class="pw-ok__name">{{ item.title }}</p>
            <p class="pw-muted pw-ok__small">Sold by {{ order.seller.displayName }}<template v-if="item.condition"> · {{ CONDITION_LABELS[item.condition].label }}</template></p>
          </div>
          <strong class="pw-ok__price">{{ formatMoney(order.totals.total) }}</strong>
        </div>
        <dl class="pw-ok__facts">
          <div><dt>{{ order.dispatchBy ? formatDayDate(order.dispatchBy) : 'Instant' }}</dt><dd>{{ order.dispatchBy ? 'Seller dispatches by' : 'Digital delivery' }}</dd></div>
          <div v-if="order.estimatedDelivery"><dt>{{ formatShortDate(order.estimatedDelivery.from) }} – {{ formatShortDate(order.estimatedDelivery.to) }}</dt><dd>Estimated landing</dd></div>
          <div><dt>Until you confirm</dt><dd>Escrow protection</dd></div>
        </dl>
      </div>
      <div class="pw-ok__actions">
        <AppButton :to="{ name: 'hangar-order', params: { id: order.id } }"><template #icon><Send :size="16" /></template>Track this order</AppButton>
        <AppButton variant="secondary" :to="{ name: 'marketplace' }">Continue browsing</AppButton>
      </div>
      <p class="pw-ok__tip"><Ruler :size="14" aria-hidden="true" /> Tip: add this item's fit notes to your <RouterLink :to="{ name: 'hangar-fit-kit' }">Fit Kit</RouterLink> once it lands.</p>
    </div>
  </div>
</template>

<style scoped>
.pw-ok {
  padding-top: var(--pw-space-12);
  padding-bottom: var(--pw-space-16);
}

.pw-ok__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.pw-ok__check {
  display: grid;
  place-items: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: var(--pw-success-600);
  color: #fff;
  box-shadow: 0 0 0 10px var(--pw-success-100);
}

.pw-ok__title {
  margin-top: var(--pw-space-6);
  font-size: clamp(1.75rem, 3vw, 2.25rem);
}

.pw-ok__sub {
  margin-top: var(--pw-space-3);
  color: var(--pw-muted);
}

.pw-ok__card {
  width: 100%;
  max-width: 720px;
  margin-top: var(--pw-space-6);
  padding: var(--pw-space-5);
  text-align: left;
}

.pw-ok__item {
  display: flex;
  align-items: center;
  gap: var(--pw-space-4);
  padding-bottom: var(--pw-space-4);
  border-bottom: 1px solid var(--pw-border);
}

.pw-ok__img {
  width: 64px;
  flex: none;
  border-radius: var(--pw-radius-md);
}

.pw-ok__item > div {
  flex: 1;
}

.pw-ok__name {
  font-weight: var(--pw-weight-semibold);
  font-size: var(--pw-text-sm);
}

.pw-ok__small {
  font-size: var(--pw-text-xs);
}

.pw-ok__price {
  font-family: var(--pw-font-display);
  font-size: 1.375rem;
}

.pw-ok__facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--pw-space-4);
  margin: var(--pw-space-4) 0 0;
}

.pw-ok__facts dt {
  font-weight: var(--pw-weight-semibold);
  font-size: var(--pw-text-sm);
}

.pw-ok__facts dd {
  margin: 0;
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-ok__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--pw-space-3);
  margin-top: var(--pw-space-6);
}

.pw-ok__tip {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: var(--pw-space-5);
  font-size: var(--pw-text-sm);
  color: var(--pw-muted);
}
</style>
