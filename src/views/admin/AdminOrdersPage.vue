<script setup lang="ts">
import { useRouter } from 'vue-router'
import { RefreshCw } from '@lucide/vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import TableToolbar from '@/components/admin/TableToolbar.vue'
import FilterSelect from '@/components/admin/FilterSelect.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppImage from '@/components/common/AppImage.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import { adminService } from '@/api/admin.api'
import { toApiError } from '@/api/errors'
import { useAdminTable } from '@/composables/useAdminTable'
import { useCsvExport } from '@/composables/useCsvExport'
import { useResource } from '@/composables/useResource'
import { useUiStore } from '@/stores/ui.store'
import { formatMoney } from '@/utils/money'
import type { AdminOrderRow } from '@/types/admin'
import type { Column } from '@/types/ui'

/** AD7 — orders & escrow. */
const router = useRouter()
const ui = useUiStore()
const t = useAdminTable<AdminOrderRow>((q, s) => adminService.orders(q, s), { filters: { status: '', payment: '', freight: '', amount: '', date: '' } })
const csv = useCsvExport('orders', t.query)
const { data: stats } = useResource((s) => adminService.escrowStats(s))

const columns: Column<AdminOrderRow>[] = [
  { key: 'number', label: 'Order' },
  { key: 'item', label: 'Item' },
  { key: 'buyer', label: 'Buyer', hideOnMobile: true },
  { key: 'seller', label: 'Seller', hideOnMobile: true },
  { key: 'total', label: 'Total', align: 'right', sortable: true },
  { key: 'escrow', label: 'Escrow' },
  { key: 'freight', label: 'Freight', hideOnMobile: true },
  { key: 'age', label: 'Age', sortable: true },
  { key: 'action', label: '', align: 'right' },
]

const tone = (r: AdminOrderRow) =>
  r.escrowStatus === 'on_hold' || r.escrowStatus === 'frozen' ? 'danger' : r.escrowStatus === 'released' ? 'success' : r.escrowLabel.startsWith('Swap') ? 'info' : 'info'

async function reconcile() {
  try {
    await adminService.reconcile()
    ui.success('Reconciliation started', 'Payments are being matched against PSP settlement reports.')
  } catch (e) {
    ui.error('Reconcile failed', toApiError(e).message)
  }
}

const action = (r: AdminOrderRow) => (r.risk === 'high' ? 'Review' : r.escrowStatus === 'frozen' ? 'Case' : r.freightAlert ? 'Nudge' : 'Open')
</script>

<template>
  <div>
    <AdminPageHeader title="Orders & escrow" :subtitle="stats ? `${formatMoney(stats.airborne.held, { whole: true })} held across ${stats.airborne.count + stats.awaitingDispatch.count + stats.landed.count} orders · ${stats.onHold.count} on hold` : ''">
      <AppButton v-can="'orders.manage'" variant="secondary" size="sm" @click="reconcile"><template #icon><RefreshCw :size="14" /></template>Reconcile with PSP</AppButton>
    </AdminPageHeader>

    <div v-if="stats" class="pw-aord__stats">
      <StatCard label="Awaiting wheels-up" :value="String(stats.awaitingDispatch.count)" :caption="stats.awaitingDispatch.detail" tone="red" />
      <StatCard label="Airborne" :value="String(stats.airborne.count)" :caption="`${formatMoney(stats.airborne.held, { whole: true })} held`" tone="navy" />
      <StatCard label="Landed · pending release" :value="String(stats.landed.count)" :caption="stats.landed.detail" tone="gold" />
      <StatCard label="On hold" :value="String(stats.onHold.count)" :caption="stats.onHold.detail" tone="red" />
      <StatCard label="Released (30d)" :value="stats.released30d.count.toLocaleString()" :caption="formatMoney(stats.released30d.amount, { whole: true })" tone="green" />
    </div>

    <TableToolbar v-model:search="t.search.value" placeholder="Order ID, tracking no., buyer, seller" exportable :exporting="csv.exporting.value" @export="csv.run">
      <FilterSelect v-model="t.filters.status" label="Status" :options="[{ value: 'awaiting_dispatch', label: 'Awaiting wheels-up' }, { value: 'in_transit', label: 'Airborne' }, { value: 'disputed', label: 'Disputed' }, { value: 'on_hold', label: 'On hold' }, { value: 'completed', label: 'Completed' }]" />
      <FilterSelect v-model="t.filters.payment" label="Payment" :options="['paystack', 'flutterwave', 'monnify', 'stripe', 'paypal'].map((v) => ({ value: v, label: v[0]!.toUpperCase() + v.slice(1) }))" />
      <FilterSelect v-model="t.filters.freight" label="Freight" :options="[{ value: 'pw', label: 'PW Freight' }, { value: 'self', label: 'Self-ship' }, { value: 'handoff', label: 'Hand-off' }]" />
      <FilterSelect v-model="t.filters.amount" label="Amount" :options="[{ value: 'over_1000', label: 'Over $1,000' }, { value: 'under_100', label: 'Under $100' }]" />
      <FilterSelect v-model="t.filters.date" label="Date" :options="[{ value: '24h', label: 'Last 24h' }, { value: '7d', label: 'Last 7 days' }]" />
    </TableToolbar>

    <ErrorState v-if="t.state.value === 'error'" :error="t.error.value" class="pw-card" @retry="t.reload" />
    <DataTable
      v-else
      :columns="columns"
      :rows="t.rows.value"
      :loading="t.state.value === 'loading' || t.refreshing.value"
      :sort="t.sort.value"
      dense
      caption="Orders"
      :row-class="(r) => (r.risk === 'high' ? 'is-highlight' : undefined)"
      @sort="t.toggleSort"
      @row-click="(r) => router.push({ name: 'admin-order', params: { id: r.id } })"
    >
      <template #cell-number="{ row }"><span class="pw-mono">#{{ row.number }}</span></template>
      <template #cell-item="{ row }"><span class="pw-aord__item"><AppImage :media="row.itemImage" ratio="1" sizes="28px" class="pw-aord__thumb" /> {{ row.itemTitle }}</span></template>
      <template #cell-buyer="{ row }">{{ row.buyerName }}</template>
      <template #cell-seller="{ row }">{{ row.sellerName }}</template>
      <template #cell-total="{ row }"><strong>{{ formatMoney(row.total) }}</strong></template>
      <template #cell-escrow="{ row }"><AppBadge :tone="tone(row)">{{ row.escrowLabel }}</AppBadge></template>
      <template #cell-freight="{ row }"><span :class="{ 'pw-aord__alert': row.freightAlert }">{{ row.freightLabel }}</span></template>
      <template #cell-age="{ row }">{{ row.ageLabel }}</template>
      <template #cell-action="{ row }"><RouterLink :to="{ name: 'admin-order', params: { id: row.id } }" @click.stop>{{ action(row) }}</RouterLink></template>
      <template v-if="t.meta.value && t.meta.value.lastPage > 1" #footer>
        <span>{{ t.meta.value.total }} orders</span>
        <AppPagination variant="compact" :page="t.meta.value.currentPage" :last-page="t.meta.value.lastPage" @change="t.page.value = $event" />
      </template>
    </DataTable>
  </div>
</template>

<style scoped>
.pw-aord__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--pw-space-3);
  margin-bottom: var(--pw-space-5);
}

.pw-aord__item {
  display: inline-flex;
  align-items: center;
  gap: var(--pw-space-2);
}

.pw-aord__thumb {
  width: 28px;
  flex: none;
  border-radius: var(--pw-radius-xs);
}

.pw-aord__alert {
  color: var(--pw-danger-600);
  font-weight: var(--pw-weight-semibold);
}
</style>
