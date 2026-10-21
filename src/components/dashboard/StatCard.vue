<script setup lang="ts">
import type { Component } from 'vue'
import { TrendingUp } from '@lucide/vue'

/** KPI tile (V5 / VB12 / VB18 / AD). Optional delta line with trend icon. */
defineProps<{
  label: string
  value: string
  caption?: string | null
  tone?: 'default' | 'green' | 'gold' | 'red' | 'navy'
  trend?: boolean
  icon?: Component
}>()
</script>

<template>
  <div class="pw-stat">
    <p class="pw-stat__label">{{ label }}</p>
    <p class="pw-stat__value">
      <slot name="value">{{ value }}</slot>
    </p>
    <p v-if="caption || $slots.caption" class="pw-stat__caption" :class="`is-${tone ?? 'default'}`">
      <TrendingUp v-if="trend" :size="14" aria-hidden="true" />
      <slot name="caption">{{ caption }}</slot>
    </p>
  </div>
</template>

<style scoped>
.pw-stat {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: var(--pw-space-4) var(--pw-space-5);
  background: var(--pw-surface);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
  min-width: 0;
}

.pw-stat__label {
  font-size: var(--pw-text-2xs);
  font-weight: var(--pw-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--pw-muted);
}

.pw-stat__value {
  display: flex;
  align-items: baseline;
  gap: var(--pw-space-2);
  font-family: var(--pw-font-display);
  font-size: clamp(1.375rem, 2.2vw, 1.75rem);
  font-weight: var(--pw-weight-bold);
  color: var(--pw-ink);
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

.pw-stat__caption {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-stat__caption.is-green {
  color: var(--pw-success-600);
}
.pw-stat__caption.is-gold {
  color: var(--pw-warning-600);
}
.pw-stat__caption.is-red {
  color: var(--pw-danger-600);
}
.pw-stat__caption.is-navy {
  color: var(--pw-navy-700);
}
</style>
