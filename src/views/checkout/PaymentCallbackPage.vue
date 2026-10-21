<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CircleAlert, Clock, XCircle } from '@lucide/vue'
import AppSpinner from '@/components/common/AppSpinner.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import { paymentService } from '@/api/payments.api'
import { toApiError } from '@/api/errors'
import { useSeo } from '@/composables/useSeo'
import { track } from '@/utils/analytics'
import { TERMINAL_PAYMENT_STATUSES, type Payment } from '@/types/payment'

/**
 * Gateway return URL. The `status` query param from the redirect is NEVER trusted:
 * we poll GET /payments/{reference} until Laravel (webhook / server-side verify)
 * reports a terminal status, with backoff and a timeout fallback.
 */
useSeo({ title: 'Confirming payment', noindex: true })
const route = useRoute()
const router = useRouter()
const state = ref<'verifying' | 'failed' | 'cancelled' | 'timeout' | 'error'>('verifying')
const payment = ref<Payment | null>(null)
const message = ref('')
let timer: ReturnType<typeof setTimeout> | null = null
let attempts = 0
const controller = new AbortController()

function pending(): { reference?: string; orderId?: string } {
  try {
    return JSON.parse(sessionStorage.getItem('pw.pending-payment') ?? '{}') as { reference?: string; orderId?: string }
  } catch {
    return {}
  }
}

const reference = String(route.query.reference ?? route.query.trxref ?? route.query.tx_ref ?? route.query.paymentReference ?? pending().reference ?? '')

async function check() {
  attempts++
  try {
    const p = await paymentService.verify(reference, controller.signal)
    payment.value = p
    if (p.status === 'successful') {
      sessionStorage.removeItem('pw.pending-payment')
      track('payment_completed', { orderId: p.orderId, gateway: p.gateway, value: p.amount.amount, currency: p.amount.currency })
      await router.replace({ name: 'order-confirmed', params: { id: p.orderId } })
      return
    }
    if (TERMINAL_PAYMENT_STATUSES.includes(p.status)) {
      state.value = p.status === 'cancelled' ? 'cancelled' : 'failed'
      message.value = p.failureReason ?? ''
      track('payment_failed', { orderId: p.orderId, gateway: p.gateway, status: p.status })
      return
    }
  } catch (e) {
    const err = toApiError(e)
    if (err.isCancelled) return
    if (err.status === 404 || attempts > 3) {
      state.value = 'error'
      message.value = err.message
      return
    }
  }
  if (attempts >= 20) {
    state.value = 'timeout'
    return
  }
  timer = setTimeout(check, Math.min(1000 * 1.4 ** attempts, 6000))
}

onMounted(() => {
  if (!reference) {
    state.value = 'error'
    message.value = 'Missing payment reference.'
    return
  }
  void check()
})

onBeforeUnmount(() => {
  controller.abort()
  if (timer) clearTimeout(timer)
})

function retry() {
  state.value = 'verifying'
  attempts = 0
  void check()
}
</script>

<template>
  <div class="pw-container pw-cb">
    <div class="pw-card pw-cb__card" aria-live="polite">
      <div v-if="state === 'verifying'" class="pw-cb__verifying" role="status">
        <AppSpinner :size="32" label="Confirming payment" />
        <h1 class="pw-cb__title">Confirming your payment…</h1>
        <p class="pw-muted">We're verifying with {{ payment?.gateway ?? 'the payment provider' }}. Don't close this page — it usually takes a few seconds.</p>
      </div>
      <AppEmptyState v-else-if="state === 'failed'" :icon="XCircle" tone="danger" title="Payment didn't go through" :body="message || 'Your card was not charged. Try again or choose another payment method.'" heading-level="h1">
        <AppButton :to="payment ? { name: 'hangar-order', params: { id: payment.orderId } } : { name: 'hangar-orders' }" variant="secondary">View order</AppButton>
        <AppButton @click="router.back()">Try again</AppButton>
      </AppEmptyState>
      <AppEmptyState v-else-if="state === 'cancelled'" :icon="CircleAlert" tone="warning" title="Payment cancelled" body="No money was taken. Your order is saved as awaiting payment for 30 minutes." heading-level="h1">
        <AppButton :to="{ name: 'cart' }">Back to cart</AppButton>
      </AppEmptyState>
      <AppEmptyState v-else-if="state === 'timeout'" :icon="Clock" tone="warning" title="Still confirming" body="Your bank is taking longer than usual. We'll email you as soon as the payment is confirmed — you won't be charged twice." heading-level="h1">
        <AppButton variant="secondary" @click="retry">Check again</AppButton>
        <AppButton :to="{ name: 'hangar-orders' }">Go to my orders</AppButton>
      </AppEmptyState>
      <AppEmptyState v-else :icon="CircleAlert" tone="danger" title="We couldn't confirm this payment" :body="message || 'Please check your orders or contact support with your reference.'" heading-level="h1">
        <AppButton :to="{ name: 'hangar-orders' }">Go to my orders</AppButton>
      </AppEmptyState>
      <p v-if="reference" class="pw-cb__ref">Reference <span class="pw-mono">{{ reference }}</span></p>
    </div>
  </div>
</template>

<style scoped>
.pw-cb {
  padding-top: var(--pw-space-12);
  padding-bottom: var(--pw-space-16);
}

.pw-cb__card {
  max-width: 560px;
  margin: 0 auto;
  padding: var(--pw-space-6);
}

.pw-cb__verifying {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--pw-space-3);
  padding: var(--pw-space-8) 0;
  text-align: center;
  color: var(--pw-navy-700);
}

.pw-cb__title {
  font-size: var(--pw-text-xl);
}

.pw-cb__ref {
  margin-top: var(--pw-space-4);
  text-align: center;
  font-size: var(--pw-text-xs);
  color: var(--pw-subtle);
}
</style>
