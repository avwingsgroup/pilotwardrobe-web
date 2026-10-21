<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import AppInput from '@/components/forms/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import { authService } from '@/api/auth.api'
import { useForm } from '@/composables/useForm'
import { email, required } from '@/utils/validators'
import { safeRedirect } from '@/utils/security'

/**
 * Email-first entry (VA1/VA14): one field, then we route to Log in (existing)
 * or Create account (new) with the email and `next` carried through.
 */
const props = defineProps<{ next?: string; onNavigate?: () => void }>()
const route = useRoute()
const router = useRouter()

const form = useForm({ email: typeof route.query.email === 'string' ? route.query.email : '' }, { email: [required('Enter your email address.'), email] })

async function submit() {
  await form.submit(async ({ email: value }) => {
    const normalised = value.trim().toLowerCase()
    const result = await authService.lookupEmail(normalised)
    const next = safeRedirect(props.next ?? route.query.next, '') || undefined
    props.onNavigate?.()
    await router.push({ name: result.exists ? 'login' : 'signup', query: { email: normalised, next } })
  })
}
</script>

<template>
  <form novalidate @submit.prevent="submit">
    <AppInput
      v-model="form.values.email"
      label="Email address"
      type="email"
      autocomplete="email"
      inputmode="email"
      placeholder="name@airline.com"
      size="lg"
      :error="form.fieldError('email')"
      @blur="form.touch('email')"
    />
    <p v-if="form.formError.value" class="pw-auth-error" role="alert">{{ form.formError.value }}</p>
    <AppButton type="submit" size="lg" block :loading="form.submitting.value" class="pw-email-start__btn">Continue with email</AppButton>
  </form>
</template>

<style scoped>
.pw-email-start__btn {
  margin-top: var(--pw-space-5);
}

.pw-auth-error {
  margin-top: var(--pw-space-3);
  color: var(--pw-danger-600);
  font-size: var(--pw-text-sm);
}
</style>
