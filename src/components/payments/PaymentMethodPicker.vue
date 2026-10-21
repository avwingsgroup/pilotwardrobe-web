<script setup lang="ts">
import { useId } from 'vue'
import { CreditCard, Lock } from '@lucide/vue'
import type { PaymentGateway, PaymentMethod } from '@/types/payment'

/**
 * Gateway-agnostic payment picker. The list comes from GET /payment-methods
 * (backend decides availability per currency/country). No card fields are ever
 * rendered here — card data is entered only on the gateway's hosted page.
 */
defineProps<{ methods: PaymentMethod[]; error?: string | null }>()
const model = defineModel<PaymentGateway | null>({ default: null })
const name = useId()

const BRAND: Record<PaymentGateway, string> = {
  paystack: '#0ba4db',
  flutterwave: '#f5a623',
  monnify: '#063b6a',
  stripe: '#635bff',
  paypal: '#003087',
}
</script>

<template>
  <fieldset class="pw-pm">
    <legend class="sr-only">Payment method</legend>
    <label v-for="m in methods" :key="m.code" class="pw-pm__opt" :class="{ 'is-on': model === m.code, 'is-disabled': !m.enabled }">
      <input v-model="model" type="radio" :name="name" :value="m.code" :disabled="!m.enabled" class="sr-only" />
      <span class="pw-pm__dot" aria-hidden="true" />
      <img v-if="m.logo" :src="m.logo" :alt="''" width="32" height="32" class="pw-pm__logo" />
      <span v-else class="pw-pm__mark" :style="{ background: BRAND[m.code] }" aria-hidden="true">{{ m.name[0] }}</span>
      <span class="pw-pm__text">
        <strong>{{ m.name }}</strong>
        <small>{{ m.enabled ? m.description : m.unavailableReason ?? 'Unavailable' }}</small>
      </span>
      <CreditCard :size="18" class="pw-pm__card" aria-hidden="true" />
    </label>
    <p v-if="error" class="pw-pm__error" role="alert">{{ error }}</p>
    <p class="pw-pm__note"><Lock :size="14" aria-hidden="true" /> You'll complete payment on the provider's secure page. Pilotwardrobe never sees or stores your card details.</p>
  </fieldset>
</template>

<style scoped>
.pw-pm {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-3);
  margin: 0;
  padding: 0;
  border: 0;
}

.pw-pm__opt {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  min-height: 64px;
  padding: var(--pw-space-3) var(--pw-space-4);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
  cursor: pointer;
}

.pw-pm__opt.is-on {
  border-color: var(--pw-navy-700);
  box-shadow: inset 0 0 0 1px var(--pw-navy-700);
}

.pw-pm__opt.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.pw-pm__opt:has(input:focus-visible) {
  outline: 2px solid var(--pw-color-focus);
  outline-offset: 2px;
}

.pw-pm__dot {
  flex: none;
  width: 20px;
  height: 20px;
  border: 1.5px solid var(--pw-border-strong);
  border-radius: 50%;
}

.is-on .pw-pm__dot {
  border: 6px solid var(--pw-navy-700);
}

.pw-pm__mark,
.pw-pm__logo {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex: none;
  border-radius: var(--pw-radius-sm);
  color: #fff;
  font-weight: var(--pw-weight-bold);
}

.pw-pm__text {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.pw-pm__text small {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-pm__card {
  color: var(--pw-subtle);
}

.pw-pm__error {
  color: var(--pw-danger-600);
  font-size: var(--pw-text-sm);
}

.pw-pm__note {
  display: flex;
  gap: var(--pw-space-2);
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-pm__note svg {
  flex: none;
  margin-top: 2px;
}
</style>
