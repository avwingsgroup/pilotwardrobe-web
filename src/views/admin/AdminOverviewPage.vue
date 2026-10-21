<script setup lang="ts">
import { computed, ref } from 'vue'
import { Activity, Banknote, ChevronRight, Download, Flag, Scale, ShieldCheck, Tag } from '@lucide/vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import FilterSelect from '@/components/admin/FilterSelect.vue'
import LineChart from '@/components/admin/LineChart.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppImage from '@/components/common/AppImage.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import DataTable from '@/components/common/DataTable.vue'
import { adminService } from '@/api/admin.api'
import { toApiError } from '@/api/errors'
import { useResource } from '@/composables/useResource'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { formatMoney } from '@/utils/money'
import type { AdminOrderRow, WorkQueue } from '@/types/admin'
import type { Column } from '@/types/ui'

const auth = useAuthStore()
const ui = useUiStore()
const range = ref('30d')
const { data, state, error, reload } = useResource((s) => adminService.overview(range.value, s), { watch: [range] })

const greeting = computed(() => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
})
const queues = computed(() => (data.value?.queues ?? []).filter((q) => auth.can(q.permission)))
const QUEUE_ICON: Record<WorkQueue['key'], unknown> = { kyc: ShieldCheck, disputes: Scale, reports: Flag, listings: Tag, payouts: Banknote }
const KPI_COLOR = { gmv: '#16386e', escrow: '#16386e', revenue: '#1c8a52', active_users: '#16386e', dispute_rate: '#b7791f' }

const columns: Column<AdminOrderRow>[] = [
  { key: 'number', label: 'Order' },
  { key: 'item', label: 'Item' },
  { key: 'parties', label: 'Buyer → seller', hideOnMobile: true },
  { key: 'total', label: 'Amount', align: 'right' },
  { key: 'status', label: 'Status' },
  { key: 'risk', label: 'Risk' },
]

async function download() {
  try {
    const { url } = await adminService.exportCsv('overview', { range: range.value })
    ui.success('Report ready', url)
  } catch (e) {
    ui.error('Export failed', toApiError(e).message)
  }
}
</script>

<template>
  <div>
    <AdminPageHeader :title="`${greeting}, ${data?.greetingName ?? auth.user?.firstName ?? ''}`" :subtitle="`${new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · ${data?.periodLabel ?? ''}`">
      <FilterSelect v-model="range" label="Last 30 days" :options="[{ value: '7d', label: 'Last 7 days' }, { value: '90d', label: 'Last 90 days' }]" />
      <AppButton variant="secondary" size="sm" @click="download"><template #icon><Download :size="14" /></template>Download report</AppButton>
    </AdminPageHeader>

    <ErrorState v-if="state === 'error'" :error="error" class="pw-card" @retry="reload" />
    <template v-else>
      <div class="pw-ao__kpis">
        <template v-if="data">
          <div v-for="k in data.kpis" :key="k.key" class="pw-card pw-ao__kpi">
            <p class="pw-eyebrow">{{ k.label }}</p>
            <p class="pw-ao__kpi-value">{{ k.value }} <span :class="k.positive ? 'is-up' : 'is-down'">{{ k.delta }}</span></p>
            <LineChart :series="[{ name: k.label, values: k.sparkline, color: KPI_COLOR[k.key], area: true }]" :height="40" sparkline :title="`${k.label} trend`" />
          </div>
        </template>
        <AppSkeleton v-for="n in 5" v-else :key="n" height="116px" radius="var(--pw-radius-lg)" />
      </div>

      <div class="pw-ao__grid">
        <section class="pw-card pw-card-pad" aria-labelledby="gmv">
          <div class="pw-between">
            <h2 id="gmv" class="pw-card-title">GMV &amp; orders · daily</h2>
            <RouterLink v-can="'analytics.view'" :to="{ name: 'admin-analytics' }" class="pw-ao__link">Analytics</RouterLink>
          </div>
          <p class="pw-ao__legend"><span class="is-navy" /> GMV <span class="is-gold" /> Orders</p>
          <LineChart
            v-if="data"
            :series="[
              { name: 'GMV', values: data.series.map((p) => p.gmv), color: '#16386e', area: true },
              { name: 'Orders', values: data.series.map((p) => p.orders), color: '#c9a227' },
            ]"
            :labels="data.series.filter((_, i) => i % 7 === 0).map((p) => new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))"
            :height="220"
            title="Daily GMV and orders"
          />
          <AppSkeleton v-else height="220px" />
        </section>

        <section class="pw-card pw-card-pad" aria-labelledby="queues">
          <h2 id="queues" class="pw-card-title">Work queues</h2>
          <ul class="pw-ao__queues" role="list">
            <li v-for="q in queues" :key="q.key">
              <RouterLink :to="q.to" class="pw-ao__queue">
                <span class="pw-ao__qicon" :class="`is-${q.key}`"><component :is="QUEUE_ICON[q.key]" :size="16" aria-hidden="true" /></span>
                <span class="pw-ao__qtext"><strong>{{ q.label }}</strong><small>{{ q.detail }}</small></span>
                <span class="pw-ao__qcount">{{ q.count }}</span>
                <ChevronRight :size="16" aria-hidden="true" />
              </RouterLink>
            </li>
          </ul>
        </section>

        <section class="pw-ao__orders" aria-labelledby="latest">
          <div class="pw-between pw-ao__orders-head">
            <h2 id="latest" class="pw-card-title">Latest orders</h2>
            <RouterLink :to="{ name: 'admin-orders' }" class="pw-ao__link">View all</RouterLink>
          </div>
          <DataTable :columns="columns" :rows="data?.latestOrders ?? []" :loading="!data" dense caption="Latest orders" :row-class="(r) => (r.risk === 'high' ? 'is-highlight' : undefined)">
            <template #cell-number="{ row }"><RouterLink :to="{ name: 'admin-order', params: { id: row.id } }" class="pw-mono">#{{ row.number }}</RouterLink></template>
            <template #cell-item="{ row }"><span class="pw-row"><AppImage :media="row.itemImage" ratio="1" sizes="28px" class="pw-ao__thumb" /> {{ row.itemTitle }}</span></template>
            <template #cell-parties="{ row }">{{ row.buyerName }} → {{ row.sellerName }}</template>
            <template #cell-total="{ row }"><strong>{{ formatMoney(row.total) }}</strong></template>
            <template #cell-status="{ row }"><AppBadge :tone="row.escrowStatus === 'on_hold' ? 'danger' : row.status === 'awaiting_dispatch' ? 'warning' : 'info'">{{ row.escrowLabel === 'Held' ? (row.status === 'in_transit' ? 'Airborne' : 'In escrow') : row.escrowLabel }}</AppBadge></template>
            <template #cell-risk="{ row }"><AppBadge :tone="row.risk === 'high' ? 'danger' : row.risk === 'medium' ? 'warning' : 'success'">{{ row.risk }}</AppBadge></template>
          </DataTable>
        </section>

        <section class="pw-ao__risk" aria-labelledby="risk">
          <p id="risk" class="pw-ao__risk-title"><Activity :size="14" aria-hidden="true" /> Risk signals · last 24h</p>
          <ul role="list">
            <li v-for="r in data?.riskSignals ?? []" :key="r.id">
              <strong>{{ r.title }}</strong>
              <small>{{ r.detail }}</small>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.pw-ao__kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--pw-space-3);
  margin-bottom: var(--pw-space-4);
}

.pw-ao__kpi {
  padding: var(--pw-space-4);
}

.pw-ao__kpi-value {
  display: flex;
  align-items: baseline;
  gap: var(--pw-space-2);
  margin: var(--pw-space-2) 0;
  font-family: var(--pw-font-display);
  font-size: 1.5rem;
  font-weight: var(--pw-weight-bold);
}

.pw-ao__kpi-value span {
  font-family: var(--pw-font-body);
  font-size: var(--pw-text-xs);
  font-weight: var(--pw-weight-semibold);
}

.is-up {
  color: var(--pw-success-600);
}

.is-down {
  color: var(--pw-warning-600);
}

.pw-ao__grid {
  display: grid;
  gap: var(--pw-space-4);
}

.pw-ao__link {
  font-size: var(--pw-text-sm);
}

.pw-ao__legend {
  display: flex;
  align-items: center;
  gap: var(--pw-space-2);
  margin: var(--pw-space-2) 0 var(--pw-space-4);
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-ao__legend span {
  width: 10px;
  height: 3px;
  border-radius: 2px;
}

.pw-ao__legend .is-navy {
  background: var(--pw-navy-700);
}

.pw-ao__legend .is-gold {
  margin-left: var(--pw-space-2);
  background: var(--pw-gold-500);
}

.pw-ao__queues {
  margin-top: var(--pw-space-3);
}

.pw-ao__queue {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  padding: var(--pw-space-3) 0;
  border-bottom: 1px solid var(--pw-border);
  color: var(--pw-ink);
}

.pw-ao__queue:hover {
  text-decoration: none;
  background: var(--pw-surface-sunken);
}

.pw-ao__qicon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--pw-radius-md);
  background: var(--pw-warning-100);
  color: var(--pw-warning-600);
}

.pw-ao__qicon.is-disputes,
.pw-ao__qicon.is-reports {
  background: var(--pw-danger-100);
  color: var(--pw-danger-600);
}

.pw-ao__qicon.is-listings {
  background: var(--pw-navy-100);
  color: var(--pw-navy-700);
}

.pw-ao__qicon.is-payouts {
  background: var(--pw-success-100);
  color: var(--pw-success-600);
}

.pw-ao__qtext {
  flex: 1;
  display: flex;
  flex-direction: column;
  font-size: var(--pw-text-sm);
}

.pw-ao__qtext small {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-ao__qcount {
  font-family: var(--pw-font-display);
  font-size: var(--pw-text-lg);
  font-weight: var(--pw-weight-bold);
}

.pw-ao__orders {
  min-width: 0;
}

.pw-ao__orders-head {
  margin-bottom: var(--pw-space-3);
}

.pw-ao__thumb {
  width: 28px;
  flex: none;
  border-radius: var(--pw-radius-xs);
}

.pw-ao__risk {
  align-self: start;
  padding: var(--pw-space-5);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-navy-900);
  color: rgb(255 255 255 / 80%);
}

.pw-ao__risk-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: var(--pw-space-3);
  color: var(--pw-gold-400);
  font-size: var(--pw-text-2xs);
  font-weight: var(--pw-weight-bold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.pw-ao__risk li {
  display: flex;
  flex-direction: column;
  padding: var(--pw-space-3) 0;
  border-bottom: 1px solid rgb(255 255 255 / 10%);
  font-size: var(--pw-text-sm);
}

.pw-ao__risk strong {
  color: #fff;
}

.pw-ao__risk small {
  font-size: var(--pw-text-xs);
}

@media (min-width: 1100px) {
  .pw-ao__grid {
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  }
}
</style>
