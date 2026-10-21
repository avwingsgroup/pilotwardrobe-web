<script setup lang="ts">
import { Eye, Heart, MessageCircle, Plus } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import InfoHero from '@/components/info/InfoHero.vue'
import { useSeo } from '@/composables/useSeo'
import { PLATFORM } from '@/content/info/nav'
import boseA20 from '@/assets/info/bose-a20.webp'
import dcH10 from '@/assets/info/david-clark-h10.webp'
import oneX from '@/assets/info/david-clark-onex.webp'
import bag from '@/assets/info/jeppesen-flight-bag.webp'

useSeo({
  title: 'How to sell aviation gear',
  description: `List in under five minutes. Buyers are verified pilots, payment waits in escrow, and you keep ${100 - PLATFORM.commissionPercent}% of the sale price.`,
  canonicalPath: '/how-to-sell',
})

const wizard = [
  { title: 'Photos', body: 'Up to 10 shots. The first is your cover.' },
  { title: 'Details', body: 'Title, category and aircraft types.' },
  { title: 'Condition', body: 'Pick a grade and note any wear.' },
  { title: 'Pricing', body: 'Set a price, allow offers or swaps.' },
  { title: 'Freight', body: 'Choose a parcel size and carriers.' },
  { title: 'Publish', body: 'Review and go live in minutes.' },
]

const shots = [
  { image: boseA20, w: 640, h: 349, caption: 'Front, on a plain surface', cover: true },
  { image: dcH10, w: 300, h: 284, caption: 'Serial plate and model label' },
  { image: oneX, w: 232, h: 230, caption: 'Ear seals and headband close-up' },
  { image: bag, w: 232, h: 230, caption: 'Case and every accessory' },
]

const grades = [
  { label: 'New', body: 'Unused, tags or seals intact', bars: 4, tone: 'success' },
  { label: 'Like new', body: 'Used a handful of times, no visible wear', bars: 3, tone: 'success' },
  { label: 'Good', body: 'Light marks, fully working', bars: 2, tone: 'navy' },
  { label: 'Fair', body: 'Visible wear, works as described', bars: 1, tone: 'gold' },
]

// Sales count per $40 price bucket, $480–$900 (Bose A20, last 90 days).
const histogram = [3, 5, 8, 13, 19, 27, 30, 26, 17, 10, 7, 4]
const suggested = [5, 6, 7] // buckets inside the suggested $690–$760 band

const payout = [
  { title: 'Sold', body: 'Buyer pays. Funds go straight into escrow.', state: 'done' },
  { title: `Ship within ${PLATFORM.dispatchDays} days`, body: 'Add tracking from the order page.', state: 'done' },
  { title: 'Goods landed', body: 'The carrier marks delivery.', state: 'current' },
  { title: `${PLATFORM.inspectionHours}-hour inspection`, body: 'The buyer checks the item matches your listing.', state: 'upcoming' },
  { title: 'Payout to wallet', body: 'Withdraw to your bank, free.', state: 'upcoming' },
]
</script>

<template>
  <div>
    <InfoHero
      eyebrow="Guides · How to sell"
      title="Turn idle kit into cash for your next type rating"
      :lead="`List in under five minutes. Buyers are verified pilots, payment waits in escrow, and you keep ${100 - PLATFORM.commissionPercent}% of the sale price.`"
      :meta="['7 min read', 'No listing fees']"
    >
      <template #actions>
        <AppButton variant="gold" size="lg" :to="{ name: 'listing-new' }">
          <template #icon><Plus :size="18" /></template>
          Start a listing
        </AppButton>
        <AppButton variant="inverse" size="lg" :to="{ name: 'seller-fees' }">See seller fees</AppButton>
      </template>
      <template #aside>
        <div class="pw-sellcard" aria-label="Example listing">
          <div class="pw-sellcard__main">
            <div class="pw-sellcard__img"><img :src="boseA20" alt="" width="640" height="349" /></div>
            <div class="pw-sellcard__info">
              <p class="pw-sellcard__tags"><span class="pw-info-pill pw-info-pill--success">Like new</span><span class="pw-info-pill">Swap OK</span></p>
              <p class="pw-sellcard__title">Bose A20 Aviation Headset</p>
              <p class="pw-sellcard__sub">B737 · A320 · Dual GA plugs</p>
              <p class="pw-sellcard__price">$745</p>
              <dl class="pw-sellcard__calc">
                <div><dt>Commission ({{ PLATFORM.commissionPercent }}%)</dt><dd>−$59.60</dd></div>
                <div><dt>You receive</dt><dd class="is-green">$685.40</dd></div>
              </dl>
            </div>
          </div>
          <ul class="pw-sellcard__stats" role="list">
            <li><Eye :size="14" aria-hidden="true" /> 312 views</li>
            <li><Heart :size="14" aria-hidden="true" /> 41 saves</li>
            <li><MessageCircle :size="14" aria-hidden="true" /> 6 offers</li>
          </ul>
        </div>
      </template>
    </InfoHero>

    <section class="pw-info-band" aria-labelledby="wizard">
      <div class="pw-container">
        <div class="pw-info-head">
          <p class="pw-info-eyebrow">The listing wizard</p>
          <h2 id="wizard" class="pw-info-h2">Six steps, saved as you go</h2>
        </div>
        <ol class="pw-wizard" role="list">
          <li v-for="(s, i) in wizard" :key="s.title">
            <span class="pw-info-num" :class="{ 'pw-info-num--gold': i === wizard.length - 1 }">{{ i + 1 }}</span>
            <h3>{{ s.title }}</h3>
            <p>{{ s.body }}</p>
          </li>
        </ol>
      </div>
    </section>

    <section class="pw-info-band pw-info-band--white" aria-labelledby="photos">
      <div class="pw-container">
        <div class="pw-info-head">
          <p class="pw-info-eyebrow">Photos</p>
          <h2 id="photos" class="pw-info-h2">Four shots every buyer looks for</h2>
          <p class="pw-info-lead">Listings with all four sell about twice as fast. Shoot in daylight and avoid filters.</p>
        </div>
        <ol class="pw-info-grid pw-info-grid--4" role="list">
          <li v-for="(s, i) in shots" :key="s.caption" class="pw-shot">
            <div class="pw-shot__frame" :class="{ 'is-cover': s.cover }">
              <span class="pw-shot__num">{{ i + 1 }}</span>
              <img :src="s.image" alt="" :width="s.w" :height="s.h" loading="lazy" />
            </div>
            <p>{{ s.caption }}</p>
          </li>
        </ol>
      </div>
    </section>

    <section class="pw-info-band" aria-label="Condition, pricing and payouts">
      <div class="pw-container pw-info-grid pw-info-grid--3 pw-sell3">
        <section class="pw-info-card" aria-labelledby="grades">
          <h3 id="grades" class="pw-info-card-title">Condition grades</h3>
          <ul class="pw-grades" role="list">
            <li v-for="g in grades" :key="g.label">
              <span class="pw-grades__bars" :class="`is-${g.tone}`" aria-hidden="true">
                <i v-for="n in 4" :key="n" :class="{ on: n <= g.bars }" />
              </span>
              <span><strong>{{ g.label }}</strong><small>{{ g.body }}</small></span>
            </li>
          </ul>
        </section>

        <section class="pw-info-card" aria-labelledby="price">
          <div class="pw-price__head">
            <h3 id="price" class="pw-info-card-title">Price guidance</h3>
            <span class="pw-muted">Bose A20 · 84 sales, last 90 days</span>
          </div>
          <figure class="pw-price">
            <div class="pw-price__chart" role="img" aria-label="Sales by price for the Bose A20. Most sales cluster between $690 and $760, the suggested band.">
              <span class="pw-price__band" aria-hidden="true">Suggested $690–$760</span>
              <span v-for="(v, i) in histogram" :key="i" class="pw-price__bar" :class="{ 'is-in': suggested.includes(i) }" :style="{ height: `${(v / 30) * 100}%` }" />
            </div>
            <div class="pw-price__axis" aria-hidden="true"><span>$480</span><span>$620</span><span>$760</span><span>$900</span></div>
            <figcaption class="pw-muted">Listings priced inside the suggested band sold in a median of 6 days.</figcaption>
          </figure>
        </section>

        <section class="pw-info-card" aria-labelledby="paid">
          <h3 id="paid" class="pw-info-card-title">When you get paid</h3>
          <ol class="pw-paytl" role="list">
            <li v-for="p in payout" :key="p.title" :class="`is-${p.state}`">
              <span class="pw-paytl__dot" aria-hidden="true" />
              <strong>{{ p.title }}</strong>
              <small>{{ p.body }}</small>
            </li>
          </ol>
        </section>
      </div>
    </section>
  </div>
</template>

<style scoped>
.pw-sellcard {
  padding: var(--pw-space-5);
  border-radius: var(--pw-radius-xl);
  background: var(--pw-surface);
  box-shadow: var(--pw-shadow-lg);
}

.pw-sellcard__main {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1fr);
  gap: var(--pw-space-4);
}

.pw-sellcard__img {
  overflow: hidden;
  aspect-ratio: 1;
  border-radius: var(--pw-radius-md);
  background: #dddddd;
}

.pw-sellcard__img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pw-sellcard__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pw-sellcard__title {
  margin-top: var(--pw-space-3);
  font-family: var(--pw-font-display);
  font-weight: var(--pw-weight-semibold);
}

.pw-sellcard__sub {
  margin-top: var(--pw-space-1);
  font-size: var(--pw-text-2xs);
  color: var(--pw-muted);
}

.pw-sellcard__price {
  margin-top: var(--pw-space-3);
  font-family: var(--pw-font-display);
  font-size: var(--pw-text-xl);
  font-weight: var(--pw-weight-bold);
}

.pw-sellcard__calc {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-1);
  margin-top: var(--pw-space-3);
  padding: var(--pw-space-3);
  border-radius: var(--pw-radius-md);
  background: var(--pw-surface-sunken);
  font-size: var(--pw-text-xs);
}

.pw-sellcard__calc div {
  display: flex;
  justify-content: space-between;
  gap: var(--pw-space-2);
}

.pw-sellcard__calc dt {
  color: var(--pw-muted);
}

.pw-sellcard__calc dd {
  margin: 0;
  font-weight: var(--pw-weight-semibold);
}

.pw-sellcard__calc .is-green {
  color: var(--pw-success-600);
}

.pw-sellcard__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--pw-space-2);
  margin-top: var(--pw-space-4);
}

.pw-sellcard__stats li {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 34px;
  border-radius: var(--pw-radius-md);
  background: var(--pw-surface-sunken);
  font-size: var(--pw-text-xs);
  color: var(--pw-ink-2);
}

/* Wizard steps on a rail */
.pw-wizard {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-5);
}

.pw-wizard li {
  position: relative;
}

.pw-wizard h3 {
  margin-top: var(--pw-space-3);
  font-family: var(--pw-font-body);
  font-size: var(--pw-text-base);
  font-weight: var(--pw-weight-semibold);
}

.pw-wizard p {
  margin-top: var(--pw-space-1);
  font-size: var(--pw-text-sm);
  color: var(--pw-muted);
}

/* Photo tiles */
.pw-shot__frame {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  border-radius: var(--pw-radius-lg);
  background: var(--pw-surface-sunken);
}

.pw-shot__frame img {
  max-width: 80%;
  max-height: 80%;
  object-fit: contain;
}

.pw-shot__frame.is-cover {
  background: #dddddd;
}

.pw-shot__frame.is-cover img {
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  object-fit: cover;
}

.pw-shot__num {
  position: absolute;
  top: var(--pw-space-3);
  left: var(--pw-space-3);
  z-index: 1;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  font-size: var(--pw-text-2xs);
  font-weight: var(--pw-weight-semibold);
}

.pw-shot p {
  margin-top: var(--pw-space-3);
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-medium);
}

/* Condition grades */
.pw-grades {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-4);
  margin-top: var(--pw-space-5);
}

.pw-grades li {
  display: flex;
  align-items: flex-start;
  gap: var(--pw-space-3);
  font-size: var(--pw-text-sm);
}

.pw-grades li span:last-child {
  display: grid;
}

.pw-grades small {
  color: var(--pw-muted);
  font-size: var(--pw-text-xs);
}

.pw-grades__bars {
  display: flex;
  gap: 3px;
  margin-top: 3px;
}

.pw-grades__bars i {
  width: 6px;
  height: 16px;
  border-radius: 1px;
  background: var(--pw-border);
}

.is-success i.on {
  background: var(--pw-success-600);
}
.is-navy i.on {
  background: var(--pw-navy-700);
}
.is-gold i.on {
  background: var(--pw-gold-500);
}

/* Price histogram */
.pw-price__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--pw-space-2);
}

.pw-price__head span {
  font-size: var(--pw-text-xs);
}

.pw-price {
  margin: var(--pw-space-5) 0 0;
}

.pw-price__chart {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 140px;
  padding-top: 28px;
}

.pw-price__band {
  position: absolute;
  top: 0;
  left: calc(5 / 12 * 100%);
  width: calc(3 / 12 * 100%);
  padding-bottom: 6px;
  border-bottom: 2px dashed var(--pw-gold-500);
  color: var(--pw-gold-600);
  font-size: var(--pw-text-2xs);
  font-weight: var(--pw-weight-semibold);
  text-align: center;
  text-transform: uppercase;
  white-space: nowrap;
}

.pw-price__bar {
  flex: 1;
  border-radius: 2px 2px 0 0;
  background: var(--pw-navy-100);
}

.pw-price__bar.is-in {
  background: var(--pw-navy-700);
}

.pw-price__axis {
  display: flex;
  justify-content: space-between;
  margin-top: var(--pw-space-2);
  font-size: var(--pw-text-2xs);
  color: var(--pw-muted);
}

.pw-price figcaption {
  margin-top: var(--pw-space-4);
  font-size: var(--pw-text-xs);
}

/* Payout timeline */
.pw-paytl {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  margin-top: var(--pw-space-5);
}

.pw-paytl li {
  position: relative;
  display: grid;
  padding: 0 0 var(--pw-space-4) 30px;
  font-size: var(--pw-text-sm);
}

.pw-paytl li::before {
  content: '';
  position: absolute;
  top: 18px;
  bottom: -2px;
  left: 8px;
  width: 2px;
  background: var(--pw-border);
}

.pw-paytl li:last-child::before {
  display: none;
}

.pw-paytl li.is-done::before {
  background: var(--pw-success-600);
}

.pw-paytl__dot {
  position: absolute;
  top: 2px;
  left: 0;
  width: 18px;
  height: 18px;
  border: 2px solid var(--pw-border-strong);
  border-radius: 50%;
  background: var(--pw-surface);
}

.is-done .pw-paytl__dot {
  border-color: var(--pw-success-600);
  background: var(--pw-success-600)
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5 12l5 5L20 7'/%3E%3C/svg%3E")
    center / 10px no-repeat;
}

.is-current .pw-paytl__dot {
  border: 0;
  background: var(--pw-navy-700);
  box-shadow: 0 0 0 4px var(--pw-navy-100);
}

.is-upcoming strong {
  color: var(--pw-subtle);
  font-weight: var(--pw-weight-medium);
}

.pw-paytl small {
  margin-top: 2px;
  color: var(--pw-muted);
  font-size: var(--pw-text-xs);
}

@media (min-width: 640px) {
  .pw-wizard {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .pw-wizard {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
  .pw-wizard li:not(:last-child)::after {
    content: '';
    position: absolute;
    top: 14px;
    left: 40px;
    right: 12px;
    height: 1px;
    background: var(--pw-border-strong);
  }
  .pw-sell3 {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr) minmax(0, 1fr);
  }
}

@media (max-width: 479px) {
  .pw-sellcard__main {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
