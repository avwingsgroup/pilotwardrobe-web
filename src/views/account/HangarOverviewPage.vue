<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronRight, CircleCheck, Clock, Plus, Send, ShieldCheck } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import AppTabs from '@/components/common/AppTabs.vue'
import AppImage from '@/components/common/AppImage.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import DataTable from '@/components/common/DataTable.vue'
import type { Column } from '@/types/ui'
import StatCard from '@/components/dashboard/StatCard.vue'
import WithdrawModal from '@/components/payments/WithdrawModal.vue'
import { hangarService } from '@/api/account.api'
import { useResource } from '@/composables/useResource'
import { useSeo } from '@/composables/useSeo'
import { useAuthStore } from '@/stores/auth.store'
import { formatMoney } from '@/utils/money'
import { formatMonthYear } from '@/utils/date'
import type { HangarSummary } from '@/types/wallet'

/** V5 — My Hangar overview: actionable items first, then KPIs, wallet and a unified listings/orders feed. */
useSeo({ title: 'My Hangar', noindex: true })
const auth = useAuthStore()
const { data, state, error, reload } = useResource((s) => hangarService.summary(s))
const tab = ref<'all' | 'live' | 'airborne' | 'landed' | 'drafts'>('all')
const withdrawOpen = ref(false)

type FeedRow = HangarSummary['feed'][number]
const rows = computed<FeedRow[]>(() => (data.value?.feed ?? []).filter((r) => tab.value === 'all' || r.bucket === tab.value))
const columns: Column<FeedRow>[] = [
  { key: 'item', label: 'Item' },
  { key: 'price', label: 'Price', align: 'right' },
  { key: 'status', label: 'Status' },
  { key: 'next', label: 'Next action', hideOnMobile: true },
  { key: 'manage', label: '', align: 'right' },
]

const icons = { warning: Clock, info: Send, success: CircleCheck }
const walletPct = computed(() => {
  const w = data.value?.wallet
  return w && w.total.amount ? Math.round((w.available.amount / w.total.amount) * 100) : 0
})
</script>

<template>
  <div>
    <header class="pw-page-head">
      <div>
        <h1 class="pw-page-title">My Hangar</h1>
        <p class="pw-page-sub">
          {{ auth.displayName }}<template v-if="data?.verifiedSeller"> · verified seller since {{ formatMonthYear(data.sellerSince ?? auth.user?.memberSince ?? '') }}</template>
        </p>
      </div>
      <div class="pw-page-head__actions">
        <AppButton :to="{ name: 'listing-new' }"><template #icon><Plus :size="18" /></template>New listing</AppButton>
      </div>
    </header>

    <ErrorState v-if="state === 'error'" :error="error" class="pw-card" @retry="reload" />

    <template v-else>
      <div v-if="!auth.kycApproved" class="pw-hov__kyc" role="note">
        <ShieldCheck :size="20" aria-hidden="true" />
        <p><strong>Verify your identity to sell without limits.</strong> Unverified accounts are capped at 3 live listings and $500 withdrawals.</p>
        <AppButton size="sm" :to="{ name: 'hangar-verification' }">Verify now</AppButton>
      </div>

      <div class="pw-hov__stats">
        <template v-if="data">
          <StatCard label="In escrow" :value="formatMoney(data.stats.inEscrow)" :caption="`${data.stats.escrowOrders} orders airborne`" tone="navy" trend />
          <StatCard label="Available to pay out" :value="formatMoney(data.stats.availableToPayOut)" :caption="`+ ${formatMoney(data.stats.weekDelta)} this week`" tone="green" trend />
          <StatCard label="Listings live" :value="String(data.stats.liveListings)" :caption="`${data.stats.listingsNeedPhotos} need photos`" tone="gold" trend />
          <StatCard label="Seller rating" :value="data.stats.sellerRating.toFixed(1)" :caption="`from ${data.stats.previousRating.toFixed(1)}`" tone="green" trend />
        </template>
        <template v-else>
          <AppSkeleton v-for="n in 4" :key="n" height="106px" radius="var(--pw-radius-lg)" />
        </template>
      </div>

      <div class="pw-hov__mid">
        <section class="pw-card pw-card-pad" aria-labelledby="attention">
          <div class="pw-between pw-hov__sec-head">
            <h2 id="attention" class="pw-card-title">Needs your attention</h2>
            <RouterLink :to="{ name: 'notifications' }" class="pw-hov__viewall">View all</RouterLink>
          </div>
          <ul v-if="data" class="pw-hov__attention" role="list">
            <li v-for="a in data.attention" :key="a.id">
              <RouterLink :to="a.to" class="pw-hov__att" :class="`is-${a.tone}`">
                <component :is="icons[a.tone]" :size="18" aria-hidden="true" />
                <span class="pw-hov__att-text"><strong>{{ a.title }}</strong><span>{{ a.detail }}</span></span>
                <ChevronRight :size="18" aria-hidden="true" />
              </RouterLink>
            </li>
            <li v-if="!data.attention.length" class="pw-muted">You're all caught up. Clear skies.</li>
          </ul>
          <AppSkeleton v-else :lines="3" height="56px" />
        </section>

        <section class="pw-hov__wallet" aria-labelledby="wallet-title">
          <p id="wallet-title" class="pw-hov__wallet-label">Wallet</p>
          <p class="pw-hov__wallet-total">{{ data ? formatMoney(data.wallet.total) : '—' }}</p>
          <p class="pw-hov__wallet-sub">{{ data ? `${formatMoney(data.wallet.available)} available · ${formatMoney(data.wallet.inEscrow)} in escrow` : '' }}</p>
          <div class="pw-hov__bar" role="progressbar" :aria-valuenow="walletPct" aria-valuemin="0" aria-valuemax="100" aria-label="Share of wallet available to withdraw">
            <span :style="{ width: `${walletPct}%` }" />
          </div>
          <div class="pw-hov__wallet-actions">
            <AppButton variant="inverse" block @click="withdrawOpen = true">Withdraw</AppButton>
            <AppButton variant="inverse-outline" block :to="{ name: 'hangar-wallet' }">Statements</AppButton>
          </div>
          <p class="pw-hov__wallet-note"><ShieldCheck :size="14" aria-hidden="true" /> Escrow funds unlock 72h after the buyer confirms goods landed.</p>
        </section>
      </div>

      <section class="pw-hov__feed" aria-labelledby="feed-title">
        <div class="pw-hov__feed-head">
          <h2 id="feed-title" class="pw-card-title">Listings &amp; orders</h2>
          <AppTabs
            v-model="tab"
            variant="pills"
            label="Filter listings and orders"
            :items="[
              { value: 'all', label: 'All' },
              { value: 'live', label: 'Live' },
              { value: 'airborne', label: 'Airborne' },
              { value: 'landed', label: 'Landed' },
              { value: 'drafts', label: 'Drafts' },
            ]"
          />
        </div>
        <DataTable :columns="columns" :rows="rows" :loading="state === 'loading'" caption="Your listings and orders">
          <template #cell-item="{ row }">
            <div class="pw-hov__item">
              <AppImage :media="row.image" ratio="1" sizes="52px" class="pw-hov__thumb" />
              <span><strong>{{ row.title }}</strong><small>{{ row.subtitle }}</small></span>
            </div>
          </template>
          <template #cell-price="{ row }"><strong>{{ formatMoney(row.price) }}</strong></template>
          <template #cell-status="{ row }"><AppBadge :tone="row.status.tone">{{ row.status.label }}</AppBadge></template>
          <template #cell-next="{ row }"><span class="pw-muted">{{ row.nextAction }}</span></template>
          <template #cell-manage="{ row }"><RouterLink :to="row.to" class="pw-hov__manage">Manage</RouterLink></template>
          <template #empty>Nothing here yet. <RouterLink :to="{ name: 'listing-new' }">List your first item</RouterLink> — it takes about 4 minutes.</template>
        </DataTable>
      </section>
    </template>

    <WithdrawModal :open="withdrawOpen" @close="withdrawOpen = false" @done="reload" />
  </div>
</template>

<style scoped>
.pw-hov__kyc {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--pw-space-3);
  margin-bottom: var(--pw-space-5);
  padding: var(--pw-space-4);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-warning-100);
  color: var(--pw-warning-700);
}

.pw-hov__kyc p {
  flex: 1 1 280px;
  font-size: var(--pw-text-sm);
}

.pw-hov__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--pw-space-4);
}

.pw-hov__mid {
  display: grid;
  gap: var(--pw-space-5);
  margin: var(--pw-space-5) 0;
}

.pw-hov__sec-head {
  margin-bottom: var(--pw-space-4);
}

.pw-hov__viewall {
  font-size: var(--pw-text-sm);
}

.pw-hov__attention {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-3);
}

.pw-hov__att {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  padding: var(--pw-space-3) var(--pw-space-4);
  border-radius: var(--pw-radius-md);
  color: var(--pw-ink);
}

.pw-hov__att:hover {
  text-decoration: none;
  filter: brightness(0.98);
}

.pw-hov__att.is-warning {
  background: var(--pw-warning-100);
}
.pw-hov__att.is-warning > svg:first-child,
.pw-hov__att.is-warning strong {
  color: var(--pw-warning-600);
}
.pw-hov__att.is-info {
  background: var(--pw-navy-100);
}
.pw-hov__att.is-info > svg:first-child,
.pw-hov__att.is-info strong {
  color: var(--pw-navy-700);
}
.pw-hov__att.is-success {
  background: var(--pw-success-100);
}
.pw-hov__att.is-success > svg:first-child,
.pw-hov__att.is-success strong {
  color: var(--pw-success-600);
}

.pw-hov__att-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  font-size: var(--pw-text-sm);
}

.pw-hov__att-text strong {
  font-weight: var(--pw-weight-medium);
}

.pw-hov__att-text span {
  font-size: var(--pw-text-xs);
  color: var(--pw-ink-2);
}

.pw-hov__wallet {
  padding: var(--pw-space-5);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-navy-900);
  color: rgb(255 255 255 / 82%);
}

.pw-hov__wallet-label {
  font-size: var(--pw-text-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.pw-hov__wallet-total {
  margin-top: var(--pw-space-2);
  font-family: var(--pw-font-display);
  font-size: 2rem;
  font-weight: var(--pw-weight-bold);
  color: #fff;
  font-variant-numeric: tabular-nums;
}

.pw-hov__wallet-sub {
  font-size: var(--pw-text-xs);
}

.pw-hov__bar {
  height: 6px;
  margin: var(--pw-space-5) 0;
  border-radius: 3px;
  background: rgb(255 255 255 / 25%);
  overflow: hidden;
}

.pw-hov__bar span {
  display: block;
  height: 100%;
  background: var(--pw-gold-500);
}

.pw-hov__wallet-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--pw-space-3);
}

.pw-hov__wallet-note {
  display: flex;
  align-items: center;
  gap: var(--pw-space-2);
  margin-top: var(--pw-space-5);
  padding-top: var(--pw-space-4);
  border-top: 1px solid rgb(255 255 255 / 12%);
  font-size: var(--pw-text-xs);
}

.pw-hov__wallet-note svg {
  color: var(--pw-gold-500);
}

.pw-hov__feed-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--pw-space-4);
  margin-bottom: var(--pw-space-4);
}

.pw-hov__item {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  text-align: left;
}

.pw-hov__thumb {
  width: 52px;
  flex: none;
  border-radius: var(--pw-radius-md);
}

.pw-hov__item span {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pw-hov__item strong {
  font-weight: var(--pw-weight-medium);
}

.pw-hov__item small {
  color: var(--pw-muted);
  font-size: var(--pw-text-xs);
}

.pw-hov__manage {
  font-weight: var(--pw-weight-semibold);
}

@media (min-width: 1280px) {
  .pw-hov__stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .pw-hov__mid {
    grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr);
  }
}
</style>
