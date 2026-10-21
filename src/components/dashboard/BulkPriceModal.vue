<script setup lang="ts">
import { ref, watch } from 'vue'
import AppModal from '@/components/common/AppModal.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppChoiceChips from '@/components/forms/AppChoiceChips.vue'
import { listingService } from '@/api/listings.api'
import { toApiError } from '@/api/errors'
import { useUiStore } from '@/stores/ui.store'

/** Bulk price adjustment (VB4 bulk bar "Edit price") — percent change applied server-side. */
const props = defineProps<{ open: boolean; ids: string[] }>()
const emit = defineEmits<{ close: []; done: [] }>()
const ui = useUiStore()
const adjust = ref<'-15' | '-10' | '-5' | '5' | '10' | null>('-5')
const saving = ref(false)

const options = [
  { value: '-15' as const, label: '−15%' },
  { value: '-10' as const, label: '−10%' },
  { value: '-5' as const, label: '−5%' },
  { value: '5' as const, label: '+5%' },
  { value: '10' as const, label: '+10%' },
]

watch(
  () => props.open,
  (open) => {
    if (open) adjust.value = '-5'
  },
)

async function save() {
  if (!adjust.value) return
  saving.value = true
  try {
    const res = await listingService.bulk(props.ids, 'edit_price', { adjustPercent: Number(adjust.value) })
    ui.success('Prices updated', `${res.updated} listing${res.updated === 1 ? '' : 's'} repriced by ${adjust.value}%.`)
    emit('done')
    emit('close')
  } catch (e) {
    ui.error("Couldn't update prices", toApiError(e).message)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <AppModal :open="open" :title="`Edit price · ${ids.length} selected`" size="sm" @close="emit('close')">
    <AppChoiceChips v-model="adjust" legend="Adjust price by" :options="options" />
    <p class="pw-muted pw-bp__note">Buyers watching these items get a price-drop alert for reductions. Accepted offers are not affected.</p>
    <template #footer>
      <AppButton variant="secondary" @click="emit('close')">Cancel</AppButton>
      <AppButton :loading="saving" :disabled="!adjust" @click="save">Apply</AppButton>
    </template>
  </AppModal>
</template>

<style scoped>
.pw-bp__note {
  margin-top: var(--pw-space-4);
  font-size: var(--pw-text-sm);
}
</style>
