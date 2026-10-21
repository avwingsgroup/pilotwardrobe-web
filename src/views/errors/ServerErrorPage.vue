<script setup lang="ts">
import { ServerCrash } from '@lucide/vue'
import SystemPage from '@/components/common/SystemPage.vue'
import AppButton from '@/components/common/AppButton.vue'

const retry = () => window.history.length > 1 ? window.history.back() : window.location.assign('/')
</script>

<template>
  <SystemPage :icon="ServerCrash" tone="danger" title="Something went wrong" body="We hit turbulence on our side. Your orders and escrow are safe — please try again in a moment.">
    <AppButton @click="retry">Try again</AppButton>
    <AppButton variant="secondary" :to="{ name: 'home' }">Back to home</AppButton>
  </SystemPage>
</template>
