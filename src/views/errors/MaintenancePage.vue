<script setup lang="ts">
import { TowerControl } from '@lucide/vue'
import SystemPage from '@/components/common/SystemPage.vue'
import AppButton from '@/components/common/AppButton.vue'
</script>

<template>
  <SystemPage :icon="TowerControl" title="Scheduled maintenance" body="Pilotwardrobe is down for upgrades until 03:00 WAT. Orders and escrow are not affected — escrow timers pause automatically.">
    <AppButton variant="secondary" href="https://status.pilotwardrobe.com">Status page</AppButton>
  </SystemPage>
</template>
