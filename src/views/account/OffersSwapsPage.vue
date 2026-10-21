<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeftRight, Check, Inbox, MessageCircle } from '@lucide/vue'
import AppTabs from '@/components/common/AppTabs.vue'
import AppImage from '@/components/common/AppImage.vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppTimeline from '@/components/common/AppTimeline.vue'
import AppConfirmDialog from '@/components/common/AppConfirmDialog.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import RatingStars from '@/components/common/RatingStars.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import AppMoneyInput from '@/components/forms/AppMoneyInput.vue'
import { loadTradeInbox, offerService, swapService, type TradeBox } from '@/api/trades.api'
import { messageService } from '@/api/messages.api'
import { toApiError } from '@/api/errors'
import { useResource } from '@/composables/useResource'
import { useSeo } from '@/composables/useSeo'
import { useUiStore } from '@/stores/ui.store'
import { OFFER_STATUS, SWAP_STATUS } from '@/constants/labels'
import { formatMoney } from '@/utils/money'
import { formatMonthYear, formatShortDate, timeAgoShort, timeUntil } from '@/utils/date'
import type { InboxItem, Offer, SwapRequest } from '@/types/swap'

/** VB5 — offers & swaps inbox with detail, counter and history. */
useSeo({ title: 'Offers & swaps', noindex: true })
const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const box = ref<TradeBox>('received')
const selectedId = ref<string | null>(typeof route.query.id === 'string' ? route.query.id : null)
const counter = ref(0)
const counterError = ref<string | null>(null)
const busy = ref<string | null>(null)
const declineOpen = ref(false)

const { data: items, state, error, reload, mutate } = useResource((s) => loadTradeInbox(box.value, s), { watch: [box] })
watch(items, (list) => {
  if (!list?.length) return (selectedId.value = null)
  if (!selectedId.value || !list.some((i) => i.id === selectedId.value)) selectedId.value = list[0]!.id
})

const selected = computed<InboxItem | null>(() => items.value?.find((i) => i.id === selectedId.value) ?? null)
const offer = computed<Offer | null>(() => (selected.value?.kind === 'offer' ? selected.value : null))
const swap = computed<SwapRequest | null>(() => (selected.value?.kind === 'swap' ? selected.value : null))
const openCount = computed(() => items.value?.filter((i) => i.status === 'pending').length ?? 0)
const expiringToday = computed(() => items.value?.filter((i) => i.status === 'pending' && Date.parse(i.expiresAt) - Date.now() < 86400_000).length ?? 0)
const canDecide = computed(() => !!selected.value && (selected.value.allowedActions as string[]).includes('accept'))
const listing = computed(() => (offer.value ? offer.value.listing : swap.value?.targetListing))

watch(offer, (o) => {
  if (o) counter.value = Math.round((o.amount.amount + o.listing.price.amount) / 2 / 500) * 500
  counterError.value = null
})

const presets = computed(() => {
  const o = offer.value
  if (!o) return []
  const mid = counter.value
  return [mid - 500, mid, mid + 500].filter((v) => v > o.amount.amount && v < o.listing.price.amount)
})

function replace(updated: InboxItem) {
  mutate((list) => list?.map((i) => (i.id === updated.id ? updated : i)) ?? null)
}

async function act(kind: 'accept' | 'decline' | 'counter' | 'reject') {
  const item = selected.value
  if (!item) return
  busy.value = kind
  try {
    let updated: InboxItem
    if (item.kind === 'offer') {
      if (kind === 'counter') updated = await offerService.counter(item.id, { amount: counter.value, currency: item.amount.currency })
      else if (kind === 'accept') updated = await offerService.accept(item.id)
      else updated = await offerService.decline(item.id)
    } else {
      updated = kind === 'accept' ? await swapService.accept(item.id) : await swapService.reject(item.id)
    }
    replace(updated)
    ui.success(
      kind === 'accept' ? (item.kind === 'offer' ? `Offer accepted — ${item.counterparty.displayName} has 24h to pay` : 'Swap accepted — both sides ship within 3 days') : kind === 'counter' ? 'Counter sent' : 'Declined with a polite note',
    )
    declineOpen.value = false
  } catch (e) {
    const err = toApiError(e)
    if (kind === 'counter') counterError.value = err.field('amount') ?? err.message
    else ui.error('Action failed', err.message)
  } finally {
    busy.value = null
  }
}

async function message() {
  const l = listing.value
  if (!l) return
  try {
    const c = await messageService.start(l.id, '')
    await router.push({ name: 'messages', params: { conversationId: c.id } })
  } catch (e) {
    ui.error("Couldn't open messages", toApiError(e).message)
  }
}

function scrollToCounter() {
  const el = document.getElementById('counter-title')
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el?.parentElement?.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true })
}

const status = (i: InboxItem) => (i.kind === 'offer' ? OFFER_STATUS[i.status] : SWAP_STATUS[i.status])
const amountLabel = (i: InboxItem) => (i.kind === 'offer' ? formatMoney(i.amount, { whole: true }) : i.cashAdjustment ? `+${formatMoney(i.cashAdjustment, { whole: true })}` : 'Even')
const summary = (i: InboxItem) =>
  i.kind === 'offer' ? `${i.listing.title.split(' — ')[0]} · ${i.status === 'pending' ? `expires in ${timeUntil(i.expiresAt)}` : status(i).label.toLowerCase()}` : `${i.targetListing.title.split(' — ')[0]} · offers ${i.offeredItems.map((o) => o.listing.title.split(',')[0]).join(' + ')}${i.cashAdjustment ? ` + ${formatMoney(i.cashAdjustment, { whole: true })}` : ''}`
</script>

<template>
  <div>
    <header class="pw-page-head">
      <div>
        <h1 class="pw-page-title">Offers &amp; swaps</h1>
        <p class="pw-page-sub">{{ openCount }} open · {{ expiringToday }} expiring today</p>
      </div>
    </header>

    <div class="pw-os">
      <section class="pw-card pw-os__list" aria-label="Inbox">
        <div class="pw-os__tabs">
          <AppTabs v-model="box" variant="pills" label="Inbox" :items="[{ value: 'received', label: `Received${box === 'received' && items ? ` ${items.length}` : ''}` }, { value: 'sent', label: 'Sent' }, { value: 'archived', label: 'Archived' }]" />
        </div>
        <ErrorState v-if="state === 'error'" :error="error" compact @retry="reload" />
        <ul v-else-if="state === 'loading'" class="pw-os__items" aria-busy="true"><li v-for="n in 4" :key="n" class="pw-os__sk"><AppSkeleton :lines="2" /></li></ul>
        <AppEmptyState v-else-if="!items?.length" :icon="Inbox" title="Nothing here" :body="box === 'sent' ? 'Offers and swaps you send appear here.' : 'New offers and swap proposals appear here.'" compact />
        <ul v-else class="pw-os__items" role="listbox" aria-label="Offers and swaps">
          <li v-for="i in items" :key="i.id" role="option" :aria-selected="i.id === selectedId">
            <button type="button" class="pw-os__row" :class="{ 'is-active': i.id === selectedId }" @click="selectedId = i.id">
              <AppImage :media="i.kind === 'offer' ? i.listing.image : i.targetListing.image" ratio="1" sizes="44px" class="pw-os__thumb" />
              <span class="pw-os__row-text">
                <span class="pw-os__row-top">
                  <strong>{{ i.counterparty.displayName }}</strong>
                  <AppBadge :tone="i.kind === 'swap' ? 'info' : 'neutral'">{{ i.kind }}</AppBadge>
                  <span v-if="i.unread" class="pw-os__dot" aria-label="Unread" />
                </span>
                <span class="pw-os__row-sub">{{ summary(i) }}</span>
              </span>
              <span class="pw-os__row-amt">
                <strong>{{ amountLabel(i) }}</strong>
                <small>{{ timeAgoShort(i.createdAt) }}</small>
              </span>
            </button>
          </li>
        </ul>
      </section>

      <div class="pw-os__detail">
        <template v-if="selected && listing">
          <section class="pw-card pw-card-pad">
            <div class="pw-os__listing">
              <AppImage :media="listing.image" ratio="1" sizes="56px" class="pw-os__listing-img" />
              <div>
                <RouterLink :to="{ name: 'listing', params: { slug: listing.slug } }" class="pw-os__listing-title">{{ listing.title }}</RouterLink>
                <p class="pw-muted pw-os__small">Listed at {{ formatMoney(listing.price) }}<template v-if="listing.minimumOffer"> · minimum offer {{ formatMoney(listing.minimumOffer, { whole: true }) }}</template></p>
              </div>
              <AppBadge v-if="selected.status === 'pending'" tone="warning" class="pw-os__expiry">Expires in {{ timeUntil(selected.expiresAt) }}</AppBadge>
              <StatusBadge v-else :status="status(selected)" class="pw-os__expiry" />
            </div>

            <div class="pw-os__summary">
              <div v-if="offer" class="pw-os__amount">
                <p class="pw-eyebrow">Offer</p>
                <p class="pw-os__amount-value">{{ formatMoney(offer.amount) }}</p>
                <p class="pw-muted pw-os__small">{{ offer.belowAskingPercent }}% below asking<template v-if="offer.youReceive"> · you'd receive {{ formatMoney(offer.youReceive) }}</template></p>
                <p v-if="offer.counterAmount" class="pw-os__small">Your counter: <strong>{{ formatMoney(offer.counterAmount) }}</strong></p>
              </div>
              <div v-else-if="swap" class="pw-os__amount">
                <p class="pw-eyebrow">Swap proposal</p>
                <ul class="pw-os__swap-items" role="list">
                  <li v-for="o in swap.offeredItems" :key="o.listing.id"><AppImage :media="o.listing.image" ratio="1" sizes="40px" class="pw-os__swap-img" /> {{ o.listing.title }} <span class="pw-muted">· est. {{ formatMoney(o.estimatedValue, { whole: true }) }}</span></li>
                </ul>
                <p v-if="swap.cashAdjustment" class="pw-os__small"><ArrowLeftRight :size="14" aria-hidden="true" /> + {{ formatMoney(swap.cashAdjustment) }} cash top-up · swap fee {{ formatMoney(swap.swapFee) }}</p>
              </div>
              <div class="pw-os__party">
                <AppAvatar :name="selected.counterparty.displayName" :initials="selected.counterparty.initials" :size="36" tone="cream" />
                <div>
                  <p class="pw-row"><strong>{{ selected.counterparty.displayName }}</strong><AppBadge v-if="selected.counterparty.verified" tone="gold" solid>Verified</AppBadge></p>
                  <p class="pw-muted pw-os__small">{{ selected.counterparty.location }} · member since {{ formatMonthYear(selected.counterparty.memberSince) }}</p>
                  <RatingStars :value="selected.counterparty.rating" show-value :count="`${selected.counterparty.trades} trades`" />
                </div>
              </div>
            </div>

            <blockquote v-if="selected.message" class="pw-os__quote">“{{ selected.message }}”</blockquote>

            <div class="pw-os__actions">
              <template v-if="canDecide">
                <AppButton variant="success" :loading="busy === 'accept'" @click="act('accept')"><template #icon><Check :size="16" /></template>Accept{{ offer ? ` ${formatMoney(offer.amount, { whole: true })}` : ' swap' }}</AppButton>
                <AppButton v-if="offer" variant="secondary" @click="scrollToCounter">Counter</AppButton>
                <AppButton variant="danger-outline" @click="declineOpen = true">Decline</AppButton>
              </template>
              <AppButton v-if="offer?.allowedActions.includes('checkout')" :to="{ name: 'checkout', query: { listing: offer.listing.id, offer: offer.id } }">Pay now</AppButton>
              <AppButton variant="ghost" @click="message"><template #icon><MessageCircle :size="16" /></template>Message {{ selected.direction === 'received' ? 'buyer' : 'seller' }}</AppButton>
            </div>
          </section>

          <section v-if="offer && offer.status === 'pending' && offer.direction === 'received'" class="pw-card pw-card-pad" aria-labelledby="counter-title">
            <h2 id="counter-title" class="pw-card-title">Counter offer</h2>
            <div class="pw-os__counter">
              <AppMoneyInput v-model="counter" label="Your price" size="lg" :error="counterError" class="pw-os__counter-input" />
              <div class="pw-os__presets" role="group" aria-label="Quick amounts">
                <button v-for="p in presets" :key="p" type="button" class="pw-os__preset" :class="{ 'is-on': p === counter }" @click="counter = p">{{ formatMoney({ amount: p, currency: 'USD' }, { whole: true }) }}</button>
              </div>
              <AppButton :loading="busy === 'counter'" @click="act('counter')">Send counter</AppButton>
            </div>
            <p class="pw-muted pw-os__small">Buyer has 24h to respond. Accepting reserves the item and opens escrow checkout for them.</p>
          </section>

          <section v-if="selected.history.length" class="pw-card pw-card-pad" aria-labelledby="hist">
            <h2 id="hist" class="pw-card-title pw-os__hist-title">{{ offer ? 'Offer' : 'Swap' }} history</h2>
            <AppTimeline :items="selected.history.map((h, idx) => ({ label: h.label, detail: h.detail || formatShortDate(h.occurredAt), state: idx === 0 ? 'current' : 'done' }))" />
          </section>
        </template>
        <AppEmptyState v-else-if="state === 'success'" :icon="Inbox" title="Select an offer or swap" class="pw-card" />
      </div>
    </div>

    <AppConfirmDialog
      :open="declineOpen"
      :title="offer ? 'Decline this offer?' : 'Reject this swap?'"
      body="We'll send a polite note. They can make a new offer if your listing is still live."
      confirm-label="Decline"
      tone="danger"
      :loading="busy === 'decline' || busy === 'reject'"
      @confirm="act(offer ? 'decline' : 'reject')"
      @cancel="declineOpen = false"
    />
  </div>
</template>

<style scoped>
.pw-os {
  display: grid;
  gap: var(--pw-space-5);
}

.pw-os__list {
  overflow: hidden;
  align-self: start;
}

.pw-os__tabs {
  padding: var(--pw-space-4);
  border-bottom: 1px solid var(--pw-border);
}

.pw-os__sk {
  padding: var(--pw-space-4);
}

.pw-os__row {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  width: 100%;
  padding: var(--pw-space-3) var(--pw-space-4);
  border: 0;
  border-left: 3px solid transparent;
  border-bottom: 1px solid var(--pw-border);
  background: none;
  text-align: left;
}

.pw-os__row:hover {
  background: var(--pw-surface-sunken);
}

.pw-os__row.is-active {
  border-left-color: var(--pw-navy-700);
  background: var(--pw-navy-50);
}

.pw-os__thumb {
  width: 44px;
  flex: none;
  border-radius: var(--pw-radius-md);
}

.pw-os__row-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pw-os__row-top {
  display: flex;
  align-items: center;
  gap: var(--pw-space-2);
  font-size: var(--pw-text-sm);
}

.pw-os__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--pw-danger-600);
}

.pw-os__row-sub {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-os__row-amt {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: var(--pw-text-sm);
}

.pw-os__row-amt small {
  font-size: var(--pw-text-2xs);
  color: var(--pw-subtle);
}

.pw-os__detail {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-5);
  min-width: 0;
}

.pw-os__listing {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--pw-space-3);
}

.pw-os__listing-img {
  width: 56px;
  flex: none;
  border-radius: var(--pw-radius-md);
}

.pw-os__listing > div {
  flex: 1 1 200px;
}

.pw-os__listing-title {
  color: var(--pw-ink);
  font-weight: var(--pw-weight-semibold);
}

.pw-os__small {
  font-size: var(--pw-text-xs);
}

.pw-os__summary {
  display: grid;
  gap: var(--pw-space-4);
  margin: var(--pw-space-5) 0 var(--pw-space-4);
}

.pw-os__amount,
.pw-os__party {
  padding: var(--pw-space-4);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
}

.pw-os__amount-value {
  font-family: var(--pw-font-display);
  font-size: 2rem;
  font-weight: var(--pw-weight-bold);
}

.pw-os__party {
  display: flex;
  gap: var(--pw-space-3);
}

.pw-os__swap-items {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-2);
  margin: var(--pw-space-2) 0;
  font-size: var(--pw-text-sm);
}

.pw-os__swap-items li {
  display: flex;
  align-items: center;
  gap: var(--pw-space-2);
}

.pw-os__swap-img {
  width: 40px;
  flex: none;
  border-radius: var(--pw-radius-sm);
}

.pw-os__quote {
  margin: 0 0 var(--pw-space-4);
  padding: var(--pw-space-3) var(--pw-space-4);
  border-radius: var(--pw-radius-md);
  background: var(--pw-surface-sunken);
  font-size: var(--pw-text-sm);
  color: var(--pw-ink-2);
}

.pw-os__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pw-space-2);
}

.pw-os__counter {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--pw-space-3);
  margin: var(--pw-space-4) 0 var(--pw-space-2);
}

.pw-os__counter-input {
  flex: 1 1 200px;
}

.pw-os__presets {
  display: flex;
  gap: var(--pw-space-2);
  padding-bottom: 8px;
}

.pw-os__preset {
  min-height: 34px;
  padding: 0 var(--pw-space-3);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-full);
  background: var(--pw-surface);
  font-size: var(--pw-text-sm);
}

.pw-os__preset.is-on {
  background: var(--pw-navy-700);
  border-color: var(--pw-navy-700);
  color: #fff;
}

.pw-os__hist-title {
  margin-bottom: var(--pw-space-4);
}

@media (min-width: 768px) {
  .pw-os__summary {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1280px) {
  .pw-os {
    grid-template-columns: 340px minmax(0, 1fr);
  }
}
</style>
