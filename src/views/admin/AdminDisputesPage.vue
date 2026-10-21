<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Scale } from '@lucide/vue'
import AppTabs from '@/components/common/AppTabs.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppImage from '@/components/common/AppImage.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import AppRadioCard from '@/components/forms/AppRadioCard.vue'
import AppSelect from '@/components/forms/AppSelect.vue'
import AppMoneyInput from '@/components/forms/AppMoneyInput.vue'
import { adminService } from '@/api/admin.api'
import { toApiError } from '@/api/errors'
import { useResource } from '@/composables/useResource'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { formatMoney } from '@/utils/money'
import { formatShortDate } from '@/utils/date'
import type { DisputeDecision } from '@/types/dispute'

/** AD9 — disputes: queue · claim vs listing + thread · decision. Decision due in 5 days. */
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()
const bucket = ref<'mine' | 'unassigned' | 'closed'>('mine')
const { data: list, state, error, reload } = useResource((s) => adminService.disputes({ tab: bucket.value }, s), { watch: [bucket] })
const selectedId = computed(() => (route.params.id ? String(route.params.id) : (list.value?.data[0]?.id ?? null)))
const { data: d, mutate } = useResource((s) => (selectedId.value ? adminService.dispute(selectedId.value, s) : Promise.resolve(null)), { watch: [selectedId] })

const audience = ref<'both' | 'buyer' | 'seller' | 'internal'>('both')
const message = ref('')
const decision = ref<DisputeDecision | ''>('')
const amount = ref(4500)
const policy = ref('')
const busy = ref(false)

watch(d, (v) => {
  decision.value = v?.decisionOptions.find((o) => o.value === 'partial_refund')?.value ?? ''
  policy.value = v?.policyOptions[0] ?? ''
})

async function send() {
  if (!d.value || !message.value.trim()) return
  try {
    const updated = await adminService.disputeMessage(selectedId.value!, message.value.trim(), audience.value)
    mutate(() => updated)
    message.value = ''
  } catch (e) {
    ui.error("Couldn't send", toApiError(e).message)
  }
}

async function issue() {
  if (!d.value || !decision.value) return
  busy.value = true
  try {
    const res = await adminService.disputeDecision(d.value.id, { decision: decision.value, amountToBuyer: decision.value === 'partial_refund' ? amount.value : decision.value.startsWith('full') ? d.value.frozen.amount : 0, policyReference: policy.value })
    ui.success(res.status === 'pending_approval' ? 'Decision recorded — refund awaits a second approver' : 'Decision issued — both parties notified')
    await reload()
    void router.replace({ name: 'admin-disputes' })
  } catch (e) {
    ui.error('Decision failed', toApiError(e).message)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div>
    <ErrorState v-if="state === 'error'" :error="error" class="pw-card" @retry="reload" />
    <div v-else class="pw-ad">
      <aside class="pw-card pw-ad__queue" aria-label="Disputes">
        <div class="pw-ad__qhead">
          <p><strong>Disputes · {{ list?.meta.counts?.open ?? '…' }} open</strong></p>
          <AppTabs v-model="bucket" variant="pills" label="Dispute queue" :items="[{ value: 'mine', label: `Mine ${list?.meta.counts?.mine ?? ''}` }, { value: 'unassigned', label: `Unassigned ${list?.meta.counts?.unassigned ?? ''}` }, { value: 'closed', label: 'Closed' }]" />
        </div>
        <AppSkeleton v-if="state === 'loading'" :lines="4" height="56px" class="pw-ad__pad" />
        <AppEmptyState v-else-if="!list?.data.length" :icon="Scale" title="No disputes here" compact />
        <ul v-else role="list">
          <li v-for="r in list.data" :key="r.id">
            <RouterLink :to="{ name: 'admin-disputes', params: { id: r.id } }" class="pw-ad__row" :class="{ 'is-active': r.id === selectedId }">
              <span class="pw-between"><span class="pw-mono pw-ad__num">{{ r.number }}</span><AppBadge :tone="r.dueTone === 'danger' ? 'danger' : r.dueTone === 'warning' ? 'warning' : 'neutral'">{{ r.due }}</AppBadge></span>
              <strong>{{ r.title }}</strong>
              <small>{{ r.parties }}</small>
            </RouterLink>
          </li>
        </ul>
      </aside>

      <template v-if="d && d.thread">
        <section class="pw-ad__case" aria-labelledby="case-title">
          <header class="pw-ad__head">
            <div>
              <h1 id="case-title" class="pw-ad__title">{{ d.number }} · {{ d.title.split(' · ')[0] }}</h1>
              <p class="pw-muted pw-ad__small">Order #{{ d.orderNumber }} · {{ formatMoney(d.frozen) }} frozen · opened {{ formatShortDate(d.openedAt) }} · assigned to {{ d.assignee }}</p>
            </div>
          </header>
          <div class="pw-card pw-card-pad">
            <h2 class="pw-card-title">Claim vs. listing</h2>
            <div class="pw-ad__claim">
              <div>
                <p class="pw-eyebrow">Listing said</p>
                <ul role="list" class="pw-ad__said"><li v-for="s in d.listingSaid" :key="s">{{ s }}</li></ul>
              </div>
              <div>
                <p class="pw-eyebrow">Buyer evidence · {{ d.buyerEvidence.length }} photos</p>
                <div class="pw-ad__evidence">
                  <AppImage v-for="(m, i) in d.buyerEvidence" :key="i" :media="m" ratio="1" fit="contain" sizes="72px" class="pw-ad__ev" />
                  <ul role="list" class="pw-ad__said"><li v-for="s in d.evidenceSummary" :key="s">{{ s }}</li></ul>
                </div>
              </div>
            </div>
          </div>
          <div class="pw-card pw-card-pad">
            <h2 class="pw-card-title">Thread</h2>
            <ul class="pw-ad__thread" role="list">
              <li v-for="m in d.thread" :key="m.id" :class="{ 'is-internal': m.internal }">
                <AppAvatar :name="m.author.displayName" :initials="m.author.initials" :size="30" :tone="m.author.role === 'mediator' ? 'navy' : 'soft'" />
                <div>
                  <p class="pw-between"><strong>{{ m.author.displayName }}<template v-if="m.internal"> · internal</template></strong><small>{{ formatShortDate(m.createdAt) }}</small></p>
                  <p>{{ m.body }}</p>
                </div>
              </li>
            </ul>
            <form v-if="auth.can('disputes.resolve')" class="pw-ad__reply" @submit.prevent="send">
              <AppTabs v-model="audience" variant="pills" label="Reply audience" :items="[{ value: 'both', label: 'Reply to both' }, { value: 'buyer', label: 'Buyer only' }, { value: 'seller', label: 'Seller only' }, { value: 'internal', label: 'Internal note' }]" />
              <label for="ad-msg" class="sr-only">Message</label>
              <textarea id="ad-msg" v-model="message" rows="2" placeholder="Write a message…" />
              <AppButton type="submit" size="sm" :disabled="!message.trim()">Send</AppButton>
            </form>
          </div>
        </section>

        <aside class="pw-stack" aria-label="Decision">
          <div class="pw-card pw-card-pad pw-stack">
            <AppRadioCard v-model="decision" :options="d.decisionOptions.map((o) => ({ value: o.value, label: o.label, hint: o.detail }))" legend="Decision" />
            <AppMoneyInput v-if="decision === 'partial_refund'" v-model="amount" label="Amount to buyer" />
            <AppSelect v-model="policy" label="Policy reference" :options="d.policyOptions.map((p) => ({ value: p, label: p }))" />
            <AppButton block :loading="busy" :disabled="!auth.can('disputes.resolve') || !decision" @click="issue">Issue decision</AppButton>
            <p class="pw-muted pw-ad__small">Both parties are notified and can appeal once within 48h.</p>
          </div>
          <div class="pw-card pw-card-pad">
            <dl class="pw-dl">
              <dt>Seller dispute rate</dt><dd>{{ d.stats.sellerDisputeRate }}</dd>
              <dt>Buyer dispute rate</dt><dd>{{ d.stats.buyerDisputeRate }}</dd>
              <dt>Seller's offer</dt><dd>{{ d.stats.sellerOffer }}</dd>
            </dl>
          </div>
        </aside>
      </template>
      <AppSkeleton v-else-if="selectedId" height="420px" radius="var(--pw-radius-lg)" />
    </div>
  </div>
</template>

<style scoped>
.pw-ad {
  display: grid;
  gap: var(--pw-space-4);
}

.pw-ad__queue {
  align-self: start;
  overflow: hidden;
}

.pw-ad__qhead {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-3);
  padding: var(--pw-space-4);
  border-bottom: 1px solid var(--pw-border);
}

.pw-ad__pad {
  padding: var(--pw-space-4);
}

.pw-ad__row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--pw-space-3) var(--pw-space-4);
  border-left: 3px solid transparent;
  border-bottom: 1px solid var(--pw-border);
  color: var(--pw-ink);
  font-size: var(--pw-text-sm);
}

.pw-ad__row:hover {
  text-decoration: none;
  background: var(--pw-surface-sunken);
}

.pw-ad__row.is-active {
  border-left-color: var(--pw-navy-700);
  background: var(--pw-navy-50);
}

.pw-ad__row small {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-ad__num {
  font-size: var(--pw-text-xs);
}

.pw-ad__case {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-4);
  min-width: 0;
}

.pw-ad__title {
  font-size: var(--pw-text-xl);
}

.pw-ad__small {
  font-size: var(--pw-text-xs);
}

.pw-ad__claim {
  display: grid;
  gap: var(--pw-space-4);
  margin-top: var(--pw-space-3);
}

.pw-ad__said {
  margin-top: var(--pw-space-2);
  font-size: var(--pw-text-sm);
}

.pw-ad__evidence {
  display: flex;
  gap: var(--pw-space-2);
  margin-top: var(--pw-space-2);
}

.pw-ad__ev {
  width: 72px;
  flex: none;
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-sm);
}

.pw-ad__thread li {
  display: flex;
  gap: var(--pw-space-3);
  padding: var(--pw-space-3) 0;
  border-bottom: 1px solid var(--pw-border);
  font-size: var(--pw-text-sm);
}

.pw-ad__thread li > div {
  flex: 1;
}

.pw-ad__thread small {
  font-size: var(--pw-text-2xs);
  color: var(--pw-subtle);
}

.pw-ad__thread .is-internal {
  background: var(--pw-warning-100);
}

.pw-ad__reply {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-2);
  margin-top: var(--pw-space-3);
}

.pw-ad__reply textarea {
  padding: var(--pw-space-2) var(--pw-space-3);
  border: 1px solid var(--pw-border-strong);
  border-radius: var(--pw-radius-md);
  font-size: var(--pw-text-sm);
}

.pw-ad__reply button {
  align-self: flex-end;
}

@media (min-width: 768px) {
  .pw-ad__claim {
    grid-template-columns: 1fr 1.4fr;
  }
}

@media (min-width: 1200px) {
  .pw-ad {
    grid-template-columns: 260px minmax(0, 1fr) 300px;
  }
}
</style>
