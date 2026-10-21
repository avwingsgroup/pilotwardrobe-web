<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { Info, Mail } from '@lucide/vue'
import AuthHeading from '@/components/auth/AuthHeading.vue'
import AppInput from '@/components/forms/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import { useForm } from '@/composables/useForm'
import { useCountdown } from '@/composables/useCountdown'
import { useSeo } from '@/composables/useSeo'
import { authService } from '@/api/auth.api'
import { email, required } from '@/utils/validators'

/**
 * VA9 → VA10. Copy is deliberately generic: never confirm whether an email exists.
 */
useSeo({ title: 'Reset your password', noindex: true })
const route = useRoute()
const sentTo = ref<string | null>(null)
const resend = useCountdown()

const form = useForm({ email: typeof route.query.email === 'string' ? route.query.email : '' }, { email: [required('Enter your email address.'), email] })

async function submit() {
  const result = await form.submit((v) => authService.forgotPassword({ email: v.email.trim().toLowerCase() }))
  if (result) {
    sentTo.value = form.values.email.trim().toLowerCase()
    resend.start(result.resendAvailableIn || 60)
  }
}
</script>

<template>
  <div v-if="!sentTo">
    <AuthHeading title="Reset your password" subtitle="Enter the email on your account and we'll send a reset link. It's valid for 30 minutes." :back="{ label: 'Back to log in', to: { name: 'login' } }" />
    <form class="pw-forgot" novalidate @submit.prevent="submit">
      <AppInput v-model="form.values.email" label="Email address" type="email" autocomplete="email" size="lg" :error="form.fieldError('email')" @blur="form.touch('email')" />
      <p v-if="form.formError.value" class="pw-forgot__error" role="alert">{{ form.formError.value }}</p>
      <AppButton type="submit" size="lg" block :loading="form.submitting.value">Send reset link</AppButton>
      <p class="pw-forgot__note">
        <Info :size="16" aria-hidden="true" />
        <span>Signed up with Google? You don't have a password — use <RouterLink :to="{ name: 'login' }">Log in with Google</RouterLink> instead.</span>
      </p>
    </form>
  </div>
  <div v-else>
    <AuthHeading title="Check your inbox" :icon="Mail" icon-tone="green">
      If an account exists for <strong>{{ sentTo }}</strong>, a reset link is on its way. Look in spam if it hasn't landed in 2 minutes.
    </AuthHeading>
    <div class="pw-forgot__mail">
      <AppButton variant="secondary" href="https://mail.google.com" target="_blank">Open Gmail</AppButton>
      <AppButton variant="secondary" href="https://outlook.live.com" target="_blank">Open Outlook</AppButton>
    </div>
    <p class="pw-forgot__resend">
      Didn't get it?
      <span v-if="resend.active.value" class="pw-muted">Resend in {{ resend.label.value }}</span>
      <button v-else type="button" class="pw-link-btn" @click="submit">Resend link</button>
    </p>
    <hr />
    <RouterLink :to="{ name: 'login' }" class="pw-forgot__back">← Back to log in</RouterLink>
  </div>
</template>

<style scoped>
.pw-forgot {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-5);
}

.pw-forgot__error {
  color: var(--pw-danger-600);
  font-size: var(--pw-text-sm);
}

.pw-forgot__note {
  display: flex;
  gap: var(--pw-space-2);
  padding: var(--pw-space-3) var(--pw-space-4);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-navy-100);
  font-size: var(--pw-text-sm);
  color: var(--pw-ink-2);
}

.pw-forgot__note svg {
  flex: none;
  margin-top: 2px;
  color: var(--pw-navy-700);
}

.pw-forgot__mail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--pw-space-3);
}

.pw-forgot__resend {
  margin-top: var(--pw-space-5);
  font-size: var(--pw-text-sm);
  color: var(--pw-muted);
}

.pw-forgot__back {
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-semibold);
}
</style>
