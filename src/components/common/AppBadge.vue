<script setup lang="ts">
import type { Tone } from '@/constants/labels'

withDefaults(defineProps<{ tone?: Tone; size?: 'xs' | 'sm'; solid?: boolean; dot?: boolean }>(), {
  tone: 'neutral',
  size: 'xs',
})
</script>

<template>
  <span class="pw-badge" :class="[`pw-badge--${tone}`, `pw-badge--${size}`, { 'pw-badge--solid': solid }]">
    <span v-if="dot" class="pw-badge__dot" aria-hidden="true" />
    <slot />
  </span>
</template>

<style scoped>
.pw-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: var(--pw-radius-xs);
  font-weight: var(--pw-weight-bold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
  line-height: 1;
}

.pw-badge--xs {
  padding: 4px 6px;
  font-size: 0.625rem;
}

.pw-badge--sm {
  padding: 5px 8px;
  font-size: var(--pw-text-2xs);
}

.pw-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.pw-badge--success {
  background: var(--pw-success-100);
  color: var(--pw-success-700);
}
.pw-badge--warning {
  background: var(--pw-warning-100);
  color: var(--pw-warning-700);
}
.pw-badge--danger {
  background: var(--pw-danger-100);
  color: var(--pw-danger-700);
}
.pw-badge--info {
  background: var(--pw-navy-100);
  color: var(--pw-navy-700);
}
.pw-badge--neutral {
  background: #eef0f4;
  color: var(--pw-ink-2);
}
.pw-badge--gold {
  background: var(--pw-gold-100);
  color: var(--pw-warning-700);
}
.pw-badge--navy {
  background: var(--pw-navy-700);
  color: #fff;
}

.pw-badge--solid.pw-badge--gold {
  background: var(--pw-gold-500);
  color: #fff;
}
.pw-badge--solid.pw-badge--success {
  background: var(--pw-success-600);
  color: #fff;
}
.pw-badge--solid.pw-badge--danger {
  background: var(--pw-danger-600);
  color: #fff;
}
.pw-badge--solid.pw-badge--info {
  background: var(--pw-navy-600);
  color: #fff;
}
</style>
