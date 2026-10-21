<script setup lang="ts" generic="T extends string">
import { useId } from 'vue'

/**
 * Segmented button group used for sizes (V3 XS–XL, V6 jacket/shoe sizes),
 * bag class, counter-offer presets. Single-select radio semantics.
 */
defineProps<{
  options: { value: T; label: string; disabled?: boolean }[]
  legend: string
  srOnlyLegend?: boolean
  size?: 'sm' | 'md'
  error?: string | null
  shape?: 'box' | 'pill'
}>()
const model = defineModel<T | null>({ default: null })
const name = useId()
</script>

<template>
  <fieldset class="pw-chips">
    <legend :class="srOnlyLegend ? 'sr-only' : 'pw-chips__legend'">{{ legend }}</legend>
    <div class="pw-chips__row" :class="[`pw-chips__row--${size ?? 'md'}`, `pw-chips__row--${shape ?? 'box'}`]">
      <label v-for="o in options" :key="o.value" class="pw-chip" :class="{ 'is-checked': model === o.value, 'is-disabled': o.disabled }">
        <input v-model="model" type="radio" :name="name" :value="o.value" :disabled="o.disabled" class="sr-only" />
        <span>{{ o.label }}</span>
        <span v-if="o.disabled" class="sr-only">(unavailable)</span>
      </label>
    </div>
    <p v-if="error" class="pw-chips__error" role="alert">{{ error }}</p>
  </fieldset>
</template>

<style scoped>
.pw-chips {
  border: 0;
  margin: 0;
  padding: 0;
  min-width: 0;
}

.pw-chips__legend {
  margin-bottom: var(--pw-space-2);
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-medium);
}

.pw-chips__row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(72px, 1fr));
  gap: var(--pw-space-3);
}

.pw-chips__row--sm {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pw-space-2);
}

.pw-chip {
  display: grid;
  place-items: center;
  min-height: var(--pw-touch);
  padding: 0 var(--pw-space-4);
  border: 1px solid var(--pw-border-strong);
  border-radius: var(--pw-radius-md);
  background: var(--pw-surface);
  font-weight: var(--pw-weight-medium);
  color: var(--pw-ink);
  cursor: pointer;
  user-select: none;
  transition: all var(--pw-duration-fast) var(--pw-ease);
}

.pw-chips__row--sm .pw-chip {
  min-height: 34px;
  padding: 0 var(--pw-space-3);
  font-size: var(--pw-text-sm);
}

.pw-chips__row--pill .pw-chip {
  border-radius: var(--pw-radius-full);
}

.pw-chip:hover {
  border-color: var(--pw-navy-300);
}

.pw-chip.is-checked {
  background: var(--pw-navy-700);
  border-color: var(--pw-navy-700);
  color: #fff;
}

.pw-chip.is-disabled {
  color: var(--pw-disabled);
  border-color: var(--pw-border);
  cursor: not-allowed;
  text-decoration: line-through;
}

.pw-chip:has(input:focus-visible) {
  outline: 2px solid var(--pw-color-focus);
  outline-offset: 2px;
}

.pw-chips__error {
  margin-top: var(--pw-space-2);
  font-size: var(--pw-text-xs);
  color: var(--pw-danger-600);
}
</style>
