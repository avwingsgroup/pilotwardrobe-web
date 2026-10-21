<script setup lang="ts">
import { computed, ref, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Mail } from '@lucide/vue'
import AuthHeading from '@/components/auth/AuthHeading.vue'
import AppOtpInput from '@/components/forms/AppOtpInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import { useCountdown } from '@/composables/useCountdown'
import { useSeo } from '@/composables/useSeo'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { authService } from '@/api/auth.api'
import { toApiError } from '@/api/errors'
import { safeRedirect } from '@/utils/security'

const MockHint = import.meta.env.VITE_API_MODE !== 'live' ? defineAsyncComponent(() => import('@/mocks/MockHint.vue')) : null

/** VA5 — 4-digit OTP, 10-min expiry, paste fills all boxes, auto-submit, 60s resend cooldown. */
useSeo({ title: 'Check your email', noindex: true })
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()
const code = ref('')
const error = ref<string | null>(null)
const submitting = ref(false)
const resend = useCountdown(34)
const email = computed(() => auth.pendingEmail ?? auth.user?.email ?? '')

async function verify() {
  if (code.value.length !== 4) {
    error.value = 'Enter the 4-digit code.'
    return
  }
  submitting.value = true
  error.value = null
  try {
    await auth.verifyEmail(code.value)
    await router.replace({ name: 'account-ready', query: { next: safeRedirect(route.query.next, '') || undefined } })
  } catch (e) {
    const err = toApiError(e)
    error.value = err.field('code') ?? err.message
    code.value = ''
  } finally {
    submitting.value = false
  }
}

async function resendCode() {
  try {
    const { resendAvailableIn } = await authService.resendVerification(email.value)
    resend.start(resendAvailableIn)
    ui.success('A new code is on its way', `Sent to ${email.value}`)
  } catch (e) {
    ui.error("Couldn't resend the code", toApiError(e).message)
  }
}
</script>

<template>
  <div>
    <AuthHeading title="Check your email" :icon="Mail" :back="{ label: 'Back', to: { name: 'signup', query: { email } } }">
      We sent a 4-digit code to <strong>{{ email || 'your email' }}</strong>. It expires in 10 minutes.
    </AuthHeading>
    <form novalidate @submit.prevent="verify">
      <AppOtpInput v-model="code" :length="4" label="Verification code" :error="error" autofocus @complete="verify" />
      <div class="pw-verify__row">
        <span>Paste works too — we'll fill every box.</span>
        <span v-if="resend.active.value">Resend in <strong class="pw-mono">{{ resend.label.value }}</strong></span>
        <button v-else type="button" class="pw-link-btn" @click="resendCode">Resend code</button>
      </div>
      <AppButton type="submit" size="lg" block :loading="submitting">Verify email</AppButton>
    </form>
    <p class="pw-verify__alt">Wrong address? <RouterLink :to="{ name: 'signup', query: { email } }">Change email</RouterLink></p>
    <MockHint v-if="MockHint" kind="otp" />
  </div>
</template>

<style scoped>
.pw-verify__row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--pw-space-2);
  margin: var(--pw-space-5) 0;
  font-size: var(--pw-text-sm);
  color: var(--pw-muted);
}

.pw-verify__row strong {
  color: var(--pw-ink);
}

.pw-verify__alt {
  margin-top: var(--pw-space-6);
  text-align: center;
  color: var(--pw-muted);
}

.pw-verify__alt a {
  font-weight: var(--pw-weight-semibold);
}

</style>
