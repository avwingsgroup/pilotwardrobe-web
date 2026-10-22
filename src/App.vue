<script setup lang="ts">
import { defineAsyncComponent, ref, watch } from 'vue'
import { RouterView } from 'vue-router'
import AppToastHost from '@/components/common/AppToastHost.vue'
import OfflineBanner from '@/components/common/OfflineBanner.vue'
import CookieBanner from '@/components/consent/CookieBanner.vue'
import { useUiStore } from '@/stores/ui.store'
import { useCookieConsent } from '@/composables/useCookieConsent'

const AuthGateModal = defineAsyncComponent(() => import('@/components/auth/AuthGateModal.vue'))
const CookiePreferencesModal = defineAsyncComponent(() => import('@/components/consent/CookiePreferencesModal.vue'))

const ui = useUiStore()
const consent = useCookieConsent()
// Load the preferences dialog on first use, then keep it mounted so it can animate out and restore focus.
const prefsLoaded = ref(false)
watch(consent.preferencesOpen, (open) => open && (prefsLoaded.value = true), { immediate: true })
</script>

<template>
  <a class="pw-skip-link" href="#main">Skip to main content</a>
  <OfflineBanner />
  <RouterView />
  <AuthGateModal v-if="ui.authGate" />
  <CookieBanner />
  <CookiePreferencesModal v-if="prefsLoaded" />
  <AppToastHost />
</template>
