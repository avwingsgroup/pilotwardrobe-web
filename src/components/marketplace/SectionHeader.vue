<script setup lang="ts">
import { ArrowRight } from '@lucide/vue'
import type { RouteLocationRaw } from 'vue-router'

defineProps<{ title: string; subtitle?: string | null; linkLabel?: string; to?: RouteLocationRaw; id?: string }>()
</script>

<template>
  <div class="pw-sh">
    <div>
      <h2 :id="id" class="pw-sh__title">{{ title }}</h2>
      <p v-if="subtitle" class="pw-sh__sub">{{ subtitle }}</p>
    </div>
    <RouterLink v-if="to" :to="to" class="pw-sh__link">{{ linkLabel ?? 'View all' }} <ArrowRight :size="16" aria-hidden="true" /></RouterLink>
  </div>
</template>

<style scoped>
.pw-sh {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--pw-space-4);
  margin-bottom: var(--pw-space-5);
}

.pw-sh__title {
  font-size: var(--pw-text-xl);
  font-weight: var(--pw-weight-semibold);
  color: var(--pw-navy-700);
}

.pw-sh__sub {
  margin-top: var(--pw-space-1);
  color: var(--pw-muted);
}

.pw-sh__link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: var(--pw-weight-semibold);
  white-space: nowrap;
}
</style>
