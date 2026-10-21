<script setup lang="ts">
import { Ban, Camera, Check, ChevronRight, Clock, Flag, Lock, Scale } from '@lucide/vue'
import PolicyShell from '@/components/info/PolicyShell.vue'
import PolicySummary from '@/components/info/PolicySummary.vue'
import PolicySection from '@/components/info/PolicySection.vue'
import PolicyAccordion from '@/components/info/PolicyAccordion.vue'
import { useSeo } from '@/composables/useSeo'
import { PLATFORM } from '@/content/info/nav'

useSeo({ title: 'Escrow & disputes', description: 'How Pilotwardrobe holds payments in escrow, when funds release, and how disputes are decided.', canonicalPath: '/escrow-disputes' })

const H = PLATFORM.inspectionHours
const D = PLATFORM.dispatchDays

const sections = [
  { id: 'escrow', title: 'How escrow works' },
  { id: 'release', title: 'Release timing' },
  { id: 'stages', title: 'Dispute stages' },
  { id: 'evidence', title: 'Evidence' },
  { id: 'outcomes', title: 'Outcomes' },
  { id: 'appeals', title: 'Appeals' },
]

const summary = [
  { icon: Lock, title: 'We hold the money', body: 'Payments sit in a protected balance, not with the seller, until delivery is confirmed.' },
  { icon: Clock, title: 'Clear timers', body: `Sellers ship within ${D} days. Buyers have ${H} hours after landing to raise an issue.` },
  { icon: Scale, title: 'A neutral mediator', body: 'If you can’t agree, a trained mediator decides using the evidence.' },
]

const happy = [
  { code: 'Paid', body: 'Buyer checks out', tone: 'plain' },
  { code: 'Escrowed', body: 'Funds held by us', tone: 'navy' },
  { code: 'Shipped', body: 'Seller adds tracking', tone: 'tint' },
  { code: 'Landed', body: `${H} h inspection`, tone: 'tint' },
  { code: 'Released', body: 'Seller paid', tone: 'green' },
]
const dispute = [
  { code: 'Disputed', body: 'Release paused', tone: 'red' },
  { code: 'Under review', body: 'Mediator assigned', tone: 'amber' },
  { code: 'Resolved', body: 'Refund, release or split', tone: 'green' },
]

const release = [
  { icon: Check, title: 'Buyer confirms', body: 'Released immediately when the buyer taps Confirm landed.' },
  { icon: Clock, title: 'Window elapses', body: `Released automatically ${H} hours after delivery if no dispute is open.` },
  { icon: Ban, title: 'Seller doesn’t ship', body: `Refunded automatically if there’s no tracking after ${D} days.` },
]

const stages = [
  { title: 'Raise it', when: `Within the ${H} h window`, body: 'Open a dispute from the order, choose a reason, add photos.' },
  { title: 'Talk it through', when: `${PLATFORM.sellerReplyHours} hours`, body: 'The seller replies. Most cases settle here with a return or partial refund.' },
  { title: 'Mediation', when: `Up to ${PLATFORM.mediationBusinessDays} business days`, body: 'A Pilotwardrobe mediator reviews chat, tracking and evidence.' },
  { title: 'Decision', when: 'Final', body: 'Funds are refunded, released or split. Both sides are emailed the reasons.', final: true },
]

const evidence = [
  'Unboxing photos or video, including the shipping label',
  'Close-ups of the issue next to the listing photos',
  'Serial numbers that don’t match the listing',
  'Screenshots of any messages outside the order chat',
]

const collapsed = [
  {
    id: 'outcomes',
    number: 5,
    title: 'Outcomes',
    paragraphs: [
      'A mediator can release the funds to the seller, issue a partial refund, or order a full refund with or without a return. Each decision cites the policy it relies on.',
      'Refunds go back to the original payment method or, if you prefer, to your Pilotwardrobe wallet instantly. Sellers see the outcome and reasons on the order page.',
    ],
  },
  {
    id: 'appeals',
    number: 6,
    title: 'Appeals',
    paragraphs: [
      'Either side can appeal once within 7 days of a decision if there’s new evidence or the decision didn’t follow this policy. A different, senior mediator reviews the appeal and their decision is final.',
    ],
  },
]
</script>

<template>
  <PolicyShell title="Escrow & disputes" effective="Oct 1, 2026" version="2.0" :read-minutes="8" :sections="sections">
    <PolicySummary :items="summary" />

    <PolicySection id="escrow" :number="1" title="How escrow works" lead="When you pay, our payment partner captures the funds into a balance controlled by Pilotwardrobe. The seller can see the payment is secured but can’t withdraw it until the order is released.">
      <div class="pw-info-card pw-life">
        <div class="pw-life__head">
          <h3 class="pw-info-card-title">The life of an order</h3>
          <span class="pw-muted">Every step is logged and visible on the order page</span>
        </div>
        <ol class="pw-life__row" role="list" aria-label="Normal path">
          <template v-for="(s, i) in happy" :key="s.code">
            <li class="pw-life__step" :class="`is-${s.tone}`"><span>{{ s.code }}</span>{{ s.body }}</li>
            <ChevronRight v-if="i < happy.length - 1" :size="16" class="pw-life__arrow" aria-hidden="true" />
          </template>
        </ol>
        <ol class="pw-life__row pw-life__row--dispute" role="list" aria-label="If a dispute is raised">
          <template v-for="(s, i) in dispute" :key="s.code">
            <li class="pw-life__step" :class="`is-${s.tone}`"><span>{{ s.code }}</span>{{ s.body }}</li>
            <ChevronRight v-if="i < dispute.length - 1" :size="16" class="pw-life__arrow" aria-hidden="true" />
          </template>
        </ol>
      </div>
    </PolicySection>

    <PolicySection id="release" :number="2" title="Release timing">
      <div class="pw-info-grid pw-info-grid--3">
        <div v-for="r in release" :key="r.title" class="pw-info-card">
          <span class="pw-info-icon"><component :is="r.icon" :size="16" aria-hidden="true" /></span>
          <h3>{{ r.title }}</h3>
          <p>{{ r.body }}</p>
        </div>
      </div>
    </PolicySection>

    <PolicySection id="stages" :number="3" title="Dispute stages">
      <ol class="pw-info-grid pw-info-grid--4" role="list">
        <li v-for="(s, i) in stages" :key="s.title" class="pw-info-card pw-stage" :class="{ 'is-final': s.final }">
          <span class="pw-info-num" :class="{ 'pw-info-num--success': s.final }">{{ i + 1 }}</span>
          <h3>{{ s.title }}</h3>
          <p class="pw-stage__when">{{ s.when }}</p>
          <p>{{ s.body }}</p>
        </li>
      </ol>
    </PolicySection>

    <PolicySection id="evidence" :number="4" title="Evidence that helps">
      <div class="pw-info-card">
        <ul class="pw-evidence" role="list">
          <li v-for="e in evidence" :key="e"><Camera :size="16" aria-hidden="true" />{{ e }}</li>
        </ul>
      </div>
      <p class="pw-info-callout pw-info-callout--danger">
        <Flag :size="16" aria-hidden="true" />
        Trades arranged or paid outside Pilotwardrobe aren’t covered by escrow or disputes. Never send money by bank transfer to a seller directly.
      </p>
    </PolicySection>

    <PolicyAccordion :items="collapsed" />
  </PolicyShell>
</template>

<style scoped>
.pw-life__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--pw-space-2);
}

.pw-life__head span {
  font-size: var(--pw-text-xs);
}

.pw-life__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-2);
  margin-top: var(--pw-space-4);
}

.pw-life__row--dispute {
  margin-top: var(--pw-space-5);
  padding-top: var(--pw-space-4);
  border-top: 1px dashed var(--pw-danger-600);
}

.pw-life__step {
  display: grid;
  gap: 2px;
  padding: var(--pw-space-3);
  border-radius: var(--pw-radius-md);
  font-size: var(--pw-text-xs);
  color: var(--pw-ink-2);
}

.pw-life__step span {
  font-family: var(--pw-font-mono);
  font-size: var(--pw-text-2xs);
  font-weight: var(--pw-weight-semibold);
  text-transform: uppercase;
  color: var(--pw-navy-700);
}

.pw-life__step.is-plain,
.pw-life__step.is-tint {
  background: var(--pw-navy-50);
}

.pw-life__step.is-tint {
  background: var(--pw-navy-100);
}

.pw-life__step.is-navy {
  background: var(--pw-navy-900);
  color: #fff;
}

.pw-life__step.is-navy span {
  color: #fff;
}

.pw-life__step.is-green {
  background: var(--pw-success-100);
}

.pw-life__step.is-green span {
  color: var(--pw-success-700);
}

.pw-life__step.is-red {
  background: var(--pw-danger-100);
}

.pw-life__step.is-red span {
  color: var(--pw-danger-600);
}

.pw-life__step.is-amber {
  background: var(--pw-warning-100);
}

.pw-life__step.is-amber span {
  color: var(--pw-warning-700);
}

.pw-life__arrow {
  justify-self: center;
  transform: rotate(90deg);
  color: var(--pw-subtle);
}

.pw-stage {
  border-top: 3px solid var(--pw-navy-700);
}

.pw-stage.is-final {
  border-top-color: var(--pw-success-600);
}

.pw-stage h3 {
  font-family: var(--pw-font-body);
  font-size: var(--pw-text-sm);
}

.pw-stage .pw-stage__when {
  margin-top: var(--pw-space-1);
  font-family: var(--pw-font-mono);
  font-size: var(--pw-text-2xs);
  text-transform: uppercase;
  color: var(--pw-gold-600);
}

.pw-stage.is-final .pw-stage__when {
  color: var(--pw-success-600);
}

.pw-evidence {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-3);
  font-size: var(--pw-text-sm);
  color: var(--pw-ink-2);
}

.pw-evidence li {
  display: flex;
  align-items: flex-start;
  gap: var(--pw-space-3);
}

.pw-evidence svg {
  flex: none;
  margin-top: 2px;
  color: var(--pw-navy-700);
}

@media (min-width: 768px) {
  .pw-life__row {
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
  }
  .pw-life__row--dispute {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr) auto minmax(0, 1.2fr) auto minmax(0, 1.2fr);
  }
  .pw-life__row--dispute::before {
    content: '';
  }
  .pw-life__arrow {
    transform: none;
  }
}
</style>
