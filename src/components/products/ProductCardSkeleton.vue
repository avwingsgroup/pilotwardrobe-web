<script setup lang="ts">
import AppSkeleton from '@/components/common/AppSkeleton.vue'

defineProps<{ variant?: 'full' | 'compact' }>()
</script>

<template>
  <div class="pw-card-skel" aria-hidden="true">
    <div class="pw-card-skel__img" :style="{ aspectRatio: variant === 'compact' ? '1 / 1' : '16 / 10.5' }" />
    <div class="pw-card-skel__body">
      <AppSkeleton :lines="2" height="12px" />
      <AppSkeleton width="45%" height="20px" />
      <AppSkeleton v-if="variant !== 'compact'" width="60%" height="10px" />
    </div>
  </div>
</template>

<style scoped>
.pw-card-skel {
  overflow: hidden;
  background: var(--pw-surface);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
}

.pw-card-skel__img {
  background: linear-gradient(90deg, #eceef3 0%, #f6f7fa 40%, #eceef3 80%);
  background-size: 200% 100%;
  animation: pw-shimmer 1.4s ease-in-out infinite;
}

.pw-card-skel__body {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-3);
  padding: var(--pw-space-4);
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
