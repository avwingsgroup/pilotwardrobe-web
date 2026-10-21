<script setup lang="ts">
import { Activity, Ban, Check, Globe, MapPin, Package, Send } from '@lucide/vue'
import InfoHero from '@/components/info/InfoHero.vue'
import { useSeo } from '@/composables/useSeo'
import { PLATFORM } from '@/content/info/nav'

useSeo({
  title: 'Freight guide',
  description: `Sellers ship every order within ${PLATFORM.dispatchDays} days with a tracked carrier. How to size the parcel, protect the gear and keep customs moving.`,
  canonicalPath: '/freight-guide',
})

const statuses = [
  { icon: Package, title: 'Cleared for pickup', body: 'Label created, waiting for the carrier.', tone: '' },
  { icon: Send, title: 'Airborne', body: 'The carrier has scanned your parcel.', tone: 'solid' },
  { icon: Globe, title: 'Holding pattern', body: 'At a hub or in customs.', tone: '' },
  { icon: MapPin, title: 'On approach', body: 'Out for delivery today.', tone: '' },
  { icon: Check, title: 'Goods landed', body: 'Delivered. Inspection window opens.', tone: 'success' },
]

const sizes = [
  { name: 'Small', price: '$9–$18', weight: 'Up to 1 kg', dims: '30 × 20 × 10 cm', fits: 'Sunglasses, epaulettes, logbooks, watches', box: { w: 100, h: 36 } },
  { name: 'Medium', price: '$16–$34', weight: 'Up to 3 kg', dims: '45 × 35 × 20 cm', fits: 'Headsets, kneeboards, GPS, EFB tablets', box: { w: 100, h: 62 } },
  { name: 'Large', price: '$28–$62', weight: 'Up to 10 kg', dims: '60 × 45 × 40 cm', fits: 'Flight bags, uniform sets, manual binders', box: { w: 100, h: 100 } },
]

const carriers = [
  { name: 'DHL Express', region: 'International', days: '2–4 days', speed: 30 },
  { name: 'FedEx International', region: 'International', days: '3–5 days', speed: 45 },
  { name: 'UPS Standard', region: 'International', days: '4–7 days', speed: 65 },
  { name: 'GIG Logistics', region: 'Nigeria domestic', days: '1–3 days', speed: 22 },
]

const checklist = [
  'Double-box headsets and avionics with 5 cm of padding on every side.',
  'Coil cables loosely and bag them separately from ear cups.',
  'Fold uniforms around tissue; keep epaulettes and wings in a small pouch.',
  'Photograph the packed box before sealing. It helps if anything goes wrong.',
  'Declare full value on parcels over $300 so carrier cover applies.',
]

const care = [
  { icon: Activity, tone: 'gold', title: 'Lithium batteries', body: 'ANR headsets, GPS units and EFB tablets must ship with batteries installed in the device, never loose.' },
  { icon: Send, tone: '', title: 'Manuals and charts', body: 'Printed manuals ship as documents. Expired Jeppesen charts are fine; current subscriptions can’t be resold.' },
  { icon: Ban, tone: 'danger', title: 'Not allowed', body: 'Oxygen cylinders, flares, life-vest CO₂ cartridges and any airline-issued ID or security item.' },
]
</script>

<template>
  <div>
    <InfoHero
      eyebrow="Guides · Freight"
      title="Pack it right, ship it tracked, land it safely"
      :lead="`Sellers ship every order within ${PLATFORM.dispatchDays} days with a tracked carrier. Here’s how to size the parcel, protect the gear and keep customs moving.`"
      :meta="['8 min read', 'Covers 42 countries']"
    >
      <template #aside>
        <div class="pw-routecard" aria-label="Example shipment: order PW-4471, Lagos to London, airborne">
          <div class="pw-routecard__head">
            <strong>Order #PW-4471</strong>
            <span class="pw-info-pill">Airborne</span>
          </div>
          <svg class="pw-routecard__arc" viewBox="0 0 400 130" aria-hidden="true">
            <path d="M34 108 C 120 30, 200 22, 236 40" fill="none" stroke="var(--pw-navy-700)" stroke-width="3" stroke-linecap="round" />
            <path d="M236 40 C 290 50, 340 70, 372 92" fill="none" stroke="var(--pw-border-strong)" stroke-width="2" stroke-dasharray="6 6" />
            <circle cx="34" cy="108" r="6" fill="var(--pw-navy-700)" />
            <circle cx="372" cy="92" r="7" fill="#fff" stroke="var(--pw-navy-700)" stroke-width="3" />
            <circle cx="236" cy="40" r="14" fill="var(--pw-gold-500)" />
            <path d="M229 41 l14-6 -6 14 -2-6z" fill="#fff" />
            <text x="34" y="128" text-anchor="middle" font-size="12" font-weight="600" fill="var(--pw-ink)">LOS</text>
            <text x="372" y="116" text-anchor="middle" font-size="12" font-weight="600" fill="var(--pw-ink)">LHR</text>
          </svg>
          <dl class="pw-routecard__facts">
            <div><dt>DHL Express</dt><dd>Carrier</dd></div>
            <div><dt>Medium · 2.1 kg</dt><dd>Parcel</dd></div>
            <div><dt>Thu, Oct 24</dt><dd>ETA</dd></div>
          </dl>
        </div>
      </template>
    </InfoHero>

    <section class="pw-info-band pw-info-band--white" aria-labelledby="statuses">
      <div class="pw-container">
        <div class="pw-info-head">
          <p class="pw-info-eyebrow">Tracking, in plain aviation</p>
          <h2 id="statuses" class="pw-info-h2">What each status means</h2>
          <p class="pw-info-lead">Buyers and sellers see the same five stages in the order tracker.</p>
        </div>
        <ol class="pw-statuses" role="list">
          <li v-for="s in statuses" :key="s.title">
            <span class="pw-info-icon pw-info-icon--lg" :class="s.tone && `pw-info-icon--${s.tone}`"><component :is="s.icon" :size="18" aria-hidden="true" /></span>
            <h3>{{ s.title }}</h3>
            <p>{{ s.body }}</p>
          </li>
        </ol>
      </div>
    </section>

    <section class="pw-info-band" aria-labelledby="sizes">
      <div class="pw-container">
        <div class="pw-info-head">
          <p class="pw-info-eyebrow">Parcel sizes</p>
          <h2 id="sizes" class="pw-info-h2">Choose a size when you list</h2>
          <p class="pw-info-lead">Your size choice sets the freight price the buyer sees at checkout.</p>
        </div>
        <div class="pw-info-grid pw-info-grid--3">
          <div v-for="s in sizes" :key="s.name" class="pw-info-card pw-parcel">
            <div class="pw-parcel__stage" aria-hidden="true">
              <span class="pw-parcel__box" :style="{ width: `${s.box.w}px`, height: `${s.box.h}px` }" />
            </div>
            <div class="pw-parcel__row">
              <h3>{{ s.name }}</h3>
              <span class="pw-parcel__price">{{ s.price }}</span>
            </div>
            <p class="pw-parcel__spec"><span>{{ s.weight }}</span><span>{{ s.dims }}</span></p>
            <p>{{ s.fits }}</p>
          </div>
        </div>

        <div class="pw-info-grid pw-info-grid--2 pw-freight2">
          <section class="pw-info-card" aria-labelledby="carriers">
            <div class="pw-freight2__head">
              <h3 id="carriers" class="pw-info-card-title">Partner carriers</h3>
              <span class="pw-muted">Typical transit, medium parcel</span>
            </div>
            <ul class="pw-carriers" role="list">
              <li v-for="c in carriers" :key="c.name">
                <span><strong>{{ c.name }}</strong><small>{{ c.region }}</small></span>
                <span class="pw-info-bar" aria-hidden="true"><span :style="{ width: `${c.speed}%` }" /></span>
                <span class="pw-carriers__days">{{ c.days }}</span>
              </li>
            </ul>
          </section>
          <section class="pw-info-card" aria-labelledby="packing">
            <h3 id="packing" class="pw-info-card-title">Packing checklist</h3>
            <ul class="pw-info-checks pw-freight2__list" role="list">
              <li v-for="c in checklist" :key="c"><Check :size="16" aria-hidden="true" />{{ c }}</li>
            </ul>
          </section>
        </div>
      </div>
    </section>

    <section class="pw-info-band pw-info-band--white" aria-labelledby="care">
      <div class="pw-container">
        <div class="pw-info-head">
          <p class="pw-info-eyebrow">Customs &amp; restrictions</p>
          <h2 id="care" class="pw-info-h2">Items that need extra care</h2>
        </div>
        <div class="pw-info-grid pw-info-grid--3">
          <div v-for="c in care" :key="c.title" class="pw-info-card">
            <span class="pw-info-icon pw-info-icon--lg" :class="c.tone && `pw-info-icon--${c.tone}`"><component :is="c.icon" :size="18" aria-hidden="true" /></span>
            <h3>{{ c.title }}</h3>
            <p>{{ c.body }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.pw-routecard {
  padding: var(--pw-space-5);
  border-radius: var(--pw-radius-xl);
  background: var(--pw-surface);
  box-shadow: var(--pw-shadow-lg);
}

.pw-routecard__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--pw-text-sm);
}

.pw-routecard__arc {
  display: block;
  width: 100%;
  height: auto;
  margin: var(--pw-space-4) 0;
}

.pw-routecard__facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--pw-space-2);
}

.pw-routecard__facts div {
  padding: var(--pw-space-2) var(--pw-space-3);
  border-radius: var(--pw-radius-md);
  background: var(--pw-surface-sunken);
}

.pw-routecard__facts dt {
  font-size: var(--pw-text-xs);
  font-weight: var(--pw-weight-medium);
}

.pw-routecard__facts dd {
  margin: 0;
  font-size: var(--pw-text-2xs);
  color: var(--pw-muted);
}

.pw-statuses {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-6);
}

.pw-statuses li {
  position: relative;
}

.pw-statuses h3 {
  margin-top: var(--pw-space-4);
  font-family: var(--pw-font-body);
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-semibold);
}

.pw-statuses p {
  margin-top: var(--pw-space-2);
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-parcel__stage {
  display: flex;
  align-items: flex-end;
  height: 110px;
}

.pw-parcel__box {
  position: relative;
  border: 2px solid #c9a46a;
  border-radius: 4px;
  background: #f0e2c4;
}

.pw-parcel__box::after {
  content: '';
  position: absolute;
  top: 36%;
  left: 0;
  right: 0;
  height: 14%;
  background: #dcc28e;
}

.pw-parcel__row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: var(--pw-space-4);
}

.pw-parcel__row h3 {
  margin: 0;
}

.pw-parcel__price {
  font-family: var(--pw-font-display);
  font-weight: var(--pw-weight-bold);
  color: var(--pw-navy-700);
}

.pw-parcel__spec {
  display: flex;
  gap: var(--pw-space-4);
}

.pw-freight2 {
  margin-top: var(--pw-space-6);
}

.pw-freight2__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--pw-space-2);
}

.pw-freight2__head span {
  font-size: var(--pw-text-xs);
}

.pw-freight2__list {
  margin-top: var(--pw-space-4);
}

.pw-carriers {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-4);
  margin-top: var(--pw-space-4);
}

.pw-carriers li {
  display: grid;
  grid-template-columns: minmax(0, 150px) minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--pw-space-4);
  font-size: var(--pw-text-sm);
}

.pw-carriers li > span:first-child {
  display: grid;
}

.pw-carriers small {
  font-size: var(--pw-text-2xs);
  color: var(--pw-muted);
}

.pw-carriers__days {
  font-weight: var(--pw-weight-semibold);
  white-space: nowrap;
}

@media (min-width: 640px) {
  .pw-statuses {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .pw-statuses {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
  .pw-statuses li:not(:last-child)::after {
    content: '';
    position: absolute;
    top: 20px;
    left: 52px;
    right: 8px;
    height: 1px;
    background: var(--pw-border-strong);
  }
  .pw-freight2 {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}

@media (max-width: 479px) {
  .pw-carriers li {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .pw-carriers .pw-info-bar {
    grid-column: 1 / -1;
    grid-row: 2;
  }
}
</style>
