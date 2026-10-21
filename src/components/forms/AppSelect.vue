<script setup lang="ts">
import { computed, useId } from 'vue'
import { ChevronDown } from '@lucide/vue'
import AppField from './AppField.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  label?: string
  hint?: string
  error?: string | null
  options: { value: string; label: string; disabled?: boolean }[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
  srOnlyLabel?: boolean
  id?: string
}>()

const model = defineModel<string>({ default: '' })
const autoId = useId()
const selectId = computed(() => props.id ?? autoId)
</script>

<template>
  <AppField :id="selectId" :label="label" :hint="hint" :error="error" :required="required" :sr-only-label="srOnlyLabel">
    <div class="pw-select" :class="{ 'is-invalid': !!error, 'is-disabled': disabled }">
      <select
        :id="selectId"
        v-model="model"
        v-bind="$attrs"
        :required="required"
        :disabled="disabled"
        :aria-invalid="!!error || undefined"
        :aria-describedby="error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined"
        class="pw-select__control"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option v-for="o in options" :key="o.value" :value="o.value" :disabled="o.disabled">{{ o.label }}</option>
      </select>
      <ChevronDown class="pw-select__chevron" :size="16" aria-hidden="true" />
    </div>
  </AppField>
</template>

<style scoped>
.pw-select {
  position: relative;
  display: flex;
}

.pw-select__control {
  appearance: none;
  width: 100%;
  min-height: var(--pw-touch);
  padding: 0 40px 0 var(--pw-space-3);
  border: 1px solid var(--pw-border-strong);
  border-radius: var(--pw-radius-md);
  background: var(--pw-surface);
  font-size: var(--pw-text-md);
  color: var(--pw-ink);
  cursor: pointer;
}

@media (min-width: 768px) {
  .pw-select__control {
    font-size: var(--pw-text-base);
  }
}

.pw-select__control:hover {
  border-color: var(--pw-navy-300);
}

.pw-select__control:focus-visible {
  outline: none;
  border-color: var(--pw-navy-700);
  box-shadow: 0 0 0 3px var(--pw-navy-100);
}

.is-invalid .pw-select__control {
  border-color: var(--pw-danger-600);
}

.is-disabled .pw-select__control {
  background: var(--pw-surface-sunken);
  color: var(--pw-muted);
  cursor: not-allowed;
}

.pw-select__chevron {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--pw-muted);
  pointer-events: none;
}
</style>
