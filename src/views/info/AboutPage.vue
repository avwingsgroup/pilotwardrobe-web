<script setup lang="ts">
import { ArrowLeftRight, Send, ShieldCheck, Sparkles } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import InfoHero from '@/components/info/InfoHero.vue'
import { useSeo } from '@/composables/useSeo'
import { useAuthStore } from '@/stores/auth.store'
import { appConfig } from '@/constants/config'

useSeo({
  title: 'About Pilotwardrobe',
  description: 'Built by pilots, for the people who fly. The trusted marketplace to pass kit on to the next pilot who needs it.',
  canonicalPath: '/about',
  jsonLd: { '@context': 'https://schema.org', '@type': 'Organization', name: 'Pilotwardrobe Ltd', url: appConfig.appUrl, logo: `${appConfig.appUrl}/icon-512.png` },
})

const auth = useAuthStore()
const heroImage = '/brand/auth-cockpit.webp'

const stats = [
  { value: '18,400', label: 'verified pilots and crew' },
  { value: '62', label: 'aircraft types tagged' },
  { value: '41', label: 'countries trading' },
]

const story = [
  { when: 'Jan 2025', title: 'The idea', body: 'Two first officers swap a headset over WhatsApp and lose $600 to a fake buyer.' },
  { when: 'Sep 2025', title: 'Closed beta', body: '800 verified pilots in Lagos, Accra and Nairobi test escrow and swaps.' },
  { when: 'Mar 2026', title: 'Public launch', body: 'Open to all aviation professionals, with Fit Kit and the photographers’ store.' },
  { when: 'Oct 2026', title: 'Going global', body: 'Freight to 41 countries and Hangar Pro for flight schools and FBOs.', now: true },
]

const principles = [
  { icon: ShieldCheck, title: 'Trust by design', body: 'Identity checks, escrow-backed payments and transparent reviews on every trade.' },
  { icon: Send, title: 'Aviation-native', body: 'Search by aircraft type, licence class and operation, not generic apparel categories.' },
  { icon: ArrowLeftRight, title: 'Buy, offer or swap', body: 'One place to purchase outright, negotiate, or trade kit item-for-item.' },
  { icon: Sparkles, title: 'Smart under the hood', body: 'Pricing guidance, fraud signals and recommendations from day one.' },
]

const crew = [
  { initials: 'AB', name: 'Adaeze Bello', role: 'Co-founder & CEO', note: 'Ex-B737 First Officer' },
  { initials: 'KM', name: 'Kwame Mensah', role: 'Co-founder & CTO', note: 'Former airline ops systems lead' },
  { initials: 'SO', name: 'Sarah Osei', role: 'Head of Trust & Safety', note: 'Ex-aviation security' },
  { initials: 'JW', name: 'James Whitfield', role: 'Head of Community', note: 'A320 Captain, photographer' },
]
</script>

<template>
  <div>
    <InfoHero
      variant="image"
      :image="heroImage"
      eyebrow="About Pilotwardrobe"
      title="Built by pilots, for the people who fly"
      lead="When a pilot changes type, a whole kit becomes idle overnight. We built a trusted place to pass it on to the next pilot who needs it."
    />

    <section class="pw-about-stats" aria-label="Pilotwardrobe in numbers">
      <dl class="pw-container pw-about-stats__grid">
        <div v-for="s in stats" :key="s.label">
          <dt class="sr-only">{{ s.label }}</dt>
          <dd><strong>{{ s.value }}</strong><span aria-hidden="true">{{ s.label }}</span></dd>
        </div>
      </dl>
    </section>

    <section class="pw-info-band" aria-labelledby="story">
      <div class="pw-container">
        <div class="pw-info-head">
          <p class="pw-info-eyebrow">Our story</p>
          <h2 id="story" class="pw-info-h2">From a lost headset to a global hangar</h2>
        </div>
        <ol class="pw-story" role="list">
          <li v-for="s in story" :key="s.title" :class="{ 'is-now': s.now }">
            <span class="pw-story__dot" aria-hidden="true" />
            <p class="pw-story__when">{{ s.when }}</p>
            <h3>{{ s.title }}</h3>
            <p>{{ s.body }}</p>
          </li>
        </ol>
      </div>
    </section>

    <section class="pw-info-band pw-info-band--white" aria-labelledby="principles">
      <div class="pw-container">
        <div class="pw-info-head">
          <p class="pw-info-eyebrow">What we believe</p>
          <h2 id="principles" class="pw-info-h2">Four principles behind every feature</h2>
        </div>
        <ul class="pw-info-grid pw-info-grid--4" role="list">
          <li v-for="p in principles" :key="p.title" class="pw-principle">
            <span class="pw-info-icon pw-info-icon--lg pw-info-icon--solid"><component :is="p.icon" :size="18" aria-hidden="true" /></span>
            <h3>{{ p.title }}</h3>
            <p>{{ p.body }}</p>
          </li>
        </ul>
      </div>
    </section>

    <section class="pw-info-band" aria-labelledby="crew">
      <div class="pw-container">
        <div class="pw-info-head">
          <p class="pw-info-eyebrow">The crew</p>
          <h2 id="crew" class="pw-info-h2">The people behind Pilotwardrobe</h2>
        </div>
        <ul class="pw-info-grid pw-info-grid--4" role="list">
          <li v-for="m in crew" :key="m.name" class="pw-info-card pw-member">
            <span class="pw-member__avatar" aria-hidden="true">{{ m.initials }}</span>
            <h3>{{ m.name }}</h3>
            <p class="pw-member__role">{{ m.role }}</p>
            <p>{{ m.note }}</p>
          </li>
        </ul>

        <div class="pw-about-cta">
          <div>
            <h2>Clear your hangar for the next type rating</h2>
            <p>Join 18,400 verified pilots and crew trading safely.</p>
          </div>
          <div class="pw-about-cta__actions">
            <AppButton v-if="!auth.isAuthenticated" variant="gold" size="lg" :to="{ name: 'signup' }">Create an account</AppButton>
            <AppButton v-else variant="gold" size="lg" :to="{ name: 'listing-new' }">List an item</AppButton>
            <AppButton variant="inverse" size="lg" :to="{ name: 'marketplace' }">Browse gear</AppButton>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.pw-about-stats {
  background: var(--pw-surface);
  border-bottom: 1px solid var(--pw-border);
}

.pw-about-stats__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 0 auto;
}

.pw-about-stats__grid > div {
  padding: var(--pw-space-6) var(--pw-space-3);
}

.pw-about-stats__grid > div + div {
  border-left: 1px solid var(--pw-border);
  padding-left: var(--pw-space-5);
}

.pw-about-stats dd {
  display: grid;
  margin: 0;
}

.pw-about-stats strong {
  font-family: var(--pw-font-display);
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  line-height: 1.1;
  color: var(--pw-navy-700);
}

.pw-about-stats span {
  margin-top: var(--pw-space-2);
  font-size: var(--pw-text-sm);
  color: var(--pw-muted);
}

.pw-story {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-6);
}

.pw-story li {
  position: relative;
  padding-left: 32px;
}

.pw-story__dot {
  position: absolute;
  top: 0;
  left: 0;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--pw-navy-700);
}

.is-now .pw-story__dot {
  background: var(--pw-gold-500);
}

.pw-story__when {
  font-family: var(--pw-font-mono);
  font-size: var(--pw-text-2xs);
  font-weight: var(--pw-weight-semibold);
  text-transform: uppercase;
  color: var(--pw-gold-600);
}

.pw-story h3 {
  margin-top: var(--pw-space-2);
  font-size: var(--pw-text-md);
}

.pw-story li > p:last-child {
  margin-top: var(--pw-space-2);
  font-size: var(--pw-text-sm);
  color: var(--pw-muted);
  line-height: var(--pw-leading-relaxed);
}

.pw-principle h3 {
  margin-top: var(--pw-space-4);
  font-size: var(--pw-text-md);
}

.pw-principle p {
  margin-top: var(--pw-space-2);
  font-size: var(--pw-text-sm);
  color: var(--pw-muted);
  line-height: var(--pw-leading-relaxed);
}

.pw-member__avatar {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--pw-navy-100);
  color: var(--pw-navy-700);
  font-family: var(--pw-font-display);
  font-size: var(--pw-text-lg);
  font-weight: var(--pw-weight-semibold);
}

.pw-member h3 {
  margin-top: var(--pw-space-4);
}

.pw-member .pw-member__role {
  margin-top: var(--pw-space-1);
  color: var(--pw-navy-700);
}

.pw-member p:last-child {
  margin-top: 2px;
}

.pw-about-cta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--pw-space-5);
  margin-top: var(--pw-space-6);
  padding: var(--pw-space-6);
  border-radius: var(--pw-radius-xl);
  background: var(--pw-navy-900);
  color: rgb(255 255 255 / 80%);
}

.pw-about-cta h2 {
  font-size: var(--pw-text-xl);
  color: #fff;
}

.pw-about-cta p {
  margin-top: var(--pw-space-1);
  font-size: var(--pw-text-sm);
}

.pw-about-cta__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pw-space-3);
}

@media (min-width: 768px) {
  .pw-story {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: var(--pw-space-5);
  }
  .pw-story li {
    padding: 34px 0 0;
  }
  .pw-story li::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 18px;
    right: calc(var(--pw-space-5) * -1);
    height: 2px;
    background: var(--pw-border);
  }
  .pw-story li:last-child::before {
    right: 0;
  }
  .pw-about-cta {
    padding: var(--pw-space-8);
  }
}

@media (max-width: 479px) {
  .pw-about-stats__grid > div {
    padding: var(--pw-space-5) var(--pw-space-2);
  }
  .pw-about-stats__grid > div + div {
    padding-left: var(--pw-space-3);
  }
}
</style>
