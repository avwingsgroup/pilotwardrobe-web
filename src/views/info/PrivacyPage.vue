<script setup lang="ts">
import { Activity, Ban, ChevronRight, Download, Eye, FileText, Landmark, Lock, Plane, ShieldCheck, User, Users, X } from '@lucide/vue'
import PolicyShell from '@/components/info/PolicyShell.vue'
import PolicySummary from '@/components/info/PolicySummary.vue'
import PolicySection from '@/components/info/PolicySection.vue'
import PolicyAccordion from '@/components/info/PolicyAccordion.vue'
import { useSeo } from '@/composables/useSeo'
import { PLATFORM } from '@/content/info/nav'

useSeo({ title: 'Privacy policy', description: 'What personal data Pilotwardrobe collects, how we use it, who we share it with and your rights.', canonicalPath: '/privacy' })

const sections = [
  { id: 'who', title: 'Who we are' },
  { id: 'collect', title: 'What we collect' },
  { id: 'use', title: 'How we use it' },
  { id: 'share', title: 'Who we share with' },
  { id: 'retention', title: 'How long we keep it' },
  { id: 'rights', title: 'Your rights' },
  { id: 'cookies', title: 'Cookies' },
  { id: 'children', title: 'Children' },
  { id: 'transfers', title: 'International transfers' },
  { id: 'changes', title: 'Changes' },
  { id: 'contact', title: 'Contact' },
]

const summary = [
  { icon: ShieldCheck, title: 'Only what we need', body: 'We collect what’s needed to verify you, run orders and keep the marketplace safe.' },
  { icon: Lock, title: 'ID images deleted fast', body: 'Passport and licence scans are deleted 90 days after your check completes.' },
  { icon: Users, title: 'You stay in control', body: 'Download or delete your data any time from Settings → Privacy.' },
]

const collect = [
  { icon: User, title: 'You give us', body: 'Name, email, phone, address, pilot licence, aircraft types, Fit Kit sizes' },
  { icon: Activity, title: 'We record', body: 'Searches, saved items, device and log data, approximate location' },
  { icon: Landmark, title: 'Partners send', body: 'Payment status from our payment providers, verification results from our ID partner' },
]

const processors = [
  { name: 'Payment providers', body: 'Payments and payouts' },
  { name: 'Identity verification', body: 'ID and licence checks' },
  { name: 'DHL · FedEx · UPS', body: 'Delivery address only' },
  { name: 'Email delivery', body: 'Order and account emails' },
]

const retention = [
  { label: 'Account and profile', keep: 'While active + 30 days', pct: 14 },
  { label: 'Messages and offers', keep: '2 years', pct: 28 },
  { label: 'ID and licence images', keep: '90 days after check', pct: 3 },
  { label: 'Orders and payments', keep: '7 years (tax law)', pct: 100 },
]

const rights = [
  { icon: Eye, title: 'Access', body: 'Get a copy of what we hold' },
  { icon: FileText, title: 'Correct', body: 'Fix anything inaccurate' },
  { icon: Download, title: 'Export', body: 'Download in a portable format' },
  { icon: X, title: 'Delete', body: 'Close your account and erase data' },
  { icon: Ban, title: 'Object', body: 'Opt out of profiling and marketing' },
]

const collapsed = [
  { id: 'cookies', number: 7, title: 'Cookies', paragraphs: ['We use strictly necessary cookies to keep you signed in and secure checkout, and optional cookies for preferences, analytics and marketing only with your consent. See the Cookie policy to change your choices.'] },
  { id: 'children', number: 8, title: 'Children', paragraphs: ['Pilotwardrobe is for people aged 18 and over. We don’t knowingly collect data from children; if you believe a child has created an account, contact us and we’ll delete it.'] },
  { id: 'transfers', number: 9, title: 'International transfers', paragraphs: ['Some of our providers process data outside your country. Where they do, we use standard contractual clauses or equivalent safeguards so your data gets the same protection.'] },
  { id: 'changes', number: 10, title: 'Changes', paragraphs: ['If we make a material change to this policy we’ll email you and show a notice in the app at least 14 days before it takes effect. The version number and effective date at the top always reflect the current text.'] },
  { id: 'contact', number: 11, title: 'Contact', paragraphs: [`Our Data Protection Officer can be reached at ${PLATFORM.privacyEmail}. You can also write to Pilotwardrobe Ltd, Suite C8, Mediatrix Of All Graces Plaza, 79 Stadium Road, Port Harcourt, Nigeria.`] },
]
</script>

<template>
  <PolicyShell title="Privacy policy" effective="Oct 1, 2026" version="2.4" :read-minutes="10" :sections="sections">
    <PolicySummary :items="summary" />

    <PolicySection id="who" :number="1" title="Who we are">
      <p>Pilotwardrobe Ltd is the controller of your personal data. Our Data Protection Officer can be reached at {{ PLATFORM.privacyEmail }}.</p>
    </PolicySection>

    <PolicySection id="collect" :number="2" title="What we collect">
      <div class="pw-info-grid pw-info-grid--3">
        <div v-for="c in collect" :key="c.title" class="pw-info-card pw-pp-card">
          <span class="pw-info-icon"><component :is="c.icon" :size="16" aria-hidden="true" /></span>
          <h3>{{ c.title }}</h3>
          <p>{{ c.body }}</p>
        </div>
      </div>
    </PolicySection>

    <PolicySection id="use" :number="3" title="How we use it">
      <p>To run your account and orders, verify identities, prevent fraud, size-match with Fit Kit, recommend listings, and send messages you’ve asked for. We use automated fraud signals; a person reviews any decision to suspend an account.</p>
    </PolicySection>

    <PolicySection id="share" :number="4" title="Who we share with">
      <div class="pw-info-card pw-flow">
        <div class="pw-flow__head">
          <h3 class="pw-info-card-title">Where your data goes</h3>
          <span class="pw-muted">We never sell personal data</span>
        </div>
        <div class="pw-flow__row">
          <div class="pw-flow__node">
            <span class="pw-info-icon"><User :size="16" aria-hidden="true" /></span>
            <strong>You</strong>
            <small>Profile, listings, messages, orders</small>
          </div>
          <ChevronRight :size="18" class="pw-flow__arrow" aria-hidden="true" />
          <div class="pw-flow__node is-us">
            <span class="pw-info-icon pw-info-icon--solid"><Plane :size="16" aria-hidden="true" /></span>
            <strong>Pilotwardrobe</strong>
            <small>Stored encrypted in our cloud data centres</small>
          </div>
          <ChevronRight :size="18" class="pw-flow__arrow" aria-hidden="true" />
          <ul class="pw-flow__partners" role="list">
            <li v-for="p in processors" :key="p.name"><strong>{{ p.name }}</strong><small>{{ p.body }}</small></li>
          </ul>
        </div>
      </div>
    </PolicySection>

    <PolicySection id="retention" :number="5" title="How long we keep it">
      <div class="pw-info-card">
        <ul class="pw-retain" role="list">
          <li v-for="r in retention" :key="r.label">
            <span>{{ r.label }}</span>
            <span class="pw-info-bar" aria-hidden="true"><span :style="{ width: `${r.pct}%` }" /></span>
            <span class="pw-retain__keep">{{ r.keep }}</span>
          </li>
        </ul>
      </div>
    </PolicySection>

    <PolicySection id="rights" :number="6" title="Your rights">
      <ul class="pw-rights" role="list">
        <li v-for="r in rights" :key="r.title" class="pw-info-card">
          <component :is="r.icon" :size="18" class="pw-rights__icon" aria-hidden="true" />
          <strong>{{ r.title }}</strong>
          <small>{{ r.body }}</small>
        </li>
      </ul>
      <p>We reply to requests within 30 days. If you’re unhappy with our answer, you can complain to your local data protection authority.</p>
    </PolicySection>

    <PolicyAccordion :items="collapsed" />
  </PolicyShell>
</template>

<style scoped>
.pw-pp-card h3 {
  font-family: var(--pw-font-body);
  font-size: var(--pw-text-sm);
}

.pw-flow__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--pw-space-2);
}

.pw-flow__head span {
  font-size: var(--pw-text-xs);
}

.pw-flow__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-3);
  margin-top: var(--pw-space-4);
}

.pw-flow__node {
  display: grid;
  gap: var(--pw-space-1);
  padding: var(--pw-space-4);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-md);
  font-size: var(--pw-text-sm);
}

.pw-flow__node .pw-info-icon {
  margin-bottom: var(--pw-space-2);
}

.pw-flow__node small {
  color: var(--pw-muted);
  font-size: var(--pw-text-xs);
}

.pw-flow__node.is-us {
  border-color: var(--pw-navy-900);
  background: var(--pw-navy-900);
  color: #fff;
}

.pw-flow__node.is-us small {
  color: rgb(255 255 255 / 75%);
}

.pw-flow__node.is-us .pw-info-icon {
  background: rgb(255 255 255 / 12%);
}

.pw-flow__arrow {
  justify-self: center;
  transform: rotate(90deg);
  color: var(--pw-subtle);
}

.pw-flow__partners {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--pw-space-2);
}

.pw-flow__partners li {
  display: grid;
  padding: var(--pw-space-3);
  border: 1px dashed var(--pw-border-strong);
  border-radius: var(--pw-radius-md);
  font-size: var(--pw-text-xs);
}

.pw-flow__partners small {
  color: var(--pw-muted);
  font-size: var(--pw-text-2xs);
}

.pw-retain {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-3);
}

.pw-retain li {
  display: grid;
  grid-template-columns: minmax(0, 170px) minmax(0, 1fr) minmax(0, 150px);
  align-items: center;
  gap: var(--pw-space-4);
  font-size: var(--pw-text-sm);
}

.pw-retain li > span:first-child {
  font-weight: var(--pw-weight-medium);
}

.pw-retain .pw-info-bar > span {
  background: var(--pw-navy-500);
}

.pw-retain li:last-child .pw-info-bar > span {
  background: var(--pw-navy-700);
}

.pw-retain__keep {
  text-align: right;
  color: var(--pw-muted);
  font-size: var(--pw-text-xs);
}

.pw-rights {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--pw-space-3);
  margin-bottom: var(--pw-space-4);
}

.pw-rights li {
  display: grid;
  gap: var(--pw-space-1);
  padding: var(--pw-space-4);
  font-size: var(--pw-text-sm);
}

.pw-rights small {
  color: var(--pw-muted);
  font-size: var(--pw-text-xs);
}

.pw-rights__icon {
  margin-bottom: var(--pw-space-2);
  color: var(--pw-navy-700);
}

@media (min-width: 768px) {
  .pw-flow__row {
    grid-template-columns: minmax(0, 0.8fr) auto minmax(0, 0.9fr) auto minmax(0, 1.6fr);
    align-items: center;
  }
  .pw-flow__arrow {
    transform: none;
  }
  .pw-rights {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (max-width: 559px) {
  .pw-retain li {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .pw-retain .pw-info-bar {
    grid-column: 1 / -1;
    grid-row: 2;
  }
}
</style>
