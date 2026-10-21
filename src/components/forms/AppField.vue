<script setup lang="ts">
import { CircleAlert } from '@lucide/vue'

/**
 * Label + control + hint/error wrapper. Wires ids so the control can reference
 * `aria-describedby` / `aria-invalid`. Errors are announced (role=alert).
 */
defineProps<{
  id: string
  label?: string
  hint?: string
  error?: string | null
  required?: boolean
  srOnlyLabel?: boolean
  /** Right-aligned helper beside the label (e.g. "Size guide", counters). */
  aside?: string
}>()
</script>

<template>
  <div class="pw-field" :class="{ 'has-error': !!error }">
    <div v-if="label || $slots.aside || aside" class="pw-field__top">
      <label v-if="label" :for="id" class="pw-field__label" :class="{ 'sr-only': srOnlyLabel }">
        {{ label }}<span v-if="required" class="pw-field__req" aria-hidden="true"> *</span>
      </label>
      <slot name="aside">
        <span v-if="aside" class="pw-field__aside">{{ aside }}</span>
      </slot>
    </div>
    <slot />
    <p v-if="error" :id="`${id}-error`" class="pw-field__error" role="alert">
      <CircleAlert :size="14" aria-hidden="true" />
      {{ error }}
    </p>
    <p v-else-if="hint" :id="`${id}-hint`" class="pw-field__hint">{{ hint }}</p>
  </div>
</template>

<style scoped>
.pw-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.pw-field__top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--pw-space-2);
}

.pw-field__label {
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-medium);
  color: var(--pw-ink);
}

.pw-field__req {
  color: var(--pw-danger-600);
}

.pw-field__aside {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-field__hint {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-field__error {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--pw-text-xs);
  color: var(--pw-danger-600);
}
</style>
