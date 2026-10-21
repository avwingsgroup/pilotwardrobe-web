<script setup lang="ts">
withDefaults(defineProps<{ width?: string; height?: string; radius?: string; circle?: boolean; lines?: number }>(), {
  width: '100%',
  height: '14px',
  radius: 'var(--pw-radius-sm)',
  lines: 1,
})
</script>

<template>
  <span class="pw-skeleton-group" aria-hidden="true">
    <span
      v-for="n in lines"
      :key="n"
      class="pw-skeleton"
      :style="{
        width: circle ? height : n === lines && lines > 1 ? '60%' : width,
        height,
        borderRadius: circle ? '50%' : radius,
      }"
    />
  </span>
</template>

<style scoped>
.pw-skeleton-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.pw-skeleton {
  display: block;
  background: linear-gradient(90deg, #eceef3 0%, #f6f7fa 40%, #eceef3 80%);
  background-size: 200% 100%;
  animation: pw-shimmer 1.4s ease-in-out infinite;
}

@keyframes pw-shimmer {
  from {
    background-position: 100% 0;
  }
  to {
    background-position: -100% 0;
  }
}
</style>
