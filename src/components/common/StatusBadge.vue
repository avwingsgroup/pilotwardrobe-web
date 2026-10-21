<script setup lang="ts">
import type { StatusLabel } from '@/constants/labels'
import AppBadge from './AppBadge.vue'

/** Renders any lifecycle status from the shared label maps (consumer + admin use the same). */
defineProps<{ status: StatusLabel; size?: 'xs' | 'sm' }>()
</script>

<template>
  <AppBadge :tone="status.tone" :size="size">{{ status.label }}</AppBadge>
</template>
