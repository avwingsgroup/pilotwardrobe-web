<script setup lang="ts">
import { computed } from 'vue'
import { CloudOff, Lock, SearchX, ServerCrash, ShieldAlert, Wrench } from '@lucide/vue'
import type { ApiError } from '@/api/errors'
import AppEmptyState from './AppEmptyState.vue'
import AppButton from './AppButton.vue'

/**
 * Maps an ApiError onto the right system state (VB20): offline, unauthorized,
 * forbidden, not found, server unavailable, generic error — with retry.
 */
const props = defineProps<{ error: ApiError | null; compact?: boolean; notFoundTitle?: string }>()
const emit = defineEmits<{ retry: [] }>()

const view = computed(() => {
  const e = props.error
  if (!e) return null
  if (e.isNetwork) return { icon: CloudOff, tone: 'warning' as const, title: "You're offline", body: e.message, retry: true }
  if (e.status === 401) return { icon: Lock, tone: 'navy' as const, title: 'Please log in', body: 'Log in to see this page.', retry: false, login: true }
  if (e.status === 403 && e.code === 'KYC_REQUIRED') return { icon: ShieldAlert, tone: 'danger' as const, title: 'Verification required', body: e.message, retry: false, kyc: true }
  if (e.status === 403) return { icon: ShieldAlert, tone: 'danger' as const, title: 'Access denied', body: e.message, retry: false }
  if (e.status === 404) return { icon: SearchX, tone: 'navy' as const, title: props.notFoundTitle ?? 'Not found', body: e.message, retry: false }
  if (e.status === 503) return { icon: Wrench, tone: 'navy' as const, title: 'Scheduled maintenance', body: e.message, retry: true }
  return { icon: ServerCrash, tone: 'danger' as const, title: "We couldn't load this", body: e.message, retry: true }
})
</script>

<template>
  <AppEmptyState v-if="view" :icon="view.icon" :tone="view.tone" :title="view.title" :body="view.body" :compact="compact">
    <AppButton v-if="view.retry" variant="secondary" size="sm" @click="emit('retry')">Try again</AppButton>
    <AppButton v-if="'login' in view" size="sm" :to="{ name: 'login', query: { next: $route.fullPath } }">Log in</AppButton>
    <AppButton v-if="'kyc' in view" size="sm" :to="{ name: 'hangar-verification' }">Verify now</AppButton>
    <p v-if="error?.requestId" class="pw-error-ref">Reference: <span class="pw-mono">{{ error.requestId.slice(0, 8) }}</span></p>
  </AppEmptyState>
</template>

<style scoped>
.pw-error-ref {
  width: 100%;
  font-size: var(--pw-text-xs);
  color: var(--pw-subtle);
}
</style>
