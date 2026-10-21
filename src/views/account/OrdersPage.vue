<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Package } from '@lucide/vue'
import AppTabs from '@/components/common/AppTabs.vue'
import AppImage from '@/components/common/AppImage.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppButton from '@/components/common/AppButton.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import DataTable from '@/components/common/DataTable.vue'
import { orderService } from '@/api/orders.api'
import { useResource } from '@/composables/useResource'
import { useSeo } from '@/composables/useSeo'
import { ORDER_STATUS } from '@/constants/labels'
import { formatMoney } from '@/utils/money'
import { formatShortDate } from '@/utils/date'
import type { Order } from '@/types/order'
import type { Column } from '@/types/ui'

/** Purchases and sales (derived from V5/VB7 styling). */
useSeo({ title: 'Orders', noindex: true })
const route = useRoute()
const role = ref<'buyer' | 'seller'>(route.query.role === 'seller' ? 'seller' : 'buyer')
const status = ref<'active' | 'completed'>('active')
const page = ref(1)

const { data, state, error, reload } = useResource((s) => orderService.list({ role: role.value, status: status.value, page: page.value }, s), {
  watch: [role, status, page],
})

const columns = computed<Column<Order>[]>(() => [
  { key: 'item', label: 'Item' },
  { key: 'number', label: 'Order', hideOnMobile: true },
  { key: 'party', label: role.value === 'buyer' ? 'Seller' : 'Buyer', hideOnMobile: true },
  { key: 'total', label: 'Total', align: 'right' },
  { key: 'status', label: 'Status' },
  { key: 'open', label: '', align: 'right' },
])
</script>

<template>
  <div>
    <header class="pw-page-head">
      <div>
        <h1 class="pw-page-title">Orders</h1>
        <p class="pw-page-sub">Track purchases and sales from payment to landing.</p>
      </div>
    </header>
    <div class="pw-ord__tabs">
      <AppTabs v-model="role" :items="[{ value: 'buyer', label: 'Purchases' }, { value: 'seller', label: 'Sales' }]" label="Order type" />
      <AppTabs v-model="status" variant="pills" :items="[{ value: 'active', label: 'Active' }, { value: 'completed', label: 'Completed' }]" label="Order status" />
    </div>
    <ErrorState v-if="state === 'error'" :error="error" class="pw-card" @retry="reload" />
    <AppEmptyState v-else-if="state === 'success' && !data?.data.length" :icon="Package" :title="role === 'buyer' ? 'No purchases yet' : 'No sales yet'" :body="role === 'buyer' ? 'When you buy gear it appears here with live tracking.' : 'Sales appear here once a buyer pays into escrow.'" class="pw-card">
      <AppButton :to="role === 'buyer' ? { name: 'marketplace' } : { name: 'listing-new' }">{{ role === 'buyer' ? 'Browse the marketplace' : 'List an item' }}</AppButton>
    </AppEmptyState>
    <DataTable v-else :columns="columns" :rows="data?.data ?? []" :loading="state === 'loading'" :caption="role === 'buyer' ? 'Your purchases' : 'Your sales'">
      <template #cell-item="{ row }">
        <div class="pw-ord__item">
          <AppImage :media="row.items[0]?.image" ratio="1" sizes="48px" class="pw-ord__thumb" />
          <span>
            <RouterLink :to="{ name: 'hangar-order', params: { id: row.id } }" class="pw-ord__title">{{ row.items[0]?.title }}</RouterLink>
            <small>Placed {{ formatShortDate(row.placedAt) }}</small>
          </span>
        </div>
      </template>
      <template #cell-number="{ row }"><span class="pw-mono">#{{ row.number }}</span></template>
      <template #cell-party="{ row }">{{ role === 'buyer' ? row.seller.displayName : row.buyer.displayName }}</template>
      <template #cell-total="{ row }"><strong>{{ formatMoney(row.totals.total) }}</strong></template>
      <template #cell-status="{ row }"><StatusBadge :status="ORDER_STATUS[row.status]" /></template>
      <template #cell-open="{ row }"><RouterLink :to="{ name: 'hangar-order', params: { id: row.id } }">{{ row.allowedActions.includes('confirm_delivery') ? 'Confirm' : row.allowedActions.includes('mark_dispatched') ? 'Dispatch' : 'View' }}</RouterLink></template>
      <template v-if="data && data.meta.lastPage > 1" #footer>
        <span>Page {{ data.meta.currentPage }} of {{ data.meta.lastPage }}</span>
        <AppPagination variant="compact" :page="data.meta.currentPage" :last-page="data.meta.lastPage" @change="page = $event" />
      </template>
    </DataTable>
  </div>
</template>

<style scoped>
.pw-ord__tabs {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--pw-space-4);
  margin-bottom: var(--pw-space-5);
}

.pw-ord__item {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  text-align: left;
}

.pw-ord__thumb {
  width: 48px;
  flex: none;
  border-radius: var(--pw-radius-md);
}

.pw-ord__item span {
  display: flex;
  flex-direction: column;
}

.pw-ord__title {
  color: var(--pw-ink);
  font-weight: var(--pw-weight-medium);
}

.pw-ord__item small {
  color: var(--pw-muted);
  font-size: var(--pw-text-xs);
}
</style>
