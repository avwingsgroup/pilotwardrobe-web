<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { X } from '@lucide/vue'
import AppBreadcrumb from '@/components/common/AppBreadcrumb.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppImage from '@/components/common/AppImage.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppTimeline from '@/components/common/AppTimeline.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import AppRadioCard from '@/components/forms/AppRadioCard.vue'
import AppSelect from '@/components/forms/AppSelect.vue'
import AppTextarea from '@/components/forms/AppTextarea.vue'
import AppMoneyInput from '@/components/forms/AppMoneyInput.vue'
import AppFileDrop from '@/components/forms/AppFileDrop.vue'
import { orderService } from '@/api/orders.api'
import { disputeService } from '@/api/account.api'
import { mediaService } from '@/api/listings.api'
import { toApiError } from '@/api/errors'
import { useResource } from '@/composables/useResource'
import { useForm } from '@/composables/useForm'
import { useSeo } from '@/composables/useSeo'
import { useUiStore } from '@/stores/ui.store'
import { DISPUTE_REASONS } from '@/constants/labels'
import { formatMoney } from '@/utils/money'
import { formatDateTime, timeUntil } from '@/utils/date'
import type { DisputeReason, DisputeResolutionRequest } from '@/types/dispute'
import type { MediaAsset } from '@/types/media'

/** VB14 — open a dispute (freezes escrow). */
useSeo({ title: 'Open a dispute', noindex: true })
const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const orderId = computed(() => String(route.query.order ?? ''))
const { data: order, state, error, reload } = useResource((s) => orderService.get(orderId.value, s))
const evidence = ref<MediaAsset[]>([])
const uploading = ref(false)

const reasons = (Object.keys(DISPUTE_REASONS) as DisputeReason[]).map((k) => ({ value: k, label: DISPUTE_REASONS[k].label, hint: DISPUTE_REASONS[k].hint }))
const resolutions: { value: DisputeResolutionRequest; label: string }[] = [
  { value: 'partial_refund', label: 'Partial refund' },
  { value: 'full_refund', label: 'Full refund' },
  { value: 'return_and_refund', label: 'Return and full refund' },
  { value: 'replacement', label: 'Replacement' },
]

const form = useForm(
  { reason: 'not_as_described' as DisputeReason | '', requested: 'partial_refund' as DisputeResolutionRequest, amount: 0, description: '' },
  {
    reason: [(v) => (v ? true : 'Tell us what went wrong.')],
    description: [(v: string) => (v.trim().length >= 20 ? true : 'Describe the issue in at least 20 characters.')],
    amount: [(v: number): true | string => (form.values.requested !== 'partial_refund' || v > 0 ? true : 'Enter the amount you are requesting.')],
  },
)

async function addFiles(files: File[]) {
  uploading.value = true
  for (const f of files.slice(0, 10 - evidence.value.length)) {
    try {
      evidence.value.push(await mediaService.upload(f, 'dispute_evidence'))
    } catch (e) {
      ui.error(`Couldn't upload ${f.name}`, toApiError(e).message)
    }
  }
  uploading.value = false
}

async function submit() {
  if (!order.value) return
  const dispute = await form.submit((v) =>
    disputeService.open({
      orderId: order.value!.id,
      reason: v.reason as DisputeReason,
      requested: v.requested,
      amount: v.requested === 'partial_refund' ? { amount: v.amount, currency: order.value!.totals.total.currency } : null,
      description: v.description,
      evidenceIds: evidence.value.map((m) => m.id),
    }),
  )
  if (dispute) {
    ui.success('Dispute opened', 'Escrow is frozen. The seller has 48h to respond.')
    await router.replace({ name: 'hangar-dispute', params: { id: dispute.id } })
  }
}
</script>

<template>
  <div>
    <AppBreadcrumb separator="chevron" :items="[{ label: 'My Hangar', to: { name: 'hangar' } }, { label: 'Orders', to: { name: 'hangar-orders' } }, { label: order ? `#${order.number}` : '…', to: order ? { name: 'hangar-order', params: { id: order.id } } : undefined }, { label: 'Open dispute' }]" />
    <header class="pw-page-head pw-odp__head">
      <div>
        <h1 class="pw-page-title">Open a dispute</h1>
        <p class="pw-page-sub">Escrow stays frozen while a mediator reviews. Most cases close within 5 days.</p>
      </div>
    </header>

    <ErrorState v-if="state === 'error' || !orderId" :error="error" not-found-title="Choose an order to dispute" class="pw-card" @retry="reload" />
    <div v-else-if="!order" class="pw-odp__grid"><AppSkeleton height="420px" radius="var(--pw-radius-lg)" /><AppSkeleton height="260px" radius="var(--pw-radius-lg)" /></div>

    <form v-else class="pw-odp__grid" novalidate @submit.prevent="submit">
      <div class="pw-stack">
        <section class="pw-card pw-card-pad">
          <AppRadioCard v-model="form.values.reason" :options="reasons" legend="What went wrong?" :columns="2" :error="form.fieldError('reason')" />
        </section>

        <section class="pw-card pw-card-pad pw-stack" aria-labelledby="more">
          <h2 id="more" class="pw-card-title">Tell us more</h2>
          <AppSelect v-model="form.values.requested" label="What would resolve this?" :options="resolutions" />
          <AppMoneyInput v-if="form.values.requested === 'partial_refund'" v-model="form.values.amount" label="Amount requested" :error="form.fieldError('amount')" :hint="`Up to ${formatMoney(order.totals.items)}`" class="pw-odp__amount" />
          <AppTextarea v-model="form.values.description" label="Describe the issue" :rows="4" :maxlength="2000" show-count :error="form.fieldError('description')" placeholder="e.g. Listed as size M, label reads S. Chest measures 98 cm against my Fit Kit 104 cm." @blur="form.touch('description')" />
        </section>

        <section class="pw-card pw-card-pad" aria-labelledby="evidence">
          <div class="pw-between">
            <h2 id="evidence" class="pw-card-title">Evidence</h2>
            <span class="pw-odp__limits">Up to 10 files · 20 MB each</span>
          </div>
          <ul class="pw-odp__files" role="list">
            <li v-for="(m, i) in evidence" :key="m.id" class="pw-odp__file">
              <AppImage :media="m" ratio="1" fit="cover" sizes="96px" />
              <button type="button" :aria-label="`Remove ${m.alt}`" @click="evidence.splice(i, 1)"><X :size="14" /></button>
            </li>
            <li v-if="evidence.length < 10" class="pw-odp__add">
              <AppFileDrop label="Add files" accept="image/jpeg,image/png,image/webp,image/heic,application/pdf" multiple compact :disabled="uploading" @files="addFiles" @rejected="ui.error('File rejected', $event)" />
            </li>
          </ul>
        </section>
      </div>

      <aside class="pw-stack">
        <div class="pw-card pw-card-pad">
          <div class="pw-odp__item">
            <AppImage :media="order.items[0]?.image" ratio="1" sizes="48px" class="pw-odp__thumb" />
            <div>
              <p class="pw-odp__title">{{ order.items[0]?.title }}</p>
              <p class="pw-muted pw-odp__small">Order #{{ order.number }} · {{ formatMoney(order.items[0]?.total) }}</p>
            </div>
          </div>
          <dl class="pw-dl">
            <dt>Seller</dt><dd>{{ order.seller.displayName }}</dd>
            <dt>Delivered</dt><dd>{{ order.tracking.find((t) => t.code === 'delivered')?.occurredAt ? formatDateTime(order.tracking.find((t) => t.code === 'delivered')!.occurredAt!) : '—' }}</dd>
            <dt>Escrow</dt><dd class="pw-odp__escrow">{{ formatMoney(order.totals.items) }} held</dd>
            <dt>Time left to dispute</dt><dd>{{ order.disputeWindowEndsAt ? timeUntil(order.disputeWindowEndsAt) : '—' }}</dd>
          </dl>
        </div>
        <div class="pw-card pw-card-pad">
          <h2 class="pw-card-title pw-odp__next">What happens next</h2>
          <AppTimeline
            tone="navy"
            :items="[
              { label: 'You submit the dispute', detail: 'Escrow freezes', state: 'current' },
              { label: 'Seller responds', detail: 'Within 48h', state: 'upcoming' },
              { label: 'Mediator decides', detail: 'Refund, partial refund or release', state: 'upcoming' },
            ]"
          />
        </div>
        <p v-if="form.formError.value" class="pw-odp__error" role="alert">{{ form.formError.value }}</p>
        <AppButton type="submit" variant="danger" size="lg" block :loading="form.submitting.value">Submit dispute</AppButton>
      </aside>
    </form>
  </div>
</template>

<style scoped>
.pw-odp__head {
  margin-top: var(--pw-space-5);
}

.pw-odp__grid {
  display: grid;
  gap: var(--pw-space-5);
}

.pw-odp__amount {
  max-width: 260px;
}

.pw-odp__limits {
  font-size: var(--pw-text-xs);
  color: var(--pw-navy-700);
}

.pw-odp__files {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: var(--pw-space-3);
  margin-top: var(--pw-space-4);
}

.pw-odp__file {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-md);
}

.pw-odp__file button {
  position: absolute;
  top: 4px;
  right: 4px;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 50%;
  background: rgb(255 255 255 / 92%);
}

.pw-odp__add :deep(.pw-drop__label) {
  min-height: 96px;
}

.pw-odp__item {
  display: flex;
  gap: var(--pw-space-3);
  padding-bottom: var(--pw-space-4);
  margin-bottom: var(--pw-space-4);
  border-bottom: 1px solid var(--pw-border);
}

.pw-odp__thumb {
  width: 48px;
  flex: none;
  border-radius: var(--pw-radius-sm);
}

.pw-odp__title {
  font-weight: var(--pw-weight-semibold);
  font-size: var(--pw-text-sm);
}

.pw-odp__small {
  font-size: var(--pw-text-xs);
}

.pw-odp__escrow {
  color: var(--pw-navy-700) !important;
}

.pw-odp__next {
  margin-bottom: var(--pw-space-4);
}

.pw-odp__error {
  color: var(--pw-danger-600);
  font-size: var(--pw-text-sm);
}

@media (min-width: 1024px) {
  .pw-odp__grid {
    grid-template-columns: minmax(0, 1fr) 320px;
    align-items: start;
  }
}
</style>
