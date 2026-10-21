<script setup lang="ts">
import { ArrowLeftRight, Clock, Lock, RotateCcw, Scale } from '@lucide/vue'
import PolicyShell from '@/components/info/PolicyShell.vue'
import PolicySummary from '@/components/info/PolicySummary.vue'
import PolicySection from '@/components/info/PolicySection.vue'
import PolicyAccordion from '@/components/info/PolicyAccordion.vue'
import { useSeo } from '@/composables/useSeo'
import { PLATFORM } from '@/content/info/nav'

useSeo({ title: 'Returns & refunds', description: 'How returns work on Pilotwardrobe, what’s covered, and how fast refunds reach you.', canonicalPath: '/returns' })

const H = PLATFORM.inspectionHours

const sections = [
  { id: 'how', title: 'How returns work' },
  { id: 'covered', title: 'What’s covered' },
  { id: 'types', title: 'Types of refund' },
  { id: 'money', title: 'Where your money goes' },
  { id: 'shipping', title: 'Return shipping' },
  { id: 'swaps', title: 'Swaps' },
  { id: 'exceptions', title: 'Exceptions' },
]

const summary = [
  { icon: Clock, title: `${H} hours to check`, body: 'Your inspection window starts when the carrier marks your order landed.' },
  { icon: Lock, title: 'Money stays in escrow', body: 'The seller isn’t paid while a return is open.' },
  { icon: RotateCcw, title: 'Free return label', body: 'If the item isn’t as described, the seller covers return freight.' },
]

const timeline = [
  { when: 'Day 0', title: 'Goods landed', body: 'Carrier confirms delivery', tone: 'navy' },
  { when: `0–${H} h`, title: 'Inspection window', body: 'Check the item; report an issue', tone: 'gold' },
  { when: `+${PLATFORM.sellerReplyHours} h`, title: 'Seller responds', body: 'Accept, offer partial, or contest', tone: 'navy' },
  { when: `+${PLATFORM.dispatchDays} days`, title: 'Return shipped', body: 'Prepaid label, tracked', tone: 'navy' },
  { when: 'On landed', title: 'Refund issued', body: 'Seller confirms return arrived', tone: 'success' },
]

const covered = [
  { reason: 'Not as described', example: 'Wrong model, undisclosed damage or missing parts', outcome: 'Full refund', tone: 'success', payer: 'Seller' },
  { reason: 'Arrived damaged', example: `Damage in transit, reported within ${H} h`, outcome: 'Full refund', tone: 'success', payer: 'Carrier claim' },
  { reason: 'Didn’t arrive', example: 'No delivery scan after 10 days in transit', outcome: 'Full refund', tone: 'success', payer: 'Seller' },
  { reason: 'Wrong size', example: 'Fit Kit was matched but item doesn’t fit', outcome: 'Return if seller allows', tone: 'warning', payer: 'Buyer' },
  { reason: 'Changed my mind', example: 'Item is exactly as listed', outcome: 'Not covered', tone: 'neutral', payer: '—' },
]

const types = [
  { icon: RotateCcw, title: 'Full refund', body: 'Item price plus freight back to your original payment method.' },
  { icon: Scale, title: 'Partial refund', body: 'Keep the item and get part of the price back. Both sides agree the amount.' },
  { icon: ArrowLeftRight, title: 'Split refund', body: 'For swaps: each side’s top-up and fees are returned in proportion.' },
]

const speed = [
  { method: 'Wallet balance', time: 'Instant', pct: 100, green: true },
  { method: 'Card', time: '5–10 business days', pct: 30 },
  { method: 'PayPal', time: '3–5 business days', pct: 55 },
]

const collapsed = [
  { id: 'shipping', number: 5, title: 'Return shipping', paragraphs: ['When a return is agreed, we generate a prepaid, tracked label from the order page. Pack the item as it arrived, including every accessory, and ship it within 5 days.', 'If the item wasn’t as described, the seller pays for the label. For accepted size returns, the buyer pays. Keep the drop-off receipt until the refund lands.'] },
  { id: 'swaps', number: 6, title: 'Swaps', paragraphs: ['Each side of a swap has its own inspection window. If one item isn’t as described, that side can return it; the other side’s item comes back too unless both agree a split refund of the top-up.'] },
  { id: 'exceptions', number: 7, title: 'Exceptions', paragraphs: ['Digital downloads and photography licences can’t be returned once downloaded. Items marked “sold as seen” are covered only if they don’t arrive or are materially different from the photos.', 'Trades arranged or paid outside Pilotwardrobe aren’t covered by escrow or this policy.'] },
]
</script>

<template>
  <PolicyShell title="Returns & refunds" effective="Oct 1, 2026" version="1.6" :read-minutes="6" :sections="sections">
    <PolicySummary :items="summary" />

    <PolicySection id="how" :number="1" title="How returns work">
      <div class="pw-info-card">
        <h3 class="pw-info-card-title">Return timeline</h3>
        <ol class="pw-rtl" role="list">
          <li v-for="(t, i) in timeline" :key="t.title" :class="[`is-${t.tone}`, { 'is-first': i === 0 }]">
            <span class="pw-rtl__dot" aria-hidden="true" />
            <span class="pw-rtl__when">{{ t.when }}</span>
            <strong>{{ t.title }}</strong>
            <small>{{ t.body }}</small>
          </li>
        </ol>
      </div>
    </PolicySection>

    <PolicySection id="covered" :number="2" title="What’s covered">
      <div class="pw-info-table-wrap">
        <table class="pw-info-table">
          <thead><tr><th scope="col">Reason</th><th scope="col">Example</th><th scope="col">Outcome</th><th scope="col">Return freight paid by</th></tr></thead>
          <tbody>
            <tr v-for="c in covered" :key="c.reason">
              <th scope="row">{{ c.reason }}</th>
              <td>{{ c.example }}</td>
              <td><span class="pw-info-pill" :class="`pw-info-pill--${c.tone}`">{{ c.outcome }}</span></td>
              <td>{{ c.payer }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </PolicySection>

    <PolicySection id="types" :number="3" title="Types of refund">
      <div class="pw-info-grid pw-info-grid--3">
        <div v-for="t in types" :key="t.title" class="pw-info-card">
          <span class="pw-info-icon"><component :is="t.icon" :size="16" aria-hidden="true" /></span>
          <h3>{{ t.title }}</h3>
          <p>{{ t.body }}</p>
        </div>
      </div>
    </PolicySection>

    <PolicySection id="money" :number="4" title="Where your money goes">
      <div class="pw-info-card">
        <ul class="pw-speed" role="list">
          <li v-for="s in speed" :key="s.method">
            <strong>{{ s.method }}</strong>
            <span class="pw-info-bar" aria-hidden="true"><span :class="{ 'is-green': s.green }" :style="{ width: `${s.pct}%` }" /></span>
            <span class="pw-speed__time">{{ s.time }}</span>
          </li>
        </ul>
        <p class="pw-speed__note">Bar length shows relative speed. The buyer service fee is refunded whenever the item price is refunded in full.</p>
      </div>
    </PolicySection>

    <PolicyAccordion :items="collapsed" />
  </PolicyShell>
</template>

<style scoped>
.pw-rtl {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-5);
  margin-top: var(--pw-space-5);
}

.pw-rtl li {
  position: relative;
  display: grid;
  gap: 2px;
  padding-left: 28px;
  font-size: var(--pw-text-sm);
}

.pw-rtl__dot {
  position: absolute;
  top: 2px;
  left: 0;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--pw-navy-700);
}

.is-gold .pw-rtl__dot {
  background: var(--pw-gold-500);
}

.is-success .pw-rtl__dot {
  background: var(--pw-success-600);
}

.pw-rtl__when {
  font-family: var(--pw-font-mono);
  font-size: var(--pw-text-2xs);
  color: var(--pw-muted);
}

.is-gold .pw-rtl__when {
  color: var(--pw-gold-600);
}

.is-success .pw-rtl__when {
  color: var(--pw-success-600);
}

.pw-rtl small {
  color: var(--pw-muted);
  font-size: var(--pw-text-xs);
}

.pw-speed {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-3);
}

.pw-speed li {
  display: grid;
  grid-template-columns: minmax(0, 120px) minmax(0, 1fr) minmax(0, 140px);
  align-items: center;
  gap: var(--pw-space-4);
  font-size: var(--pw-text-sm);
}

.pw-speed .is-green {
  background: var(--pw-success-600);
}

.pw-speed__time {
  text-align: right;
  color: var(--pw-muted);
  font-size: var(--pw-text-xs);
}

.pw-speed__note {
  margin-top: var(--pw-space-4);
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

@media (min-width: 768px) {
  .pw-rtl {
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: var(--pw-space-3);
  }
  .pw-rtl li {
    padding: 24px 0 0;
  }
  /* Rail from each dot to the next; gold over the inspection window. */
  .pw-rtl li::before {
    content: '';
    position: absolute;
    top: 6px;
    left: 14px;
    right: calc(var(--pw-space-3) * -1);
    height: 2px;
    background: var(--pw-border);
  }
  .pw-rtl li:last-child::before {
    display: none;
  }
  .pw-rtl li.is-first::before {
    height: 4px;
    top: 5px;
    background: var(--pw-gold-500);
  }
}

@media (max-width: 559px) {
  .pw-speed li {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .pw-speed .pw-info-bar {
    grid-column: 1 / -1;
    grid-row: 2;
  }
}
</style>
