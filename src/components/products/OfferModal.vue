<script setup lang="ts">
import { computed, watch } from 'vue'
import AppModal from '@/components/common/AppModal.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppMoneyInput from '@/components/forms/AppMoneyInput.vue'
import AppTextarea from '@/components/forms/AppTextarea.vue'
import { offerService } from '@/api/trades.api'
import { useForm } from '@/composables/useForm'
import { useUiStore } from '@/stores/ui.store'
import { formatMoney, percentBelow } from '@/utils/money'
import { track } from '@/utils/analytics'
import type { Listing } from '@/types/product'

const props = defineProps<{ open: boolean; listing: Listing }>()
const emit = defineEmits<{ close: []; sent: [] }>()
const ui = useUiStore()

const form = useForm(
  { amount: Math.round(props.listing.price.amount * 0.95), message: '' },
  {
    amount: [
      (v: number) => (v > 0 ? true : 'Enter an amount greater than zero.'),
      (v: number) => (v < props.listing.price.amount ? true : 'Offer below the asking price, or use Buy now.'),
      (v: number) => (!props.listing.minimumOffer || v >= props.listing.minimumOffer.amount ? true : `The seller doesn't accept offers below ${formatMoney(props.listing.minimumOffer)}.`),
    ],
    message: [(v: string) => (v.length <= 500 ? true : 'Keep messages under 500 characters.')],
  },
)

watch(
  () => props.open,
  (open) => {
    if (open) {
      form.reset({ amount: Math.round(props.listing.price.amount * 0.95), message: '' })
      track('offer_started', { listingId: props.listing.id })
    }
  },
)

const below = computed(() => percentBelow(props.listing.price, { amount: form.values.amount, currency: props.listing.price.currency }))

async function submit() {
  const result = await form.submit((v) => offerService.create(props.listing.id, { amount: v.amount, currency: props.listing.price.currency, message: v.message || undefined }))
  if (result) {
    track('offer_submitted', { listingId: props.listing.id, amount: result.amount.amount, currency: result.amount.currency })
    ui.success('Offer sent', 'The seller has 24h to respond. We will notify you.')
    emit('sent')
    emit('close')
  }
}
</script>

<template>
  <AppModal :open="open" title="Make an offer" :description="`${listing.title} · listed at ${formatMoney(listing.price)}`" @close="emit('close')">
    <form id="offer-form" class="pw-offer" novalidate @submit.prevent="submit">
      <AppMoneyInput
        v-model="form.values.amount"
        label="Your offer"
        size="lg"
        :currency="listing.price.currency"
        :error="form.fieldError('amount')"
        :hint="below > 0 ? `${below}% below asking${listing.minimumOffer ? ` · minimum ${formatMoney(listing.minimumOffer)}` : ''}` : undefined"
      />
      <AppTextarea v-model="form.values.message" label="Message to seller (optional)" :rows="3" :maxlength="500" show-count placeholder="e.g. Can you ship to Abuja this week?" :error="form.fieldError('message')" />
      <p class="pw-offer__note">Offers are binding for 24 hours. If accepted, the item is reserved and you'll complete payment in escrow.</p>
      <p v-if="form.formError.value" class="pw-offer__error" role="alert">{{ form.formError.value }}</p>
    </form>
    <template #footer>
      <AppButton variant="secondary" @click="emit('close')">Cancel</AppButton>
      <AppButton type="submit" form="offer-form" :loading="form.submitting.value">Send offer</AppButton>
    </template>
  </AppModal>
</template>

<style scoped>
.pw-offer {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-4);
}

.pw-offer__note {
  padding: var(--pw-space-3);
  border-radius: var(--pw-radius-md);
  background: var(--pw-navy-100);
  font-size: var(--pw-text-xs);
  color: var(--pw-navy-700);
}

.pw-offer__error {
  color: var(--pw-danger-600);
  font-size: var(--pw-text-sm);
}
</style>
