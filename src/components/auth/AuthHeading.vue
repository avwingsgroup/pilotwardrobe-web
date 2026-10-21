<script setup lang="ts">
import type { Component } from 'vue'
import { ChevronLeft } from '@lucide/vue'
import type { RouteLocationRaw } from 'vue-router'

defineProps<{ title: string; subtitle?: string; back?: { label: string; to: RouteLocationRaw }; icon?: Component; iconTone?: 'navy' | 'green' | 'gold' }>()
</script>

<template>
  <div class="pw-ah">
    <RouterLink v-if="back" :to="back.to" class="pw-ah__back"><ChevronLeft :size="18" aria-hidden="true" /> {{ back.label }}</RouterLink>
    <span v-if="icon" class="pw-ah__icon" :class="`is-${iconTone ?? 'navy'}`" aria-hidden="true"><component :is="icon" :size="24" /></span>
    <h1 class="pw-ah__title">{{ title }}</h1>
    <p v-if="subtitle || $slots.default" class="pw-ah__sub"><slot>{{ subtitle }}</slot></p>
  </div>
</template>

<style scoped>
.pw-ah {
  margin-bottom: var(--pw-space-6);
}

.pw-ah__back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-bottom: var(--pw-space-5);
  font-weight: var(--pw-weight-semibold);
}

.pw-ah__icon {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  margin-bottom: var(--pw-space-5);
  border-radius: var(--pw-radius-lg);
}

.pw-ah__icon.is-navy {
  background: var(--pw-navy-100);
  color: var(--pw-navy-700);
}
.pw-ah__icon.is-green {
  background: var(--pw-success-100);
  color: var(--pw-success-600);
}
.pw-ah__icon.is-gold {
  background: var(--pw-gold-100);
  color: var(--pw-gold-600);
}

.pw-ah__title {
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  font-weight: var(--pw-weight-bold);
}

.pw-ah__sub {
  margin-top: var(--pw-space-3);
  color: var(--pw-muted);
  font-size: var(--pw-text-md);
  line-height: var(--pw-leading-relaxed);
}

.pw-ah__sub :deep(strong) {
  color: var(--pw-ink);
}
</style>
