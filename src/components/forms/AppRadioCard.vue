<script setup lang="ts" generic="T extends string">
import { useId } from 'vue'
import type { RadioCardOption } from '@/types/ui'

/**
 * Selectable card radio group (shipping "Flight plan", condition, freight method,
 * dispute reason, boost package, KYC document). Native radios for a11y.
 */

defineProps<{ options: RadioCardOption<T>[]; legend: string; columns?: 1 | 2 | 3 | 4; srOnlyLegend?: boolean; size?: 'md' | 'lg'; error?: string | null }>()
const model = defineModel<T | ''>({ required: true })
const name = useId()
</script>

<template>
  <fieldset class="pw-radio-cards">
    <legend :class="srOnlyLegend ? 'sr-only' : 'pw-radio-cards__legend'">{{ legend }}</legend>
    <div class="pw-radio-cards__grid" :style="{ '--cols': columns ?? 1 }">
      <label
        v-for="o in options"
        :key="o.value"
        class="pw-radio-card"
        :class="[`pw-radio-card--${size ?? 'md'}`, { 'is-checked': model === o.value, 'is-disabled': o.disabled }]"
      >
        <input v-model="model" type="radio" :name="name" :value="o.value" :disabled="o.disabled" class="pw-radio-card__input" />
        <span class="pw-radio-card__dot" aria-hidden="true" />
        <span class="pw-radio-card__text">
          <span class="pw-radio-card__label">{{ o.label }}</span>
          <span v-if="o.hint" class="pw-radio-card__hint">{{ o.hint }}</span>
          <span v-if="o.extra" class="pw-radio-card__extra">{{ o.extra }}</span>
          <slot name="extra" :option="o" />
        </span>
        <span v-if="o.aside" class="pw-radio-card__aside">{{ o.aside }}</span>
      </label>
    </div>
    <p v-if="error" class="pw-radio-cards__error" role="alert">{{ error }}</p>
  </fieldset>
</template>

<style scoped>
.pw-radio-cards {
  border: 0;
  margin: 0;
  padding: 0;
  min-width: 0;
}

.pw-radio-cards__legend {
  margin-bottom: var(--pw-space-3);
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-medium);
}

.pw-radio-cards__grid {
  display: grid;
  gap: var(--pw-space-3);
  grid-template-columns: 1fr;
}

@media (min-width: 640px) {
  .pw-radio-cards__grid {
    grid-template-columns: repeat(min(var(--cols), 2), minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .pw-radio-cards__grid {
    grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
  }
}

.pw-radio-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: var(--pw-space-3);
  padding: var(--pw-space-3) var(--pw-space-4);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-surface);
  cursor: pointer;
  transition:
    border-color var(--pw-duration) var(--pw-ease),
    box-shadow var(--pw-duration) var(--pw-ease);
}

.pw-radio-card--lg {
  padding: var(--pw-space-4) var(--pw-space-5);
}

.pw-radio-card:hover {
  border-color: var(--pw-navy-300);
}

.pw-radio-card.is-checked {
  border-color: var(--pw-navy-700);
  box-shadow: inset 0 0 0 1px var(--pw-navy-700);
}

.pw-radio-card.is-disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.pw-radio-card__input {
  position: absolute;
  opacity: 0;
  inset: 0;
  margin: 0;
  cursor: inherit;
}

.pw-radio-card__input:focus-visible ~ .pw-radio-card__dot {
  outline: 2px solid var(--pw-color-focus);
  outline-offset: 2px;
}

.pw-radio-card__dot {
  flex: none;
  width: 20px;
  height: 20px;
  margin-top: 1px;
  border: 1.5px solid var(--pw-border-strong);
  border-radius: 50%;
  background: var(--pw-surface);
}

.is-checked .pw-radio-card__dot {
  border: 6px solid var(--pw-navy-700);
}

.pw-radio-card--lg.is-checked .pw-radio-card__dot {
  width: 26px;
  height: 26px;
  border-width: 7px;
}

.pw-radio-card__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.pw-radio-card__label {
  font-size: var(--pw-text-base);
  font-weight: var(--pw-weight-medium);
  color: var(--pw-ink);
}

.pw-radio-card__hint {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-radio-card__extra {
  margin-top: var(--pw-space-2);
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-semibold);
  color: var(--pw-navy-700);
}

.pw-radio-card__aside {
  align-self: center;
  font-weight: var(--pw-weight-semibold);
  font-variant-numeric: tabular-nums;
  color: var(--pw-ink);
}

.pw-radio-cards__error {
  margin-top: var(--pw-space-2);
  font-size: var(--pw-text-xs);
  color: var(--pw-danger-600);
}
</style>
