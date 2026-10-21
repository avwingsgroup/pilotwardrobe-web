<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check } from '@lucide/vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import ReasonDialog from '@/components/admin/ReasonDialog.vue'
import AppTabs from '@/components/common/AppTabs.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppConfirmDialog from '@/components/common/AppConfirmDialog.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import { adminService } from '@/api/admin.api'
import { toApiError } from '@/api/errors'
import { useAdminTable } from '@/composables/useAdminTable'
import { useResource } from '@/composables/useResource'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { formatMoney } from '@/utils/money'
import type { PayoutRow } from '@/types/admin'
import type { Column } from '@/types/ui'

/** AD11 — payouts. Over $2,000 needs a second approver; flagged rows must be handled individually. */
const auth = useAuthStore()
const ui = useUiStore()
const t = useAdminTable<PayoutRow>((q, s) => adminService.payouts(q, s), { tab: 'awaiting_approval' })
const { data: stats, reload: reloadStats } = useResource((s) => adminService.payoutStats(s))
const busy = ref(false)
const batchOpen = ref(false)
const rejecting = ref<PayoutRow | null>(null)
const holding = ref<PayoutRow | null>(null)

const tabs = computed(() => [
  { value: 'awaiting_approval', label: `Needs approval ${t.counts.value.awaiting_approval ?? ''}` },
  { value: 'processing', label: `Processing ${t.counts.value.processing ?? ''}` },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: `Failed ${t.counts.value.failed ?? ''}` },
])

const columns: Column<PayoutRow>[] = [
  { key: 'seller', label: 'Seller' },
  { key: 'amount', label: 'Amount', align: 'right', sortable: true },
  { key: 'destination', label: 'Destination', hideOnMobile: true },
  { key: 'reason', label: 'Reason for review' },
  { key: 'requested', label: 'Requested', hideOnMobile: true },
  { key: 'actions', label: '', align: 'right' },
]

const selectable = computed(() => t.selected.value.filter((id) => !t.rows.value.find((r) => r.id === id)?.flagged))

async function approve(ids: string[]) {
  busy.value = true
  try {
    const res = await adminService.approvePayouts(ids)
    ui.success(res.status === 'pending_approval' ? 'Approved — some payouts need a second approver' : `${ids.length} payout${ids.length === 1 ? '' : 's'} approved`)
    t.selected.value = []
    void t.reload()
    void reloadStats()
  } catch (e) {
    ui.error('Approval failed', toApiError(e).message)
  } finally {
    busy.value = false
  }
}

async function act(kind: 'hold' | 'reject', reason: string) {
  const row = kind === 'hold' ? holding.value : rejecting.value
  if (!row) return
  busy.value = true
  try {
    await (kind === 'hold' ? adminService.holdPayout(row.id, reason) : adminService.rejectPayout(row.id, reason))
    ui.success(kind === 'hold' ? 'Payout held' : 'Payout rejected')
    holding.value = null
    rejecting.value = null
    void t.reload()
  } catch (e) {
    ui.error('Action failed', toApiError(e).message)
  } finally {
    busy.value = false
  }
}

async function runBatch() {
  busy.value = true
  try {
    await adminService.runPayoutBatch()
    ui.success('Batch started', 'Approved payouts are being sent to Paystack and Wise.')
    batchOpen.value = false
  } catch (e) {
    ui.error('Batch failed', toApiError(e).message)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div>
    <AdminPageHeader title="Payouts" :subtitle="stats ? `Next automatic batch: ${stats.nextBatch}` : ''">
      <AppButton v-can="'payouts.approve'" variant="secondary" size="sm" @click="batchOpen = true">Run batch now</AppButton>
      <AppButton v-can="'payouts.approve'" variant="success" size="sm" :disabled="!selectable.length" :loading="busy" @click="approve(selectable)"><template #icon><Check :size="14" /></template>Approve selected ({{ selectable.length }})</AppButton>
    </AdminPageHeader>

    <div v-if="stats" class="pw-ap__stats">
      <StatCard label="Awaiting approval" :value="String(stats.awaiting.count)" :caption="formatMoney(stats.awaiting.amount)" tone="red" />
      <StatCard label="Processing" :value="String(stats.processing.count)" :caption="formatMoney(stats.processing.amount)" tone="navy" />
      <StatCard label="Paid (7d)" :value="stats.paid7d.count.toLocaleString()" :caption="formatMoney(stats.paid7d.amount)" tone="green" />
      <StatCard label="Failed" :value="String(stats.failed.count)" :caption="stats.failed.detail" tone="red" />
      <StatCard label="PSP balance" :value="formatMoney(stats.pspBalance.amount, { whole: true })" :caption="stats.pspBalance.detail" />
    </div>

    <AppTabs v-model="t.tab.value" :items="tabs" label="Payout status" class="pw-ap__tabs" />
    <ErrorState v-if="t.state.value === 'error'" :error="t.error.value" class="pw-card" @retry="t.reload" />
    <DataTable
      v-else
      v-model:selected="t.selected.value"
      :columns="columns"
      :rows="t.rows.value"
      :loading="t.state.value === 'loading'"
      :selectable="t.tab.value === 'awaiting_approval' && auth.can('payouts.approve')"
      :sort="t.sort.value"
      dense
      caption="Payouts"
      :row-class="(r) => (r.flagged ? 'is-highlight' : undefined)"
      @sort="t.toggleSort"
    >
      <template #cell-seller="{ row }"><span class="pw-ap__seller"><AppAvatar :name="row.sellerName" :initials="row.initials" :size="28" /><span><strong>{{ row.sellerName }}</strong><small>{{ row.sellerDetail }}</small></span></span></template>
      <template #cell-amount="{ row }"><strong>{{ formatMoney(row.amount) }}</strong></template>
      <template #cell-destination="{ row }">{{ row.destination }}</template>
      <template #cell-reason="{ row }"><span :class="{ 'pw-ap__flag': row.flagged }">{{ row.reason }}</span></template>
      <template #cell-requested="{ row }">{{ row.requestedAt }}</template>
      <template #cell-actions="{ row }">
        <span v-if="row.status === 'awaiting_approval' && auth.can('payouts.approve')" class="pw-ap__actions">
          <AppButton v-if="row.flagged" variant="danger-outline" size="sm" @click="rejecting = row">Reject</AppButton>
          <AppButton v-else variant="success" size="sm" :disabled="busy" @click="approve([row.id])">Approve</AppButton>
          <AppButton variant="secondary" size="sm" @click="row.flagged ? $router.push({ name: 'admin-users', query: { search: row.sellerName } }) : (holding = row)">{{ row.flagged ? 'Open' : 'Hold' }}</AppButton>
        </span>
      </template>
      <template #empty>Nothing in this queue.</template>
    </DataTable>

    <AppConfirmDialog :open="batchOpen" title="Run payout batch now?" body="Approved payouts are sent to the PSPs immediately instead of at the next scheduled window." confirm-label="Run batch" :loading="busy" @confirm="runBatch" @cancel="batchOpen = false" />
    <ReasonDialog :open="!!holding" :title="`Hold payout to ${holding?.sellerName ?? ''}?`" confirm-label="Hold" tone="primary" :loading="busy" @confirm="act('hold', $event)" @cancel="holding = null" />
    <ReasonDialog :open="!!rejecting" :title="`Reject payout to ${rejecting?.sellerName ?? ''}?`" body="Funds return to the seller's wallet balance." confirm-label="Reject" :loading="busy" @confirm="act('reject', $event)" @cancel="rejecting = null" />
  </div>
</template>

<style scoped>
.pw-ap__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--pw-space-3);
  margin-bottom: var(--pw-space-5);
}

.pw-ap__tabs {
  margin-bottom: var(--pw-space-4);
}

.pw-ap__seller {
  display: inline-flex;
  align-items: center;
  gap: var(--pw-space-2);
  text-align: left;
}

.pw-ap__seller span {
  display: flex;
  flex-direction: column;
}

.pw-ap__seller small {
  font-size: var(--pw-text-2xs);
  color: var(--pw-muted);
}

.pw-ap__flag {
  color: var(--pw-danger-600);
}

.pw-ap__actions {
  display: inline-flex;
  gap: var(--pw-space-2);
}
</style>
