<script setup lang="ts">
import { computed, ref } from 'vue'
import { Building2, Download, Lock } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import AppTabs from '@/components/common/AppTabs.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import DataTable from '@/components/common/DataTable.vue'
import AppToggle from '@/components/forms/AppToggle.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import WithdrawModal from '@/components/payments/WithdrawModal.vue'
import AddPayoutMethodModal from '@/components/payments/AddPayoutMethodModal.vue'
import { walletService } from '@/api/account.api'
import { toApiError } from '@/api/errors'
import { useResource } from '@/composables/useResource'
import { useSeo } from '@/composables/useSeo'
import { useUiStore } from '@/stores/ui.store'
import { TRANSACTION_STATUS } from '@/constants/labels'
import { formatMoney, formatSigned } from '@/utils/money'
import { formatShortDate } from '@/utils/date'
import type { WalletTransaction } from '@/types/wallet'
import type { Column } from '@/types/ui'

/** VB12 wallet + VB13 withdraw. Balances are server-computed; never derived client-side. */
useSeo({ title: 'Wallet', noindex: true })
const ui = useUiStore()
const type = ref<'all' | 'sales' | 'payouts' | 'fees'>('all')
const page = ref(1)
const withdrawOpen = ref(false)
const addOpen = ref(false)
const month = new Date().toISOString().slice(0, 7)

const { data: balance, reload: reloadBalance } = useResource((s) => walletService.balance(s))
const { data: tx, state, error, reload } = useResource((s) => walletService.transactions({ type: type.value, page: page.value }, s), { watch: [type, page] })
const { data: methods, mutate: mutateMethods } = useResource((s) => walletService.payoutMethods(s))
const { data: schedule, mutate: mutateSchedule } = useResource((s) => walletService.payoutSchedule(s))

const columns: Column<WalletTransaction>[] = [
  { key: 'date', label: 'Date', width: '90px' },
  { key: 'description', label: 'Description' },
  { key: 'type', label: 'Type', hideOnMobile: true },
  { key: 'status', label: 'Status' },
  { key: 'amount', label: 'Amount', align: 'right' },
]

const autoPayouts = computed({
  get: () => schedule.value?.enabled ?? false,
  set: async (enabled: boolean) => {
    const prev = schedule.value
    mutateSchedule((s) => (s ? { ...s, enabled } : s))
    try {
      await walletService.updatePayoutSchedule({ enabled })
      ui.success(enabled ? 'Automatic payouts on' : 'Automatic payouts off')
    } catch (e) {
      mutateSchedule(() => prev)
      ui.error("Couldn't update payouts", toApiError(e).message)
    }
  },
})

async function statements() {
  try {
    const { url } = await walletService.statementUrl(month)
    window.open(url, '_blank', 'noopener')
  } catch (e) {
    ui.error("Couldn't generate statement", toApiError(e).message)
  }
}

function onWithdrawn() {
  void reloadBalance()
  void reload()
}
</script>

<template>
  <div>
    <header class="pw-page-head">
      <div>
        <h1 class="pw-page-title">Wallet</h1>
        <p class="pw-page-sub">Balances update in real time. Payouts in USD or NGN.</p>
      </div>
      <div class="pw-page-head__actions">
        <AppButton variant="secondary" @click="statements"><template #icon><Download :size="16" /></template>Statements</AppButton>
        <AppButton @click="withdrawOpen = true">Withdraw</AppButton>
      </div>
    </header>

    <div class="pw-wal__stats">
      <template v-if="balance">
        <StatCard label="Available" :value="formatMoney(balance.available)" caption="Ready to withdraw" tone="green" />
        <StatCard label="In escrow" :value="formatMoney(balance.inEscrow)" :caption="`${balance.escrowOrders} orders airborne`" tone="navy" />
        <StatCard label="Pending release" :value="formatMoney(balance.pendingRelease)" :caption="balance.pendingReleaseIn ? `Releases in ${balance.pendingReleaseIn}` : null" tone="gold" />
        <StatCard label="Lifetime earnings" :value="formatMoney(balance.lifetimeEarnings)" :caption="balance.thisMonthEarnings ? `+ ${formatMoney(balance.thisMonthEarnings)} this month` : null" tone="green" />
      </template>
      <AppSkeleton v-for="n in 4" v-else :key="n" height="98px" radius="var(--pw-radius-lg)" />
    </div>

    <div class="pw-wal__grid">
      <section class="pw-wal__activity" aria-labelledby="activity">
        <div class="pw-wal__head">
          <h2 id="activity" class="pw-card-title">Activity</h2>
          <AppTabs v-model="type" variant="pills" label="Filter activity" :items="[{ value: 'all', label: 'All' }, { value: 'sales', label: 'Sales' }, { value: 'payouts', label: 'Payouts' }, { value: 'fees', label: 'Fees' }]" />
        </div>
        <ErrorState v-if="state === 'error'" :error="error" class="pw-card" @retry="reload" />
        <DataTable v-else :columns="columns" :rows="tx?.data ?? []" :loading="state === 'loading'" caption="Wallet activity">
          <template #cell-date="{ row }">{{ formatShortDate(row.occurredAt) }}</template>
          <template #cell-description="{ row }">
            <span class="pw-wal__desc"><strong>{{ row.description }}</strong><small>{{ row.detail }}</small></span>
          </template>
          <template #cell-type="{ row }">{{ row.type.charAt(0).toUpperCase() + row.type.slice(1).replace('_', ' ') }}</template>
          <template #cell-status="{ row }"><StatusBadge :status="TRANSACTION_STATUS[row.status]" /></template>
          <template #cell-amount="{ row }">
            <strong :class="row.direction === 'credit' ? 'pw-wal__credit' : row.type === 'refund' ? 'pw-wal__refund' : ''">{{ formatSigned(row.amount, row.direction) }}</strong>
          </template>
          <template #empty>No activity for this filter yet.</template>
          <template v-if="tx && tx.meta.lastPage > 1" #footer>
            <span>Page {{ tx.meta.currentPage }} of {{ tx.meta.lastPage }}</span>
            <AppPagination variant="compact" :page="tx.meta.currentPage" :last-page="tx.meta.lastPage" @change="page = $event" />
          </template>
        </DataTable>
      </section>

      <aside class="pw-wal__aside">
        <section class="pw-card pw-card-pad" aria-labelledby="methods">
          <div class="pw-between">
            <h2 id="methods" class="pw-card-title">Payout methods</h2>
            <button type="button" class="pw-link-btn" @click="addOpen = true">Add</button>
          </div>
          <ul class="pw-wal__methods" role="list">
            <li v-for="m in methods ?? []" :key="m.id" class="pw-wal__method" :class="{ 'is-default': m.isDefault }">
              <span class="pw-wal__method-icon"><Building2 :size="16" aria-hidden="true" /></span>
              <span><strong>{{ m.label }}</strong><small>•••• {{ m.last4 }}<template v-if="m.isDefault"> · default</template></small></span>
              <AppBadge v-if="m.isDefault" tone="neutral">Default</AppBadge>
            </li>
          </ul>
        </section>
        <section class="pw-card pw-card-pad" aria-labelledby="auto">
          <h2 id="auto" class="pw-card-title">Automatic payouts</h2>
          <AppToggle v-model="autoPayouts" class="pw-wal__toggle" :label="schedule?.dayLabel ?? 'Weekly'" :hint="schedule ? `When available balance is over ${formatMoney(schedule.threshold, { whole: true })}` : undefined" />
        </section>
        <p class="pw-wal__note"><Lock :size="14" aria-hidden="true" /> Payouts above $2,000 or to a new account require two-step verification.</p>
      </aside>
    </div>

    <WithdrawModal :open="withdrawOpen" @close="withdrawOpen = false" @done="onWithdrawn" />
    <AddPayoutMethodModal :open="addOpen" @close="addOpen = false" @added="(m) => mutateMethods((list) => [...(list ?? []), m])" />
  </div>
</template>

<style scoped>
.pw-wal__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--pw-space-4);
  margin-bottom: var(--pw-space-5);
}

.pw-wal__grid {
  display: grid;
  gap: var(--pw-space-5);
}

.pw-wal__activity {
  min-width: 0;
}

.pw-wal__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--pw-space-3);
  margin-bottom: var(--pw-space-4);
}

.pw-wal__desc {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.pw-wal__desc strong {
  font-weight: var(--pw-weight-medium);
}

.pw-wal__desc small {
  color: var(--pw-muted);
  font-size: var(--pw-text-xs);
}

.pw-wal__credit {
  color: var(--pw-success-600);
}

.pw-wal__refund {
  color: var(--pw-danger-600);
}

.pw-wal__aside {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-4);
}

.pw-wal__methods {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-2);
  margin-top: var(--pw-space-4);
}

.pw-wal__method {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  padding: var(--pw-space-3);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-md);
  font-size: var(--pw-text-sm);
}

.pw-wal__method.is-default {
  border-color: var(--pw-navy-700);
}

.pw-wal__method > span:nth-child(2) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.pw-wal__method small {
  color: var(--pw-muted);
  font-size: var(--pw-text-xs);
}

.pw-wal__method-icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--pw-radius-sm);
  background: var(--pw-navy-100);
  color: var(--pw-navy-700);
}

.pw-wal__toggle {
  margin-top: var(--pw-space-3);
}

.pw-wal__note {
  display: flex;
  gap: var(--pw-space-2);
  padding: var(--pw-space-4);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-navy-100);
  color: var(--pw-navy-700);
  font-size: var(--pw-text-sm);
}

.pw-wal__note svg {
  flex: none;
  margin-top: 3px;
}

@media (min-width: 1280px) {
  .pw-wal__stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .pw-wal__grid {
    grid-template-columns: minmax(0, 1fr) 300px;
    align-items: start;
  }
}
</style>
