<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppTabs from '@/components/common/AppTabs.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppConfirmDialog from '@/components/common/AppConfirmDialog.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import AppInput from '@/components/forms/AppInput.vue'
import AppSelect from '@/components/forms/AppSelect.vue'
import AppTextarea from '@/components/forms/AppTextarea.vue'
import { userService } from '@/api/account.api'
import { toApiError } from '@/api/errors'
import { useResource } from '@/composables/useResource'
import { useForm } from '@/composables/useForm'
import { useSeo } from '@/composables/useSeo'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { COUNTRIES, CURRENCIES } from '@/constants/labels'
import { password as passwordRule, required, sameAs, username as usernameRule } from '@/utils/validators'
import { timeAgo } from '@/utils/date'
import type { NotificationPreference } from '@/types/user'

/** VB17 — account settings. Security tab follows the design; other tabs extend its language. */
useSeo({ title: 'Settings', noindex: true })
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

type Tab = 'profile' | 'security' | 'notifications' | 'payments' | 'preferences' | 'privacy'
const TABS: { value: Tab; label: string }[] = [
  { value: 'profile', label: 'Profile' },
  { value: 'security', label: 'Security' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'payments', label: 'Payments' },
  { value: 'preferences', label: 'Preferences' },
  { value: 'privacy', label: 'Privacy & data' },
]
const tab = computed<Tab>({
  get: () => (TABS.some((t) => t.value === route.params.tab) ? (route.params.tab as Tab) : 'security'),
  set: (v) => void router.replace({ name: 'hangar-settings', params: { tab: v } }),
})

/* Profile */
const profile = useForm(
  { firstName: auth.user?.firstName ?? '', lastName: auth.user?.lastName ?? '', username: auth.user?.username ?? '', phone: auth.user?.phone ?? '', bio: '' },
  { firstName: [required()], lastName: [required()], username: [required(), usernameRule] },
)
async function saveProfile() {
  const user = await profile.submit((v) => userService.updateProfile(v))
  if (user) {
    auth.setSession(user)
    ui.success('Profile saved')
  }
}

/* Security */
const { data: security, state: secState, error: secError, reload: reloadSecurity, mutate: mutateSecurity } = useResource((s) => userService.security(s))
const pwOpen = ref(false)
const pw = useForm(
  { currentPassword: '', password: '', passwordConfirmation: '' },
  { currentPassword: [required('Enter your current password.')], password: [required(), passwordRule], passwordConfirmation: [required(), sameAs((): string => pw.values.password)] },
)
async function changePassword() {
  const ok = await pw.submit((v) => userService.changePassword(v))
  if (ok !== undefined || pw.succeeded.value) {
    pwOpen.value = false
    pw.reset()
    ui.success('Password changed', 'Other sessions were logged out.')
    void reloadSecurity()
  }
}
async function revoke(id: string) {
  try {
    await userService.revokeSession(id)
    mutateSecurity((s) => (s ? { ...s, sessions: s.sessions.filter((x) => x.id !== id) } : s))
    ui.success('Session logged out')
  } catch (e) {
    ui.error("Couldn't log out session", toApiError(e).message)
  }
}
async function revokeOthers() {
  try {
    await userService.revokeOtherSessions()
    mutateSecurity((s) => (s ? { ...s, sessions: s.sessions.filter((x) => x.current) } : s))
    ui.success('Logged out of all other sessions')
  } catch (e) {
    ui.error('Action failed', toApiError(e).message)
  }
}
async function disconnect(provider: string) {
  try {
    await userService.disconnectProvider(provider)
    mutateSecurity((s) => (s ? { ...s, methods: s.methods.map((m) => (m.provider === provider ? { ...m, connected: false, detail: 'Not connected' } : m)) } : s))
    ui.success(`${provider} disconnected`)
  } catch (e) {
    ui.error("Couldn't disconnect", toApiError(e).message)
  }
}

const danger = ref<'deactivate' | 'delete' | null>(null)
const deletePassword = ref('')
const dangerBusy = ref(false)
async function confirmDanger() {
  dangerBusy.value = true
  try {
    if (danger.value === 'deactivate') await userService.deactivate()
    else await userService.deleteAccount(deletePassword.value)
    await auth.logout()
    ui.info(danger.value === 'deactivate' ? 'Account deactivated' : 'Account deleted')
    await router.replace({ name: 'home' })
  } catch (e) {
    ui.error('Action failed', toApiError(e).message)
  } finally {
    dangerBusy.value = false
    danger.value = null
  }
}

/* Notifications */
const { data: prefs, state: prefState, mutate: mutatePrefs } = useResource((s) => userService.notificationPreferences(s))
const prefsDirty = ref(false)
const prefSaving = ref(false)
function togglePref(p: NotificationPreference, channel: 'email' | 'push') {
  mutatePrefs((list) => list?.map((x) => (x.category === p.category ? { ...x, [channel]: !x[channel] } : x)) ?? null)
  prefsDirty.value = true
}
async function savePrefs() {
  if (!prefs.value) return
  prefSaving.value = true
  try {
    await userService.updateNotificationPreferences(prefs.value)
    prefsDirty.value = false
    ui.success('Preferences saved')
  } catch (e) {
    ui.error("Couldn't save", toApiError(e).message)
  } finally {
    prefSaving.value = false
  }
}

/* Preferences */
const prefsForm = reactive({ currency: auth.user?.currency ?? 'USD', countryCode: auth.user?.countryCode ?? 'NG', locale: auth.user?.locale ?? 'en' })
watch(() => auth.user, (u) => u && Object.assign(prefsForm, { currency: u.currency, countryCode: u.countryCode, locale: u.locale }))
const savingPrefsForm = ref(false)
async function savePreferences() {
  savingPrefsForm.value = true
  try {
    auth.setSession(await userService.updateProfile(prefsForm))
    ui.success('Preferences saved')
  } catch (e) {
    ui.error("Couldn't save", toApiError(e).message)
  } finally {
    savingPrefsForm.value = false
  }
}
</script>

<template>
  <div>
    <header class="pw-page-head"><h1 class="pw-page-title">Settings</h1></header>
    <AppTabs v-model="tab" :items="TABS" label="Settings sections" />

    <div class="pw-set">
      <!-- Profile -->
      <form v-if="tab === 'profile'" class="pw-card pw-card-pad pw-stack" novalidate @submit.prevent="saveProfile">
        <h2 class="pw-card-title">Profile</h2>
        <div class="pw-set__row">
          <AppInput v-model="profile.values.firstName" label="First name" autocomplete="given-name" :error="profile.fieldError('firstName')" />
          <AppInput v-model="profile.values.lastName" label="Last name" autocomplete="family-name" :error="profile.fieldError('lastName')" />
        </div>
        <div class="pw-set__row">
          <AppInput v-model="profile.values.username" label="Username" prefix="@" :error="profile.fieldError('username')" />
          <AppInput v-model="profile.values.phone" label="Phone" type="tel" autocomplete="tel" />
        </div>
        <AppInput :model-value="auth.user?.email ?? ''" label="Email" readonly hint="Contact support to change your sign-in email." />
        <AppTextarea v-model="profile.values.bio" label="Bio" :rows="3" :maxlength="300" show-count placeholder="First Officer on the B737…" />
        <p v-if="profile.formError.value" class="pw-set__err" role="alert">{{ profile.formError.value }}</p>
        <div class="pw-set__actions"><AppButton type="submit" :loading="profile.submitting.value">Save profile</AppButton></div>
      </form>

      <!-- Security (VB17) -->
      <template v-else-if="tab === 'security'">
        <ErrorState v-if="secState === 'error'" :error="secError" class="pw-card" @retry="reloadSecurity" />
        <AppSkeleton v-else-if="!security" height="420px" radius="var(--pw-radius-lg)" />
        <template v-else>
          <section class="pw-card pw-card-pad" aria-labelledby="sm">
            <h2 id="sm" class="pw-card-title">Sign-in methods</h2>
            <ul class="pw-set__list" role="list">
              <li v-for="m in security.methods" :key="m.provider">
                <div>
                  <p class="pw-set__name">{{ m.provider === 'password' ? 'Email & password' : m.provider[0]!.toUpperCase() + m.provider.slice(1) }} <AppBadge v-if="m.provider !== 'password' && m.connected" tone="success">Connected</AppBadge></p>
                  <p class="pw-set__detail">{{ m.provider === 'password' ? `${auth.user?.email} · ${m.detail}` : m.detail }}</p>
                </div>
                <AppButton v-if="m.provider === 'password'" variant="secondary" size="sm" @click="pwOpen = true">Change password</AppButton>
                <button v-else-if="m.connected" type="button" class="pw-link-btn" @click="disconnect(m.provider)">Disconnect</button>
                <AppButton v-else variant="secondary" size="sm" @click="ui.info(`Connect ${m.provider}`, 'You will be redirected to the provider to approve access.')">Connect</AppButton>
              </li>
            </ul>
          </section>

          <section class="pw-card pw-card-pad" aria-labelledby="tf">
            <h2 id="tf" class="pw-card-title">Two-step verification</h2>
            <ul class="pw-set__list" role="list">
              <li>
                <div>
                  <p class="pw-set__name">Authenticator app <AppBadge :tone="security.twoFactor.authenticatorEnabled ? 'success' : 'neutral'">{{ security.twoFactor.authenticatorEnabled ? 'On' : 'Off' }}</AppBadge></p>
                  <p class="pw-set__detail">Required on new devices and for payouts over $2,000</p>
                </div>
                <AppButton variant="secondary" size="sm">Manage</AppButton>
              </li>
              <li>
                <div><p class="pw-set__name">SMS backup</p><p class="pw-set__detail">{{ security.twoFactor.smsBackupMasked ?? 'Not set' }}</p></div>
                <button type="button" class="pw-link-btn">Edit</button>
              </li>
              <li>
                <div><p class="pw-set__name">Backup codes</p><p class="pw-set__detail">{{ security.twoFactor.backupCodesRemaining }} of 10 remaining</p></div>
                <AppButton variant="secondary" size="sm">View codes</AppButton>
              </li>
            </ul>
          </section>

          <section class="pw-card pw-card-pad" aria-labelledby="as">
            <div class="pw-between"><h2 id="as" class="pw-card-title">Active sessions</h2><button type="button" class="pw-link-btn pw-set__small" @click="revokeOthers">Log out all other sessions</button></div>
            <ul class="pw-set__list" role="list">
              <li v-for="s in security.sessions" :key="s.id">
                <div>
                  <p class="pw-set__name">{{ s.device }} <AppBadge v-if="s.current" tone="info">This device</AppBadge></p>
                  <p class="pw-set__detail">{{ s.location }} · {{ s.current ? 'Active now' : timeAgo(s.lastActiveAt) }}</p>
                </div>
                <button v-if="!s.current" type="button" class="pw-link-btn" @click="revoke(s.id)">Log out</button>
              </li>
            </ul>
          </section>

          <section class="pw-card pw-card-pad pw-set__danger" aria-labelledby="dz">
            <h2 id="dz" class="pw-card-title">Danger zone</h2>
            <ul class="pw-set__list" role="list">
              <li>
                <div><p class="pw-set__name">Deactivate account</p><p class="pw-set__detail">Hide your profile and listings. You can reactivate anytime.</p></div>
                <AppButton variant="secondary" size="sm" @click="danger = 'deactivate'">Deactivate</AppButton>
              </li>
              <li>
                <div><p class="pw-set__name">Delete account</p><p class="pw-set__detail">Permanently delete your data. Open orders and escrow must be settled first.</p></div>
                <AppButton variant="danger-outline" size="sm" @click="danger = 'delete'">Delete account</AppButton>
              </li>
            </ul>
          </section>
        </template>
      </template>

      <!-- Notifications -->
      <section v-else-if="tab === 'notifications'" class="pw-card pw-card-pad" aria-labelledby="np">
        <h2 id="np" class="pw-card-title">Delivery preferences</h2>
        <AppSkeleton v-if="prefState === 'loading'" :lines="5" />
        <table v-else class="pw-set__prefs">
          <thead><tr><th scope="col"><span class="sr-only">Category</span></th><th scope="col">Email</th><th scope="col">Push</th></tr></thead>
          <tbody>
            <tr v-for="p in prefs ?? []" :key="p.category">
              <th scope="row">{{ p.label }}</th>
              <td><input type="checkbox" :checked="p.email" :aria-label="`${p.label} by email`" @change="togglePref(p, 'email')" /></td>
              <td><input type="checkbox" :checked="p.push" :aria-label="`${p.label} by push`" @change="togglePref(p, 'push')" /></td>
            </tr>
          </tbody>
        </table>
        <p class="pw-set__detail pw-set__note">Security and payment alerts are always sent.</p>
        <div class="pw-set__actions"><AppButton :disabled="!prefsDirty" :loading="prefSaving" @click="savePrefs">Save preferences</AppButton></div>
      </section>

      <!-- Payments -->
      <section v-else-if="tab === 'payments'" class="pw-card pw-card-pad pw-stack" aria-labelledby="pay">
        <h2 id="pay" class="pw-card-title">Payments &amp; payouts</h2>
        <p class="pw-set__detail">Card details are never stored by Pilotwardrobe — you pay through our gateway partners (Paystack, Flutterwave, Monnify, Stripe, PayPal) at checkout.</p>
        <div class="pw-row">
          <AppButton variant="secondary" :to="{ name: 'hangar-wallet' }">Manage payout methods</AppButton>
          <AppButton variant="secondary" :to="{ name: 'hangar-addresses' }">Delivery addresses</AppButton>
        </div>
      </section>

      <!-- Preferences -->
      <section v-else-if="tab === 'preferences'" class="pw-card pw-card-pad pw-stack" aria-labelledby="pr">
        <h2 id="pr" class="pw-card-title">Preferences</h2>
        <div class="pw-set__row">
          <AppSelect v-model="prefsForm.currency" label="Display currency" :options="CURRENCIES.map((c) => ({ value: c, label: c }))" hint="Prices convert at checkout; you pay in the listing currency." />
          <AppSelect v-model="prefsForm.locale" label="Language" :options="[{ value: 'en', label: 'English' }, { value: 'fr', label: 'Français' }, { value: 'ha', label: 'Hausa' }]" />
        </div>
        <AppSelect v-model="prefsForm.countryCode" label="Country of residence" :options="COUNTRIES.map((c) => ({ value: c.code, label: c.name }))" />
        <div class="pw-set__actions"><AppButton :loading="savingPrefsForm" @click="savePreferences">Save preferences</AppButton></div>
      </section>

      <!-- Privacy -->
      <section v-else class="pw-card pw-card-pad pw-stack" aria-labelledby="pv">
        <h2 id="pv" class="pw-card-title">Privacy &amp; data</h2>
        <p class="pw-set__detail">Identity documents are encrypted and deleted 90 days after approval. You can request a copy of the data we hold about you at any time.</p>
        <div class="pw-row">
          <AppButton variant="secondary" @click="ui.success('Export requested', 'We will email a download link within 24 hours.')">Request my data</AppButton>
          <AppButton variant="ghost" to="/privacy">Read the privacy policy</AppButton>
        </div>
      </section>
    </div>

    <AppModal :open="pwOpen" title="Change password" size="sm" @close="pwOpen = false">
      <form id="pw-form" class="pw-stack" novalidate @submit.prevent="changePassword">
        <AppInput v-model="pw.values.currentPassword" label="Current password" type="password" autocomplete="current-password" :error="pw.fieldError('currentPassword')" />
        <AppInput v-model="pw.values.password" label="New password" type="password" autocomplete="new-password" :error="pw.fieldError('password')" />
        <AppInput v-model="pw.values.passwordConfirmation" label="Confirm new password" type="password" autocomplete="new-password" :error="pw.fieldError('passwordConfirmation')" />
      </form>
      <template #footer>
        <AppButton variant="secondary" @click="pwOpen = false">Cancel</AppButton>
        <AppButton type="submit" form="pw-form" :loading="pw.submitting.value">Update password</AppButton>
      </template>
    </AppModal>

    <AppConfirmDialog
      :open="!!danger"
      :title="danger === 'delete' ? 'Delete your account?' : 'Deactivate your account?'"
      :body="danger === 'delete' ? 'This permanently deletes your profile, listings and history. Enter your password to confirm.' : 'Your profile and listings will be hidden until you log in again.'"
      :confirm-label="danger === 'delete' ? 'Delete account' : 'Deactivate'"
      :tone="danger === 'delete' ? 'danger' : 'primary'"
      :loading="dangerBusy"
      @confirm="confirmDanger"
      @cancel="danger = null"
    >
      <AppInput v-if="danger === 'delete'" v-model="deletePassword" label="Password" type="password" autocomplete="current-password" class="pw-set__confirm" />
    </AppConfirmDialog>
  </div>
</template>

<style scoped>
.pw-set {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-5);
  margin-top: var(--pw-space-5);
  max-width: 860px;
}

.pw-set__row {
  display: grid;
  gap: var(--pw-space-4);
}

.pw-set__list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--pw-space-4);
  padding: var(--pw-space-4) 0;
  border-top: 1px solid var(--pw-border);
}

.pw-set__list {
  margin-top: var(--pw-space-3);
}

.pw-set__name {
  display: flex;
  align-items: center;
  gap: var(--pw-space-2);
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-semibold);
}

.pw-set__detail {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-set__small {
  font-size: var(--pw-text-xs);
}

.pw-set__danger {
  border-color: color-mix(in srgb, var(--pw-danger-600) 30%, white);
}

.pw-set__prefs {
  margin-top: var(--pw-space-4);
  font-size: var(--pw-text-sm);
}

.pw-set__prefs th,
.pw-set__prefs td {
  padding: var(--pw-space-3) var(--pw-space-2);
  text-align: center;
  border-bottom: 1px solid var(--pw-border);
}

.pw-set__prefs thead th {
  font-size: var(--pw-text-2xs);
  text-transform: uppercase;
  color: var(--pw-muted);
}

.pw-set__prefs tbody th {
  text-align: left;
  font-weight: var(--pw-weight-regular);
}

.pw-set__prefs input {
  width: 18px;
  height: 18px;
  accent-color: var(--pw-navy-700);
}

.pw-set__note {
  margin-top: var(--pw-space-3);
}

.pw-set__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--pw-space-2);
}

.pw-set__err {
  color: var(--pw-danger-600);
}

.pw-set__confirm {
  margin-top: var(--pw-space-4);
}

@media (min-width: 640px) {
  .pw-set__row {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
