<script setup lang="ts">
import { Download, Search } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'

/** Admin table toolbar: search + filter slot + export trigger. */
defineProps<{ placeholder: string; exportable?: boolean; exporting?: boolean }>()
const search = defineModel<string>('search', { default: '' })
const emit = defineEmits<{ export: [] }>()
</script>

<template>
  <div class="pw-tt">
    <label class="pw-tt__search">
      <Search :size="15" aria-hidden="true" />
      <span class="sr-only">{{ placeholder }}</span>
      <input v-model="search" type="search" :placeholder="placeholder" />
    </label>
    <div class="pw-tt__filters"><slot /></div>
    <AppButton v-if="exportable" variant="secondary" size="sm" :loading="exporting" class="pw-tt__export" @click="emit('export')"><template #icon><Download :size="14" /></template>Export CSV</AppButton>
  </div>
</template>

<style scoped>
.pw-tt {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--pw-space-2);
  margin-bottom: var(--pw-space-4);
}

.pw-tt__search {
  display: flex;
  align-items: center;
  gap: var(--pw-space-2);
  flex: 1 1 220px;
  max-width: 300px;
  min-height: 36px;
  padding: 0 var(--pw-space-3);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-md);
  background: var(--pw-surface);
  color: var(--pw-muted);
}

.pw-tt__search:focus-within {
  border-color: var(--pw-navy-700);
}

.pw-tt__search input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: none;
  font-size: var(--pw-text-sm);
}

.pw-tt__filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pw-space-2);
}

.pw-tt__export {
  margin-left: auto;
}
</style>
