<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { Check, Eye, EyeOff } from '@lucide/vue'
import AppField from './AppField.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    label?: string
    hint?: string
    error?: string | null
    type?: string
    placeholder?: string
    required?: boolean
    disabled?: boolean
    readonly?: boolean
    autocomplete?: string
    inputmode?: 'text' | 'email' | 'numeric' | 'decimal' | 'tel' | 'search' | 'url'
    srOnlyLabel?: boolean
    valid?: boolean
    /** Mark invalid without an inline message (e.g. a form-level banner explains it). */
    invalid?: boolean
    /** Inline suffix text (e.g. "USD"). */
    suffix?: string
    prefix?: string
    size?: 'md' | 'lg'
    aside?: string
    maxlength?: number
    id?: string
  }>(),
  { type: 'text', size: 'md' },
)

const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ blur: [FocusEvent] }>()
const autoId = useId()
const inputId = computed(() => props.id ?? autoId)
const reveal = ref(false)
const isPassword = computed(() => props.type === 'password')
const describedBy = computed(() => (props.error ? `${inputId.value}-error` : props.hint ? `${inputId.value}-hint` : undefined))
</script>

<template>
  <AppField :id="inputId" :label="label" :hint="hint" :error="error" :required="required" :sr-only-label="srOnlyLabel" :aside="aside">
    <template v-if="$slots.aside" #aside><slot name="aside" /></template>
    <div class="pw-input" :class="[`pw-input--${size}`, { 'is-invalid': !!error || invalid, 'is-valid': valid && !error, 'is-disabled': disabled, 'is-readonly': readonly }]">
      <span v-if="prefix" class="pw-input__affix">{{ prefix }}</span>
      <slot name="leading" />
      <input
        :id="inputId"
        v-model="model"
        v-bind="$attrs"
        :type="isPassword && reveal ? 'text' : type"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :readonly="readonly"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :maxlength="maxlength"
        :aria-invalid="!!error || invalid || undefined"
        :aria-describedby="describedBy"
        class="pw-input__control"
        @blur="emit('blur', $event)"
      />
      <span v-if="suffix" class="pw-input__affix pw-input__affix--end">{{ suffix }}</span>
      <Check v-if="valid && !error" class="pw-input__valid" :size="16" aria-hidden="true" />
      <button
        v-if="isPassword"
        type="button"
        class="pw-input__reveal"
        :aria-label="reveal ? 'Hide password' : 'Show password'"
        :aria-pressed="reveal"
        @click="reveal = !reveal"
      >
        <EyeOff v-if="reveal" :size="18" />
        <Eye v-else :size="18" />
      </button>
      <slot name="trailing" />
    </div>
    <slot name="below" />
  </AppField>
</template>

<style scoped>
.pw-input {
  display: flex;
  align-items: center;
  gap: var(--pw-space-2);
  min-height: var(--pw-touch);
  padding: 0 var(--pw-space-3);
  background: var(--pw-surface);
  border: 1px solid var(--pw-input-border);
  border-radius: var(--pw-radius-md);
  transition:
    border-color var(--pw-duration) var(--pw-ease),
    box-shadow var(--pw-duration) var(--pw-ease);
}

.pw-input--lg {
  min-height: 52px;
  padding: 0 var(--pw-space-4);
}

.pw-input:hover {
  border-color: var(--pw-navy-300);
}

.pw-input:focus-within {
  border-color: var(--pw-navy-700);
  box-shadow: 0 0 0 3px var(--pw-navy-100);
}

.pw-input.is-invalid {
  border-color: var(--pw-danger-600);
}
.pw-input.is-invalid:focus-within {
  box-shadow: 0 0 0 3px var(--pw-danger-100);
}

.pw-input.is-valid {
  border-color: var(--pw-success-600);
}

.pw-input.is-disabled,
.pw-input.is-readonly {
  background: var(--pw-surface-sunken);
  border-color: var(--pw-border);
}

.pw-input__control {
  flex: 1;
  min-width: 0;
  height: 100%;
  min-height: inherit;
  padding: 0;
  border: 0;
  outline: none;
  background: transparent;
  font-size: var(--pw-text-md);
  color: var(--pw-ink);
}

@media (min-width: 768px) {
  .pw-input__control {
    font-size: var(--pw-text-base);
  }
  .pw-input--lg .pw-input__control {
    font-size: var(--pw-text-md);
  }
}

.pw-input__control::placeholder {
  color: var(--pw-subtle);
}

.pw-input__control:disabled {
  color: var(--pw-muted);
}

.pw-input__affix {
  color: var(--pw-muted);
  font-size: var(--pw-text-sm);
}

.pw-input__valid {
  color: var(--pw-success-600);
}

.pw-input__reveal {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  margin-right: -8px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--pw-muted);
}

.pw-input__reveal:hover {
  color: var(--pw-ink);
}
</style>
