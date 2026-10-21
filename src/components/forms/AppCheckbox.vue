<script setup lang="ts">
import { useId } from 'vue'
import { Check } from '@lucide/vue'

defineProps<{ label?: string; hint?: string; count?: number | string; error?: string | null; disabled?: boolean }>()
const model = defineModel<boolean>({ default: false })
const id = useId()
</script>

<template>
  <div class="pw-check-wrap">
    <label :for="id" class="pw-check" :class="{ 'is-disabled': disabled }">
      <span class="pw-check__box-wrap">
        <input :id="id" v-model="model" type="checkbox" class="pw-check__input" :disabled="disabled" :aria-invalid="!!error || undefined" :aria-describedby="error ? `${id}-err` : undefined" />
        <span class="pw-check__box" aria-hidden="true"><Check :size="13" :stroke-width="3" /></span>
      </span>
      <span class="pw-check__text">
        <slot>{{ label }}</slot>
        <span v-if="hint" class="pw-check__hint">{{ hint }}</span>
      </span>
      <span v-if="count !== undefined" class="pw-check__count">{{ count }}</span>
    </label>
    <p v-if="error" :id="`${id}-err`" class="pw-check__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.pw-check {
  display: flex;
  align-items: flex-start;
  gap: var(--pw-space-3);
  min-height: 32px;
  padding: 4px 0;
  cursor: pointer;
  font-size: var(--pw-text-base);
  color: var(--pw-ink);
}

.pw-check.is-disabled {
  cursor: not-allowed;
  color: var(--pw-muted);
}

.pw-check__box-wrap {
  position: relative;
  display: inline-grid;
  flex: none;
  margin-top: 1px;
}

.pw-check__input {
  position: absolute;
  inset: -10px;
  width: calc(100% + 20px);
  height: calc(100% + 20px);
  opacity: 0;
  margin: 0;
  cursor: inherit;
}

.pw-check__box {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border: 1.5px solid var(--pw-border-strong);
  border-radius: var(--pw-radius-xs);
  background: var(--pw-surface);
  color: transparent;
  transition: all var(--pw-duration-fast) var(--pw-ease);
}

.pw-check__input:checked + .pw-check__box {
  background: var(--pw-navy-700);
  border-color: var(--pw-navy-700);
  color: #fff;
}

.pw-check__input:focus-visible + .pw-check__box {
  outline: 2px solid var(--pw-color-focus);
  outline-offset: 2px;
}

.pw-check__input[aria-invalid='true'] + .pw-check__box {
  border-color: var(--pw-danger-600);
}

.pw-check__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.4;
}

.pw-check__hint {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-check__count {
  font-size: var(--pw-text-xs);
  color: var(--pw-subtle);
  font-variant-numeric: tabular-nums;
  margin-top: 2px;
}

.pw-check__error {
  font-size: var(--pw-text-xs);
  color: var(--pw-danger-600);
  margin-left: 32px;
}
</style>
