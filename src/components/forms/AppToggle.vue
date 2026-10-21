<script setup lang="ts">
import { useId } from 'vue'

/** Switch (role=switch). Optional label + hint rendered beside it. */
defineProps<{ label?: string; hint?: string; disabled?: boolean; srOnlyLabel?: boolean; reverse?: boolean }>()
const model = defineModel<boolean>({ default: false })
const id = useId()
</script>

<template>
  <div class="pw-toggle" :class="{ 'pw-toggle--reverse': reverse, 'is-disabled': disabled }">
    <button
      :id="id"
      type="button"
      role="switch"
      class="pw-toggle__track"
      :class="{ 'is-on': model }"
      :aria-checked="model"
      :aria-labelledby="label ? `${id}-label` : undefined"
      :aria-describedby="hint ? `${id}-hint` : undefined"
      :disabled="disabled"
      @click="model = !model"
    >
      <span class="pw-toggle__thumb" />
    </button>
    <div v-if="label" class="pw-toggle__text" :class="{ 'sr-only': srOnlyLabel }">
      <label :id="`${id}-label`" :for="id" class="pw-toggle__label">{{ label }}</label>
      <span v-if="hint" :id="`${id}-hint`" class="pw-toggle__hint">{{ hint }}</span>
    </div>
  </div>
</template>

<style scoped>
.pw-toggle {
  display: flex;
  align-items: flex-start;
  gap: var(--pw-space-3);
}

.pw-toggle--reverse {
  flex-direction: row-reverse;
  justify-content: space-between;
  align-items: center;
}

.pw-toggle__track {
  position: relative;
  flex: none;
  width: 46px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: var(--pw-radius-full);
  background: var(--pw-disabled);
  transition: background var(--pw-duration) var(--pw-ease);
}

.pw-toggle__track.is-on {
  background: var(--pw-navy-700);
}

.pw-toggle__track:disabled {
  opacity: 0.5;
}

.pw-toggle__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #fff;
  box-shadow: var(--pw-shadow-sm);
  transition: transform var(--pw-duration) var(--pw-ease);
}

.is-on .pw-toggle__thumb {
  transform: translateX(18px);
}

.pw-toggle__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pw-toggle__label {
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-medium);
  color: var(--pw-ink);
  cursor: pointer;
}

.pw-toggle__hint {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}
</style>
