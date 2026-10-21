<script setup lang="ts">
import { computed } from 'vue'
import type { Money } from '@/types/api'
import { formatMoney } from '@/utils/money'

const props = withDefaults(defineProps<{ price: Money; compareAt?: Money | null; size?: 'sm' | 'md' | 'lg' | 'xl'; whole?: boolean; note?: string | null }>(), { size: 'md' })
const showCompare = computed(() => props.compareAt && props.compareAt.amount > props.price.amount)
</script>

<template>
  <p class="pw-price" :class="`pw-price--${size}`">
    <span class="pw-price__now">
      <span class="sr-only">Price</span>
      {{ formatMoney(price, { whole }) }}
    </span>
    <s v-if="showCompare" class="pw-price__was"><span class="sr-only">was</span> {{ formatMoney(compareAt) }}</s>
    <span v-if="note" class="pw-price__note">{{ note }}</span>
  </p>
</template>

<style scoped>
.pw-price {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px var(--pw-space-2);
}

.pw-price__now {
  font-family: var(--pw-font-display);
  font-weight: var(--pw-weight-bold);
  color: var(--pw-ink);
  letter-spacing: -0.01em;
  font-variant-numeric: tabular-nums;
}

.pw-price--sm .pw-price__now {
  font-size: var(--pw-text-base);
}
.pw-price--md .pw-price__now {
  font-size: 1.25rem;
}
.pw-price--lg .pw-price__now {
  font-size: 1.75rem;
}
.pw-price--xl .pw-price__now {
  font-size: clamp(1.75rem, 3vw, 2.25rem);
}

.pw-price__was {
  font-size: var(--pw-text-xs);
  color: var(--pw-subtle);
}

.pw-price__note {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-price--xl .pw-price__note {
  font-size: var(--pw-text-sm);
}
</style>
