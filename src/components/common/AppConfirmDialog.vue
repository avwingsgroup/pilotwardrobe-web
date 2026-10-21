<script setup lang="ts">
import AppModal from './AppModal.vue'
import AppButton from './AppButton.vue'

withDefaults(
  defineProps<{
    open: boolean
    title: string
    body?: string
    confirmLabel?: string
    cancelLabel?: string
    tone?: 'danger' | 'primary' | 'success'
    loading?: boolean
  }>(),
  { confirmLabel: 'Confirm', cancelLabel: 'Cancel', tone: 'primary' },
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <AppModal :open="open" :title="title" size="sm" @close="emit('cancel')">
    <p v-if="body" class="pw-confirm__body">{{ body }}</p>
    <slot />
    <template #footer>
      <AppButton variant="secondary" :disabled="loading" @click="emit('cancel')">{{ cancelLabel }}</AppButton>
      <AppButton :variant="tone" :loading="loading" data-autofocus @click="emit('confirm')">{{ confirmLabel }}</AppButton>
    </template>
  </AppModal>
</template>

<style scoped>
.pw-confirm__body {
  color: var(--pw-ink-2);
  line-height: var(--pw-leading-relaxed);
}
</style>
