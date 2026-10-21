<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { Link2 } from '@lucide/vue'
import AuthHeading from '@/components/auth/AuthHeading.vue'
import AppInput from '@/components/forms/AppInput.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import { useForm } from '@/composables/useForm'
import { useSeo } from '@/composables/useSeo'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/api/auth.api'
import { required } from '@/utils/validators'
import { formatMonthYear } from '@/utils/date'
import { safeRedirect } from '@/utils/security'
import type { SocialCallbackResult } from '@/types/auth'

/** VA8 — Google email matches a password account: confirm password once to link. */
useSeo({ title: 'Link your Google account', noindex: true })
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

const form = useForm({ password: '' }, { password: [required('Enter your Pilotwardrobe password.')] })

async function submit() {
  const user = await form.submit((v) => authService.linkSocial({ pendingToken: pending!.pendingToken!, password: v.password }))
  if (user) {
    sessionStorage.removeItem('pw.social')
    auth.setSession(user)
    await router.replace(safeRedirect(route.query.next, '/'))
  }
}
</script>

<template>
  <div v-if="pending">
    <AuthHeading title="Link your Google account" :icon="Link2">
      <strong>{{ pending.profile?.email }}</strong> already has a Pilotwardrobe password. Enter it once to connect Google — after that, either method logs you in.
    </AuthHeading>
    <div v-if="pending.existingAccount" class="pw-link__acct">
      <AppAvatar :name="pending.existingAccount.displayName" :size="36" />
      <div>
        <p class="pw-link__name">{{ pending.existingAccount.displayName }}</p>
        <p class="pw-link__meta">Member since {{ formatMonthYear(pending.existingAccount.memberSince) }}<template v-if="pending.existingAccount.verified"> · Verified seller</template></p>
      </div>
      <AppBadge v-if="pending.existingAccount.verified" tone="gold" solid>Verified</AppBadge>
    </div>
    <form class="pw-link" novalidate @submit.prevent="submit">
      <AppInput v-model="form.values.password" label="Pilotwardrobe password" type="password" autocomplete="current-password" size="lg" :error="form.fieldError('password') ?? form.formError.value" />
      <RouterLink :to="{ name: 'forgot-password', query: { email: pending.profile?.email } }" class="pw-link__forgot">Forgot password?</RouterLink>
      <AppButton type="submit" size="lg" block :loading="form.submitting.value">Link and log in</AppButton>
      <RouterLink :to="{ name: 'login', query: { email: pending.profile?.email } }" class="pw-link__cancel">Cancel and use email instead</RouterLink>
    </form>
  </div>
</template>

<style scoped>
.pw-link__acct {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  margin-bottom: var(--pw-space-5);
  padding: var(--pw-space-3) var(--pw-space-4);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
}

.pw-link__acct > div {
  flex: 1;
}

.pw-link__name {
  font-weight: var(--pw-weight-semibold);
  font-size: var(--pw-text-sm);
}

.pw-link__meta {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-link {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-4);
}

.pw-link__forgot {
  align-self: flex-end;
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-semibold);
}

.pw-link__cancel {
  align-self: center;
  color: var(--pw-ink);
  font-size: var(--pw-text-sm);
}
</style>
