<script setup lang="ts">
import { computed, ref, watch } from 'vue'

/**
 * Segmented one-time-code input (VA5 4-digit email OTP, VA7 6-digit TOTP).
 * Paste fills every box; typing advances; Backspace steps back; emits
 * `complete` on the last digit for auto-submit.
 */
const props = withDefaults(defineProps<{ length?: number; label: string; error?: string | null; disabled?: boolean; autofocus?: boolean }>(), {
  length: 4,
})
const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ complete: [code: string] }>()
const inputs = ref<HTMLInputElement[]>([])

const digits = computed(() => Array.from({ length: props.length }, (_, i) => model.value[i] ?? ''))

function setAt(index: number, char: string) {
  const arr = digits.value.slice()
  arr[index] = char
  model.value = arr.join('').slice(0, props.length)
}

function onInput(index: number, event: Event) {
  const el = event.target as HTMLInputElement
  const value = el.value.replace(/\D/g, '')
  if (value.length > 1) return fill(value, index)
  setAt(index, value)
  if (value && index < props.length - 1) inputs.value[index + 1]?.focus()
}

function fill(value: string, start = 0) {
  const arr = digits.value.slice()
  for (let i = 0; i < value.length && start + i < props.length; i++) arr[start + i] = value[i]!
  model.value = arr.join('')
  inputs.value[Math.min(props.length - 1, start + value.length)]?.focus()
}

function onPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData('text').replace(/\D/g, '') ?? ''
  if (!text) return
  event.preventDefault()
  fill(text.slice(0, props.length), 0)
}

function onKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace' && !digits.value[index] && index > 0) {
    event.preventDefault()
    setAt(index - 1, '')
    inputs.value[index - 1]?.focus()
  } else if (event.key === 'ArrowLeft' && index > 0) inputs.value[index - 1]?.focus()
  else if (event.key === 'ArrowRight' && index < props.length - 1) inputs.value[index + 1]?.focus()
}

watch(model, (value) => {
  if (value.length === props.length && /^\d+$/.test(value)) emit('complete', value)
})

defineExpose({ focus: () => inputs.value[0]?.focus() })
</script>

<template>
  <fieldset class="pw-otp" :disabled="disabled">
    <legend class="sr-only">{{ label }}</legend>
    <div class="pw-otp__boxes" @paste="onPaste">
      <input
        v-for="(d, i) in digits"
        :key="i"
        :ref="(el) => (inputs[i] = el as HTMLInputElement)"
        :value="d"
        class="pw-otp__box"
        :class="{ 'is-filled': !!d, 'is-invalid': !!error }"
        type="text"
        inputmode="numeric"
        pattern="[0-9]*"
        :autocomplete="i === 0 ? 'one-time-code' : 'off'"
        maxlength="1"
        :autofocus="autofocus && i === 0"
        :aria-label="`Digit ${i + 1} of ${length}`"
        :aria-invalid="!!error || undefined"
        @input="onInput(i, $event)"
        @keydown="onKeydown(i, $event)"
        @focus="($event.target as HTMLInputElement).select()"
      />
    </div>
    <p v-if="error" class="pw-otp__error" role="alert">{{ error }}</p>
  </fieldset>
</template>

<style scoped>
.pw-otp {
  border: 0;
  margin: 0;
  padding: 0;
}

.pw-otp__boxes {
  display: flex;
  gap: var(--pw-space-3);
}

.pw-otp__box {
  width: 64px;
  height: 64px;
  padding: 0;
  border: 1.5px solid var(--pw-border-strong);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-surface);
  font-family: var(--pw-font-display);
  font-size: 1.75rem;
  font-weight: var(--pw-weight-semibold);
  text-align: center;
  color: var(--pw-ink);
  caret-color: var(--pw-navy-700);
}

.pw-otp__box.is-filled {
  background: var(--pw-navy-50);
  border-color: var(--pw-navy-700);
}

.pw-otp__box:focus-visible {
  outline: none;
  border-color: var(--pw-navy-700);
  box-shadow: 0 0 0 3px var(--pw-navy-100);
  background: var(--pw-surface);
}

.pw-otp__box.is-invalid {
  border-color: var(--pw-danger-600);
}

.pw-otp__error {
  margin-top: var(--pw-space-2);
  font-size: var(--pw-text-xs);
  color: var(--pw-danger-600);
}

@media (max-width: 400px) {
  .pw-otp__boxes {
    gap: var(--pw-space-2);
  }
  .pw-otp__box {
    width: 48px;
    height: 56px;
    font-size: 1.5rem;
  }
}
</style>
