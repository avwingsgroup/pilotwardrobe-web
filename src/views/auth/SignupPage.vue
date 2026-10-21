<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthHeading from '@/components/auth/AuthHeading.vue'
import AppInput from '@/components/forms/AppInput.vue'
import AppCheckbox from '@/components/forms/AppCheckbox.vue'
import AppButton from '@/components/common/AppButton.vue'
import PasswordStrength from '@/components/forms/PasswordStrength.vue'
import { useForm } from '@/composables/useForm'
import { useSeo } from '@/composables/useSeo'
import { useAuthStore } from '@/stores/auth.store'
import { email, password, required, sameAs } from '@/utils/validators'
import { safeRedirect } from '@/utils/security'

/** VA4 — create account. CTA enables only once passwords match + rules pass. */
useSeo({ title: 'Create your account', noindex: true })
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const editingEmail = ref(!route.query.email)

const form = useForm(
  {
    firstName: '',
    lastName: '',
    email: typeof route.query.email === 'string' ? route.query.email : '',
    password: '',
    passwordConfirmation: '',
    termsAccepted: false,
  },
  {
    firstName: [required('Enter your first name.')],
    lastName: [required('Enter your last name.')],
    email: [required('Enter your email address.'), email],
    password: [required('Create a password.'), password],
    passwordConfirmation: [required('Re-enter your password.'), sameAs((): string => form.values.password)],
    termsAccepted: [required('Please accept the Terms of Service and Privacy Policy.')],
  },
)

const canSubmit = computed(() => form.isValid.value)

async function submit() {
  const result = await form.submit((v) =>
    auth.register({
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      email: v.email.trim().toLowerCase(),
      password: v.password,
      passwordConfirmation: v.passwordConfirmation,
      countryCode: 'NG',
      accountType: 'user',
      termsAccepted: v.termsAccepted,
    }),
  )
  if (result) await router.push({ name: 'verify-email', query: { next: safeRedirect(route.query.next, '') || undefined } })
}
</script>

<template>
  <div>
    <AuthHeading title="Create your account" :back="{ label: 'Use a different method', to: { name: 'auth', query: { next: route.query.next } } }" />
    <form class="pw-signup" novalidate @submit.prevent="submit">
      <div class="pw-signup__names">
        <AppInput v-model="form.values.firstName" label="First name" autocomplete="given-name" size="lg" :error="form.fieldError('firstName')" @blur="form.touch('firstName')" />
        <AppInput v-model="form.values.lastName" label="Last name" autocomplete="family-name" size="lg" :error="form.fieldError('lastName')" @blur="form.touch('lastName')" />
      </div>
      <AppInput
        v-model="form.values.email"
        label="Email address"
        type="email"
        autocomplete="email"
        size="lg"
        :readonly="!editingEmail"
        :error="form.fieldError('email')"
        @blur="form.touch('email')"
      >
        <template v-if="!editingEmail" #trailing>
          <button type="button" class="pw-link-btn" @click="editingEmail = true">Change</button>
        </template>
      </AppInput>
      <div>
        <AppInput
          v-model="form.values.password"
          label="Password"
          type="password"
          autocomplete="new-password"
          size="lg"
          aria-describedby="pw-strength"
          :error="form.submitted.value ? form.fieldError('password') : null"
        />
        <PasswordStrength id="pw-strength" :password="form.values.password" />
      </div>
      <AppInput
        v-model="form.values.passwordConfirmation"
        label="Confirm password"
        type="password"
        autocomplete="new-password"
        placeholder="Re-enter password"
        size="lg"
        :valid="!!form.values.passwordConfirmation && form.values.passwordConfirmation === form.values.password"
        :error="form.values.passwordConfirmation ? form.fieldError('passwordConfirmation') ?? (form.values.passwordConfirmation !== form.values.password ? 'Passwords don\'t match' : null) : form.fieldError('passwordConfirmation')"
        @blur="form.touch('passwordConfirmation')"
      />
      <AppCheckbox v-model="form.values.termsAccepted" :error="form.fieldError('termsAccepted')">
        I agree to the <RouterLink to="/terms" target="_blank">Terms of Service</RouterLink> and <RouterLink to="/privacy" target="_blank">Privacy Policy</RouterLink>
      </AppCheckbox>
      <p v-if="form.formError.value" class="pw-signup__error" role="alert">{{ form.formError.value }}</p>
      <AppButton type="submit" size="lg" block :disabled="!canSubmit" :loading="form.submitting.value">Create account</AppButton>
      <p v-if="!canSubmit" class="pw-signup__hint">Button enables once both passwords match.</p>
    </form>
  </div>
</template>

<style scoped>
.pw-signup {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-5);
}

.pw-signup__names {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--pw-space-4);
}

.pw-signup__hint {
  text-align: center;
  font-size: var(--pw-text-sm);
  color: var(--pw-muted);
}

.pw-signup__error {
  color: var(--pw-danger-600);
  font-size: var(--pw-text-sm);
}

@media (max-width: 400px) {
  .pw-signup__names {
    grid-template-columns: 1fr;
  }
}
</style>
