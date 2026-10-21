<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CircleAlert } from '@lucide/vue'
import AuthHeading from '@/components/auth/AuthHeading.vue'
import SocialButtons from '@/components/auth/SocialButtons.vue'
import OrDivider from '@/components/auth/OrDivider.vue'
import AppInput from '@/components/forms/AppInput.vue'
import AppCheckbox from '@/components/forms/AppCheckbox.vue'
import AppButton from '@/components/common/AppButton.vue'
import { useForm } from '@/composables/useForm'
import { useSeo } from '@/composables/useSeo'
import { useAuthStore } from '@/stores/auth.store'
import { email, required } from '@/utils/validators'
import { safeRedirect } from '@/utils/security'

const MockHint = import.meta.env.VITE_API_MODE !== 'live' ? defineAsyncComponent(() => import('@/mocks/MockHint.vue')) : null

/** VA6 — email/password with lockout messaging (5 failures → 15-min lock, warn from attempt 3). */
useSeo({ title: 'Log in', noindex: true })
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const form = useForm(
  { email: typeof route.query.email === 'string' ? route.query.email : '', password: '', remember: true },
  { email: [required('Enter your email address.'), email], password: [required('Enter your password.')] },
)

const banner = computed(() => {
  if (route.query.reason === 'expired' && !form.formError.value && !form.lastError.value) return 'Your session ended. Log in again to continue.'
  const err = form.lastError.value
  if (!err) return null
  if (err.code === 'ACCOUNT_LOCKED' || err.code === 'RATE_LIMITED') return err.message
  return err.isValidation ? err.message : form.formError.value
})
const credentialsInvalid = computed(() => form.lastError.value?.isValidation && !form.submitting.value)

async function submit() {
  form.lastError.value = null
  const result = await form.submit((v) => auth.login({ email: v.email.trim().toLowerCase(), password: v.password, remember: v.remember }))
  if (!result) return
  const next = safeRedirect(route.query.next, auth.isAdmin ? '/admin/overview' : '/')
  if (result.status === 'two_factor_required') {
    await router.push({ name: 'two-step', query: { next } })
    return
  }
  await router.replace(next)
}
</script>

<template>
  <div>
    <AuthHeading title="Welcome back" subtitle="Log in to pick up where you left off." />
    <SocialButtons mode="login" :providers="['google']" />
    <OrDivider />
    <div v-if="banner" class="pw-login__banner" role="alert">
      <CircleAlert :size="20" aria-hidden="true" />
      <span>{{ banner }}</span>
    </div>
    <form class="pw-login__form" novalidate @submit.prevent="submit">
      <AppInput
        v-model="form.values.email"
        label="Email address"
        type="email"
        autocomplete="username"
        inputmode="email"
        size="lg"
        :error="credentialsInvalid ? null : form.fieldError('email')"
        :invalid="credentialsInvalid"
        @blur="form.touch('email')"
      />
      <AppInput
        v-model="form.values.password"
        label="Password"
        type="password"
        autocomplete="current-password"
        size="lg"
        :error="credentialsInvalid ? null : form.fieldError('password')"
        :invalid="credentialsInvalid"
        @blur="form.touch('password')"
      />
      <div class="pw-login__row">
        <AppCheckbox v-model="form.values.remember" label="Keep me signed in for 30 days" />
        <RouterLink :to="{ name: 'forgot-password', query: { email: form.values.email || undefined } }" class="pw-login__forgot">Forgot password?</RouterLink>
      </div>
      <AppButton type="submit" size="lg" block :loading="form.submitting.value">Log in</AppButton>
    </form>
    <MockHint v-if="MockHint" kind="login" />
  </div>
</template>

<style scoped>
.pw-login__banner {
  display: flex;
  gap: var(--pw-space-3);
  align-items: flex-start;
  margin-bottom: var(--pw-space-5);
  padding: var(--pw-space-4);
  border: 1px solid color-mix(in srgb, var(--pw-danger-600) 30%, white);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-danger-100);
  color: var(--pw-danger-700);
  font-size: var(--pw-text-base);
}

.pw-login__banner svg {
  flex: none;
  color: var(--pw-danger-600);
}

.pw-login__form {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-5);
}

.pw-login__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--pw-space-2);
}

.pw-login__forgot {
  font-weight: var(--pw-weight-semibold);
}

</style>
