<script setup lang="ts">
import { Globe } from '@lucide/vue'
import { useUiStore } from '@/stores/ui.store'

const ui = useUiStore()
</script>

<template>
  <Transition name="pw-fade">
    <div v-if="!ui.online" class="pw-offline" role="status">
      <Globe :size="16" aria-hidden="true" />
      <span><strong>You're offline.</strong> We'll reconnect automatically — drafts and messages are saved on this device.</span>
    </div>
  </Transition>
</template>

<style scoped>
.pw-offline {
  position: sticky;
  top: 0;
  z-index: calc(var(--pw-z-header) + 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--pw-space-2);
  padding: var(--pw-space-2) var(--pw-space-4);
  background: var(--pw-warning-100);
  color: var(--pw-warning-700);
  font-size: var(--pw-text-sm);
  text-align: center;
}

.pw-fade-enter-active,
.pw-fade-leave-active {
  transition: opacity var(--pw-duration) var(--pw-ease);
}
.pw-fade-enter-from,
.pw-fade-leave-to {
  opacity: 0;
}
</style>
