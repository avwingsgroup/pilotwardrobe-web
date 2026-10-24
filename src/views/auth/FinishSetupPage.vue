<script setup lang="ts">
import { ref, toRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { refDebounced } from '@vueuse/core'
import AuthHeading from '@/components/auth/AuthHeading.vue'
import AppInput from '@/components/forms/AppInput.vue'
import AppSelect from '@/components/forms/AppSelect.vue'
import AppCheckbox from '@/components/forms/AppCheckbox.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import { useForm } from '@/composables/useForm'
import { useSeo } from '@/composables/useSeo'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/api/auth.api'
import { COUNTRIES } from '@/constants/labels'
import { required, username as usernameRule } from '@/utils/validators'
import { safeRedirect } from '@/utils/security'
import type { SocialCallbackResult } from '@/types/auth'

/** VA3 — Google shared name + email; add username (3–20, a–z 0–9 _, availability debounced 400ms) + country. */
useSeo({ title: 'Almost cleared', noindex: true })
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const pending = ((): SocialCallbackResult | null => {
  try {
    return JSON.parse(sessionStorage.getItem('pw.social') ?? 'null') as SocialCallbackResult | null
  } catch {
    return null
  }
})()
if (!pending?.pendingToken) void router.replace({ name: 'auth' })

const form = useForm(
  {
    firstName: pending?.profile?.firstName ?? '',
    lastName: pending?.profile?.lastName ?? '',
    username: (pending?.profile?.email.split('@')[0] ?? '').toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 20),
    countryCode: 'NG',
    marketingOptIn: false,
    termsAccepted: false,
  },
  { firstName: [required()], lastName: [required()], username: [required('Choose a username.'), usernameRule], termsAccepted: [required('Please accept the terms.')] },
)

const availability = ref<'idle' | 'checking' | 'available' | 'taken'>('idle')
const suggestion = ref<string | null>(null)
const debounced = refDebounced(toRef(form.values, 'username'), 400)
let controller: AbortController | null = null

watch(
  debounced,
  async (name) => {
    controller?.abort()
    if (usernameRule(name) !== true) {
      availability.value = 'idle'
      return
    }
    controller = new AbortController()
    availability.value = 'checking'
    try {
      const result = await authService.usernameAvailable(name, controller.signal)
      availability.value = result.available ? 'available' : 'taken'
      suggestion.value = result.suggestion ?? null
    } catch {
      availability.value = 'idle'
    }
  },
  { immediate: true },
)

async function submit() {
  if (availability.value === 'taken') return
  const session = await form.submit((v) => authService.finishSocialSetup({ ...v, pendingToken: pending!.pendingToken! }))
  if (session) {
    sessionStorage.removeItem('pw.social')
    auth.setSession(session.user, session.accessToken)
    await router.replace({ name: 'account-ready', query: { next: safeRedirect(route.query.next, '') || undefined } })
  }
}
</script>

<template>
  <div v-if="pending">
    <div class="pw-fs__connected">
      <AppAvatar :name="`${pending.profile?.firstName} ${pending.profile?.lastName}`" :size="36" />
      <div>
        <p class="pw-fs__name">{{ pending.profile?.firstName }} {{ pending.profile?.lastName }}</p>
        <p class="pw-fs__email">{{ pending.profile?.email }}</p>
      </div>
      <span class="pw-fs__badge">Connected</span>
    </div>
    <AuthHeading title="Almost cleared" subtitle="Google shared your name and email. Add a few details to finish your account." />
    <form class="pw-fs" novalidate @submit.prevent="submit">
      <div class="pw-fs__names">
        <AppInput v-model="form.values.firstName" label="First name" autocomplete="given-name" :error="form.fieldError('firstName')" />
        <AppInput v-model="form.values.lastName" label="Last name" autocomplete="family-name" :error="form.fieldError('lastName')" />
      </div>
      <AppInput
        v-model="form.values.username"
        label="Username"
        prefix="@"
        autocomplete="username"
        :valid="availability === 'available'"
        :error="form.fieldError('username') ?? (availability === 'taken' ? `That username is taken${suggestion ? ` — try @${suggestion}` : ''}.` : null)"
        :hint="availability === 'checking' ? 'Checking availability…' : availability === 'available' ? 'Shown on your listings and reviews. Available.' : 'Shown on your listings and reviews.'"
        @blur="form.touch('username')"
      />
      <AppSelect v-model="form.values.countryCode" label="Country of residence" :options="COUNTRIES.map((c) => ({ value: c.code, label: c.name }))" />
      <AppCheckbox v-model="form.values.marketingOptIn" label="Send me deals and new listings that match my Fit Kit" />
      <AppCheckbox v-model="form.values.termsAccepted" :error="form.fieldError('termsAccepted')">
        I agree to the <RouterLink to="/terms">Terms of Service</RouterLink> and <RouterLink to="/privacy">Privacy Policy</RouterLink>
      </AppCheckbox>
      <p v-if="form.formError.value" class="pw-fs__error" role="alert">{{ form.formError.value }}</p>
      <AppButton type="submit" size="lg" block :loading="form.submitting.value" :disabled="availability === 'taken'">Create account</AppButton>
    </form>
  </div>
</template>

<style scoped>
.pw-fs__connected {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  margin-bottom: var(--pw-space-6);
  padding: var(--pw-space-3) var(--pw-space-4);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-surface-sunken);
}

.pw-fs__name {
  font-weight: var(--pw-weight-semibold);
  font-size: var(--pw-text-sm);
}

.pw-fs__email {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-fs__badge {
  margin-left: auto;
  font-size: var(--pw-text-xs);
  color: var(--pw-ink-2);
}

.pw-fs {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-4);
}

.pw-fs__names {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--pw-space-4);
}

.pw-fs__error {
  color: var(--pw-danger-600);
  font-size: var(--pw-text-sm);
}
</style>
