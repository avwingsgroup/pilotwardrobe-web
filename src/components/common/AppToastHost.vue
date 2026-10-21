<script setup lang="ts">
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from '@lucide/vue'
import { useUiStore } from '@/stores/ui.store'

const ui = useUiStore()
const icons = { success: CircleCheck, error: CircleAlert, info: Info, warning: TriangleAlert }
</script>

<template>
  <!-- Polite live region so screen readers announce status changes. -->
  <div class="pw-toasts" aria-live="polite" aria-atomic="false">
    <TransitionGroup name="pw-toast">
      <div v-for="t in ui.toasts" :key="t.id" class="pw-toast" :class="`pw-toast--${t.tone}`" :role="t.tone === 'error' ? 'alert' : 'status'">
        <component :is="icons[t.tone]" class="pw-toast__icon" :size="18" aria-hidden="true" />
        <div class="pw-toast__text">
          <p class="pw-toast__title">{{ t.title }}</p>
          <p v-if="t.body" class="pw-toast__body">{{ t.body }}</p>
        </div>
        <button type="button" class="pw-toast__close" aria-label="Dismiss notification" @click="ui.dismiss(t.id)">
          <X :size="16" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.pw-toasts {
  position: fixed;
  z-index: var(--pw-z-toast);
  right: var(--pw-space-4);
  bottom: calc(var(--pw-space-4) + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-2);
  width: min(380px, calc(100vw - 32px));
  pointer-events: none;
}

.pw-toast {
  display: flex;
  gap: var(--pw-space-3);
  align-items: flex-start;
  padding: var(--pw-space-3) var(--pw-space-4);
  background: var(--pw-navy-900);
  color: #fff;
  border-radius: var(--pw-radius-lg);
  box-shadow: var(--pw-shadow-lg);
  pointer-events: auto;
}

.pw-toast__icon {
  flex: none;
  margin-top: 1px;
}
.pw-toast--success .pw-toast__icon {
  color: #7fd3a6;
}
.pw-toast--error .pw-toast__icon {
  color: #ff9d94;
}
.pw-toast--warning .pw-toast__icon {
  color: var(--pw-gold-400);
}

.pw-toast__text {
  flex: 1;
  min-width: 0;
}

.pw-toast__title {
  font-weight: var(--pw-weight-semibold);
  font-size: var(--pw-text-sm);
}

.pw-toast__body {
  font-size: var(--pw-text-xs);
  color: rgb(255 255 255 / 78%);
  margin-top: 2px;
}

.pw-toast__close {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  margin: -4px -8px 0 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: rgb(255 255 255 / 70%);
}

.pw-toast-enter-active,
.pw-toast-leave-active {
  transition: all var(--pw-duration) var(--pw-ease);
}
.pw-toast-enter-from,
.pw-toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 479px) {
  .pw-toasts {
    left: var(--pw-space-4);
    right: var(--pw-space-4);
    width: auto;
  }
}
</style>
