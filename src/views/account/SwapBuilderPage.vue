<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeftRight, Check, Tag } from '@lucide/vue'
import AppBreadcrumb from '@/components/common/AppBreadcrumb.vue'
import AppImage from '@/components/common/AppImage.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import AppMoneyInput from '@/components/forms/AppMoneyInput.vue'
import AppTextarea from '@/components/forms/AppTextarea.vue'
import { productService } from '@/api/products.api'
import { listingService } from '@/api/listings.api'
import { swapService } from '@/api/trades.api'
import { toApiError } from '@/api/errors'
import { useResource } from '@/composables/useResource'
import { useSeo } from '@/composables/useSeo'
import { useUiStore } from '@/stores/ui.store'
import { CONDITION_LABELS } from '@/constants/labels'
import { formatMoney } from '@/utils/money'
import { track } from '@/utils/analytics'

/** VB6 — propose a swap: items from your hangar + optional cash top-up. */
const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const slug = computed(() => String(route.params.slug))

const { data: target, state, error, reload } = useResource((s) => productService.getBySlug(slug.value, s), { watch: [slug] })
const { data: mine, state: mineState } = useResource((s) => listingService.mine({ status: 'live' }, s))
const offered = ref<string[]>([])
const cash = ref(0)
const message = ref('')
const errorMsg = ref<string | null>(null)
const sending = ref(false)
const SWAP_FEE = 0.04

const options = computed(() => (mine.value?.data ?? []).filter((l) => l.id !== target.value?.id))
const itemsValue = computed(() => options.value.filter((l) => offered.value.includes(l.id)).reduce((s, l) => s + l.price.amount, 0))
const total = computed(() => itemsValue.value + cash.value)
const pct = computed(() => (target.value ? Math.min(100, Math.round((total.value / target.value.price.amount) * 100)) : 0))
const fee = computed(() => Math.round(total.value * SWAP_FEE))
const usd = (amount: number) => ({ amount, currency: 'USD' as const })

useSeo(() => ({ title: target.value ? `Propose a swap · ${target.value.title}` : 'Propose a swap', noindex: true }))

function toggle(id: string) {
  offered.value = offered.value.includes(id) ? offered.value.filter((x) => x !== id) : [...offered.value, id]
  errorMsg.value = null
}

async function send() {
  if (!target.value) return
  if (!offered.value.length) {
    errorMsg.value = 'Choose at least one item from your hangar.'
    return
  }
  sending.value = true
  try {
    await swapService.create(target.value.id, { offeredListingIds: offered.value, cashAdjustment: cash.value ? usd(cash.value) : null, message: message.value || undefined })
    track('swap_submitted', { listingId: target.value.id, itemsOffered: offered.value.length, cashTopUp: cash.value })
    ui.success('Swap proposal sent', `${target.value.seller.displayName} has 48h to respond.`)
    await router.push({ name: 'hangar-offers', query: { box: 'sent' } })
  } catch (e) {
    const err = toApiError(e)
    errorMsg.value = err.field('offeredListingIds') ?? err.message
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <div class="pw-container pw-swap">
    <AppBreadcrumb
      separator="chevron"
      :items="[
        { label: 'Marketplace', to: { name: 'marketplace' } },
        ...(target ? [{ label: target.category.name, to: { name: 'category', params: { slug: target.category.slug } } }, { label: target.title.split(' — ')[0]!, to: { name: 'listing', params: { slug: target.slug } } }] : []),
        { label: 'Propose swap' },
      ]"
    />
    <header class="pw-swap__head">
      <h1 class="pw-page-title">Propose a swap</h1>
      <p class="pw-page-sub">Offer items from your hangar, add cash if needed. Both sides ship; escrow releases when both confirm.</p>
    </header>

    <ErrorState v-if="state === 'error'" :error="error" class="pw-card" @retry="reload" />
    <div v-else-if="!target" class="pw-swap__grid"><AppSkeleton height="260px" radius="var(--pw-radius-lg)" /><AppSkeleton height="260px" radius="var(--pw-radius-lg)" /></div>
    <template v-else>
      <div class="pw-swap__grid">
        <section class="pw-card pw-card-pad" aria-labelledby="receive">
          <p id="receive" class="pw-eyebrow">You receive</p>
          <div class="pw-swap__target">
            <AppImage :media="target.images[0]" ratio="1" sizes="120px" class="pw-swap__target-img" />
            <div>
              <p class="pw-swap__target-title">{{ target.title }}</p>
              <p class="pw-muted pw-swap__small">Seller: {{ target.seller.displayName }} · {{ target.location?.city ?? '' }}</p>
              <p class="pw-swap__target-price">{{ formatMoney(target.price) }}</p>
              <AppBadge tone="success">{{ CONDITION_LABELS[target.condition].label }}</AppBadge>
            </div>
          </div>
        </section>

        <span class="pw-swap__icon" aria-hidden="true"><ArrowLeftRight :size="20" /></span>

        <section class="pw-card pw-card-pad" aria-labelledby="offer">
          <p id="offer" class="pw-eyebrow">You offer · from your hangar</p>
          <AppSkeleton v-if="mineState === 'loading'" :lines="3" height="56px" />
          <AppEmptyState v-else-if="!options.length" :icon="Tag" title="No live listings to offer" body="List an item first — you can add a cash top-up in a swap." compact>
            <AppButton size="sm" :to="{ name: 'listing-new' }">List an item</AppButton>
          </AppEmptyState>
          <ul v-else class="pw-swap__options" role="list">
            <li v-for="l in options" :key="l.id">
              <label class="pw-swap__opt" :class="{ 'is-on': offered.includes(l.id) }">
                <input type="checkbox" class="sr-only" :checked="offered.includes(l.id)" @change="toggle(l.id)" />
                <span class="pw-swap__check" aria-hidden="true"><Check :size="13" :stroke-width="3" /></span>
                <AppImage :media="l.images[0]" ratio="1" sizes="40px" class="pw-swap__opt-img" />
                <span><strong>{{ l.title }}</strong><small>Est. value {{ formatMoney(l.price, { whole: true }) }}</small></span>
              </label>
            </li>
          </ul>
          <div class="pw-swap__cash">
            <AppMoneyInput v-model="cash" label="Cash top-up" />
            <p class="pw-muted pw-swap__small">Paid into escrow now. Refunded if the seller declines.</p>
          </div>
        </section>
      </div>

      <div class="pw-swap__bottom">
        <section class="pw-card pw-card-pad" aria-labelledby="balance">
          <h2 id="balance" class="pw-card-title">Swap balance</h2>
          <div class="pw-swap__bar-row">
            <div class="pw-swap__bar" role="progressbar" :aria-valuenow="pct" aria-valuemin="0" aria-valuemax="100" aria-label="Offer value versus listing price"><span :style="{ width: `${pct}%` }" /></div>
            <strong class="pw-swap__bar-label" :class="{ 'is-full': pct >= 95 }">{{ formatMoney(usd(total), { whole: true }) }} of {{ formatMoney(target.price, { whole: true }) }}</strong>
          </div>
          <dl class="pw-swap__sums">
            <div><dt>Items offered</dt><dd>{{ formatMoney(usd(itemsValue)) }}</dd></div>
            <div><dt>Cash top-up</dt><dd>{{ formatMoney(usd(cash)) }}</dd></div>
            <div><dt>Swap fee ({{ SWAP_FEE * 100 }}% each side)</dt><dd>{{ formatMoney(usd(fee)) }}</dd></div>
          </dl>
        </section>
        <section class="pw-card pw-card-pad pw-stack">
          <AppTextarea v-model="message" label="Message to seller (optional)" :rows="3" :maxlength="500" placeholder="e.g. Zulu 3 is 2023, fresh battery cover. Happy to meet at LOS GA terminal." />
          <p v-if="errorMsg" class="pw-swap__err" role="alert">{{ errorMsg }}</p>
          <AppButton size="lg" block :loading="sending" @click="send">Send swap proposal</AppButton>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.pw-swap {
  padding-top: var(--pw-space-5);
  padding-bottom: var(--pw-space-16);
}

.pw-swap__head {
  margin: var(--pw-space-5) 0 var(--pw-space-6);
}

.pw-swap__grid {
  display: grid;
  gap: var(--pw-space-4);
  align-items: center;
}

.pw-swap__target {
  display: flex;
  gap: var(--pw-space-4);
  margin-top: var(--pw-space-3);
}

.pw-swap__target-img {
  width: 120px;
  flex: none;
  border-radius: var(--pw-radius-md);
}

.pw-swap__target-title {
  font-weight: var(--pw-weight-semibold);
}

.pw-swap__target-price {
  margin: var(--pw-space-2) 0;
  font-family: var(--pw-font-display);
  font-size: 1.5rem;
  font-weight: var(--pw-weight-bold);
}

.pw-swap__small {
  font-size: var(--pw-text-xs);
}

.pw-swap__icon {
  display: grid;
  place-items: center;
  justify-self: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--pw-navy-700);
  color: #fff;
}

.pw-swap__options {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-2);
  margin-top: var(--pw-space-3);
}

.pw-swap__opt {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  padding: var(--pw-space-3);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-md);
  cursor: pointer;
}

.pw-swap__opt.is-on {
  border-color: var(--pw-navy-700);
  box-shadow: inset 0 0 0 1px var(--pw-navy-700);
}

.pw-swap__opt:has(input:focus-visible) {
  outline: 2px solid var(--pw-color-focus);
  outline-offset: 2px;
}

.pw-swap__check {
  display: grid;
  place-items: center;
  flex: none;
  width: 20px;
  height: 20px;
  border: 1.5px solid var(--pw-border-strong);
  border-radius: var(--pw-radius-xs);
  color: transparent;
}

.is-on .pw-swap__check {
  background: var(--pw-navy-700);
  border-color: var(--pw-navy-700);
  color: #fff;
}

.pw-swap__opt-img {
  width: 40px;
  flex: none;
  border-radius: var(--pw-radius-sm);
}

.pw-swap__opt span:last-child {
  display: flex;
  flex-direction: column;
  font-size: var(--pw-text-sm);
}

.pw-swap__opt small {
  color: var(--pw-muted);
  font-size: var(--pw-text-xs);
}

.pw-swap__cash {
  display: grid;
  gap: var(--pw-space-2);
  margin-top: var(--pw-space-4);
}

.pw-swap__bottom {
  display: grid;
  gap: var(--pw-space-4);
  margin-top: var(--pw-space-5);
}

.pw-swap__bar-row {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  margin: var(--pw-space-4) 0;
}

.pw-swap__bar {
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: var(--pw-border);
  overflow: hidden;
}

.pw-swap__bar span {
  display: block;
  height: 100%;
  background: var(--pw-success-600);
  transition: width var(--pw-duration) var(--pw-ease);
}

.pw-swap__bar-label {
  font-size: var(--pw-text-sm);
  white-space: nowrap;
}

.pw-swap__bar-label.is-full {
  color: var(--pw-success-600);
}

.pw-swap__sums {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pw-space-3) var(--pw-space-6);
  margin: 0;
  font-size: var(--pw-text-sm);
}

.pw-swap__sums div {
  display: flex;
  gap: var(--pw-space-3);
}

.pw-swap__sums dt {
  color: var(--pw-muted);
}

.pw-swap__sums dd {
  margin: 0;
  font-weight: var(--pw-weight-semibold);
}

.pw-swap__err {
  color: var(--pw-danger-600);
  font-size: var(--pw-text-sm);
}

@media (min-width: 1024px) {
  .pw-swap__grid {
    grid-template-columns: 1fr auto 1fr;
    align-items: stretch;
  }
  .pw-swap__icon {
    align-self: center;
  }
  .pw-swap__bottom {
    grid-template-columns: 1.4fr 1fr;
  }
}
</style>
