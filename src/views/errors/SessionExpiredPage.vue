<script setup lang="ts">
import { useRoute } from 'vue-router'
import { Clock } from '@lucide/vue'
import SystemPage from '@/components/common/SystemPage.vue'
import AppButton from '@/components/common/AppButton.vue'
import { safeRedirect } from '@/utils/security'

/** 419 — CSRF token / session expired (Sanctum). */
const route = useRoute()
const next = safeRedirect(route.query.next, '/')
</script>

<template>
  <SystemPage :icon="Clock" tone="warning" title="Your session expired" body="For your security we signed you out after a period of inactivity. Log in again to pick up where you left off.">
    <AppButton :to="{ name: 'login', query: { next } }">Log in again</AppButton>
  </SystemPage>
</template>
