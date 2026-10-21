<script setup lang="ts">
import { reactive } from 'vue'
import { Settings2 } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import AppToggle from '@/components/forms/AppToggle.vue'
import PolicyShell from '@/components/info/PolicyShell.vue'
import PolicySection from '@/components/info/PolicySection.vue'
import PolicyAccordion from '@/components/info/PolicyAccordion.vue'
import { useSeo } from '@/composables/useSeo'
import { useUiStore } from '@/stores/ui.store'
import { PLATFORM } from '@/content/info/nav'
import { readConsent, saveConsent, type ConsentCategory } from '@/utils/cookieConsent'

useSeo({ title: 'Cookie policy', description: 'The cookies Pilotwardrobe uses and how to change your preferences.', canonicalPath: '/cookies' })
const ui = useUiStore()

const sections = [
  { id: 'what', title: 'What cookies are' },
  { id: 'preferences', title: 'Your preferences' },
  { id: 'list', title: 'Cookies we use' },
  { id: 'managing', title: 'Managing cookies' },
  { id: 'third-parties', title: 'Third parties' },
  { id: 'contact', title: 'Contact' },
]

const saved = readConsent()
const prefs = reactive<Record<ConsentCategory, boolean>>({ functional: saved.functional, analytics: saved.analytics, marketing: saved.marketing })

const TYPE_TONE = { Necessary: '', Functional: 'success', Analytics: 'warning', Marketing: 'neutral' } as const
const cookies: { name: string; by: string; purpose: string; expires: string; type: keyof typeof TYPE_TONE }[] = [
  { name: 'pw_session', by: 'Pilotwardrobe', purpose: 'Keeps you signed in', expires: 'Session', type: 'Necessary' },
  { name: 'XSRF-TOKEN', by: 'Pilotwardrobe', purpose: 'Protects forms against forgery', expires: 'Session', type: 'Necessary' },
  { name: '__stripe_mid', by: 'Payment provider', purpose: 'Fraud prevention at checkout', expires: '1 year', type: 'Necessary' },
  { name: 'pw_currency', by: 'Pilotwardrobe', purpose: 'Remembers your display currency', expires: '6 months', type: 'Functional' },
  { name: 'pw_fitkit', by: 'Pilotwardrobe', purpose: 'Caches your saved sizes', expires: '6 months', type: 'Functional' },
  { name: '_ga', by: 'Google Analytics', purpose: 'Distinguishes visitors', expires: '13 months', type: 'Analytics' },
  { name: '_fbp', by: 'Meta', purpose: 'Ad measurement', expires: '3 months', type: 'Marketing' },
]

const count = (type: keyof typeof TYPE_TONE) => cookies.filter((c) => c.type === type).length
const categories: { key: ConsentCategory | 'necessary'; title: string; count: number; body: string }[] = [
  { key: 'necessary', title: 'Strictly necessary', count: count('Necessary'), body: 'Sign-in, checkout, security and fraud prevention. These can’t be switched off.' },
  { key: 'functional', title: 'Functional', count: count('Functional'), body: 'Remember your currency, Fit Kit sizes and recently viewed gear.' },
  { key: 'analytics', title: 'Analytics', count: count('Analytics'), body: 'Help us see which pages work so we can improve them. Data is aggregated.' },
  { key: 'marketing', title: 'Marketing', count: count('Marketing'), body: 'Measure ads on aviation sites and show relevant promotions.' },
]

function persist(message: string) {
  saveConsent({ ...prefs })
  ui.success(message, 'Changes apply right away on this device.')
}

function rejectOptional() {
  prefs.functional = false
  prefs.analytics = false
  prefs.marketing = false
  persist('Optional cookies switched off')
}

const collapsed = [
  { id: 'third-parties', number: 5, title: 'Third parties', paragraphs: ['Payment and analytics providers set their own cookies when their features load. They act under their own privacy policies; we only enable optional ones after you opt in above.'] },
  { id: 'contact', number: 6, title: 'Contact', paragraphs: [`Questions about cookies? Email ${PLATFORM.privacyEmail}.`] },
]
</script>

<template>
  <PolicyShell title="Cookie policy" effective="Oct 1, 2026" version="1.3" :read-minutes="4" :sections="sections">
    <PolicySection id="what" :number="1" title="What cookies are">
      <p>Cookies are small files saved by your browser. We use them, and similar technologies like local storage, to keep you signed in, remember your settings and understand how the site is used.</p>
    </PolicySection>

    <PolicySection id="preferences" :number="2" title="Your preferences">
      <div class="pw-consent">
        <div class="pw-consent__head">
          <span class="pw-info-icon"><Settings2 :size="16" aria-hidden="true" /></span>
          <span class="pw-consent__title"><strong>Cookie preferences</strong><small>Changes apply right away on this device</small></span>
          <div class="pw-consent__actions">
            <AppButton variant="secondary" size="sm" @click="rejectOptional">Reject optional</AppButton>
            <AppButton size="sm" @click="persist('Cookie preferences saved')">Save preferences</AppButton>
          </div>
        </div>
        <ul role="list">
          <li v-for="c in categories" :key="c.key" class="pw-consent__row">
            <div>
              <p class="pw-consent__name">
                <strong :id="`cc-${c.key}`">{{ c.title }}</strong>
                <span>{{ c.count }} cookie{{ c.count === 1 ? '' : 's' }}</span>
                <span v-if="c.key === 'necessary'" class="pw-info-pill pw-info-pill--neutral">Always on</span>
              </p>
              <p class="pw-consent__body">{{ c.body }}</p>
            </div>
            <AppToggle v-if="c.key === 'necessary'" :model-value="true" disabled :label="c.title" sr-only-label />
            <AppToggle v-else v-model="prefs[c.key]" :label="c.title" sr-only-label />
          </li>
        </ul>
      </div>
    </PolicySection>

    <PolicySection id="list" :number="3" title="Cookies we use">
      <div class="pw-info-table-wrap">
        <table class="pw-info-table">
          <thead><tr><th scope="col">Name</th><th scope="col">Set by</th><th scope="col">Purpose</th><th scope="col">Expires</th><th scope="col">Type</th></tr></thead>
          <tbody>
            <tr v-for="c in cookies" :key="c.name">
              <th scope="row" class="pw-mono pw-cookie-name">{{ c.name }}</th>
              <td>{{ c.by }}</td>
              <td>{{ c.purpose }}</td>
              <td>{{ c.expires }}</td>
              <td><span class="pw-info-pill" :class="TYPE_TONE[c.type] && `pw-info-pill--${TYPE_TONE[c.type]}`">{{ c.type }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </PolicySection>

    <PolicySection id="managing" :number="4" title="Managing cookies in your browser">
      <p>You can also block or delete cookies in your browser settings. Blocking strictly necessary cookies will stop sign-in and checkout from working.</p>
    </PolicySection>

    <PolicyAccordion :items="collapsed" />
  </PolicyShell>
</template>

<style scoped>
.pw-consent {
  overflow: hidden;
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-surface);
}

.pw-consent__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--pw-space-3);
  padding: var(--pw-space-4);
  border-bottom: 1px solid var(--pw-border);
}

.pw-consent__title {
  display: grid;
  flex: 1;
  min-width: 160px;
  font-size: var(--pw-text-sm);
}

.pw-consent__title small {
  color: var(--pw-muted);
  font-size: var(--pw-text-2xs);
}

.pw-consent__actions {
  display: flex;
  gap: var(--pw-space-2);
}

.pw-consent__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--pw-space-4);
  padding: var(--pw-space-4);
}

.pw-consent__row + .pw-consent__row {
  border-top: 1px solid var(--pw-border);
}

.pw-consent__name {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--pw-space-2);
  font-size: var(--pw-text-sm);
}

.pw-consent__name span:not(.pw-info-pill) {
  color: var(--pw-muted);
  font-size: var(--pw-text-2xs);
}

.pw-consent__body {
  margin-top: var(--pw-space-1);
  color: var(--pw-muted);
  font-size: var(--pw-text-xs);
}

.pw-cookie-name {
  font-size: var(--pw-text-xs);
  font-weight: var(--pw-weight-regular) !important;
}
</style>
