<script setup lang="ts">
import { watch } from 'vue'
import AppModal from '@/components/common/AppModal.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppSelect from '@/components/forms/AppSelect.vue'
import AppInput from '@/components/forms/AppInput.vue'
import AppOtpInput from '@/components/forms/AppOtpInput.vue'
import { walletService } from '@/api/account.api'
import { useForm } from '@/composables/useForm'
import { useUiStore } from '@/stores/ui.store'
import { required } from '@/utils/validators'
import type { PayoutMethod } from '@/types/wallet'

/**
 * New payout destination. Account details go straight to Laravel, which verifies the
 * account name with the PSP and stores only a tokenised reference + last 4 digits.
 * A two-step code is required because payouts to new accounts are a fraud vector.
 */
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; added: [PayoutMethod] }>()
const ui = useUiStore()

const form = useForm(
  { kind: 'bank' as PayoutMethod['kind'], currency: 'NGN' as PayoutMethod['currency'], institution: '', accountNumber: '', accountName: '', twoFactorCode: '' },
  {
    institution: [required('Choose your bank or provider.')],
    accountNumber: [required('Enter the account number.'), (v: string) => (/^\d{6,18}$/.test(v.replace(/\s/g, '')) ? true : 'Use 6–18 digits.')],
    accountName: [required('Enter the account holder name.')],
    twoFactorCode: [(v: string) => (/^\d{6}$/.test(v) ? true : 'Enter the 6-digit code from your authenticator app.')],
  },
)

watch(
  () => props.open,
  (o) => o && form.reset(),
)

async function submit() {
  const method = await form.submit((v) => walletService.addPayoutMethod({ ...v, accountNumber: v.accountNumber.replace(/\s/g, '') }))
  if (method) {
    ui.success('Payout method added', `${method.label} •••• ${method.last4}`)
    emit('added', method)
    emit('close')
  }
}
</script>

<template>
  <AppModal :open="open" title="Add payout method" description="Payouts go only to accounts in your verified name." size="sm" @close="emit('close')">
    <form id="payout-form" class="pw-stack" novalidate @submit.prevent="submit">
      <div class="pw-apm__row">
        <AppSelect v-model="form.values.kind" label="Type" :options="[{ value: 'bank', label: 'Bank account' }, { value: 'mobile_money', label: 'Mobile money' }, { value: 'wise', label: 'Wise' }]" />
        <AppSelect v-model="form.values.currency" label="Currency" :options="[{ value: 'NGN', label: 'NGN' }, { value: 'GHS', label: 'GHS' }, { value: 'USD', label: 'USD' }, { value: 'GBP', label: 'GBP' }]" />
      </div>
      <AppSelect
        v-model="form.values.institution"
        label="Bank or provider"
        placeholder="Choose…"
        :error="form.fieldError('institution')"
        :options="['Access Bank', 'GTBank', 'UBA', 'Zenith Bank', 'First Bank', 'Opay', 'MTN MoMo', 'Wise'].map((b) => ({ value: b, label: b }))"
      />
      <AppInput v-model="form.values.accountNumber" label="Account number" inputmode="numeric" autocomplete="off" :error="form.fieldError('accountNumber')" @blur="form.touch('accountNumber')" />
      <AppInput v-model="form.values.accountName" label="Account holder name" autocomplete="name" :error="form.fieldError('accountName')" hint="Must match your verified identity." />
      <div>
        <p class="pw-apm__label">Two-step code</p>
        <AppOtpInput v-model="form.values.twoFactorCode" :length="6" label="Authenticator code" :error="form.fieldError('twoFactorCode')" />
      </div>
      <p v-if="form.formError.value" class="pw-apm__error" role="alert">{{ form.formError.value }}</p>
    </form>
    <template #footer>
      <AppButton variant="secondary" @click="emit('close')">Cancel</AppButton>
      <AppButton type="submit" form="payout-form" :loading="form.submitting.value">Add method</AppButton>
    </template>
  </AppModal>
</template>

<style scoped>
.pw-apm__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--pw-space-3);
}

.pw-apm__label {
  margin-bottom: var(--pw-space-2);
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-medium);
}

.pw-apm__error {
  color: var(--pw-danger-600);
  font-size: var(--pw-text-sm);
}
</style>
