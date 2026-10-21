<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CurrencyCode } from '@/types/api'
import { toMajor, toMinor } from '@/utils/money'
import AppInput from './AppInput.vue'

/**
 * Money input bound to integer MINOR units (cents/kobo) — the API contract.
 * The user edits a major-unit string; conversion avoids floating-point drift.
 */
const props = withDefaults(
  defineProps<{
    label?: string
    hint?: string
    error?: string | null
    currency?: CurrencyCode
    size?: 'md' | 'lg'
    placeholder?: string
    srOnlyLabel?: boolean
    showCurrency?: boolean
  }>(),
  { currency: 'USD', size: 'md', showCurrency: false },
)

const minor = defineModel<number>({ required: true })
const symbol = computed(() => ({ USD: '$', NGN: '₦', GHS: 'GH₵', GBP: '£', EUR: '€' })[props.currency])

const format = (value: number) =>
  value ? toMajor(value, props.currency).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''

const text = ref(format(minor.value))
const focused = ref(false)

watch(minor, (value) => {
  if (!focused.value) text.value = format(value)
})

watch(text, (value) => {
  if (focused.value) minor.value = toMinor(value, props.currency)
})

function onBlur() {
  focused.value = false
  text.value = format(minor.value)
}
</script>

<template>
  <AppInput
    v-model="text"
    :label="label"
    :hint="hint"
    :error="error"
    :size="size"
    :prefix="symbol"
    :suffix="showCurrency ? currency : undefined"
    :placeholder="placeholder ?? '0.00'"
    :sr-only-label="srOnlyLabel"
    inputmode="decimal"
    autocomplete="off"
    @focus="focused = true"
    @blur="onBlur"
  />
</template>
