<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { RouterView } from 'vue-router'
import AppToastHost from '@/components/common/AppToastHost.vue'
import OfflineBanner from '@/components/common/OfflineBanner.vue'
import { useUiStore } from '@/stores/ui.store'

const AuthGateModal = defineAsyncComponent(() => import('@/components/auth/AuthGateModal.vue'))

const ui = useUiStore()
</script>

<template>
  <a class="pw-skip-link" href="#main">Skip to main content</a>
  <OfflineBanner />
  <RouterView />
  <AuthGateModal v-if="ui.authGate" />
  <AppToastHost />
</template>
