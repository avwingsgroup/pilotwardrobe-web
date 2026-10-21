<script setup lang="ts">
import { Check } from '@lucide/vue'

/** Vertical status timeline (order tracking VB7, dispute status VB15, offer history VB5). */
defineProps<{
  items: { label: string; detail?: string | null; state: 'done' | 'current' | 'upcoming' }[]
  tone?: 'success' | 'navy'
}>()
</script>

<template>
  <ol class="pw-timeline" :class="`pw-timeline--${tone ?? 'success'}`">
    <li v-for="(item, i) in items" :key="i" class="pw-timeline__item" :class="`is-${item.state}`">
      <span class="pw-timeline__marker" aria-hidden="true">
        <Check v-if="item.state === 'done'" :size="11" :stroke-width="3.5" />
      </span>
      <div class="pw-timeline__text">
        <p class="pw-timeline__label">
          {{ item.label }}
          <span class="sr-only">— {{ item.state === 'done' ? 'completed' : item.state === 'current' ? 'in progress' : 'upcoming' }}</span>
        </p>
        <p v-if="item.detail" class="pw-timeline__detail">{{ item.detail }}</p>
      </div>
    </li>
  </ol>
</template>

<style scoped>
.pw-timeline {
  list-style: none;
  margin: 0;
  padding: 0;
}

.pw-timeline__item {
  position: relative;
  display: flex;
  gap: var(--pw-space-3);
  padding-bottom: var(--pw-space-5);
}

.pw-timeline__item:last-child {
  padding-bottom: 0;
}

.pw-timeline__item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 20px;
  bottom: 2px;
  width: 2px;
  background: var(--pw-border);
}

.pw-timeline--success .pw-timeline__item.is-done:not(:last-child)::before {
  background: var(--pw-success-600);
}
.pw-timeline--navy .pw-timeline__item.is-done:not(:last-child)::before {
  background: var(--pw-navy-700);
}

.pw-timeline__marker {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  flex: none;
  width: 18px;
  height: 18px;
  margin-top: 1px;
  border-radius: 50%;
  border: 2px solid var(--pw-border-strong);
  background: var(--pw-surface);
  color: #fff;
}

.pw-timeline--success .is-done .pw-timeline__marker {
  background: var(--pw-success-600);
  border-color: var(--pw-success-600);
}
.pw-timeline--navy .is-done .pw-timeline__marker {
  background: var(--pw-navy-700);
  border-color: var(--pw-navy-700);
}

.is-current .pw-timeline__marker {
  background: var(--pw-navy-700);
  border-color: var(--pw-navy-700);
  box-shadow: 0 0 0 4px var(--pw-navy-100);
}

.pw-timeline__label {
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-semibold);
  color: var(--pw-ink);
}

.is-upcoming .pw-timeline__label {
  color: var(--pw-muted);
  font-weight: var(--pw-weight-regular);
}

.pw-timeline__detail {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
  margin-top: 2px;
}
</style>
