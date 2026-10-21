<script setup lang="ts">
import { ref, watch } from 'vue'
import { Star } from '@lucide/vue'
import AppModal from '@/components/common/AppModal.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppImage from '@/components/common/AppImage.vue'
import AppTextarea from '@/components/forms/AppTextarea.vue'
import { orderService } from '@/api/orders.api'
import { toApiError } from '@/api/errors'
import { useUiStore } from '@/stores/ui.store'
import { formatMoney } from '@/utils/money'
import { timeUntil } from '@/utils/date'
import type { Order } from '@/types/order'

/** VB8 — confirm goods landed (releases escrow) + rate the trade. */
const props = defineProps<{ open: boolean; order: Order }>()
const emit = defineEmits<{ close: []; confirmed: [Order] }>()
const ui = useUiStore()
const rating = ref(5)
const hover = ref(0)
const tags = ref<string[]>(['As described', 'Fast dispatch', 'Well packed'])
const comment = ref('')
const submitting = ref(false)
const TAGS = ['As described', 'Fast dispatch', 'Well packed', 'Great communication']
const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']

watch(
  () => props.open,
  (o) => {
    if (o) {
      rating.value = 5
      comment.value = ''
    }
  },
)

function toggleTag(t: string) {
  tags.value = tags.value.includes(t) ? tags.value.filter((x) => x !== t) : [...tags.value, t]
}

async function confirm() {
  submitting.value = true
  try {
    const updated = await orderService.confirmDelivery(props.order.id, { review: { rating: rating.value, tags: tags.value, comment: comment.value } })
    ui.success('Funds released', `${formatMoney(props.order.items[0]?.total)} sent to ${props.order.seller.displayName}. Thanks for the review!`)
    emit('confirmed', updated)
    emit('close')
  } catch (e) {
    ui.error("Couldn't confirm delivery", toApiError(e).message)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AppModal :open="open" title="Confirm goods landed" @close="emit('close')">
    <div class="pw-cl__item">
      <AppImage :media="order.items[0]?.image" ratio="1" sizes="48px" class="pw-cl__thumb" />
      <div>
        <p class="pw-cl__title">{{ order.items[0]?.title }}</p>
        <p class="pw-muted pw-cl__meta">Seller: {{ order.seller.displayName }} · {{ formatMoney(order.items[0]?.total) }}</p>
      </div>
    </div>
    <p class="pw-cl__body">
      Confirming releases <strong>{{ formatMoney(order.items[0]?.total) }}</strong> to the seller. Only confirm once you've checked the item matches the listing.
    </p>

    <fieldset class="pw-cl__rate">
      <legend>Rate this trade</legend>
      <div class="pw-cl__stars" role="radiogroup" aria-label="Rating" @mouseleave="hover = 0">
        <button
          v-for="n in 5"
          :key="n"
          type="button"
          role="radio"
          :aria-checked="rating === n"
          :aria-label="`${n} star${n > 1 ? 's' : ''} — ${LABELS[n]}`"
          @click="rating = n"
          @mouseenter="hover = n"
        >
          <Star :size="26" :fill="n <= (hover || rating) ? 'currentColor' : 'none'" :class="{ 'is-on': n <= (hover || rating) }" />
        </button>
        <span class="pw-cl__rating-label" aria-live="polite">{{ LABELS[hover || rating] }}</span>
      </div>
    </fieldset>

    <div class="pw-cl__tags" role="group" aria-label="What went well">
      <button v-for="t in TAGS" :key="t" type="button" class="pw-cl__tag" :class="{ 'is-on': tags.includes(t) }" :aria-pressed="tags.includes(t)" @click="toggleTag(t)">{{ t }}</button>
    </div>

    <AppTextarea v-model="comment" label="Review (optional)" sr-only-label :rows="3" :maxlength="500" placeholder="Fits true to my Fit Kit size. Crisp epaulettes, packed in tissue." />

    <AppButton variant="success" size="lg" block :loading="submitting" class="pw-cl__confirm" @click="confirm">Confirm &amp; release {{ formatMoney(order.items[0]?.total, { whole: true }) }}</AppButton>
    <p class="pw-cl__alt">
      Something wrong?
      <RouterLink :to="{ name: 'dispute-new', query: { order: order.id } }" class="pw-cl__dispute" @click="emit('close')">Open a dispute instead</RouterLink>
      <template v-if="order.disputeWindowEndsAt"> · {{ timeUntil(order.disputeWindowEndsAt) }} left</template>
    </p>
  </AppModal>
</template>

<style scoped>
.pw-cl__item {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  padding: var(--pw-space-3);
  border-radius: var(--pw-radius-md);
  background: var(--pw-surface-sunken);
}

.pw-cl__thumb {
  width: 48px;
  flex: none;
  border-radius: var(--pw-radius-sm);
}

.pw-cl__title {
  font-weight: var(--pw-weight-semibold);
  font-size: var(--pw-text-sm);
}

.pw-cl__meta {
  font-size: var(--pw-text-xs);
}

.pw-cl__body {
  margin: var(--pw-space-4) 0;
  font-size: var(--pw-text-sm);
  color: var(--pw-ink-2);
}

.pw-cl__rate {
  margin: 0 0 var(--pw-space-3);
  padding: 0;
  border: 0;
}

.pw-cl__rate legend {
  margin-bottom: var(--pw-space-2);
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-medium);
}

.pw-cl__stars {
  display: flex;
  align-items: center;
  gap: 2px;
}

.pw-cl__stars button {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 0;
  background: none;
  color: var(--pw-border-strong);
}

.pw-cl__stars .is-on {
  color: var(--pw-gold-500);
}

.pw-cl__rating-label {
  margin-left: var(--pw-space-2);
  font-weight: var(--pw-weight-semibold);
}

.pw-cl__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pw-space-2);
  margin-bottom: var(--pw-space-4);
}

.pw-cl__tag {
  min-height: 32px;
  padding: 0 var(--pw-space-3);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-full);
  background: var(--pw-surface);
  font-size: var(--pw-text-xs);
  font-weight: var(--pw-weight-semibold);
}

.pw-cl__tag.is-on {
  background: var(--pw-navy-700);
  border-color: var(--pw-navy-700);
  color: #fff;
}

.pw-cl__confirm {
  margin-top: var(--pw-space-4);
}

.pw-cl__alt {
  margin-top: var(--pw-space-3);
  text-align: center;
  font-size: var(--pw-text-sm);
  color: var(--pw-muted);
}

.pw-cl__dispute {
  color: var(--pw-danger-600);
  font-weight: var(--pw-weight-semibold);
}
</style>
