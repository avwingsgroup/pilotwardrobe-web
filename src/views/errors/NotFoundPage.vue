<script setup lang="ts">
import { Send } from '@lucide/vue'
import SystemPage from '@/components/common/SystemPage.vue'
import AppButton from '@/components/common/AppButton.vue'
</script>

<template>
  <SystemPage :icon="Send" title="404 · Off the flight plan" body="This page has been moved or never existed. Check the link or head back to the marketplace.">
    <AppButton :to="{ name: 'marketplace' }">Back to marketplace</AppButton>
  </SystemPage>
</template>
