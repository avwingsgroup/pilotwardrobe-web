<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ShieldAlert } from '@lucide/vue'
import SystemPage from '@/components/common/SystemPage.vue'
import AppButton from '@/components/common/AppButton.vue'
import { useAuthStore } from '@/stores/auth.store'

const route = useRoute()
const auth = useAuthStore()
const suspended = computed(() => route.query.reason === 'suspended')
</script>

<template>
  <SystemPage
    :icon="ShieldAlert"
    tone="danger"
    :title="suspended ? 'Your account is suspended' : 'Access denied'"
    :body="suspended ? 'Our Trust & Safety team restricted this account. Contact support if you think this is a mistake.' : `You don't have permission to view this page${auth.isAuthenticated ? ' with your current role' : ''}. If you need access, ask an administrator.`"
  >
    <AppButton :to="auth.isAdmin ? { name: 'admin-overview' } : { name: 'home' }">{{ auth.isAdmin ? 'Back to Control Tower' : 'Back to home' }}</AppButton>
    <AppButton variant="secondary" :to="{ name: 'contact' }">Contact support</AppButton>
  </SystemPage>
</template>
