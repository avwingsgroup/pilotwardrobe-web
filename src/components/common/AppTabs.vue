<script setup lang="ts" generic="T extends string">
import { ref } from 'vue'
import type { TabItem } from '@/types/ui'

/**
 * Tabs in two visual styles from the designs:
 *  - `underline` (Details / Size & fit / Freight; Settings tabs; admin tabs)
 *  - `pills` (All / Live / Airborne…; notification filters)
 * Implements the WAI-ARIA tablist pattern with roving focus (←/→/Home/End).
 */

const props = withDefaults(defineProps<{ items: TabItem<T>[]; variant?: 'underline' | 'pills'; label: string }>(), { variant: 'underline' })
const model = defineModel<T>({ required: true })
const refs = ref<HTMLButtonElement[]>([])

function onKeydown(event: KeyboardEvent, index: number) {
  const last = props.items.length - 1
  let next = index
  if (event.key === 'ArrowRight') next = index === last ? 0 : index + 1
  else if (event.key === 'ArrowLeft') next = index === 0 ? last : index - 1
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = last
  else return
  event.preventDefault()
  model.value = props.items[next]!.value
  refs.value[next]?.focus()
}
</script>

<template>
  <div class="pw-tabs" :class="`pw-tabs--${variant}`" role="tablist" :aria-label="label">
    <button
      v-for="(item, i) in items"
      :key="item.value"
      :ref="(el) => (refs[i] = el as HTMLButtonElement)"
      type="button"
      role="tab"
      class="pw-tabs__tab"
      :class="{ 'is-active': model === item.value }"
      :aria-selected="model === item.value"
      :tabindex="model === item.value ? 0 : -1"
      @click="model = item.value"
      @keydown="onKeydown($event, i)"
    >
      {{ item.label }}
      <span v-if="item.count !== undefined && item.count !== null" class="pw-tabs__count">{{ item.count }}</span>
    </button>
  </div>
</template>

<style scoped>
.pw-tabs {
  display: flex;
  gap: var(--pw-space-1);
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.pw-tabs::-webkit-scrollbar {
  display: none;
}

.pw-tabs__tab {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 0;
  background: none;
  font-size: var(--pw-text-base);
  color: var(--pw-muted);
  white-space: nowrap;
}

.pw-tabs--underline {
  gap: var(--pw-space-6);
  border-bottom: 1px solid var(--pw-border);
}

.pw-tabs--underline .pw-tabs__tab {
  min-height: var(--pw-touch);
  padding: 0 0 2px;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}

.pw-tabs--underline .pw-tabs__tab.is-active {
  color: var(--pw-navy-700);
  font-weight: var(--pw-weight-semibold);
  border-bottom-color: var(--pw-navy-700);
}

.pw-tabs--underline .pw-tabs__tab:hover {
  color: var(--pw-ink);
}

.pw-tabs--pills .pw-tabs__tab {
  min-height: 36px;
  padding: 0 var(--pw-space-4);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-full);
  background: var(--pw-surface);
  font-size: var(--pw-text-sm);
  color: var(--pw-ink-2);
}

.pw-tabs--pills .pw-tabs__tab.is-active {
  background: var(--pw-navy-700);
  border-color: var(--pw-navy-700);
  color: #fff;
  font-weight: var(--pw-weight-semibold);
}

.pw-tabs__count {
  font-variant-numeric: tabular-nums;
}
</style>
