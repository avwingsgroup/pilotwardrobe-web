<script setup lang="ts">
import { Check, Megaphone, Sparkles, Star } from '@lucide/vue'
import InfoHero from '@/components/info/InfoHero.vue'
import { useSeo } from '@/composables/useSeo'
import { PLATFORM } from '@/content/info/nav'

useSeo({
  title: 'Seller fees',
  description: `No listing fees. You pay ${PLATFORM.commissionPercent}% only when an item sells and the buyer confirms it landed.`,
  canonicalPath: '/seller-fees',
})

const rate = PLATFORM.commissionPercent
const keep = 100 - rate
const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const schedule = [
  { fee: 'Listing an item', rate: 'Free', free: true, how: 'No insertion or relisting fees' },
  { fee: 'Marketplace sale', rate: `${rate}%`, how: 'Of the item price, taken at payout' },
  { fee: 'Swap with cash top-up', rate: `${rate}% of top-up`, how: 'Items traded are fee-free' },
  { fee: 'Swap protection', rate: `${PLATFORM.swapProtectionPerSide} per side`, how: 'Covers dual tracking and escrow' },
  { fee: 'Photography licences', rate: '20%', how: 'Of each digital download sale' },
  { fee: 'Withdrawal to bank', rate: 'Free', free: true, how: '1–2 business days' },
  { fee: 'Withdrawal to PayPal', rate: '1%', how: 'Capped at $10' },
]

const examples = [100, 250, 745, 1200].map((price) => ({ price, payout: price * (keep / 100) }))
const maxPrice = Math.max(...examples.map((e) => e.price))

const plans = [
  { name: 'Registered', price: 'Free', sub: 'For occasional sellers', perks: ['Up to 5 active listings', `${rate}% commission`, 'Standard search placement'] },
  { name: 'Verified pilot', price: 'Free', sub: 'Licence + ID verified', perks: ['Unlimited listings', `${rate}% commission`, 'Verified badge and swap access', 'Payouts within 24 h of release'], featured: true },
  { name: 'Hangar Pro', price: 'From $49/mo', sub: 'For schools, FBOs and shops', perks: ['Bulk listing tools and CSV import', 'Invoices and tax documents', 'Reduced 6% commission', 'Two free boosts each month'] },
]

const boosts = [
  { icon: Sparkles, name: 'Boost', body: '7 days higher in search and category pages', price: '$2.99' },
  { icon: Star, name: 'Featured', body: '7 days in the homepage Featured rail', price: '$9.99' },
  { icon: Megaphone, name: 'Spotlight', body: '14 days featured plus a slot in the weekly email', price: '$24.99' },
]

// Donut: circumference for r = 52.
const C = 2 * Math.PI * 52
</script>

<template>
  <div>
    <InfoHero
      eyebrow="Guides · Seller fees"
      title="No listing fees. One clear commission when you sell."
      :lead="`You pay ${rate}% only when an item sells and the buyer confirms it landed. Everything else is optional.`"
      :meta="['3 min read', 'Fees effective Oct 1, 2026']"
    >
      <template #aside>
        <div class="pw-feecard">
          <div class="pw-feecard__head">
            <strong>Example: $250 headset sale</strong>
            <span class="pw-muted">Verified pilots</span>
          </div>
          <div class="pw-feecard__body">
            <svg class="pw-feecard__donut" viewBox="0 0 128 128" role="img" :aria-label="`You keep ${keep}%`">
              <circle cx="64" cy="64" r="52" fill="none" stroke="var(--pw-gold-500)" stroke-width="14" />
              <circle cx="64" cy="64" r="52" fill="none" stroke="var(--pw-navy-700)" stroke-width="14" :stroke-dasharray="`${(C * keep) / 100} ${C}`" transform="rotate(-90 64 64)" :stroke-dashoffset="-(C * rate) / 100" />
              <text x="64" y="64" text-anchor="middle" font-size="24" font-weight="700" fill="var(--pw-ink)">{{ keep }}%</text>
              <text x="64" y="82" text-anchor="middle" font-size="8" letter-spacing="1" fill="var(--pw-muted)">YOU KEEP</text>
            </svg>
            <dl class="pw-feecard__calc">
              <div><dt>Sale price</dt><dd>$250.00</dd></div>
              <div><dt><i class="is-gold" />Commission {{ rate }}%</dt><dd>−$20.00</dd></div>
              <div class="pw-feecard__total"><dt><i />Your payout</dt><dd>$230.00</dd></div>
              <p>The buyer pays a separate {{ PLATFORM.buyerFeePercent }}% service fee ($10) at checkout. It never comes out of your payout.</p>
            </dl>
          </div>
        </div>
      </template>
    </InfoHero>

    <section class="pw-info-band" aria-label="Fee schedule">
      <div class="pw-container pw-fees2">
        <section class="pw-info-table-wrap" aria-labelledby="schedule">
          <h2 id="schedule" class="pw-info-card-title pw-fees2__title">Fee schedule</h2>
          <table class="pw-info-table">
            <thead><tr><th scope="col">Fee</th><th scope="col">Rate</th><th scope="col">How it works</th></tr></thead>
            <tbody>
              <tr v-for="r in schedule" :key="r.fee">
                <th scope="row">{{ r.fee }}</th>
                <td class="pw-fees2__rate" :class="{ 'is-free': r.free }">{{ r.rate }}</td>
                <td>{{ r.how }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="pw-info-card" aria-labelledby="keep">
          <h2 id="keep" class="pw-info-card-title">What you keep at each price</h2>
          <p class="pw-muted pw-fees2__sub">Payout after {{ rate }}% commission</p>
          <ul class="pw-keep" role="list">
            <li v-for="e in examples" :key="e.price">
              <div class="pw-keep__row"><span>${{ e.price }} sale</span><strong>{{ usd(e.payout) }}</strong></div>
              <div class="pw-keep__bar" :style="{ width: `${(e.price / maxPrice) * 100}%` }" aria-hidden="true">
                <span :style="{ flex: keep }" /><span class="is-gold" :style="{ flex: rate }" />
              </div>
            </li>
          </ul>
          <p class="pw-keep__legend" aria-hidden="true"><span><i />Payout</span><span><i class="is-gold" />Commission</span></p>
        </section>
      </div>
    </section>

    <section class="pw-info-band pw-info-band--white" aria-labelledby="accounts">
      <div class="pw-container">
        <div class="pw-info-head">
          <p class="pw-info-eyebrow">Seller accounts</p>
          <h2 id="accounts" class="pw-info-h2">Pick the account that fits how you sell</h2>
        </div>
        <div class="pw-info-grid pw-info-grid--3">
          <div v-for="p in plans" :key="p.name" class="pw-plan" :class="{ 'is-featured': p.featured }">
            <div class="pw-plan__head">
              <h3>{{ p.name }}</h3>
              <span v-if="p.featured" class="pw-plan__badge">Most popular</span>
            </div>
            <p class="pw-plan__price">{{ p.price }}</p>
            <p class="pw-plan__sub">{{ p.sub }}</p>
            <ul class="pw-info-checks" role="list">
              <li v-for="perk in p.perks" :key="perk"><Check :size="16" aria-hidden="true" />{{ perk }}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section class="pw-info-band" aria-labelledby="boost">
      <div class="pw-container">
        <div class="pw-info-head">
          <p class="pw-info-eyebrow">Optional</p>
          <h2 id="boost" class="pw-info-h2">Boost a listing</h2>
          <p class="pw-info-lead">Promotions are charged up front and never affect your commission.</p>
        </div>
        <div class="pw-info-grid pw-info-grid--3">
          <div v-for="b in boosts" :key="b.name" class="pw-info-card pw-boost">
            <span class="pw-info-icon pw-info-icon--lg pw-info-icon--gold"><component :is="b.icon" :size="18" aria-hidden="true" /></span>
            <span class="pw-boost__text"><strong>{{ b.name }}</strong><small>{{ b.body }}</small></span>
            <span class="pw-boost__price">{{ b.price }}</span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.pw-feecard {
  padding: var(--pw-space-5);
  border-radius: var(--pw-radius-xl);
  background: var(--pw-surface);
  box-shadow: var(--pw-shadow-lg);
}

.pw-feecard__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--pw-space-2);
  font-size: var(--pw-text-sm);
}

.pw-feecard__head span {
  font-size: var(--pw-text-xs);
}

.pw-feecard__body {
  display: grid;
  grid-template-columns: 128px minmax(0, 1fr);
  gap: var(--pw-space-5);
  align-items: center;
  margin-top: var(--pw-space-4);
}

.pw-feecard__donut {
  width: 128px;
  height: 128px;
}

.pw-feecard__calc {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-2);
  font-size: var(--pw-text-xs);
}

.pw-feecard__calc div {
  display: flex;
  justify-content: space-between;
  gap: var(--pw-space-2);
}

.pw-feecard__calc dt {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--pw-muted);
}

.pw-feecard__calc dd {
  margin: 0;
  font-weight: var(--pw-weight-medium);
}

.pw-feecard__calc i,
.pw-keep__legend i {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: var(--pw-navy-700);
}

.pw-feecard__calc i.is-gold,
.pw-keep__legend i.is-gold {
  background: var(--pw-gold-500);
}

.pw-feecard__total dt {
  color: var(--pw-ink);
  font-weight: var(--pw-weight-semibold);
}

.pw-feecard__total dd {
  font-family: var(--pw-font-display);
  font-size: var(--pw-text-xl);
  font-weight: var(--pw-weight-bold);
  color: var(--pw-success-600);
}

.pw-feecard__calc p {
  font-size: var(--pw-text-2xs);
  color: var(--pw-muted);
}

.pw-fees2 {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-4);
}

.pw-fees2__title {
  padding: var(--pw-space-4) var(--pw-space-4) var(--pw-space-3);
}

.pw-fees2__rate {
  font-weight: var(--pw-weight-semibold);
  color: var(--pw-navy-700) !important;
}

.pw-fees2__rate.is-free {
  color: var(--pw-success-600) !important;
}

.pw-fees2__sub {
  margin-top: var(--pw-space-1);
  font-size: var(--pw-text-xs);
}

.pw-keep {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-4);
  margin-top: var(--pw-space-5);
}

.pw-keep__row {
  display: flex;
  justify-content: space-between;
  font-size: var(--pw-text-xs);
}

.pw-keep__bar {
  display: flex;
  overflow: hidden;
  height: 12px;
  margin-top: var(--pw-space-2);
  border-radius: 3px;
}

.pw-keep__bar span {
  background: var(--pw-navy-700);
}

.pw-keep__bar span.is-gold {
  background: var(--pw-gold-500);
}

.pw-keep__legend {
  display: flex;
  gap: var(--pw-space-4);
  margin-top: var(--pw-space-4);
  font-size: var(--pw-text-2xs);
  color: var(--pw-muted);
}

.pw-keep__legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.pw-plan {
  padding: var(--pw-space-5);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-surface);
}

.pw-plan.is-featured {
  border-color: var(--pw-navy-900);
  background: var(--pw-navy-900);
  color: #fff;
}

.pw-plan__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--pw-space-2);
}

.pw-plan__head h3 {
  font-size: var(--pw-text-md);
  color: inherit;
}

.pw-plan__badge {
  padding: 3px 8px;
  border-radius: var(--pw-radius-xs);
  background: var(--pw-gold-500);
  color: var(--pw-navy-900);
  font-size: var(--pw-text-2xs);
  font-weight: var(--pw-weight-bold);
  text-transform: uppercase;
}

.pw-plan__price {
  margin-top: var(--pw-space-4);
  font-family: var(--pw-font-display);
  font-size: var(--pw-text-2xl);
  font-weight: var(--pw-weight-bold);
}

.pw-plan__sub {
  margin-bottom: var(--pw-space-4);
  padding-bottom: var(--pw-space-4);
  border-bottom: 1px solid var(--pw-border);
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.is-featured .pw-plan__sub {
  border-color: rgb(255 255 255 / 15%);
  color: rgb(255 255 255 / 75%);
}

.is-featured .pw-info-checks {
  color: #fff;
}

.is-featured .pw-info-checks svg {
  color: var(--pw-gold-500);
}

.pw-boost {
  display: flex;
  align-items: center;
  gap: var(--pw-space-4);
}

.pw-boost__text {
  display: grid;
  flex: 1;
  font-size: var(--pw-text-sm);
}

.pw-boost__text small {
  color: var(--pw-muted);
  font-size: var(--pw-text-xs);
}

.pw-boost__price {
  font-family: var(--pw-font-display);
  font-size: var(--pw-text-lg);
  font-weight: var(--pw-weight-bold);
}

@media (min-width: 1024px) {
  .pw-fees2 {
    grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
    align-items: start;
  }
}

@media (max-width: 479px) {
  .pw-feecard__body {
    grid-template-columns: minmax(0, 1fr);
    justify-items: center;
  }
  .pw-feecard__calc {
    width: 100%;
  }
}
</style>
