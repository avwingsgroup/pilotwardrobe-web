<script setup lang="ts">
import { computed, useId } from 'vue'
import AppField from './AppField.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    label?: string
    hint?: string
    error?: string | null
    placeholder?: string
    rows?: number
    maxlength?: number
    required?: boolean
    disabled?: boolean
    showCount?: boolean
    srOnlyLabel?: boolean
    id?: string
  }>(),
  { rows: 4 },
)

const model = defineModel<string>({ default: '' })
const autoId = useId()
const fieldId = computed(() => props.id ?? autoId)
const counter = computed(() => (props.showCount && props.maxlength ? `${model.value.length} / ${props.maxlength}` : undefined))
</script>

<template>
  <AppField :id="fieldId" :label="label" :hint="hint" :error="error" :required="required" :sr-only-label="srOnlyLabel" :aside="counter">
    <textarea
      :id="fieldId"
      v-model="model"
      v-bind="$attrs"
      :rows="rows"
      :placeholder="placeholder"
      :maxlength="maxlength"
      :required="required"
      :disabled="disabled"
      :aria-invalid="!!error || undefined"
      :aria-describedby="error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined"
      class="pw-textarea"
      :class="{ 'is-invalid': !!error }"
    />
  </AppField>
</template>

<style scoped>
.pw-textarea {
  width: 100%;
  min-height: 88px;
  padding: var(--pw-space-3);
  border: 1px solid var(--pw-input-border);
  border-radius: var(--pw-radius-md);
  background: var(--pw-surface);
  font-size: var(--pw-text-md);
  line-height: var(--pw-leading-normal);
  color: var(--pw-ink);
  resize: vertical;
}

@media (min-width: 768px) {
  .pw-textarea {
    font-size: var(--pw-text-base);
  }
}

.pw-textarea::placeholder {
  color: var(--pw-subtle);
}

.pw-textarea:hover {
  border-color: var(--pw-navy-300);
}

.pw-textarea:focus-visible {
  outline: none;
  border-color: var(--pw-navy-700);
  box-shadow: 0 0 0 3px var(--pw-navy-100);
}

.pw-textarea.is-invalid {
  border-color: var(--pw-danger-600);
}

.pw-textarea:disabled {
  background: var(--pw-surface-sunken);
}
</style>
