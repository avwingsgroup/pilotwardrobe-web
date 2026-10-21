<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppSpinner from '@/components/common/AppSpinner.vue'
import AppButton from '@/components/common/AppButton.vue'
import { authService } from '@/api/auth.api'
import { toApiError } from '@/api/errors'
import { useAuthStore } from '@/stores/auth.store'
import { safeRedirect } from '@/utils/security'
import { track } from '@/utils/analytics'
import type { SocialProvider } from '@/types/auth'

/**
 * /auth/google/callback — exchanges the provider code with Laravel, then routes:
 *   new account → VA3 finish setup · password account → VA8 link · existing → done (2FA if enabled)
 */
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const error = ref<string | null>(null)

function storedNext() {
  try {
    return sessionStorage.getItem('pw.auth.next')
  } catch {
    return null
  }
}

onMounted(async () => {
  const code = String(route.query.code ?? '')
  const state = String(route.query.state ?? '')
  const provider = (String(route.query.provider ?? 'google') as SocialProvider) || 'google'
  if (!code) {
    error.value = route.query.error === 'access_denied' ? 'Sign-in was cancelled.' : 'Missing authorisation code.'
    return
  }
  try {
    const result = await authService.socialCallback(provider, { code, state })
    const next = safeRedirect(storedNext(), '/')
    if (result.status === 'authenticated' && result.user) {
      auth.setSession(result.user)
      track('login_completed', { method: provider })
      await router.replace(next)
    } else if (result.status === 'new_account') {
      sessionStorage.setItem('pw.social', JSON.stringify(result))
      await router.replace({ name: 'finish-setup', query: { next } })
    } else if (result.status === 'link_required') {
      sessionStorage.setItem('pw.social', JSON.stringify(result))
      await router.replace({ name: 'link-accounts', query: { next } })
    } else if (result.status === 'two_factor_required' && result.challengeId) {
      auth.twoFactor = { challengeId: result.challengeId, methods: ['totp', 'sms', 'backup_code'], remember: true }
      await router.replace({ name: 'two-step', query: { next } })
    }
  } catch (e) {
    error.value = toApiError(e).message
  }
})
</script>

<template>
  <div class="pw-cb" role="status" aria-live="polite">
    <template v-if="!error">
      <AppSpinner :size="28" label="Finishing sign-in" />
      <p>Finishing sign-in with Google…</p>
    </template>
    <template v-else>
      <h1 class="pw-cb__title">We couldn't sign you in</h1>
      <p>{{ error }}</p>
      <AppButton :to="{ name: 'auth' }">Try again</AppButton>
    </template>
  </div>
</template>

<style scoped>
.pw-cb {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--pw-space-4);
  text-align: center;
  color: var(--pw-muted);
}

.pw-cb__title {
  font-size: var(--pw-text-xl);
  color: var(--pw-ink);
}
</style>
