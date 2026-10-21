<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { X } from '@lucide/vue'
import { useFocusTrap } from '@/composables/useFocusTrap'

/**
 * Accessible dialog: role=dialog + aria-modal, labelled by its title, focus trap,
 * Escape to close, scroll lock, focus restored to the opener.
 */
const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    description?: string
    size?: 'sm' | 'md' | 'lg'
    dismissible?: boolean
    hideClose?: boolean
  }>(),
  { size: 'md', dismissible: true },
)

const emit = defineEmits<{ close: [] }>()
const panel = ref<HTMLElement | null>(null)
const titleId = useId()
const descId = useId()
const isOpen = computed(() => props.open)

function close() {
  if (props.dismissible) emit('close')
}

useFocusTrap(panel, isOpen, close)
</script>

<template>
  <Teleport to="body">
    <Transition name="pw-modal">
      <div v-if="open" class="pw-modal" @mousedown.self="close">
        <div
          ref="panel"
          class="pw-modal__panel"
          :class="`pw-modal__panel--${size}`"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="title ? titleId : undefined"
          :aria-describedby="description ? descId : undefined"
          tabindex="-1"
        >
          <header v-if="title || $slots.header" class="pw-modal__header">
            <slot name="header">
              <h2 :id="titleId" class="pw-modal__title">{{ title }}</h2>
            </slot>
            <button v-if="!hideClose && dismissible" type="button" class="pw-modal__close" aria-label="Close dialog" @click="close">
              <X :size="18" />
            </button>
          </header>
          <p v-if="description" :id="descId" class="pw-modal__desc">{{ description }}</p>
          <div class="pw-modal__body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="pw-modal__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.pw-modal {
  position: fixed;
  inset: 0;
  z-index: var(--pw-z-modal);
  display: grid;
  place-items: center;
  padding: var(--pw-space-4);
  background: var(--pw-overlay);
  overflow-y: auto;
}

.pw-modal__panel {
  width: 100%;
  max-height: calc(100dvh - 32px);
  overflow-y: auto;
  background: var(--pw-surface);
  border-radius: var(--pw-radius-xl);
  box-shadow: var(--pw-shadow-lg);
  padding: var(--pw-space-6);
  outline: none;
}

.pw-modal__panel--sm {
  max-width: 420px;
}
.pw-modal__panel--md {
  max-width: 560px;
}
.pw-modal__panel--lg {
  max-width: 820px;
}

.pw-modal__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--pw-space-4);
  margin-bottom: var(--pw-space-4);
}

.pw-modal__title {
  font-size: var(--pw-text-lg);
}

.pw-modal__desc {
  color: var(--pw-muted);
  margin: calc(var(--pw-space-2) * -1) 0 var(--pw-space-4);
  font-size: var(--pw-text-sm);
}

.pw-modal__close {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  margin: -6px -6px 0 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--pw-muted);
}

.pw-modal__close:hover {
  background: var(--pw-surface-sunken);
  color: var(--pw-ink);
}

.pw-modal__footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--pw-space-2);
  margin-top: var(--pw-space-6);
}

.pw-modal-enter-active,
.pw-modal-leave-active {
  transition: opacity var(--pw-duration) var(--pw-ease);
}
.pw-modal-enter-active .pw-modal__panel,
.pw-modal-leave-active .pw-modal__panel {
  transition: transform var(--pw-duration) var(--pw-ease);
}
.pw-modal-enter-from,
.pw-modal-leave-to {
  opacity: 0;
}
.pw-modal-enter-from .pw-modal__panel,
.pw-modal-leave-to .pw-modal__panel {
  transform: translateY(8px) scale(0.98);
}

@media (max-width: 479px) {
  .pw-modal {
    align-items: end;
    padding: 0;
  }
  .pw-modal__panel {
    max-height: 92dvh;
    border-radius: var(--pw-radius-xl) var(--pw-radius-xl) 0 0;
    padding: var(--pw-space-5);
  }
}
</style>
