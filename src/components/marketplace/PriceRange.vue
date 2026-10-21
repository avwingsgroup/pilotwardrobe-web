<script setup lang="ts">
import { computed } from 'vue'
import AppMoneyInput from '@/components/forms/AppMoneyInput.vue'

/** Dual-thumb range slider (minor units) with linked min/max inputs (V2). */
const props = withDefaults(defineProps<{ min: number; max: number; step?: number }>(), { step: 1000 })
const model = defineModel<[number, number]>({ required: true })

const low = computed({
  get: () => model.value[0],
  set: (v: number) => (model.value = [Math.min(v, model.value[1] - props.step), model.value[1]]),
})
const high = computed({
  get: () => model.value[1],
  set: (v: number) => (model.value = [model.value[0], Math.max(v, model.value[0] + props.step)]),
})

const pct = (v: number) => ((v - props.min) / (props.max - props.min)) * 100
</script>

<template>
  <div class="pw-range">
    <div class="pw-range__track" :style="{ '--a': `${pct(low)}%`, '--b': `${pct(high)}%` }">
      <input v-model.number="low" type="range" :min="min" :max="max" :step="step" aria-label="Minimum price" />
      <input v-model.number="high" type="range" :min="min" :max="max" :step="step" aria-label="Maximum price" />
    </div>
    <div class="pw-range__inputs">
      <AppMoneyInput v-model="low" label="Minimum price" sr-only-label />
      <AppMoneyInput v-model="high" label="Maximum price" sr-only-label />
    </div>
  </div>
</template>

<style scoped>
.pw-range__track {
  position: relative;
  height: 28px;
  margin: 0 10px var(--pw-space-3);
}

.pw-range__track::before,
.pw-range__track::after {
  content: '';
  position: absolute;
  top: 50%;
  height: 4px;
  border-radius: 2px;
  transform: translateY(-50%);
}

.pw-range__track::before {
  left: 0;
  right: 0;
  background: var(--pw-border);
}

.pw-range__track::after {
  left: var(--a);
  right: calc(100% - var(--b));
  background: var(--pw-navy-700);
}

.pw-range__track input {
  position: absolute;
  inset: 0 -10px;
  z-index: 1;
  width: calc(100% + 20px);
  margin: 0;
  background: none;
  pointer-events: none;
  appearance: none;
}

.pw-range__track input::-webkit-slider-thumb {
  appearance: none;
  width: 22px;
  height: 22px;
  border: 2px solid var(--pw-navy-700);
  border-radius: 50%;
  background: #fff;
  pointer-events: auto;
  cursor: grab;
}

.pw-range__track input::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border: 2px solid var(--pw-navy-700);
  border-radius: 50%;
  background: #fff;
  pointer-events: auto;
  cursor: grab;
}

.pw-range__track input:focus-visible::-webkit-slider-thumb {
  box-shadow: 0 0 0 3px var(--pw-navy-100);
}

.pw-range__inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--pw-space-3);
}
</style>
