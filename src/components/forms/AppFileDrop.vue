<script setup lang="ts">
import { ref, useId } from 'vue'
import { Upload } from '@lucide/vue'

/**
 * Drag-and-drop / click-to-browse file target. Validates type + size client-side
 * (server re-validates) and emits accepted files.
 */
const props = withDefaults(
  defineProps<{
    label: string
    hint?: string
    accept?: string
    multiple?: boolean
    maxBytes?: number
    disabled?: boolean
    compact?: boolean
  }>(),
  { accept: 'image/jpeg,image/png,image/webp,image/heic', maxBytes: 20 * 1024 * 1024 },
)

const emit = defineEmits<{ files: [File[]]; rejected: [string] }>()
const over = ref(false)
const input = ref<HTMLInputElement | null>(null)
const id = useId()

function handleFiles(list: FileList | null) {
  if (!list?.length) return
  const allowed = props.accept.split(',').map((s) => s.trim())
  const good: File[] = []
  for (const file of Array.from(list)) {
    if (allowed.length && !allowed.some((a) => (a.endsWith('/*') ? file.type.startsWith(a.slice(0, -1)) : file.type === a))) {
      emit('rejected', `${file.name}: unsupported file type.`)
      continue
    }
    if (file.size > props.maxBytes) {
      emit('rejected', `${file.name} is larger than ${Math.round(props.maxBytes / 1024 / 1024)} MB.`)
      continue
    }
    good.push(file)
  }
  if (good.length) emit('files', props.multiple ? good : good.slice(0, 1))
  if (input.value) input.value.value = ''
}

function onDrop(e: DragEvent) {
  over.value = false
  if (!props.disabled) handleFiles(e.dataTransfer?.files ?? null)
}
</script>

<template>
  <div
    class="pw-drop"
    :class="{ 'is-over': over, 'is-disabled': disabled, 'pw-drop--compact': compact }"
    @dragover.prevent="over = true"
    @dragleave="over = false"
    @drop.prevent="onDrop"
  >
    <input :id="id" ref="input" type="file" class="sr-only" :accept="accept" :multiple="multiple" :disabled="disabled" @change="handleFiles(($event.target as HTMLInputElement).files)" />
    <label :for="id" class="pw-drop__label">
      <Upload :size="20" aria-hidden="true" />
      <span class="pw-drop__title">{{ label }}</span>
      <span v-if="hint" class="pw-drop__hint">{{ hint }}</span>
    </label>
  </div>
</template>

<style scoped>
.pw-drop {
  position: relative;
  display: flex;
  border: 1.5px dashed var(--pw-border-strong);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-surface);
  transition: all var(--pw-duration) var(--pw-ease);
}

.pw-drop.is-over {
  border-color: var(--pw-navy-700);
  background: var(--pw-navy-50);
}

.pw-drop.is-disabled {
  opacity: 0.5;
}

.pw-drop__label {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 140px;
  padding: var(--pw-space-4);
  text-align: center;
  color: var(--pw-navy-700);
  cursor: pointer;
}

.pw-drop--compact .pw-drop__label {
  min-height: 100px;
}

.pw-drop__title {
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-semibold);
}

.pw-drop__hint {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-drop:has(input:focus-visible) {
  outline: 2px solid var(--pw-color-focus);
  outline-offset: 2px;
}
</style>
