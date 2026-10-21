<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Smartphone } from '@lucide/vue'
import AuthHeading from '@/components/auth/AuthHeading.vue'
import AppOtpInput from '@/components/forms/AppOtpInput.vue'
import AppInput from '@/components/forms/AppInput.vue'
import AppCheckbox from '@/components/forms/AppCheckbox.vue'
import AppButton from '@/components/common/AppButton.vue'
import { useSeo } from '@/composables/useSeo'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { authService } from '@/api/auth.api'
import { toApiError } from '@/api/errors'
import { safeRedirect } from '@/utils/security'

/** VA7 — TOTP (6 digits, ±1 step tolerance server-side), SMS fallback, backup code. */
useSeo({ title: 'Two-step verification', noindex: true })
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()
const method = ref<'totp' | 'sms' | 'backup_code'>('totp')
const code = ref('')
const trust = ref(true)
const error = ref<string | null>(null)
const submitting = ref(false)

onMounted(() => {
  if (!auth.twoFactor) void router.replace({ name: 'login', query: route.query })
})

async function verify() {
  submitting.value = true
  error.value = null
  try {
    await auth.completeTwoFactor({ code: code.value.trim(), method: method.value, trustDevice: trust.value })
    await router.replace(safeRedirect(route.query.next, '/'))
  } catch (e) {
    const err = toApiError(e)
    if (err.code === 'SESSION_EXPIRED') {
      ui.error('Sign-in expired', err.message)
      await router.replace({ name: 'login' })
      return
    }
    error.value = err.field('code') ?? err.message
    code.value = ''
  } finally {
    submitting.value = false
  }
}

async function useSms() {
  if (!auth.twoFactor) return
  try {
    const { sentTo } = await authService.sendTwoFactorSms(auth.twoFactor.challengeId)
    method.value = 'sms'
    code.value = ''
    ui.info('Code sent', `We texted a code to ${sentTo}.`)
  } catch (e) {
    ui.error("Couldn't send SMS", toApiError(e).message)
  }
}
</script>

<template>
  <div>
    <AuthHeading
      title="Two-step verification"
      :icon="Smartphone"
      :back="{ label: 'Back to log in', to: { name: 'login' } }"
      :subtitle="method === 'backup_code' ? 'Enter one of your saved backup codes.' : method === 'sms' ? 'Enter the 6-digit code we texted you.' : 'Enter the 6-digit code from your authenticator app. Required on new devices and before payouts.'"
    />
    <form novalidate @submit.prevent="verify">
      <AppOtpInput v-if="method !== 'backup_code'" v-model="code" :length="6" label="Authentication code" :error="error" autofocus @complete="verify" />
      <AppInput v-else v-model="code" label="Backup code" placeholder="XXXX-XXXX" autocomplete="one-time-code" size="lg" :error="error" />
      <AppCheckbox v-model="trust" label="Trust this browser for 30 days" class="pw-2fa__trust" />
      <AppButton type="submit" size="lg" block :loading="submitting">Verify and log in</AppButton>
    </form>
    <hr />
    <div class="pw-2fa__alts">
      <button v-if="method !== 'sms'" type="button" class="pw-link-btn" @click="useSms">Send a code by SMS to {{ auth.twoFactor?.smsHint ?? 'your phone' }} instead</button>
      <button v-if="method !== 'totp'" type="button" class="pw-link-btn" @click="method = 'totp'">Use authenticator app</button>
      <button v-if="method !== 'backup_code'" type="button" class="pw-link-btn" @click="method = 'backup_code'">Use a backup code</button>
    </div>
  </div>
</template>

<style scoped>
.pw-2fa__trust {
  margin: var(--pw-space-4) 0 var(--pw-space-5);
}

.pw-2fa__alts {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--pw-space-2);
  font-size: var(--pw-text-sm);
}
</style>
