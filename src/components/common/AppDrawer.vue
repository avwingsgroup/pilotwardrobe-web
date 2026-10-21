<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { X } from '@lucide/vue'
import { useFocusTrap } from '@/composables/useFocusTrap'

const props = withDefaults(defineProps<{ open: boolean; title: string; side?: 'left' | 'right' | 'bottom' }>(), { side: 'right' })
const emit = defineEmits<{ close: [] }>()
const panel = ref<HTMLElement | null>(null)
const titleId = useId()
const isOpen = computed(() => props.open)

useFocusTrap(panel, isOpen, () => emit('close'))
</script>

<template>
  <Teleport to="body">
    <Transition :name="`pw-drawer-${side}`">
      <div v-if="open" class="pw-drawer" @mousedown.self="emit('close')">
        <aside ref="panel" class="pw-drawer__panel" :class="`pw-drawer__panel--${side}`" role="dialog" aria-modal="true" :aria-labelledby="titleId" tabindex="-1">
          <header class="pw-drawer__header">
            <h2 :id="titleId" class="pw-drawer__title">{{ title }}</h2>
            <button type="button" class="pw-drawer__close" aria-label="Close" @click="emit('close')">
              <X :size="20" />
            </button>
          </header>
          <div class="pw-drawer__body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="pw-drawer__footer">
            <slot name="footer" />
          </footer>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.pw-drawer {
  position: fixed;
  inset: 0;
  z-index: var(--pw-z-drawer);
  background: var(--pw-overlay);
}

.pw-drawer__panel {
  position: absolute;
  display: flex;
  flex-direction: column;
  background: var(--pw-surface);
  box-shadow: var(--pw-shadow-lg);
  outline: none;
}

.pw-drawer__panel--right,
.pw-drawer__panel--left {
  top: 0;
  bottom: 0;
  width: min(380px, 88vw);
}
.pw-drawer__panel--right {
  right: 0;
}
.pw-drawer__panel--left {
  left: 0;
}
.pw-drawer__panel--bottom {
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 88dvh;
  border-radius: var(--pw-radius-xl) var(--pw-radius-xl) 0 0;
}

.pw-drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--pw-space-4) var(--pw-space-5);
  border-bottom: 1px solid var(--pw-border);
}

.pw-drawer__title {
  font-size: var(--pw-text-md);
}

.pw-drawer__close {
  display: grid;
  place-items: center;
  width: var(--pw-touch);
  height: var(--pw-touch);
  margin-right: -10px;
  border: 0;
  background: transparent;
  color: var(--pw-muted);
  border-radius: 50%;
}

.pw-drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: var(--pw-space-5);
}

.pw-drawer__footer {
  padding: var(--pw-space-4) var(--pw-space-5);
  border-top: 1px solid var(--pw-border);
  padding-bottom: calc(var(--pw-space-4) + env(safe-area-inset-bottom));
}

.pw-drawer-right-enter-active,
.pw-drawer-right-leave-active,
.pw-drawer-left-enter-active,
.pw-drawer-left-leave-active,
.pw-drawer-bottom-enter-active,
.pw-drawer-bottom-leave-active {
  transition: opacity var(--pw-duration) var(--pw-ease);
}
.pw-drawer-right-enter-active .pw-drawer__panel,
.pw-drawer-right-leave-active .pw-drawer__panel,
.pw-drawer-left-enter-active .pw-drawer__panel,
.pw-drawer-left-leave-active .pw-drawer__panel,
.pw-drawer-bottom-enter-active .pw-drawer__panel,
.pw-drawer-bottom-leave-active .pw-drawer__panel {
  transition: transform var(--pw-duration-slow) var(--pw-ease);
}
.pw-drawer-right-enter-from,
.pw-drawer-right-leave-to,
.pw-drawer-left-enter-from,
.pw-drawer-left-leave-to,
.pw-drawer-bottom-enter-from,
.pw-drawer-bottom-leave-to {
  opacity: 0;
}
.pw-drawer-right-enter-from .pw-drawer__panel,
.pw-drawer-right-leave-to .pw-drawer__panel {
  transform: translateX(100%);
}
.pw-drawer-left-enter-from .pw-drawer__panel,
.pw-drawer-left-leave-to .pw-drawer__panel {
  transform: translateX(-100%);
}
.pw-drawer-bottom-enter-from .pw-drawer__panel,
.pw-drawer-bottom-leave-to .pw-drawer__panel {
  transform: translateY(100%);
}
</style>
