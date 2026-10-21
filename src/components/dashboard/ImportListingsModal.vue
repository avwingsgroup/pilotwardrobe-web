<script setup lang="ts">
import { ref, watch } from 'vue'
import AppModal from '@/components/common/AppModal.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppFileDrop from '@/components/forms/AppFileDrop.vue'
import { listingService } from '@/api/listings.api'
import { toApiError } from '@/api/errors'
import { useUiStore } from '@/stores/ui.store'

/** CSV import (VB4). Rows become drafts the seller reviews before publishing. */
defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: []; done: [] }>()
const ui = useUiStore()
const file = ref<File | null>(null)
const error = ref<string | null>(null)
const result = ref<{ imported: number; failed: { row: number; error: string }[] } | null>(null)
const uploading = ref(false)

watch(file, () => (error.value = null))

async function upload() {
  if (!file.value) return
  uploading.value = true
  try {
    result.value = await listingService.importCsv(file.value)
    ui.success('Import complete', `${result.value.imported} drafts created.`)
    emit('done')
  } catch (e) {
    const err = toApiError(e)
    error.value = err.field('file') ?? err.message
  } finally {
    uploading.value = false
  }
}

function close() {
  file.value = null
  result.value = null
  emit('close')
}
</script>

<template>
  <AppModal :open="open" title="Import listings from CSV" description="Columns: title, category, condition, price (USD). Each row is saved as a draft." @close="close">
    <div v-if="result" role="status">
      <p><strong>{{ result.imported }}</strong> rows imported as drafts.</p>
      <ul v-if="result.failed.length" class="pw-imp__failed">
        <li v-for="f in result.failed" :key="f.row">Row {{ f.row }}: {{ f.error }}</li>
      </ul>
    </div>
    <template v-else>
      <AppFileDrop label="Choose a CSV file" hint="or drop it here · max 5 MB" accept="text/csv,.csv" :max-bytes="5 * 1024 * 1024" @files="file = $event[0] ?? null" @rejected="error = $event" />
      <p v-if="file" class="pw-imp__file">{{ file.name }}</p>
      <p v-if="error" class="pw-imp__error" role="alert">{{ error }}</p>
    </template>
    <template #footer>
      <AppButton variant="secondary" @click="close">{{ result ? 'Done' : 'Cancel' }}</AppButton>
      <AppButton v-if="!result" :loading="uploading" :disabled="!file" @click="upload">Import</AppButton>
    </template>
  </AppModal>
</template>

<style scoped>
.pw-imp__file {
  margin-top: var(--pw-space-3);
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-medium);
}

.pw-imp__error,
.pw-imp__failed {
  margin-top: var(--pw-space-3);
  color: var(--pw-danger-600);
  font-size: var(--pw-text-sm);
}
</style>
