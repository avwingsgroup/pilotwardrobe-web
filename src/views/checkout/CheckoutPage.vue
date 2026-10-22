<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Check, Clock, Lock, Ruler, ShieldCheck } from '@lucide/vue'
import AppStepper from '@/components/common/AppStepper.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppImage from '@/components/common/AppImage.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import AppRadioCard from '@/components/forms/AppRadioCard.vue'
import AddressForm from '@/components/transactions/AddressForm.vue'
import PaymentMethodPicker from '@/components/payments/PaymentMethodPicker.vue'
import { addressService, checkoutService, orderService } from '@/api/orders.api'
import { paymentService } from '@/api/payments.api'
import { ApiError, toApiError } from '@/api/errors'
import { useSeo } from '@/composables/useSeo'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { appConfig } from '@/constants/config'
import { PAYMENT_GATEWAY_HOSTS } from '@/constants/breakpoints'
import { CONDITION_LABELS } from '@/constants/labels'
import { formatMoney } from '@/utils/money'
import { isAllowedExternalUrl } from '@/utils/security'
import { track } from '@/utils/analytics'
import type { CheckoutQuote } from '@/types/order'
import type { Address } from '@/types/user'
import type { PaymentGateway, PaymentMethod } from '@/types/payment'

/**
 * V4 checkout. Step 3 deliberately replaces the design's raw card fields with a
 * gateway selector: card data is entered only on the gateway's hosted page
 * (PCI scope stays with Paystack/Flutterwave/Monnify/Stripe/PayPal).
 */
useSeo({ title: 'Secure checkout', noindex: true })
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

const STEPS = ['Destination', 'Flight plan', 'Payment', 'Review']
const step = ref(0)
const quote = ref<CheckoutQuote | null>(null)
const quoteError = ref<ApiError | null>(null)
const addresses = ref<Address[]>([])
const addressId = ref('')
const addingAddress = ref(false)
const shippingId = ref<string>('')
const methods = ref<PaymentMethod[]>([])
const gateway = ref<PaymentGateway | null>(null)
const gatewayError = ref<string | null>(null)
const methodsLoading = ref(true)
const placing = ref(false)
const mounted = ref(false)
// Quote and saved addresses load in parallel; stepping on before both land would
// report "Choose a destination" even though a default address is about to be selected.
const ready = ref(false)

const input = computed(() => ({
  listingId: typeof route.query.listing === 'string' ? route.query.listing : undefined,
  cartId: typeof route.query.cart === 'string' ? route.query.cart : undefined,
  size: typeof route.query.size === 'string' ? route.query.size : null,
  offerId: typeof route.query.offer === 'string' ? route.query.offer : undefined,
}))
const physical = computed(() => (quote.value?.shippingOptions.length ?? 0) > 0)
const currency = computed(() => quote.value?.totals.total.currency ?? 'USD')

async function loadQuote() {
  try {
    quote.value = await checkoutService.quote({ ...input.value, addressId: addressId.value || undefined, shippingOptionId: shippingId.value || null })
    if (!shippingId.value && quote.value.selectedShippingId) shippingId.value = quote.value.selectedShippingId
    quoteError.value = null
  } catch (e) {
    quoteError.value = toApiError(e)
  }
}

onMounted(async () => {
  mounted.value = true
  if (!input.value.listingId && !input.value.cartId) {
    await router.replace({ name: 'cart' })
    return
  }
  const [addr] = await Promise.all([addressService.list().catch(() => []), loadQuote()])
  addresses.value = addr
  addressId.value = addr.find((a) => a.isDefault)?.id ?? addr[0]?.id ?? ''
  if (!physical.value) step.value = 2
  ready.value = true
  try {
    methods.value = await paymentService.methods({ currency: currency.value, country: auth.user?.countryCode ?? 'NG' })
    gateway.value = methods.value.find((m) => m.enabled)?.code ?? null
  } catch (e) {
    gatewayError.value = toApiError(e).message
  } finally {
    methodsLoading.value = false
  }
  track('checkout_started', { listingId: input.value.listingId, itemCount: quote.value?.items.length ?? 0, value: quote.value?.totals.total.amount ?? 0, currency: currency.value })
})

watch(shippingId, (v, old) => old && v !== old && loadQuote())
watch(gateway, (g) => {
  if (!g) return
  gatewayError.value = null
  track('payment_gateway_selected', { gateway: g })
})

const selectedAddress = computed(() => addresses.value.find((a) => a.id === addressId.value) ?? null)
const addressOptions = computed(() => addresses.value.map((a) => ({ value: a.id, label: `${a.fullName} · ${a.phone}`, hint: `${a.line1}, ${a.city} ${a.postalCode ?? ''}, ${a.countryCode}` })))
const shippingOptions = computed(() => (quote.value?.shippingOptions ?? []).map((s) => ({ value: s.id, label: s.label, hint: s.description, aside: s.price.amount ? formatMoney(s.price) : 'Free' })))

function next() {
  if (step.value === 0 && !addressId.value) return ui.error('Choose a destination', 'Add or pick a delivery address.')
  if (step.value === 2 && !gateway.value) {
    gatewayError.value = 'Choose how you want to pay.'
    return
  }
  step.value = Math.min(3, step.value + 1)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function back() {
  step.value = Math.max(physical.value ? 0 : 2, step.value - 1)
}

function onAddressSaved(a: Address) {
  addresses.value = [...addresses.value.filter((x) => x.id !== a.id), a]
  addressId.value = a.id
  addingAddress.value = false
}

/**
 * 1) create order (pending_payment) → 2) initialise payment server-side →
 * 3) redirect to the gateway's authorization URL (allow-listed hosts only).
 * The order is only marked paid after Laravel verifies the gateway (webhook/verify).
 */
async function placeOrder() {
  if (!gateway.value || !quote.value) return
  placing.value = true
  try {
    const order = await orderService.create({
      listingId: input.value.listingId,
      cartId: input.value.cartId,
      size: input.value.size,
      offerId: input.value.offerId,
      addressId: addressId.value,
      shippingOptionId: shippingId.value,
    })
    const init = await paymentService.initialize({ orderId: order.id, gateway: gateway.value, returnUrl: `${appConfig.appUrl}/payment/callback` })
    try {
      sessionStorage.setItem('pw.pending-payment', JSON.stringify({ reference: init.reference, orderId: order.id, gateway: init.gateway }))
    } catch {
      /* ignore */
    }
    if (!isAllowedExternalUrl(init.authorizationUrl, PAYMENT_GATEWAY_HOSTS)) throw new Error('Unexpected payment redirect')
    window.location.assign(init.authorizationUrl)
  } catch (e) {
    const err = toApiError(e)
    const redirectBlocked = !(e instanceof ApiError) && e instanceof Error && e.message === 'Unexpected payment redirect'
    ui.error("Couldn't start payment", redirectBlocked ? 'The payment provider returned an unexpected address. Please try again or contact support.' : err.message)
    if (err.code === 'CONFLICT') await loadQuote()
    placing.value = false
  }
}
</script>

<template>
  <Teleport v-if="mounted" to="#checkout-stepper" defer>
    <AppStepper :steps="STEPS" :current="step" :navigable="true" @go="(i) => (step = i)" />
  </Teleport>

  <ErrorState v-if="quoteError && !quote" :error="quoteError" class="pw-card" @retry="loadQuote" />
  <div v-else class="pw-co-grid">
    <div class="pw-stack">
      <!-- Destination -->
      <section class="pw-card pw-card-pad" :class="{ 'is-collapsed': step !== 0 }" aria-labelledby="co-dest">
        <div class="pw-between">
          <h2 id="co-dest" class="pw-card-title">Destination</h2>
          <button v-if="step !== 0 && physical" type="button" class="pw-link-btn" @click="step = 0">Edit</button>
        </div>
        <template v-if="step === 0">
          <AppSkeleton v-if="!quote" :lines="2" height="56px" />
          <template v-else>
            <AppRadioCard v-if="addresses.length && !addingAddress" v-model="addressId" :options="addressOptions" legend="Deliver to" sr-only-legend class="pw-co__mt" />
            <AddressForm v-if="addingAddress || !addresses.length" :address="null" class="pw-co__mt" @saved="onAddressSaved" @cancel="addingAddress = false" />
            <button v-else type="button" class="pw-link-btn pw-co__mt" @click="addingAddress = true">+ Add a new address</button>
          </template>
        </template>
        <p v-else-if="selectedAddress" class="pw-co__done"><Check :size="16" aria-hidden="true" /> <span>{{ selectedAddress.fullName }} · {{ selectedAddress.phone }}<br />{{ selectedAddress.line1 }}, {{ selectedAddress.city }} {{ selectedAddress.postalCode }}</span></p>
        <p v-else-if="!physical" class="pw-co__done"><Check :size="16" aria-hidden="true" /> Digital delivery — no shipping needed</p>
      </section>

      <!-- Flight plan -->
      <section v-if="physical || !quote" class="pw-card pw-card-pad" :class="{ 'is-collapsed': step !== 1 }" aria-labelledby="co-plan">
        <div class="pw-between">
          <h2 id="co-plan" class="pw-card-title">Flight plan</h2>
          <button v-if="step > 1" type="button" class="pw-link-btn" @click="step = 1">Edit</button>
        </div>
        <template v-if="step === 1 && quote">
          <AppRadioCard v-model="shippingId" :options="shippingOptions" legend="Shipping method" sr-only-legend size="lg" class="pw-co__mt" />
          <p v-if="quote.dispatchNote" class="pw-co__info"><Clock :size="16" aria-hidden="true" /> {{ quote.dispatchNote }}</p>
        </template>
        <p v-else-if="step > 1" class="pw-co__done"><Check :size="16" aria-hidden="true" /> {{ shippingOptions.find((s) => s.value === shippingId)?.label }} · {{ shippingOptions.find((s) => s.value === shippingId)?.aside }}</p>
      </section>

      <!-- Payment -->
      <section class="pw-card pw-card-pad" :class="{ 'is-disabled': step < 2, 'is-collapsed': step !== 2 }" aria-labelledby="co-pay">
        <div class="pw-between">
          <h2 id="co-pay" class="pw-card-title">Payment</h2>
          <button v-if="step > 2" type="button" class="pw-link-btn" @click="step = 2">Edit</button>
        </div>
        <AppSkeleton v-if="step === 2 && methodsLoading" :lines="3" height="64px" class="pw-co__mt" />
        <PaymentMethodPicker v-else-if="step === 2" v-model="gateway" :methods="methods" :error="gatewayError" class="pw-co__mt" />
        <p v-else-if="step > 2" class="pw-co__done"><Check :size="16" aria-hidden="true" /> {{ methods.find((m) => m.code === gateway)?.name }}</p>
        <p v-else class="pw-muted pw-co__small">Choose a payment provider after your flight plan.</p>
      </section>

      <!-- Review -->
      <section v-if="step === 3" class="pw-card pw-card-pad" aria-labelledby="co-review">
        <h2 id="co-review" class="pw-card-title">Review &amp; pay</h2>
        <p class="pw-muted pw-co__small pw-co__mt">By placing this order you agree to the <RouterLink to="/terms">Terms of Service</RouterLink>. You'll be taken to {{ methods.find((m) => m.code === gateway)?.name }} to authorise {{ quote ? formatMoney(quote.totals.total) : '' }}. Your order is confirmed only after we verify the payment.</p>
      </section>

      <div class="pw-co__nav">
        <button v-if="step > (physical ? 0 : 2)" type="button" class="pw-link-btn" @click="back">← Back to {{ STEPS[step - 1]?.toLowerCase() }}</button>
        <span v-else />
        <AppButton v-if="step < 3" size="lg" :disabled="!quote" :loading="!ready || (step === 2 && methodsLoading)" @click="next">Continue to {{ STEPS[step + 1]?.toLowerCase() }}</AppButton>
        <AppButton v-else size="lg" :loading="placing" @click="placeOrder"><template #icon><Lock :size="16" /></template>Pay {{ quote ? formatMoney(quote.totals.total) : '' }}</AppButton>
      </div>
    </div>

    <aside class="pw-card pw-card-pad pw-co__summary" aria-labelledby="co-sum">
      <h2 id="co-sum" class="pw-card-title">Order summary</h2>
      <AppSkeleton v-if="!quote" :lines="6" />
      <template v-else>
        <ul class="pw-co__items" role="list">
          <li v-for="i in quote.items" :key="i.id">
            <AppImage :media="i.image" ratio="1" sizes="68px" class="pw-co__img" />
            <div>
              <p class="pw-co__title">{{ i.title }}</p>
              <p class="pw-co__tags">
                <AppBadge v-if="i.size" tone="info">Size {{ i.size }}</AppBadge>
                <AppBadge v-if="i.sizeFromFitKit" tone="success"><Ruler :size="11" /> From Fit Kit</AppBadge>
                <span v-if="!i.size && i.condition" class="pw-muted">Condition: {{ CONDITION_LABELS[i.condition].label }}</span>
              </p>
            </div>
            <strong>{{ formatMoney(i.price) }}</strong>
          </li>
        </ul>
        <dl class="pw-dl pw-co__totals">
          <dt>Items ({{ quote.items.length }})</dt><dd>{{ formatMoney(quote.totals.items) }}</dd>
          <template v-if="physical"><dt>Freight ({{ shippingOptions.find((s) => s.value === shippingId)?.label ?? '—' }})</dt><dd>{{ formatMoney(quote.totals.freight) }}</dd></template>
          <dt>Buyer protection fee</dt><dd>{{ formatMoney(quote.totals.buyerProtection) }}</dd>
          <template v-if="quote.totals.duties"><dt>Import duties (est.)</dt><dd>{{ formatMoney(quote.totals.duties) }}</dd></template>
        </dl>
        <div class="pw-between pw-co__total"><span>Total due</span><strong>{{ formatMoney(quote.totals.total) }}</strong></div>
        <p class="pw-co__escrow"><ShieldCheck :size="16" aria-hidden="true" /> {{ quote.escrowNote }}</p>
        <p class="pw-co__secure"><Lock :size="12" aria-hidden="true" /> 256-bit encryption · PCI-DSS compliant gateways</p>
      </template>
    </aside>
  </div>
</template>

<style scoped>
.pw-co-grid {
  display: grid;
  gap: var(--pw-space-5);
}

.is-disabled {
  background: var(--pw-surface-sunken);
}

.is-disabled .pw-card-title {
  color: var(--pw-muted);
}

.pw-co__mt {
  margin-top: var(--pw-space-4);
}

.pw-co__small {
  font-size: var(--pw-text-sm);
}

.pw-co__done {
  display: flex;
  gap: var(--pw-space-3);
  margin-top: var(--pw-space-3);
  font-size: var(--pw-text-sm);
  color: var(--pw-ink-2);
}

.pw-co__done svg {
  flex: none;
  margin-top: 2px;
  color: var(--pw-success-600);
}

.pw-co__info {
  display: flex;
  align-items: center;
  gap: var(--pw-space-2);
  margin-top: var(--pw-space-4);
  padding: var(--pw-space-3) var(--pw-space-4);
  border-radius: var(--pw-radius-md);
  background: var(--pw-navy-100);
  color: var(--pw-navy-700);
  font-size: var(--pw-text-sm);
}

.pw-co__nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--pw-space-3);
  margin-top: var(--pw-space-2);
}

.pw-co__summary {
  align-self: start;
}

.pw-co__items li {
  display: flex;
  gap: var(--pw-space-3);
  padding: var(--pw-space-4) 0;
  border-bottom: 1px solid var(--pw-border);
}

.pw-co__img {
  width: 68px;
  flex: none;
  border-radius: var(--pw-radius-md);
}

.pw-co__items li > div {
  flex: 1;
  min-width: 0;
}

.pw-co__title {
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-medium);
}

.pw-co__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
  font-size: var(--pw-text-xs);
}

.pw-co__totals {
  padding: var(--pw-space-4) 0;
  border-bottom: 1px solid var(--pw-border);
}

.pw-co__total {
  padding: var(--pw-space-4) 0;
  font-weight: var(--pw-weight-semibold);
}

.pw-co__total strong {
  font-family: var(--pw-font-display);
  font-size: 1.25rem;
}

.pw-co__escrow {
  display: flex;
  gap: var(--pw-space-2);
  padding: var(--pw-space-3) var(--pw-space-4);
  border-radius: var(--pw-radius-md);
  background: var(--pw-success-100);
  color: var(--pw-success-700);
  font-size: var(--pw-text-xs);
}

.pw-co__escrow svg {
  flex: none;
}

.pw-co__secure {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: var(--pw-space-3);
  font-size: var(--pw-text-xs);
  color: var(--pw-subtle);
}

@media (min-width: 1024px) {
  .pw-co-grid {
    grid-template-columns: minmax(0, 1.55fr) minmax(320px, 1fr);
  }
  .pw-co__summary {
    position: sticky;
    top: var(--pw-space-5);
  }
}
</style>
