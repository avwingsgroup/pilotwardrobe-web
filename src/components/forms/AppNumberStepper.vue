<script setup lang="ts">
import { computed, useId } from 'vue'
import { Minus, Plus } from '@lucide/vue'

/** − value + stepper over a list of allowed values (V6 collar/sleeve/waist/inseam). */
const props = defineProps<{ label: string; values: string[] }>()
const model = defineModel<string | null>({ default: null })
const id = useId()
const index = computed(() => Math.max(0, props.values.indexOf(model.value ?? '')))

function step(delta: number) {
  const next = Math.min(props.values.length - 1, Math.max(0, index.value + delta))
  model.value = props.values[next] ?? null
}
</script>

<template>
  <div class="pw-stepnum">
    <span :id="id" class="pw-stepnum__label">{{ label }}</span>
    <div class="pw-stepnum__control" role="group" :aria-labelledby="id">
      <button type="button" :aria-label="`Decrease ${label}`" :disabled="index <= 0" @click="step(-1)"><Minus :size="14" /></button>
      <output class="pw-stepnum__value" aria-live="polite">{{ model ?? '—' }}</output>
      <button type="button" :aria-label="`Increase ${label}`" :disabled="index >= values.length - 1" @click="step(1)"><Plus :size="14" /></button>
    </div>
  </div>
</template>

<style scoped>
.pw-stepnum {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pw-stepnum__label {
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-medium);
}

.pw-stepnum__control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: var(--pw-touch);
  border: 1px solid var(--pw-border-strong);
  border-radius: var(--pw-radius-md);
  background: var(--pw-surface);
}

.pw-stepnum__control button {
  display: grid;
  place-items: center;
  width: 40px;
  height: 42px;
  border: 0;
  background: none;
  color: var(--pw-navy-700);
}

.pw-stepnum__control button:disabled {
  color: var(--pw-disabled);
}

.pw-stepnum__value {
  font-family: var(--pw-font-display);
  font-weight: var(--pw-weight-semibold);
  font-size: var(--pw-text-md);
}
</style>
