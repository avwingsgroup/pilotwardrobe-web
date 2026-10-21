<script setup lang="ts">
import type { Component } from 'vue'

/** VB20 empty / system-state card: tinted icon tile, title, body, actions. */
withDefaults(
  defineProps<{
    title: string
    body?: string
    icon?: Component
    tone?: 'navy' | 'warning' | 'danger' | 'neutral' | 'success'
    compact?: boolean
    headingLevel?: 'h1' | 'h2' | 'h3'
  }>(),
  { tone: 'navy', headingLevel: 'h2' },
)
</script>

<template>
  <div class="pw-empty" :class="{ 'pw-empty--compact': compact }">
    <span v-if="icon" class="pw-empty__icon" :class="`pw-empty__icon--${tone}`" aria-hidden="true">
      <component :is="icon" :size="24" :stroke-width="1.75" />
    </span>
    <component :is="headingLevel" class="pw-empty__title">{{ title }}</component>
    <p v-if="body" class="pw-empty__body">{{ body }}</p>
    <div v-if="$slots.default" class="pw-empty__actions">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.pw-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--pw-space-12) var(--pw-space-6);
  gap: var(--pw-space-3);
}

.pw-empty--compact {
  padding: var(--pw-space-8) var(--pw-space-4);
}

.pw-empty__icon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: var(--pw-radius-lg);
  margin-bottom: var(--pw-space-2);
}

.pw-empty__icon--navy {
  background: var(--pw-navy-100);
  color: var(--pw-navy-700);
}
.pw-empty__icon--neutral {
  background: #eef0f4;
  color: var(--pw-ink-2);
}
.pw-empty__icon--warning {
  background: var(--pw-warning-100);
  color: var(--pw-warning-600);
}
.pw-empty__icon--danger {
  background: var(--pw-danger-100);
  color: var(--pw-danger-600);
}
.pw-empty__icon--success {
  background: var(--pw-success-100);
  color: var(--pw-success-600);
}

.pw-empty__title {
  font-size: var(--pw-text-lg);
}

.pw-empty__body {
  max-width: 420px;
  color: var(--pw-muted);
  font-size: var(--pw-text-sm);
  line-height: var(--pw-leading-relaxed);
}

.pw-empty__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--pw-space-2);
  margin-top: var(--pw-space-3);
}
</style>
