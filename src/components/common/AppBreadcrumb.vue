<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import type { RouteLocationRaw } from 'vue-router'

defineProps<{ items: { label: string; to?: RouteLocationRaw }[]; separator?: 'slash' | 'chevron' }>()
</script>

<template>
  <nav class="pw-crumbs" aria-label="Breadcrumb">
    <ol role="list">
      <li v-for="(item, i) in items" :key="i">
        <RouterLink v-if="item.to && i < items.length - 1" :to="item.to">{{ item.label }}</RouterLink>
        <span v-else :aria-current="i === items.length - 1 ? 'page' : undefined">{{ item.label }}</span>
        <template v-if="i < items.length - 1">
          <ChevronRight v-if="separator === 'chevron'" :size="12" class="pw-crumbs__sep" aria-hidden="true" />
          <span v-else class="pw-crumbs__sep" aria-hidden="true">/</span>
        </template>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.pw-crumbs ol {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: var(--pw-text-sm);
  color: var(--pw-muted);
}

.pw-crumbs li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.pw-crumbs a {
  color: var(--pw-muted);
}

.pw-crumbs a:hover {
  color: var(--pw-navy-700);
}

.pw-crumbs [aria-current='page'] {
  color: var(--pw-ink);
  font-weight: var(--pw-weight-semibold);
}

.pw-crumbs__sep {
  color: var(--pw-subtle);
}
</style>
