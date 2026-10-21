<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'

/** Compact filter dropdown used in admin toolbars ("Country ⌄", "KYC ⌄"). */
defineProps<{ label: string; options: { value: string; label: string }[] }>()
const model = defineModel<string>({ default: '' })
</script>

<template>
  <label class="pw-fsel" :class="{ 'is-set': !!model }">
    <span class="sr-only">{{ label }}</span>
    <select v-model="model">
      <option value="">{{ label }}</option>
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
    <ChevronDown :size="14" aria-hidden="true" />
  </label>
</template>

<style scoped>
.pw-fsel {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.pw-fsel select {
  appearance: none;
  min-height: 36px;
  padding: 0 30px 0 12px;
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-md);
  background: var(--pw-surface);
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-medium);
  cursor: pointer;
}

.pw-fsel.is-set select {
  border-color: var(--pw-navy-700);
  background: var(--pw-navy-50);
  color: var(--pw-navy-700);
}

.pw-fsel svg {
  position: absolute;
  right: 10px;
  pointer-events: none;
  color: var(--pw-muted);
}
</style>
