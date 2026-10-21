<script setup lang="ts">
import type { Component } from 'vue'
import BrandLogo from '@/components/navigation/BrandLogo.vue'
import AppEmptyState from './AppEmptyState.vue'
import { useSeo } from '@/composables/useSeo'

/** Full-page system state (VB20 cards, standalone). */
const props = defineProps<{ title: string; body: string; icon: Component; tone?: 'navy' | 'warning' | 'danger' | 'neutral' }>()
useSeo({ title: props.title, noindex: true })
</script>

<template>
  <div class="pw-sys">
    <header class="pw-sys__top"><BrandLogo :height="40" /></header>
    <main id="main" tabindex="-1" class="pw-sys__main">
      <div class="pw-card pw-sys__card">
        <AppEmptyState :title="title" :body="body" :icon="icon" :tone="tone" heading-level="h1">
          <slot />
        </AppEmptyState>
      </div>
    </main>
  </div>
</template>

<style scoped>
.pw-sys {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--pw-surface-sunken);
}

.pw-sys__top {
  display: flex;
  align-items: center;
  min-height: 66px;
  padding: 0 var(--pw-gutter);
  background: var(--pw-surface);
  border-bottom: 1px solid var(--pw-border);
}

.pw-sys__main {
  flex: 1;
  display: grid;
  place-items: center;
  padding: var(--pw-space-8) var(--pw-gutter);
  outline: none;
}

.pw-sys__card {
  width: 100%;
  max-width: 520px;
}
</style>
