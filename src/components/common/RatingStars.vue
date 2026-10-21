<script setup lang="ts">
import { computed } from 'vue'
import { Star } from '@lucide/vue'

const props = withDefaults(defineProps<{ value: number; size?: number; showValue?: boolean; count?: string | number | null }>(), { size: 12 })
const filled = computed(() => Math.round(props.value))
</script>

<template>
  <span class="pw-rating" :aria-label="`Rated ${value.toFixed(1)} out of 5${count ? `, ${count}` : ''}`" role="img">
    <span class="pw-rating__stars" aria-hidden="true">
      <Star v-for="n in 5" :key="n" :size="size" :class="n <= filled ? 'is-on' : 'is-off'" :fill="n <= filled ? 'currentColor' : 'none'" :stroke-width="1.5" />
    </span>
    <span v-if="showValue" class="pw-rating__value" aria-hidden="true">{{ value.toFixed(1) }}</span>
    <span v-if="count" class="pw-rating__count" aria-hidden="true">· {{ count }}</span>
  </span>
</template>

<style scoped>
.pw-rating {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-rating__stars {
  display: inline-flex;
  gap: 2px;
}

.is-on {
  color: var(--pw-gold-500);
}

.is-off {
  color: var(--pw-border-strong);
}

.pw-rating__value {
  color: var(--pw-ink-2);
  font-weight: var(--pw-weight-medium);
}
</style>
