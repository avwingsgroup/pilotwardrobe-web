<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import { Lock } from '@lucide/vue'
import AppModal from '@/components/common/AppModal.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppMoneyInput from '@/components/forms/AppMoneyInput.vue'
import AppSelect from '@/components/forms/AppSelect.vue'
import AppOtpInput from '@/components/forms/AppOtpInput.vue'
import { walletService } from '@/api/account.api'
import { toApiError } from '@/api/errors'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { formatMoney } from '@/utils/money'
import { formatShortDate } from '@/utils/date'
import type { PayoutMethod, WalletBalance, WithdrawalQuote } from '@/types/wallet'

/**
 * VB13 — withdraw funds. Quote (FX, fee, ETA) comes from the API; payouts over
 * $2,000 (or to a new account) require an authenticator code (step 2).
 */
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; done: [] }>()
const ui = useUiStore()
const auth = useAuthStore()

const balance = ref<WalletBalance | null>(null)
const methods = ref<PayoutMethod[]>([])
const amount = ref(0)
const methodId = ref('')
const quote = ref<WithdrawalQuote | null>(null)
const quoting = ref(false)
const step = ref<'amount' | 'code'>('amount')
const code = ref('')
const error = ref<string | null>(null)
const submitting = ref(false)
const debouncedAmount = refDebounced(amount, 400)
let ctl: AbortController | null = null

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    step.value = 'amount'
    code.value = ''
    error.value = null
    quote.value = null
    try {
      const [b, m] = await Promise.all([walletService.balance(), walletService.payoutMethods()])
      balance.value = b
      methods.value = m
      methodId.value = m.find((x) => x.isDefault)?.id ?? m[0]?.id ?? ''
      amount.value = Math.min(250000, b.available.amount)
    } catch (e) {
      error.value = toApiError(e).message
    }
  },
)

watch([debouncedAmount, methodId], async ([value, id]) => {
  if (!props.open || !value || !id) return
  ctl?.abort()
  ctl = new AbortController()
  quoting.value = true
  error.value = null
  try {
    quote.value = await walletService.quoteWithdrawal({ amount: value, currency: 'USD', payoutMethodId: id })
  } catch (e) {
    const err = toApiError(e)
    if (!err.isCancelled) {
      quote.value = null
      error.value = err.field('amount') ?? err.message
    }
  } finally {
    quoting.value = false
  }
})

const methodOptions = computed(() => methods.value.map((m) => ({ value: m.id, label: `${m.label} · •••• ${m.last4}` })))
const overKycLimit = computed(() => !auth.kycApproved && amount.value > 50000)

async function submit() {
  if (!quote.value) return
  if (quote.value.requiresTwoFactor && step.value === 'amount') {
    step.value = 'code'
    return
  }
  submitting.value = true
  error.value = null
  try {
    await walletService.withdraw({ amount: amount.value, currency: 'USD', payoutMethodId: methodId.value, twoFactorCode: code.value || undefined })
    ui.success('Withdrawal requested', `${formatMoney(quote.value.recipientReceives)} is on its way.`)
    emit('done')
    emit('close')
  } catch (e) {
    const err = toApiError(e)
    error.value = err.field('twoFactorCode') ?? err.field('amount') ?? err.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AppModal :open="open" title="Withdraw funds" size="sm" @close="emit('close')">
    <form id="withdraw-form" class="pw-wd" novalidate @submit.prevent="submit">
      <template v-if="step === 'amount'">
        <AppMoneyInput v-model="amount" label="Amount" size="lg" :error="error" :hint="balance ? `Available: ${formatMoney(balance.available)}` : undefined">
        </AppMoneyInput>
        <button v-if="balance" type="button" class="pw-link-btn pw-wd__max" @click="amount = balance.available.amount">Max</button>
        <AppSelect v-model="methodId" label="To" :options="methodOptions" />
        <div class="pw-wd__quote" aria-live="polite">
          <AppSkeleton v-if="quoting && !quote" :lines="4" />
          <dl v-else-if="quote" class="pw-dl">
            <template v-if="quote.exchangeRate"><dt>Exchange rate</dt><dd>{{ quote.exchangeRate.label }}</dd></template>
            <dt>Transfer fee</dt>
            <dd>{{ formatMoney(quote.fee) }}</dd>
            <dt>They receive</dt>
            <dd>{{ formatMoney(quote.recipientReceives) }}</dd>
            <dt>Arrives</dt>
            <dd>{{ formatShortDate(quote.arrivesBetween.from) }} – {{ formatShortDate(quote.arrivesBetween.to) }}</dd>
          </dl>
        </div>
        <p v-if="quote?.requiresTwoFactor" class="pw-wd__note"><Lock :size="16" aria-hidden="true" /> This amount is over $2,000, so we'll ask for a code from your authenticator app.</p>
        <p v-if="overKycLimit" class="pw-wd__note is-danger">Withdrawals over $500 need a verified identity. <RouterLink :to="{ name: 'hangar-verification' }" @click="emit('close')">Verify now</RouterLink></p>
      </template>
      <template v-else>
        <p class="pw-muted">Enter the 6-digit code from your authenticator app to confirm sending {{ quote ? formatMoney(quote.amount) : '' }}.</p>
        <AppOtpInput v-model="code" :length="6" label="Authenticator code" :error="error" autofocus @complete="submit" />
      </template>
    </form>
    <template #footer>
      <AppButton v-if="step === 'code'" variant="secondary" @click="step = 'amount'">Back</AppButton>
      <AppButton type="submit" form="withdraw-form" block :loading="submitting" :disabled="!quote || quoting || overKycLimit || (step === 'code' && code.length < 6)">
        {{ step === 'code' ? 'Confirm withdrawal' : 'Continue' }}
      </AppButton>
    </template>
  </AppModal>
</template>

<style scoped>
.pw-wd {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-4);
}

.pw-wd__max {
  position: absolute;
  top: 40px;
  right: 16px;
  font-size: var(--pw-text-sm);
}

.pw-wd__quote {
  padding: var(--pw-space-4);
  border-radius: var(--pw-radius-md);
  background: var(--pw-surface-sunken);
}

.pw-wd__note {
  display: flex;
  gap: var(--pw-space-2);
  padding: var(--pw-space-3);
  border-radius: var(--pw-radius-md);
  background: var(--pw-warning-100);
  color: var(--pw-warning-700);
  font-size: var(--pw-text-sm);
}

.pw-wd__note.is-danger {
  background: var(--pw-danger-100);
  color: var(--pw-danger-700);
}
</style>
