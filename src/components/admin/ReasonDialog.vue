<script setup lang="ts">
import { ref, watch } from 'vue'
import AppModal from '@/components/common/AppModal.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppTextarea from '@/components/forms/AppTextarea.vue'

/** Every privileged write needs a reason that's written to the audit log. */
const props = withDefaults(defineProps<{ open: boolean; title: string; body?: string; confirmLabel?: string; tone?: 'danger' | 'primary'; loading?: boolean }>(), {
  confirmLabel: 'Confirm',
  tone: 'danger',
})
const emit = defineEmits<{ confirm: [reason: string]; cancel: [] }>()
const reason = ref('')
const error = ref<string | null>(null)

watch(
  () => props.open,
  (o) => {
    if (o) {
      reason.value = ''
      error.value = null
    }
  },
)

function submit() {
  if (reason.value.trim().length < 5) {
    error.value = 'Give a short reason (5+ characters). It is written to the audit log.'
    return
  }
  emit('confirm', reason.value.trim())
}
</script>

<template>
  <AppModal :open="open" :title="title" :description="body" size="sm" @close="emit('cancel')">
    <AppTextarea v-model="reason" label="Reason" :rows="3" :maxlength="500" :error="error" data-autofocus />
    <template #footer>
      <AppButton variant="secondary" :disabled="loading" @click="emit('cancel')">Cancel</AppButton>
      <AppButton :variant="tone" :loading="loading" @click="submit">{{ confirmLabel }}</AppButton>
    </template>
  </AppModal>
</template>
