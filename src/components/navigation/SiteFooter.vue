<script setup lang="ts">
import PaymentBrandMark, { type PaymentBrand } from '@/components/payments/PaymentBrandMark.vue'
import { ShieldCheck } from '@lucide/vue'
import BrandLogo from './BrandLogo.vue'
import NewsletterForm from './NewsletterForm.vue'

const columns = [
  {
    title: 'Shop categories',
    links: [
      { label: 'Official store', to: '/category/pilotwardrobe' },
      { label: 'Headsets & audio', to: '/category/headsets' },
      { label: 'Uniform & apparel', to: '/category/uniforms' },
      { label: 'Flight bags', to: '/category/flight-bags' },
      { label: 'Books & manuals', to: '/category/books-manuals' },
      { label: 'Avionics', to: '/category/avionics' },
    ],
  },
  {
    title: 'Sell / swap',
    links: [
      { label: 'Start selling', to: '/hangar/listings/new' },
      { label: 'How to sell', to: '/how-to-sell' },
      { label: 'How to swap', to: '/how-to-swap' },
      { label: 'Freight guide', to: '/freight-guide' },
      { label: 'Seller fees', to: '/seller-fees' },
    ],
  },
  {
    title: 'Policies',
    links: [
      { label: 'Terms of service', to: '/terms' },
      { label: 'Privacy policy', to: '/privacy' },
      { label: 'Returns & refunds', to: '/returns' },
      { label: 'Escrow & disputes', to: '/escrow-disputes' },
      { label: 'Cookies', to: '/cookies' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'Help centre', to: '/help' },
      { label: 'Fit Kit & sizing', to: '/hangar/fit-kit' },
      { label: 'Contact us', to: '/contact' },
      { label: 'FAQs', to: '/faq' },
      { label: 'About us', to: '/about' },
    ],
  },
]

const social = [
  { label: 'Instagram', href: 'https://instagram.com/pilotwardrobe' },
  { label: 'X / Twitter', href: 'https://x.com/pilotwardrobe' },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/pilotwardrobe' },
  { label: 'Facebook', href: 'https://facebook.com/pilotwardrobe' },
]

const payments: { brand: PaymentBrand; label: string }[] = [
  { brand: 'visa', label: 'Visa' },
  { brand: 'mastercard', label: 'Mastercard' },
  { brand: 'paypal', label: 'PayPal' },
  { brand: 'gpay', label: 'Google Pay' },
  { brand: 'applepay', label: 'Apple Pay' },
]
</script>

<template>
  <footer class="pw-footer">
    <div class="pw-container">
      <div class="pw-footer__top">
        <div class="pw-footer__brand">
          <BrandLogo inverse :height="56" :tile="true" />
          <address>Suite C8, Mediatrix Of All Graces Plaza, No. 79 Stadium Road, Rumuomasi, Port Harcourt, Rivers State, Nigeria</address>
        </div>
        <nav v-for="col in columns" :key="col.title" class="pw-footer__col" :aria-label="col.title">
          <h2 class="pw-footer__heading">{{ col.title }}</h2>
          <ul role="list">
            <li v-for="link in col.links" :key="link.label"><RouterLink :to="link.to">{{ link.label }}</RouterLink></li>
          </ul>
        </nav>
        <nav class="pw-footer__col" aria-label="Social">
          <h2 class="pw-footer__heading">Join us on</h2>
          <ul role="list">
            <li v-for="s in social" :key="s.label"><a :href="s.href" target="_blank" rel="noopener noreferrer">{{ s.label }}</a></li>
          </ul>
        </nav>
      </div>

      <div class="pw-footer__mid">
        <div class="pw-footer__newsletter">
          <h2 class="pw-footer__heading">Newsletter</h2>
          <p>New arrivals and price drops in your categories. Unsubscribe any time.</p>
          <NewsletterForm />
          <p class="pw-footer__fine">By subscribing you agree to our <RouterLink to="/privacy">Privacy Policy</RouterLink>.</p>
        </div>
        <div class="pw-footer__pay">
          <h2 class="pw-footer__heading">Payment methods</h2>
          <ul class="pw-footer__pay-list" role="list">
            <li v-for="p in payments" :key="p.brand" class="pw-footer__pay-chip" :class="{ 'is-dark': p.brand === 'applepay' }" :aria-label="p.label" :title="p.label">
              <PaymentBrandMark :brand="p.brand" />
            </li>
          </ul>
          <p class="pw-footer__escrow"><ShieldCheck :size="16" aria-hidden="true" /> Every order held in escrow until goods land.</p>
        </div>
      </div>
    </div>
    <div class="pw-footer__bottom">
      <div class="pw-container pw-footer__bottom-row">
        <p>© {{ new Date().getFullYear() }} Pilotwardrobe Ltd. All rights reserved.</p>
        <p>USD · English</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.pw-footer {
  margin-top: auto;
  background: var(--pw-navy-900);
  color: rgb(255 255 255 / 82%);
  font-size: var(--pw-text-sm);
}

.pw-footer a {
  color: rgb(255 255 255 / 82%);
}

.pw-footer a:hover {
  color: #fff;
}

.pw-footer__top {
  display: grid;
  gap: var(--pw-space-8);
  grid-template-columns: repeat(2, 1fr);
  padding: var(--pw-space-10) 0 var(--pw-space-8);
}

.pw-footer__brand {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-4);
}

.pw-footer__brand address {
  font-style: normal;
  max-width: 260px;
  line-height: var(--pw-leading-relaxed);
}

.pw-footer__heading {
  margin-bottom: var(--pw-space-3);
  font-family: var(--pw-font-body);
  font-size: var(--pw-text-md);
  font-weight: var(--pw-weight-semibold);
  color: #fff;
}

.pw-footer__col li + li {
  margin-top: var(--pw-space-2);
}

.pw-footer__mid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--pw-space-8);
  padding-bottom: var(--pw-space-8);
}

.pw-footer__newsletter {
  max-width: 440px;
}

.pw-footer__newsletter > p {
  margin-bottom: var(--pw-space-4);
}

.pw-footer__fine {
  margin-top: var(--pw-space-3);
  font-size: var(--pw-text-xs);
  color: rgb(255 255 255 / 60%);
}

.pw-footer__pay-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pw-space-2);
}

.pw-footer__pay-chip {
  display: grid;
  place-items: center;
  width: 48px;
  height: 32px;
  border-radius: var(--pw-radius-sm);
  background: #fff;
}

.pw-footer__pay-chip.is-dark {
  background: #000;
  color: #fff;
}

.pw-footer__escrow {
  display: flex;
  align-items: center;
  gap: var(--pw-space-2);
  margin-top: var(--pw-space-3);
}

.pw-footer__escrow svg {
  color: var(--pw-gold-500);
}

.pw-footer__bottom {
  border-top: 1px solid rgb(255 255 255 / 10%);
}

.pw-footer__bottom-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--pw-space-2);
  padding-top: var(--pw-space-4);
  padding-bottom: var(--pw-space-4);
  font-size: var(--pw-text-xs);
}

@media (min-width: 768px) {
  .pw-footer__top {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .pw-footer__top {
    grid-template-columns: 1.6fr repeat(5, 1fr);
  }
  .pw-footer__brand {
    grid-column: auto;
  }
  .pw-footer__pay {
    text-align: right;
  }
  .pw-footer__pay-list {
    justify-content: flex-end;
  }
}

@media (max-width: 767px) {
  .pw-footer {
    padding-bottom: 64px;
  }
}
</style>
