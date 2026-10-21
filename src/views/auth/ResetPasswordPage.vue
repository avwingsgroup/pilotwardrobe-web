<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Clock } from '@lucide/vue'
import AuthHeading from '@/components/auth/AuthHeading.vue'
import AppInput from '@/components/forms/AppInput.vue'
import AppCheckbox from '@/components/forms/AppCheckbox.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import PasswordStrength from '@/components/forms/PasswordStrength.vue'
import { useForm } from '@/composables/useForm'
import { useSeo } from '@/composables/useSeo'
import { useUiStore } from '@/stores/ui.store'
import { authService } from '@/api/auth.api'
import { password, required, sameAs } from '@/utils/validators'

/** VA11 new password (logs out other devices) · VA12 link expired/used. Tokens: single-use, 30 min. */
useSeo({ title: 'Create a new password', noindex: true })
const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const token = String(route.query.token ?? '')
const status = ref<'checking' | 'valid' | 'expired'>('checking')
const email = ref(String(route.query.email ?? ''))

const form = useForm(
  { password: '', passwordConfirmation: '', logoutOtherDevices: true },
  { password: [required('Create a password.'), password], passwordConfirmation: [required('Re-enter your password.'), sameAs((): string => form.values.password)] },
)
const mismatch = computed(() => !!form.values.passwordConfirmation && form.values.passwordConfirmation !== form.values.password)

onMounted(async () => {
  if (!token) {
    status.value = 'expired'
    return
  }
  try {
    const result = await authService.checkResetToken(token, email.value)
    status.value = result.valid ? 'valid' : 'expired'
    if (result.email) email.value = result.email
  } catch {
    status.value = 'expired'
  }
})

async function submit() {
  const result = await form.submit((v) => authService.resetPassword({ token, email: email.value, ...v }))
  if (result) {
    ui.success('Password updated', 'Log in with your new password.')
    await router.replace({ name: 'login', query: { email: email.value } })
  } else if (form.lastError.value?.code === 'TOKEN_EXPIRED') {
    status.value = 'expired'
  }
}
</script>

<template>
  <div v-if="status === 'checking'" aria-busy="true">
    <AppSkeleton height="36px" width="70%" />
    <AppSkeleton :lines="3" height="44px" style="margin-top: 24px" />
  </div>

  <div v-else-if="status === 'expired'">
    <AuthHeading title="This link has expired" :icon="Clock" icon-tone="gold" subtitle="Reset links work once and expire after 30 minutes. Request a new one and use the latest email we send." />
    <AppButton size="lg" block :to="{ name: 'forgot-password', query: { email: email || undefined } }">Send a new link</AppButton>
    <hr />
    <RouterLink :to="{ name: 'login' }">← Back to log in</RouterLink>
  </div>

  <div v-else>
    <AuthHeading title="Create a new password">
      For <strong>{{ email }}</strong>. You'll be logged out on other devices.
    </AuthHeading>
    <form class="pw-reset" novalidate @submit.prevent="submit">
      <div>
        <AppInput v-model="form.values.password" label="New password" type="password" autocomplete="new-password" size="lg" :error="form.submitted.value ? form.fieldError('password') : null" />
        <PasswordStrength :password="form.values.password" />
      </div>
      <AppInput
        v-model="form.values.passwordConfirmation"
        label="Confirm new password"
        type="password"
        autocomplete="new-password"
        size="lg"
        :error="mismatch ? 'Passwords don\'t match' : form.fieldError('passwordConfirmation')"
      />
      <AppCheckbox v-model="form.values.logoutOtherDevices" label="Log me out of all other devices" />
      <p v-if="form.formError.value" class="pw-reset__error" role="alert">{{ form.formError.value }}</p>
      <AppButton type="submit" size="lg" block :disabled="!form.isValid.value" :loading="form.submitting.value">Update password</AppButton>
    </form>
  </div>
</template>

<style scoped>
.pw-reset {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-5);
}

.pw-reset__error {
  color: var(--pw-danger-600);
  font-size: var(--pw-text-sm);
}
</style>
