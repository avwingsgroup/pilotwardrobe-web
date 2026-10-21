<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronRight, Flag, RotateCcw } from '@lucide/vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import ReasonDialog from '@/components/admin/ReasonDialog.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppImage from '@/components/common/AppImage.vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppConfirmDialog from '@/components/common/AppConfirmDialog.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import AppRadioCard from '@/components/forms/AppRadioCard.vue'
import AppSelect from '@/components/forms/AppSelect.vue'
import AppTextarea from '@/components/forms/AppTextarea.vue'
import AppCheckbox from '@/components/forms/AppCheckbox.vue'
import AppMoneyInput from '@/components/forms/AppMoneyInput.vue'
import { adminService } from '@/api/admin.api'
import { toApiError } from '@/api/errors'
import { useResource } from '@/composables/useResource'
import { useSeo } from '@/composables/useSeo'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { formatMoney } from '@/utils/money'
import { formatAuditTime } from '@/utils/date'

/** AD8 — order detail with escrow ledger, risk signals and refund (dual control > $1,000). */
const route = useRoute()
const auth = useAuthStore()
const ui = useUiStore()
const id = computed(() => String(route.params.id))
const { data: o, state, error, reload } = useResource((s) => adminService.order(id.value, s), { watch: [id] })
useSeo(() => ({ title: o.value ? `Order #${o.value.number}` : 'Order', noindex: true }))

const refundOpen = ref(false)
const holdOpen = ref(false)
const releaseOpen = ref(false)
const busy = ref(false)
const refund = ref({ type: 'full' as 'full' | 'partial', amount: 0, reason: 'fraud_velocity', note: '', suspendBuyer: true })
const DUAL_CONTROL = 100000

const refundAmount = computed(() => (refund.value.type === 'full' ? (o.value?.total.amount ?? 0) : refund.value.amount))

async function submitRefund() {
  if (!o.value) return
  busy.value = true
  try {
    const res = await adminService.refund(o.value.id, { type: refund.value.type, amount: refund.value.type === 'partial' ? refund.value.amount : undefined, reason: refund.value.reason, note: refund.value.note, suspendBuyer: refund.value.suspendBuyer })
    ui.success(res.status === 'pending_approval' ? `Refund requested — awaiting ${res.approver ?? 'second approver'}` : 'Refund issued')
    refundOpen.value = false
    void reload()
  } catch (e) {
    ui.error('Refund failed', toApiError(e).message)
  } finally {
    busy.value = false
  }
}

async function hold(reason: string) {
  busy.value = true
  try {
    await adminService.holdOrder(id.value, reason)
    ui.success('Order on hold')
    holdOpen.value = false
    void reload()
  } catch (e) {
    ui.error('Hold failed', toApiError(e).message)
  } finally {
    busy.value = false
  }
}

async function release() {
  busy.value = true
  try {
    await adminService.releaseEscrow(id.value)
    ui.success('Escrow released to seller')
    releaseOpen.value = false
    void reload()
  } catch (e) {
    ui.error('Release failed', toApiError(e).message)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div>
    <ErrorState v-if="state === 'error'" :error="error" not-found-title="Order not found" class="pw-card" @retry="reload" />
    <AppSkeleton v-else-if="!o" height="420px" radius="var(--pw-radius-lg)" />
    <template v-else>
      <AdminPageHeader :title="`Order #${o.number}`">
        <template #subtitle>Created {{ formatAuditTime(o.createdAt) }} · card payment via {{ o.paymentGateway }} · ref <span class="pw-mono">{{ o.paymentReference }}</span></template>
        <AppButton v-can="'orders.manage'" variant="secondary" size="sm" :disabled="o.escrowStatus === 'released' || o.escrowStatus === 'frozen'" @click="releaseOpen = true">Release to seller</AppButton>
        <AppButton v-can="'orders.manage'" variant="secondary" size="sm" @click="holdOpen = true">Hold</AppButton>
        <AppButton v-can="'transactions.refund'" variant="danger" size="sm" :disabled="o.escrowStatus === 'refunded'" @click="refundOpen = true"><template #icon><RotateCcw :size="14" /></template>Refund buyer</AppButton>
      </AdminPageHeader>
      <AppBadge :tone="o.risk === 'high' ? 'danger' : 'info'" class="pw-aod__status">{{ o.escrowLabel }}</AppBadge>

      <div class="pw-aod__grid">
        <div class="pw-stack">
          <section class="pw-card pw-card-pad" aria-labelledby="ledger">
            <h2 id="ledger" class="pw-card-title">Escrow ledger</h2>
            <table class="pw-aod__ledger">
              <tbody>
                <tr v-for="(l, i) in o.ledger" :key="i">
                  <td class="pw-mono">{{ formatAuditTime(l.at) }}</td>
                  <td>{{ l.entry }}</td>
                  <td class="pw-tabular">{{ formatMoney(l.amount) }}</td>
                </tr>
              </tbody>
            </table>
          </section>
          <section class="pw-card pw-card-pad" aria-labelledby="risk">
            <h2 id="risk" class="pw-card-title">Risk signals</h2>
            <ul class="pw-aod__risk" role="list">
              <li v-for="r in o.riskSignals" :key="r"><Flag :size="14" aria-hidden="true" /> {{ r }}</li>
            </ul>
          </section>
        </div>
        <div class="pw-stack">
          <section class="pw-card pw-card-pad">
            <div class="pw-aod__item">
              <AppImage :media="o.itemImage" ratio="1" sizes="48px" class="pw-aod__thumb" />
              <div><p class="pw-aod__title">{{ o.itemTitle }}</p><p class="pw-muted pw-aod__small">Seller {{ o.sellerName }}</p></div>
            </div>
            <dl class="pw-dl">
              <dt>Subtotal</dt><dd>{{ formatMoney(o.breakdown.subtotal) }}</dd>
              <dt>Platform fee (8%)</dt><dd>{{ formatMoney(o.breakdown.platformFee) }}</dd>
              <dt>Seller would receive</dt><dd>{{ formatMoney(o.breakdown.sellerWouldReceive) }}</dd>
            </dl>
          </section>
          <section class="pw-card pw-card-pad" aria-labelledby="parties">
            <h2 id="parties" class="pw-card-title">Parties</h2>
            <ul role="list" class="pw-aod__parties">
              <li v-for="p in o.parties" :key="p.role">
                <AppAvatar :name="p.name" :size="32" :tone="p.risk === 'high' ? 'gold' : 'soft'" />
                <span><strong>{{ p.name }}</strong><small>{{ p.detail }}</small></span>
                <ChevronRight :size="16" aria-hidden="true" />
              </li>
            </ul>
          </section>
        </div>
      </div>

      <AppModal :open="refundOpen" title="Refund buyer and cancel order?" @close="refundOpen = false">
        <p class="pw-aod__body">{{ formatMoney({ amount: refundAmount, currency: o.total.currency }) }} returns to {{ o.refundMethodLabel }}. The seller is notified and the listings go live again. This can't be undone.</p>
        <div class="pw-stack">
          <AppRadioCard v-model="refund.type" :options="[{ value: 'full', label: 'Full refund' }, { value: 'partial', label: 'Partial' }]" legend="Refund type" sr-only-legend :columns="2" />
          <AppMoneyInput v-if="refund.type === 'partial'" v-model="refund.amount" label="Amount to refund" />
          <AppSelect v-model="refund.reason" label="Reason (shown in audit log)" :options="[{ value: 'fraud_velocity', label: 'Fraud risk · velocity' }, { value: 'not_as_described', label: 'Not as described' }, { value: 'not_received', label: 'Not received' }, { value: 'seller_cancelled', label: 'Seller cancelled' }, { value: 'goodwill', label: 'Goodwill' }]" />
          <AppTextarea v-model="refund.note" label="Internal note" :rows="2" />
          <AppCheckbox v-model="refund.suspendBuyer" label="Also suspend buyer account" />
        </div>
        <p v-if="refundAmount > DUAL_CONTROL" class="pw-aod__dual">Refunds over $1,000 need a second approver. You can't approve your own request.</p>
        <template #footer>
          <AppButton variant="secondary" @click="refundOpen = false">Cancel</AppButton>
          <AppButton variant="danger" :loading="busy" :disabled="!auth.can('transactions.refund') || refundAmount <= 0" @click="submitRefund">Refund {{ formatMoney({ amount: refundAmount, currency: o.total.currency }) }}</AppButton>
        </template>
      </AppModal>
      <ReasonDialog :open="holdOpen" title="Place order on hold?" body="Escrow is held and the seller cannot dispatch until released." confirm-label="Hold order" tone="primary" :loading="busy" @confirm="hold" @cancel="holdOpen = false" />
      <AppConfirmDialog :open="releaseOpen" title="Release escrow to seller?" :body="`${formatMoney(o.breakdown.sellerWouldReceive)} will be paid to ${o.sellerName}. Audited.`" confirm-label="Release" :loading="busy" @confirm="release" @cancel="releaseOpen = false" />
    </template>
  </div>
</template>

<style scoped>
.pw-aod__status {
  margin: calc(var(--pw-space-3) * -1) 0 var(--pw-space-4);
}

.pw-aod__grid {
  display: grid;
  gap: var(--pw-space-4);
}

.pw-aod__ledger {
  margin-top: var(--pw-space-3);
  font-size: var(--pw-text-sm);
}

.pw-aod__ledger td {
  padding: var(--pw-space-2);
  border-bottom: 1px solid var(--pw-border);
}

.pw-aod__ledger td:last-child {
  text-align: right;
}

.pw-aod__risk li {
  display: flex;
  align-items: center;
  gap: var(--pw-space-2);
  padding: var(--pw-space-2) 0;
  font-size: var(--pw-text-sm);
}

.pw-aod__risk svg {
  color: var(--pw-danger-600);
}

.pw-aod__item {
  display: flex;
  gap: var(--pw-space-3);
  margin-bottom: var(--pw-space-4);
}

.pw-aod__thumb {
  width: 48px;
  flex: none;
  border-radius: var(--pw-radius-sm);
}

.pw-aod__title {
  font-weight: var(--pw-weight-semibold);
  font-size: var(--pw-text-sm);
}

.pw-aod__small {
  font-size: var(--pw-text-xs);
}

.pw-aod__parties li {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  padding: var(--pw-space-3) 0;
  border-bottom: 1px solid var(--pw-border);
  font-size: var(--pw-text-sm);
}

.pw-aod__parties span {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.pw-aod__parties small {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-aod__body {
  margin-bottom: var(--pw-space-4);
  font-size: var(--pw-text-sm);
  color: var(--pw-ink-2);
}

.pw-aod__dual {
  margin-top: var(--pw-space-4);
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

@media (min-width: 1100px) {
  .pw-aod__grid {
    grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
  }
}
</style>
