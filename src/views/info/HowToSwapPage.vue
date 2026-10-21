<script setup lang="ts">
import { ArrowLeftRight, Check, Flag, Lock, MessageCircle, Ruler, Search, Send, ShieldCheck, Tag } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import InfoHero from '@/components/info/InfoHero.vue'
import { useSeo } from '@/composables/useSeo'
import { PLATFORM } from '@/content/info/nav'
import oneX from '@/assets/info/david-clark-onex.webp'
import boseA20 from '@/assets/info/bose-a20.webp'

useSeo({
  title: 'How to swap aviation gear',
  description: 'Trade gear pilot to pilot with escrow on both sides — five steps from proposal to landed.',
  canonicalPath: '/how-to-swap',
})

const steps = [
  { icon: Search, title: 'Find a swap-friendly listing', body: 'Look for the SWAP badge or filter Listing type → Swap. The owner has said they’ll consider trades.' },
  { icon: ArrowLeftRight, title: 'Build your proposal', body: 'Pick one or more items from your hangar. Add a cash top-up if the values don’t line up.' },
  { icon: MessageCircle, title: 'Negotiate in chat', body: 'The owner can accept, decline or counter with different items or a new top-up.' },
  { icon: Send, title: 'Both sides ship', body: `Once accepted, each side has ${PLATFORM.dispatchDays} days to ship with tracking. Escrow holds both items.` },
  { icon: Check, title: 'Both confirm landed', body: `Each side gets a ${PLATFORM.inspectionHours}-hour inspection window. Escrow releases when both confirm.` },
]

const stages = ['Accepted', 'Packed', 'Airborne', 'On approach', 'Goods landed']
const lanes = [
  { title: 'Your ONE-X', route: 'Lagos → Abuja', image: oneX, reached: 2 },
  { title: 'Their Bose A20', route: 'Accra → Lagos', image: boseA20, reached: 3 },
]

const rules = [
  { icon: ShieldCheck, title: 'Verified accounts only', body: 'Both sides must have completed ID verification. Swaps over $500 also need a verified pilot licence on at least one side.' },
  { icon: Tag, title: 'Items must be live listings', body: 'Every item you offer has to be an active listing in your hangar with photos and a stated condition.' },
  { icon: Ruler, title: 'Sizes checked with Fit Kit', body: 'For uniforms and headset cushions, we compare your Fit Kit with the other pilot’s before the proposal goes out.' },
]
</script>

<template>
  <div>
    <InfoHero
      eyebrow="Guides · How to swap"
      title="Trade gear pilot to pilot, with escrow on both sides"
      lead="Moving from the 737 to the A320? Swap your type-specific kit for what you need next. Both items are tracked and protected until each side confirms they landed."
      :meta="['6 min read', 'Updated Oct 2026']"
    >
      <template #actions>
        <AppButton variant="gold" size="lg" :to="{ name: 'marketplace', query: { deal: 'swaps' } }">
          <template #icon><ArrowLeftRight :size="18" /></template>
          Browse swap listings
        </AppButton>
        <AppButton variant="inverse" size="lg" :to="{ name: 'hangar-offers' }">Propose a swap</AppButton>
      </template>
      <template #aside>
        <div class="pw-swapcard" aria-label="Example swap proposal">
          <div class="pw-swapcard__head">
            <strong>Swap proposal #SW-2207</strong>
            <span class="pw-info-pill pw-info-pill--success">Balanced</span>
          </div>
          <div class="pw-swapcard__items">
            <figure>
              <div class="pw-swapcard__img"><img :src="oneX" alt="" width="232" height="230" /></div>
              <figcaption><strong>David Clark ONE-X</strong><small>You give · Like new</small><span>$615</span></figcaption>
            </figure>
            <div class="pw-swapcard__mid" aria-hidden="true">
              <span class="pw-swapcard__swap"><ArrowLeftRight :size="18" /></span>
              <span class="pw-swapcard__topup">+ $130</span>
            </div>
            <figure>
              <div class="pw-swapcard__img"><img :src="boseA20" alt="" width="640" height="349" /></div>
              <figcaption><strong>Bose A20 Headset</strong><small>You receive · Like new</small><span>$745</span></figcaption>
            </figure>
          </div>
          <p class="pw-swapcard__note"><Lock :size="14" aria-hidden="true" /> Both items and the $130 top-up are held in escrow until both sides confirm landed.</p>
        </div>
      </template>
    </InfoHero>

    <section class="pw-info-band" aria-labelledby="flight-plan">
      <div class="pw-container">
        <div class="pw-info-head">
          <p class="pw-info-eyebrow">The flight plan</p>
          <h2 id="flight-plan" class="pw-info-h2">Five steps from proposal to landed</h2>
        </div>
        <ol class="pw-info-grid pw-info-grid--5" role="list">
          <li v-for="(s, i) in steps" :key="s.title" class="pw-info-card pw-swapstep">
            <div class="pw-swapstep__top">
              <span class="pw-info-num">{{ i + 1 }}</span>
              <component :is="s.icon" :size="18" class="pw-swapstep__icon" aria-hidden="true" />
            </div>
            <h3>{{ s.title }}</h3>
            <p>{{ s.body }}</p>
          </li>
        </ol>

        <div class="pw-swap2">
          <section class="pw-info-card" aria-labelledby="tracker">
            <div class="pw-swap2__head">
              <h3 id="tracker" class="pw-info-card-title">Dual-flight tracker</h3>
              <span class="pw-muted pw-swap2__note">Escrow releases only when both lanes reach Goods landed</span>
            </div>
            <div class="pw-tracker">
              <div class="pw-tracker__stages" aria-hidden="true">
                <span />
                <span v-for="st in stages" :key="st">{{ st }}</span>
              </div>
              <div v-for="lane in lanes" :key="lane.title" class="pw-tracker__lane">
                <div class="pw-tracker__item">
                  <img :src="lane.image" alt="" width="40" height="40" />
                  <span><strong>{{ lane.title }}</strong><small>{{ lane.route }}</small></span>
                </div>
                <ol class="pw-tracker__track" role="list" :aria-label="`${lane.title}: ${stages[lane.reached]}`">
                  <li v-for="(st, i) in stages" :key="st" :class="{ 'is-done': i < lane.reached, 'is-current': i === lane.reached }">
                    <span class="sr-only">{{ st }}{{ i < lane.reached ? ' — done' : i === lane.reached ? ' — current' : '' }}</span>
                  </li>
                </ol>
              </div>
            </div>
            <dl class="pw-swap2__facts">
              <div><dt>$1,490 value · 2 items + $130</dt><dd>In escrow</dd></div>
              <div><dt>Opens when the A20 lands</dt><dd>Your inspection</dd></div>
              <div><dt>Sat, Oct 26</dt><dd>Est. release</dd></div>
            </dl>
          </section>

          <section class="pw-info-card" aria-labelledby="balance">
            <h3 id="balance" class="pw-info-card-title">Balancing value with a top-up</h3>
            <p class="pw-muted pw-swap2__sub">We show both sides’ listed values so the gap is clear before you send.</p>
            <div class="pw-balance">
              <div class="pw-balance__row"><span>You give</span><span>$615 + $130</span></div>
              <div class="pw-balance__bar">
                <span class="pw-balance__seg" style="flex: 615">ONE-X · $615</span>
                <span class="pw-balance__seg pw-balance__seg--cash" style="flex: 130">Cash</span>
              </div>
              <div class="pw-balance__row"><span>You receive</span><span>$745</span></div>
              <div class="pw-balance__bar">
                <span class="pw-balance__seg pw-balance__seg--receive" style="flex: 745">Bose A20 · $745</span>
              </div>
            </div>
            <dl class="pw-balance__fees">
              <div><dt>Fees on items</dt><dd>None</dd></div>
              <div><dt>Fees on top-up</dt><dd>{{ PLATFORM.commissionPercent }}% · $10.40</dd></div>
              <div><dt>Swap protection</dt><dd>{{ PLATFORM.swapProtectionPerSide }} per side</dd></div>
              <div><dt>Inspection window</dt><dd>{{ PLATFORM.inspectionHours }} hours each</dd></div>
            </dl>
          </section>
        </div>
      </div>
    </section>

    <section class="pw-info-band pw-info-band--white" aria-labelledby="qualifies">
      <div class="pw-container">
        <div class="pw-info-head">
          <p class="pw-info-eyebrow">Before you propose</p>
          <h2 id="qualifies" class="pw-info-h2">Who can swap, and what qualifies</h2>
        </div>
        <div class="pw-info-grid pw-info-grid--3">
          <div v-for="r in rules" :key="r.title" class="pw-info-card">
            <span class="pw-info-icon pw-info-icon--lg"><component :is="r.icon" :size="18" aria-hidden="true" /></span>
            <h3>{{ r.title }}</h3>
            <p>{{ r.body }}</p>
          </div>
        </div>
        <p class="pw-info-callout">
          <Flag :size="16" aria-hidden="true" />
          Swaps can’t include photography licences, digital charts or first-party Pilotwardrobe merchandise. If a swap partner asks you to ship before acceptance or pay outside escrow, report it from the chat menu.
        </p>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Hero card */
.pw-swapcard {
  padding: var(--pw-space-5);
  border-radius: var(--pw-radius-xl);
  background: var(--pw-surface);
  box-shadow: var(--pw-shadow-lg);
}

.pw-swapcard__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--pw-space-3);
  font-size: var(--pw-text-sm);
}

.pw-swapcard__items {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: var(--pw-space-3);
  align-items: start;
  margin-top: var(--pw-space-4);
}

.pw-swapcard figure {
  margin: 0;
}

.pw-swapcard__img {
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: var(--pw-radius-md);
  background: var(--pw-surface-sunken);
}

.pw-swapcard__img img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.pw-swapcard figcaption {
  display: grid;
  margin-top: var(--pw-space-3);
  font-size: var(--pw-text-sm);
}

.pw-swapcard figcaption small {
  color: var(--pw-muted);
  font-size: var(--pw-text-2xs);
}

.pw-swapcard figcaption span {
  margin-top: var(--pw-space-2);
  font-family: var(--pw-font-display);
  font-size: var(--pw-text-lg);
  font-weight: var(--pw-weight-bold);
}

.pw-swapcard__mid {
  display: grid;
  justify-items: center;
  gap: var(--pw-space-2);
  margin-top: 30%;
}

.pw-swapcard__swap {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--pw-navy-700);
  color: #fff;
}

.pw-swapcard__topup {
  padding: 2px 6px;
  border-radius: var(--pw-radius-xs);
  background: var(--pw-gold-100);
  color: var(--pw-gold-600);
  font-size: var(--pw-text-2xs);
  font-weight: var(--pw-weight-semibold);
}

.pw-swapcard__note {
  display: flex;
  gap: var(--pw-space-2);
  margin-top: var(--pw-space-4);
  padding: var(--pw-space-3);
  border-radius: var(--pw-radius-md);
  background: var(--pw-navy-100);
  font-size: var(--pw-text-xs);
  color: var(--pw-ink-2);
}

.pw-swapcard__note svg {
  flex: none;
  margin-top: 1px;
}

/* Steps */
.pw-swapstep__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pw-swapstep__icon {
  color: var(--pw-subtle);
}

/* Tracker + balance */
.pw-swap2 {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-4);
  margin-top: var(--pw-space-8);
}

.pw-swap2__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--pw-space-2);
}

.pw-swap2__note,
.pw-swap2__sub {
  font-size: var(--pw-text-xs);
}

.pw-swap2__sub {
  margin-top: var(--pw-space-1);
}

.pw-tracker {
  margin-top: var(--pw-space-5);
  overflow-x: auto;
}

.pw-tracker__stages,
.pw-tracker__lane {
  display: grid;
  grid-template-columns: 160px repeat(5, minmax(56px, 1fr));
  align-items: center;
  min-width: 520px;
}

.pw-tracker__stages span {
  font-size: var(--pw-text-2xs);
  font-weight: var(--pw-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--pw-muted);
}

.pw-tracker__lane {
  margin-top: var(--pw-space-4);
}

.pw-tracker__item {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  font-size: var(--pw-text-sm);
}

.pw-tracker__item img {
  width: 40px;
  height: 40px;
  object-fit: contain;
  border-radius: var(--pw-radius-sm);
  background: var(--pw-surface-sunken);
}

.pw-tracker__item span {
  display: grid;
}

.pw-tracker__item small {
  color: var(--pw-muted);
  font-size: var(--pw-text-2xs);
}

.pw-tracker__track {
  display: contents;
}

.pw-tracker__track li {
  position: relative;
  height: 20px;
}

/* Rail segment to the next stage + node. */
.pw-tracker__track li::before {
  content: '';
  position: absolute;
  top: 9px;
  left: 6px;
  right: -6px;
  height: 2px;
  background: var(--pw-border);
}

.pw-tracker__track li:last-child::before {
  display: none;
}

.pw-tracker__track li::after {
  content: '';
  position: absolute;
  top: 4px;
  left: 0;
  width: 12px;
  height: 12px;
  border: 2px solid var(--pw-border-strong);
  border-radius: 50%;
  background: var(--pw-surface);
}

.pw-tracker__track li.is-done::before {
  background: var(--pw-navy-700);
}

.pw-tracker__track li.is-done::after {
  border-color: var(--pw-navy-700);
  background: var(--pw-navy-700);
}

.pw-tracker__track li.is-current::after {
  top: 1px;
  left: -3px;
  width: 18px;
  height: 18px;
  border: 3px solid var(--pw-navy-700);
  box-shadow: 0 0 0 4px var(--pw-navy-100);
}

.pw-swap2__facts {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-3);
  margin-top: var(--pw-space-6);
  padding-top: var(--pw-space-5);
  border-top: 1px solid var(--pw-border);
}

.pw-swap2__facts div {
  padding: var(--pw-space-3) var(--pw-space-4);
  border-radius: var(--pw-radius-md);
  background: var(--pw-surface-sunken);
}

.pw-swap2__facts dt {
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-medium);
  color: var(--pw-ink);
}

.pw-swap2__facts dd {
  margin: 0;
  font-size: var(--pw-text-2xs);
  color: var(--pw-muted);
}

.pw-balance {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-2);
  margin-top: var(--pw-space-5);
}

.pw-balance__row {
  display: flex;
  justify-content: space-between;
  font-size: var(--pw-text-xs);
  color: var(--pw-ink-2);
}

.pw-balance__row span:last-child {
  font-weight: var(--pw-weight-semibold);
  color: var(--pw-ink);
}

.pw-balance__bar {
  display: flex;
  overflow: hidden;
  min-height: 30px;
  margin-bottom: var(--pw-space-3);
  border-radius: var(--pw-radius-sm);
}

.pw-balance__seg {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 0 var(--pw-space-3);
  background: var(--pw-navy-700);
  color: #fff;
  font-size: var(--pw-text-2xs);
  font-weight: var(--pw-weight-semibold);
  white-space: nowrap;
  overflow: hidden;
}

.pw-balance__seg--cash {
  justify-content: center;
  background: var(--pw-gold-500);
}

.pw-balance__seg--receive {
  background: var(--pw-navy-500);
}

.pw-balance__fees {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--pw-space-2) var(--pw-space-5);
  margin-top: var(--pw-space-3);
  padding-top: var(--pw-space-4);
  border-top: 1px solid var(--pw-border);
  font-size: var(--pw-text-xs);
}

.pw-balance__fees div {
  display: flex;
  justify-content: space-between;
  gap: var(--pw-space-2);
}

.pw-balance__fees dt {
  color: var(--pw-muted);
}

.pw-balance__fees dd {
  margin: 0;
  font-weight: var(--pw-weight-semibold);
  color: var(--pw-ink);
  text-align: right;
}

@media (min-width: 640px) {
  .pw-swap2__facts {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .pw-swap2 {
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  }
}

@media (max-width: 479px) {
  .pw-balance__fees {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
