<script setup lang="ts">
import { Globe } from '@lucide/vue'
import SystemPage from '@/components/common/SystemPage.vue'
import AppButton from '@/components/common/AppButton.vue'

const retry = () => window.location.reload()
</script>

<template>
  <SystemPage :icon="Globe" tone="warning" title="You're offline" body="We'll reconnect automatically. Drafts and messages are saved on this device.">
    <AppButton variant="secondary" @click="retry">Try again</AppButton>
  </SystemPage>
</template>
