<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { KeyRound } from '@lucide/vue'
import BrandLogo from '@/components/navigation/BrandLogo.vue'
import AppButton from '@/components/common/AppButton.vue'
import OrDivider from '@/components/auth/OrDivider.vue'
import { authService } from '@/api/auth.api'
import { toApiError } from '@/api/errors'
import { useAuthStore } from '@/stores/auth.store'
import { useSeo } from '@/composables/useSeo'
import { safeRedirect } from '@/utils/security'

/**
 * AD1 — staff sign-in: Google Workspace SSO, then a WebAuthn security key.
 * The browser WebAuthn ceremony uses the challenge returned by Laravel; the
 * assertion is verified server-side. 8h idle timeout and IP allow-list are
 * enforced by the API.
 */
useSeo({ title: 'Staff sign-in', noindex: true })
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const step = ref<'sso' | 'key'>('sso')
const email = ref('')
const challenge = ref<{ id: string; publicKey: Record<string, unknown> } | null>(null)
const busy = ref(false)
const error = ref<string | null>(null)

async function sso() {
  busy.value = true
  error.value = null
  try {
    const res = await authService.staffGoogle()
    email.value = res.email
    challenge.value = { id: res.challengeId, publicKey: res.publicKey }
    step.value = 'key'
  } catch (e) {
    error.value = toApiError(e).message
  } finally {
    busy.value = false
  }
}

async function securityKey() {
  if (!challenge.value) return
  busy.value = true
  error.value = null
  try {
    let credential: Record<string, unknown> = { mock: true }
    // Real deployments: navigator.credentials.get({ publicKey }) with the server challenge.
    if (window.PublicKeyCredential && import.meta.env.VITE_API_MODE === 'live') {
      const assertion = (await navigator.credentials.get({ publicKey: challenge.value.publicKey as unknown as PublicKeyCredentialRequestOptions })) as PublicKeyCredential | null
      if (!assertion) throw new Error('Security key not confirmed')
      credential = { id: assertion.id, type: assertion.type }
    }
    const user = await authService.staffWebAuthn(challenge.value.id, credential)
    auth.setSession(user)
    await router.replace(safeRedirect(route.query.next, '/admin/overview'))
  } catch (e) {
    error.value = e instanceof Error && !('status' in e) ? e.message : toApiError(e).message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main id="main" class="pw-staff">
    <div class="pw-staff__card">
      <div class="pw-staff__brand">
        <BrandLogo :height="36" :tile="false" :to="null" />
        <span class="pw-staff__tag">Control Tower</span>
      </div>
      <h1 class="pw-staff__title">Staff sign-in</h1>
      <p class="pw-staff__sub">Restricted to Pilotwardrobe staff. All activity is logged.</p>

      <AppButton variant="secondary" block size="lg" :loading="busy && step === 'sso'" :disabled="step === 'key'" @click="sso">
        <template #icon><span class="pw-staff__g" aria-hidden="true">G</span></template>
        {{ step === 'key' ? `Signed in as ${email}` : 'Continue with Google Workspace' }}
      </AppButton>
      <OrDivider label="then" />
      <button type="button" class="pw-staff__key" :class="{ 'is-active': step === 'key' }" :disabled="step !== 'key' || busy" @click="securityKey">
        <span class="pw-staff__key-icon"><KeyRound :size="18" aria-hidden="true" /></span>
        <span>
          <strong>{{ busy && step === 'key' ? 'Waiting for your key…' : 'Touch your security key' }}</strong>
          <small>Step 2 of 2{{ email ? ` · ${email}` : '' }}</small>
        </span>
      </button>
      <div class="pw-staff__progress" aria-hidden="true"><span :style="{ width: step === 'key' ? '100%' : '45%' }" /></div>
      <p v-if="error" class="pw-staff__error" role="alert">{{ error }}</p>
      <p class="pw-staff__foot">Lost your key? Contact security@pilotwardrobe.com. Sessions expire after 8h idle; IP allow-list enforced.</p>
    </div>
  </main>
</template>

<style scoped>
.pw-staff {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  place-items: center;
  min-height: 100vh;
  padding: var(--pw-space-4);
  background:
    linear-gradient(rgb(13 42 87 / 86%), rgb(13 42 87 / 92%)),
    url('/brand/auth-cockpit.webp') center / cover;
}

.pw-staff__card {
  width: 100%;
  max-width: 440px;
  padding: clamp(var(--pw-space-5), 6vw, var(--pw-space-8));
  border-radius: var(--pw-radius-xl);
  background: #fff;
  box-shadow: var(--pw-shadow-lg);
}

.pw-staff__brand {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--pw-space-3);
}

.pw-staff__tag {
  padding: 3px 6px;
  border: 1px solid var(--pw-gold-500);
  border-radius: var(--pw-radius-xs);
  color: var(--pw-gold-600);
  font-size: 0.5625rem;
  font-weight: var(--pw-weight-bold);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.pw-staff__title {
  margin-top: var(--pw-space-5);
  font-size: var(--pw-text-2xl);
}

.pw-staff__sub {
  margin: var(--pw-space-2) 0 var(--pw-space-5);
  color: var(--pw-muted);
  font-size: var(--pw-text-sm);
}

.pw-staff__g {
  color: #4285f4;
  font-weight: var(--pw-weight-bold);
}

.pw-staff__key {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  width: 100%;
  padding: var(--pw-space-4);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-surface-sunken);
  text-align: left;
}

.pw-staff__key.is-active {
  border: 2px solid var(--pw-navy-700);
  background: var(--pw-navy-50);
  cursor: pointer;
}

.pw-staff__key span:last-child {
  display: flex;
  flex-direction: column;
  font-size: var(--pw-text-sm);
}

.pw-staff__key small {
  color: var(--pw-muted);
  font-size: var(--pw-text-xs);
}

.pw-staff__key-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--pw-radius-md);
  background: var(--pw-navy-700);
  color: #fff;
}

.pw-staff__progress {
  height: 4px;
  margin: var(--pw-space-4) 0;
  border-radius: 2px;
  background: var(--pw-border);
  overflow: hidden;
}

.pw-staff__progress span {
  display: block;
  height: 100%;
  background: var(--pw-navy-700);
  transition: width var(--pw-duration-slow) var(--pw-ease);
}

.pw-staff__error {
  color: var(--pw-danger-600);
  font-size: var(--pw-text-sm);
}

.pw-staff__foot {
  margin-top: var(--pw-space-3);
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
  text-align: center;
}
</style>
