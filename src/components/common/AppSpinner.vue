<script setup lang="ts">
withDefaults(defineProps<{ size?: number; label?: string }>(), { size: 20 })
</script>

<template>
  <span class="pw-spinner" role="status" :style="{ width: `${size}px`, height: `${size}px` }">
    <span class="sr-only">{{ label ?? 'Loading' }}</span>
  </span>
</template>

<style scoped>
.pw-spinner {
  display: inline-block;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: pw-spin 0.7s linear infinite;
  opacity: 0.8;
}

@keyframes pw-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
