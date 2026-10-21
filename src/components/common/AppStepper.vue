<script setup lang="ts">
import { Check } from '@lucide/vue'

/**
 * Progress stepper used by checkout (V4), the sell wizard (VB1–3) and KYC (VB16).
 * Completed steps show a check; the current one is outlined; connectors fill
 * as steps complete. Steps before `current` are clickable when `navigable`.
 */
const props = defineProps<{ steps: string[]; current: number; navigable?: boolean; compact?: boolean }>()
const emit = defineEmits<{ go: [index: number] }>()

const state = (i: number) => (i < props.current ? 'done' : i === props.current ? 'current' : 'upcoming')
</script>

<template>
  <ol class="pw-stepper" :class="{ 'pw-stepper--compact': compact }" aria-label="Progress">
    <li v-for="(label, i) in steps" :key="label" class="pw-stepper__step" :class="`is-${state(i)}`">
      <component
        :is="navigable && i < current ? 'button' : 'span'"
        :type="navigable && i < current ? 'button' : undefined"
        class="pw-stepper__marker-wrap"
        :aria-current="i === current ? 'step' : undefined"
        @click="navigable && i < current && emit('go', i)"
      >
        <span class="pw-stepper__marker" aria-hidden="true">
          <Check v-if="i < current" :size="14" :stroke-width="3" />
          <template v-else>{{ i + 1 }}</template>
        </span>
        <span class="pw-stepper__label">
          {{ label }}
          <span class="sr-only">{{ i < current ? '(completed)' : i === current ? '(current step)' : '' }}</span>
        </span>
      </component>
      <span v-if="i < steps.length - 1" class="pw-stepper__line" aria-hidden="true" />
    </li>
  </ol>
</template>

<style scoped>
.pw-stepper {
  display: flex;
  align-items: center;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: var(--pw-space-3);
}

.pw-stepper__step {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  flex: 1;
  min-width: 0;
}

.pw-stepper__step:last-child {
  flex: none;
}

.pw-stepper__marker-wrap {
  display: inline-flex;
  align-items: center;
  gap: var(--pw-space-2);
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  white-space: nowrap;
}

button.pw-stepper__marker-wrap {
  cursor: pointer;
}

.pw-stepper__marker {
  display: grid;
  place-items: center;
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1.5px solid var(--pw-border-strong);
  background: var(--pw-surface);
  color: var(--pw-muted);
  font-size: var(--pw-text-xs);
  font-weight: var(--pw-weight-semibold);
}

.pw-stepper__label {
  font-size: var(--pw-text-sm);
  color: var(--pw-muted);
}

.is-done .pw-stepper__marker {
  background: var(--pw-navy-700);
  border-color: var(--pw-navy-700);
  color: #fff;
}

.is-current .pw-stepper__marker {
  border-color: var(--pw-navy-700);
  color: var(--pw-navy-700);
  border-width: 2px;
}

.is-done .pw-stepper__label,
.is-current .pw-stepper__label {
  color: var(--pw-ink);
  font-weight: var(--pw-weight-semibold);
}

.pw-stepper__line {
  flex: 1;
  height: 2px;
  min-width: 16px;
  background: var(--pw-border);
  border-radius: 1px;
}

.is-done .pw-stepper__line {
  background: var(--pw-navy-700);
}

@media (max-width: 767px) {
  .pw-stepper__step:not(.is-current) .pw-stepper__label {
    display: none;
  }
  .pw-stepper {
    gap: var(--pw-space-2);
  }
  .pw-stepper__step {
    gap: var(--pw-space-2);
  }
}

.pw-stepper--compact .pw-stepper__label {
  display: none;
}
</style>
