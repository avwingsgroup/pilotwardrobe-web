<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Download, Lock, MessageCircle, Send, Truck } from '@lucide/vue'
import AppBreadcrumb from '@/components/common/AppBreadcrumb.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppImage from '@/components/common/AppImage.vue'
import AppTimeline from '@/components/common/AppTimeline.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppModal from '@/components/common/AppModal.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import AppInput from '@/components/forms/AppInput.vue'
import AppSelect from '@/components/forms/AppSelect.vue'
import ConfirmLandedModal from '@/components/transactions/ConfirmLandedModal.vue'
import { orderService } from '@/api/orders.api'
import { messageService } from '@/api/messages.api'
import { toApiError } from '@/api/errors'
import { useResource } from '@/composables/useResource'
import { useSeo } from '@/composables/useSeo'
import { useUiStore } from '@/stores/ui.store'
import { ORDER_STATUS, CONDITION_LABELS } from '@/constants/labels'
import { formatMoney } from '@/utils/money'
import { dateRangeLabel, formatDateTime, formatShortDate, timeUntil } from '@/utils/date'

/** VB7 order tracker (+ VB8 confirm modal, seller dispatch, digital downloads). */
const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const id = computed(() => String(route.params.id))
const { data: order, state, error, reload, mutate } = useResource((s) => orderService.get(id.value, s), { watch: [id] })
const confirmOpen = ref(false)
const dispatchOpen = ref(false)
const dispatch = ref({ carrier: 'DHL Express', trackingNumber: '' })
const dispatchError = ref<string | null>(null)
const busy = ref(false)

useSeo(() => ({ title: order.value ? `Order #${order.value.number}` : 'Order', noindex: true }))
onMounted(() => {
  if (route.query.confirm === '1') confirmOpen.value = true
})

const timeline = computed(() => (order.value?.tracking ?? []).map((t) => ({ label: t.label, detail: [t.occurredAt ? formatDateTime(t.occurredAt) : null, t.detail].filter(Boolean).join(' · '), state: t.state })))

async function message() {
  const o = order.value
  if (!o) return
  try {
    const c = await messageService.start(o.items[0]!.listingId, '')
    await router.push({ name: 'messages', params: { conversationId: c.id } })
  } catch (e) {
    ui.error("Couldn't open messages", toApiError(e).message)
  }
}

async function invoice() {
  if (!order.value) return
  try {
    const blob = await orderService.invoice(order.value.id)
    const url = URL.createObjectURL(blob)
    const a = Object.assign(document.createElement('a'), { href: url, download: `invoice-${order.value.number}.pdf` })
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    ui.error("Couldn't download invoice", toApiError(e).message)
  }
}

/** Digital purchases: Laravel authorises and returns a short-lived signed URL. */
async function download(assetId: string) {
  if (!order.value) return
  try {
    const { url } = await orderService.authorizeDownload(order.value.id, assetId)
    window.location.assign(url)
  } catch (e) {
    ui.error("Couldn't start download", toApiError(e).message)
  }
}

async function markDispatched() {
  if (!order.value) return
  if (!dispatch.value.trackingNumber.trim()) {
    dispatchError.value = 'Enter the tracking number.'
    return
  }
  busy.value = true
  try {
    const updated = await orderService.markDispatched(order.value.id, dispatch.value)
    mutate(() => updated)
    dispatchOpen.value = false
    ui.success('Marked as dispatched', 'The buyer has been notified with tracking.')
  } catch (e) {
    const err = toApiError(e)
    dispatchError.value = err.field('trackingNumber') ?? err.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div>
    <AppBreadcrumb :items="[{ label: 'My Hangar', to: { name: 'hangar' } }, { label: 'Orders', to: { name: 'hangar-orders' } }, { label: order ? `#${order.number}` : '…' }]" separator="chevron" />

    <ErrorState v-if="state === 'error'" :error="error" not-found-title="Order not found" class="pw-card pw-od__err" @retry="reload" />
    <div v-else-if="!order" class="pw-od__grid pw-od__top"><AppSkeleton height="420px" radius="var(--pw-radius-lg)" /><AppSkeleton height="420px" radius="var(--pw-radius-lg)" /></div>

    <template v-else>
      <header class="pw-page-head pw-od__top">
        <div>
          <h1 class="pw-page-title pw-row">Order #{{ order.number }} <StatusBadge :status="ORDER_STATUS[order.status]" /></h1>
          <p class="pw-page-sub">Placed {{ formatShortDate(order.placedAt) }}<template v-if="order.payment?.methodLabel"> · paid with {{ order.payment.methodLabel }}</template></p>
        </div>
        <div class="pw-page-head__actions">
          <AppButton variant="secondary" @click="invoice"><template #icon><Download :size="16" /></template>Download invoice</AppButton>
          <AppButton variant="secondary" @click="message"><template #icon><MessageCircle :size="16" /></template>Message {{ order.role === 'buyer' ? 'seller' : 'buyer' }}</AppButton>
        </div>
      </header>

      <div v-if="order.allowedActions.includes('confirm_delivery')" class="pw-od__cta" role="status">
        <p><strong>Your item landed.</strong> Check it matches the listing, then confirm to release funds{{ order.autoReleaseAt ? ` — or escrow releases automatically in ${timeUntil(order.autoReleaseAt)}` : '' }}.</p>
        <AppButton variant="success" @click="confirmOpen = true">Confirm &amp; release</AppButton>
      </div>
      <div v-if="order.allowedActions.includes('mark_dispatched')" class="pw-od__cta is-warn" role="status">
        <p><strong>Awaiting wheels-up.</strong> Dispatch by {{ order.dispatchBy ? formatShortDate(order.dispatchBy) : 'the deadline' }} to keep your on-time rate.</p>
        <AppButton @click="dispatchOpen = true"><template #icon><Truck :size="16" /></template>Mark as dispatched</AppButton>
      </div>

      <div class="pw-od__grid">
        <section class="pw-card pw-card-pad" aria-labelledby="track">
          <div v-if="order.estimatedDelivery" class="pw-od__eta">
            <div>
              <p class="pw-eyebrow">Estimated landing</p>
              <h2 id="track" class="pw-od__eta-date">{{ dateRangeLabel(order.estimatedDelivery.from, order.estimatedDelivery.to) }}</h2>
            </div>
            <div v-if="order.carrier" class="pw-od__carrier">
              <p>{{ order.carrier.name }}</p>
              <p class="pw-mono">{{ order.carrier.trackingNumber }}</p>
            </div>
          </div>
          <h2 v-else id="track" class="pw-card-title">Tracking</h2>

          <div v-if="order.route" class="pw-od__route" role="img" :aria-label="`Route from ${order.route.from} to ${order.route.to}, ${Math.round(order.route.progress * 100)}% complete`">
            <div class="pw-od__route-line"><span :style="{ width: `${order.route.progress * 100}%` }" /><Send :size="18" class="pw-od__plane" :style="{ left: `${order.route.progress * 100}%` }" /></div>
            <div class="pw-between pw-od__route-codes"><span>{{ order.route.from }}</span><span>{{ order.route.to }}</span></div>
          </div>

          <AppTimeline v-if="timeline.length" :items="timeline" />
          <div v-else-if="order.items.some((i) => i.digitalAssets?.length)" class="pw-od__downloads">
            <h3 class="pw-card-title">Your files</h3>
            <ul role="list">
              <li v-for="a in order.items.flatMap((i) => i.digitalAssets ?? [])" :key="a.id">
                <span><strong>{{ a.name }}</strong><small>{{ a.sizeLabel }}</small></span>
                <AppButton size="sm" variant="secondary" @click="download(a.id)"><template #icon><Download :size="14" /></template>Download</AppButton>
              </li>
            </ul>
            <p class="pw-muted pw-od__dl-note">Links are generated on demand and expire after 5 minutes.</p>
          </div>
          <p v-else class="pw-muted">No tracking events yet.</p>
        </section>

        <aside class="pw-od__aside">
          <div class="pw-card pw-card-pad">
            <div v-for="item in order.items" :key="item.id" class="pw-od__item">
              <AppImage :media="item.image" ratio="1" sizes="52px" class="pw-od__thumb" />
              <div>
                <RouterLink :to="{ name: 'listing', params: { slug: item.listingSlug } }" class="pw-od__item-title">{{ item.title }}</RouterLink>
                <p class="pw-muted pw-od__item-meta">{{ item.condition ? CONDITION_LABELS[item.condition].label : '' }}<template v-if="item.size"> · Size {{ item.size }}</template> · sold by {{ order.seller.displayName }}</p>
              </div>
            </div>
            <dl class="pw-dl pw-od__totals">
              <dt>Item</dt><dd>{{ formatMoney(order.totals.items) }}</dd>
              <dt>Freight</dt><dd>{{ formatMoney(order.totals.freight) }}</dd>
              <dt>Buyer protection</dt><dd>{{ formatMoney(order.totals.buyerProtection) }}</dd>
              <template v-if="order.totals.duties"><dt>Import duties</dt><dd>{{ formatMoney(order.totals.duties) }}</dd></template>
              <dt class="pw-od__total">Total paid</dt><dd class="pw-od__total">{{ formatMoney(order.totals.total) }}</dd>
            </dl>
          </div>

          <div class="pw-od__escrow">
            <p class="pw-od__escrow-label"><Lock :size="14" aria-hidden="true" /> Escrow {{ order.escrowStatus === 'released' ? 'released' : order.escrowStatus === 'frozen' ? 'frozen' : 'holding' }}</p>
            <p class="pw-od__escrow-amount">{{ formatMoney(order.totals.total) }}</p>
            <p>{{ order.escrowStatus === 'released' ? 'Funds have been released to the seller.' : order.escrowStatus === 'frozen' ? 'Frozen while a mediator reviews your dispute.' : 'The seller is paid only after you confirm the item landed as described.' }}</p>
          </div>

          <div v-if="order.shippingAddress" class="pw-card pw-card-pad">
            <h2 class="pw-card-title">Deliver to</h2>
            <address class="pw-od__addr">
              {{ order.shippingAddress.fullName }}<br />
              {{ order.shippingAddress.line1 }}<br />
              {{ order.shippingAddress.city }} {{ order.shippingAddress.postalCode }}, {{ order.shippingAddress.countryCode === 'NG' ? 'Nigeria' : order.shippingAddress.countryCode }}
            </address>
          </div>

          <RouterLink v-if="order.allowedActions.includes('open_dispute')" :to="{ name: 'dispute-new', query: { order: order.id } }" class="pw-od__problem">Report a problem with this order</RouterLink>
          <RouterLink v-else-if="order.disputeId" :to="{ name: 'hangar-dispute', params: { id: order.disputeId } }" class="pw-od__problem">View dispute</RouterLink>
        </aside>
      </div>

      <ConfirmLandedModal :open="confirmOpen" :order="order" @close="confirmOpen = false" @confirmed="mutate(() => $event)" />
      <AppModal :open="dispatchOpen" title="Mark as dispatched" description="Add the carrier and tracking number. The buyer is notified immediately." size="sm" @close="dispatchOpen = false">
        <form id="dispatch-form" class="pw-stack" novalidate @submit.prevent="markDispatched">
          <AppSelect v-model="dispatch.carrier" label="Carrier" :options="['DHL Express', 'FedEx', 'UPS', 'GIG Logistics', 'PW Freight'].map((c) => ({ value: c, label: c }))" />
          <AppInput v-model="dispatch.trackingNumber" label="Tracking number" autocomplete="off" :error="dispatchError" />
        </form>
        <template #footer>
          <AppButton variant="secondary" @click="dispatchOpen = false">Cancel</AppButton>
          <AppButton type="submit" form="dispatch-form" :loading="busy">Confirm dispatch</AppButton>
        </template>
      </AppModal>
    </template>
  </div>
</template>

<style scoped>
.pw-od__top,
.pw-od__err {
  margin-top: var(--pw-space-5);
}

.pw-od__cta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--pw-space-3);
  margin-bottom: var(--pw-space-5);
  padding: var(--pw-space-4) var(--pw-space-5);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-success-100);
  color: var(--pw-success-700);
}

.pw-od__cta.is-warn {
  background: var(--pw-warning-100);
  color: var(--pw-warning-700);
}

.pw-od__cta p {
  flex: 1 1 300px;
}

.pw-od__grid {
  display: grid;
  gap: var(--pw-space-5);
}

.pw-od__eta {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--pw-space-3);
}

.pw-od__eta-date {
  margin-top: 4px;
  font-size: var(--pw-text-xl);
}

.pw-od__carrier {
  text-align: right;
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-semibold);
}

.pw-od__carrier .pw-mono {
  font-size: var(--pw-text-xs);
  font-weight: var(--pw-weight-regular);
  color: var(--pw-muted);
}

.pw-od__route {
  margin: var(--pw-space-5) 0 var(--pw-space-6);
  padding: var(--pw-space-6) var(--pw-space-5) var(--pw-space-3);
  border-radius: var(--pw-radius-md);
  background: var(--pw-navy-50);
}

.pw-od__route-line {
  position: relative;
  height: 2px;
  background: repeating-linear-gradient(90deg, var(--pw-navy-300) 0 6px, transparent 6px 10px);
}

.pw-od__route-line > span {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--pw-navy-700);
}

.pw-od__plane {
  position: absolute;
  top: 50%;
  color: var(--pw-navy-700);
  transform: translate(-50%, -50%) rotate(45deg);
}

.pw-od__route-codes {
  margin-top: var(--pw-space-3);
  font-size: var(--pw-text-xs);
  font-weight: var(--pw-weight-bold);
}

.pw-od__downloads li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--pw-space-3);
  padding: var(--pw-space-3) 0;
  border-bottom: 1px solid var(--pw-border);
}

.pw-od__downloads li span {
  display: flex;
  flex-direction: column;
}

.pw-od__downloads small {
  color: var(--pw-muted);
  font-size: var(--pw-text-xs);
}

.pw-od__dl-note {
  margin-top: var(--pw-space-3);
  font-size: var(--pw-text-xs);
}

.pw-od__aside {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-4);
}

.pw-od__item {
  display: flex;
  gap: var(--pw-space-3);
  padding-bottom: var(--pw-space-4);
  margin-bottom: var(--pw-space-4);
  border-bottom: 1px solid var(--pw-border);
}

.pw-od__thumb {
  width: 52px;
  flex: none;
  border-radius: var(--pw-radius-md);
}

.pw-od__item-title {
  color: var(--pw-ink);
  font-weight: var(--pw-weight-medium);
  font-size: var(--pw-text-sm);
}

.pw-od__item-meta {
  font-size: var(--pw-text-xs);
}

.pw-od__total {
  color: var(--pw-ink) !important;
  font-weight: var(--pw-weight-semibold);
}

.pw-od__escrow {
  padding: var(--pw-space-5);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-navy-900);
  color: rgb(255 255 255 / 82%);
  font-size: var(--pw-text-sm);
}

.pw-od__escrow-label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--pw-gold-400);
  font-size: var(--pw-text-2xs);
  font-weight: var(--pw-weight-bold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.pw-od__escrow-amount {
  margin: var(--pw-space-2) 0;
  font-family: var(--pw-font-display);
  font-size: 1.75rem;
  font-weight: var(--pw-weight-bold);
  color: #fff;
}

.pw-od__addr {
  margin-top: var(--pw-space-3);
  font-style: normal;
  font-size: var(--pw-text-sm);
  line-height: var(--pw-leading-relaxed);
  color: var(--pw-ink-2);
}

.pw-od__problem {
  text-align: center;
  color: var(--pw-danger-600);
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-semibold);
}

@media (min-width: 1024px) {
  .pw-od__grid {
    grid-template-columns: minmax(0, 1.6fr) minmax(280px, 1fr);
    align-items: start;
  }
}
</style>
