<script setup lang="ts">
defineProps<{ label?: string }>()
</script>

<template>
  <div class="pw-or" role="separator">
    <span>{{ label ?? 'or' }}</span>
  </div>
</template>

<style scoped>
.pw-or {
  display: flex;
  align-items: center;
  gap: var(--pw-space-4);
  margin: var(--pw-space-5) 0;
  font-size: var(--pw-text-sm);
  color: var(--pw-muted);
}

.pw-or::before,
.pw-or::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--pw-border);
}
</style>
