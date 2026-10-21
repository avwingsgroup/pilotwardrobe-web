<script setup lang="ts">
import AppInput from '@/components/forms/AppInput.vue'
import AppSelect from '@/components/forms/AppSelect.vue'
import AppCheckbox from '@/components/forms/AppCheckbox.vue'
import AppButton from '@/components/common/AppButton.vue'
import { addressService } from '@/api/orders.api'
import { useForm } from '@/composables/useForm'
import { COUNTRIES } from '@/constants/labels'
import { required } from '@/utils/validators'
import type { Address } from '@/types/user'

/** Shared add/edit address form (addresses page + checkout destination step). */
const props = defineProps<{ address: Address | null }>()
const emit = defineEmits<{ saved: [Address]; cancel: [] }>()

const a = props.address
const form = useForm(
  {
    label: a?.label ?? '',
    fullName: a?.fullName ?? '',
    phone: a?.phone ?? '',
    line1: a?.line1 ?? '',
    line2: a?.line2 ?? '',
    city: a?.city ?? '',
    state: a?.state ?? '',
    postalCode: a?.postalCode ?? '',
    countryCode: a?.countryCode ?? 'NG',
    isDefault: a?.isDefault ?? false,
  },
  { fullName: [required('Enter the recipient name.')], phone: [required('Enter a phone number for the courier.')], line1: [required('Enter the street address.')], city: [required('Enter the city.')] },
)

async function submit() {
  const saved = await form.submit((v) => (a ? addressService.update(a.id, v) : addressService.create(v)))
  if (saved) emit('saved', saved)
}
</script>

<template>
  <form class="pw-stack" novalidate @submit.prevent="submit">
    <div class="pw-af__row">
      <AppInput v-model="form.values.fullName" label="Full name" autocomplete="name" :error="form.fieldError('fullName')" />
      <AppInput v-model="form.values.phone" label="Phone" type="tel" autocomplete="tel" :error="form.fieldError('phone')" />
    </div>
    <AppInput v-model="form.values.line1" label="Street address" autocomplete="address-line1" :error="form.fieldError('line1')" />
    <AppInput v-model="form.values.line2" label="Apartment, suite (optional)" autocomplete="address-line2" />
    <div class="pw-af__row">
      <AppInput v-model="form.values.city" label="City" autocomplete="address-level2" :error="form.fieldError('city')" />
      <AppInput v-model="form.values.state" label="State / region" autocomplete="address-level1" />
    </div>
    <div class="pw-af__row">
      <AppInput v-model="form.values.postalCode" label="Postal code" autocomplete="postal-code" />
      <AppSelect v-model="form.values.countryCode" label="Country" :options="COUNTRIES.map((c) => ({ value: c.code, label: c.name }))" />
    </div>
    <AppInput v-model="form.values.label" label="Label (optional)" placeholder="Home, Crew lounge…" />
    <AppCheckbox v-model="form.values.isDefault" label="Use as my default address" />
    <p v-if="form.formError.value" class="pw-af__err" role="alert">{{ form.formError.value }}</p>
    <div class="pw-af__actions">
      <AppButton variant="secondary" @click="emit('cancel')">Cancel</AppButton>
      <AppButton type="submit" :loading="form.submitting.value">Save address</AppButton>
    </div>
  </form>
</template>

<style scoped>
.pw-af__row {
  display: grid;
  gap: var(--pw-space-4);
}

.pw-af__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--pw-space-2);
}

.pw-af__err {
  color: var(--pw-danger-600);
}

@media (min-width: 560px) {
  .pw-af__row {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
