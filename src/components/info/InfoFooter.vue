<script setup lang="ts">
import { Globe, Lock } from '@lucide/vue'
import BrandLogo from '@/components/navigation/BrandLogo.vue'
import { INFO_GROUPS, INFO_MARKETPLACE_LINKS } from '@/content/info/nav'
import { useCookieConsent } from '@/composables/useCookieConsent'

const consent = useCookieConsent()
</script>

<template>
  <footer class="pw-ifoot">
    <div class="pw-container">
      <div class="pw-ifoot__top">
        <div class="pw-ifoot__brand">
          <BrandLogo inverse :height="40" />
          <p>The verified marketplace for pilots and aviation professionals. Buy, sell and swap gear with escrow on every order.</p>
        </div>
        <nav v-for="g in INFO_GROUPS" :key="g.key" class="pw-ifoot__col" :aria-label="g.title">
          <h2 class="pw-ifoot__heading">{{ g.title }}</h2>
          <ul role="list">
            <li v-for="l in g.links" :key="l.name"><RouterLink :to="{ name: l.name }">{{ l.label }}</RouterLink></li>
          </ul>
        </nav>
        <nav class="pw-ifoot__col" aria-label="Marketplace">
          <h2 class="pw-ifoot__heading">Marketplace</h2>
          <ul role="list">
            <li v-for="l in INFO_MARKETPLACE_LINKS" :key="l.label"><RouterLink :to="l.to">{{ l.label }}</RouterLink></li>
          </ul>
        </nav>
      </div>
      <div class="pw-ifoot__bottom">
        <p>© {{ new Date().getFullYear() }} Pilotwardrobe Ltd. All rights reserved.</p>
        <p class="pw-ifoot__meta">
          <button type="button" class="pw-ifoot__cookie" @click="consent.openPreferences">Cookie settings</button>
          <span><Lock :size="14" aria-hidden="true" /> Payments held in escrow</span>
          <span><Globe :size="14" aria-hidden="true" /> English · USD</span>
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.pw-ifoot {
  background: var(--pw-navy-900);
  color: rgb(255 255 255 / 78%);
  padding: var(--pw-space-10) 0 var(--pw-space-6);
  font-size: var(--pw-text-sm);
}

.pw-ifoot__top {
  display: grid;
  gap: var(--pw-space-8) var(--pw-space-6);
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.pw-ifoot__brand {
  grid-column: 1 / -1;
  max-width: 300px;
}

.pw-ifoot__brand p {
  margin-top: var(--pw-space-4);
  line-height: var(--pw-leading-relaxed);
}

.pw-ifoot__heading {
  margin-bottom: var(--pw-space-3);
  font-family: var(--pw-font-body);
  font-size: var(--pw-text-2xs);
  font-weight: var(--pw-weight-semibold);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--pw-gold-500);
}

.pw-ifoot__col ul {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-2);
}

.pw-ifoot__col a {
  color: #fff;
  font-weight: var(--pw-weight-medium);
}

.pw-ifoot__bottom {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--pw-space-3);
  margin-top: var(--pw-space-10);
  padding-top: var(--pw-space-5);
  border-top: 1px solid rgb(255 255 255 / 12%);
  font-size: var(--pw-text-xs);
}

.pw-ifoot__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pw-space-5);
}

.pw-ifoot__cookie {
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.pw-ifoot__meta span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

@media (min-width: 1024px) {
  .pw-ifoot__top {
    grid-template-columns: 1.4fr repeat(4, minmax(0, 1fr));
  }
  .pw-ifoot__brand {
    grid-column: auto;
  }
}

@media (max-width: 767px) {
  .pw-ifoot {
    padding-bottom: calc(var(--pw-space-6) + 64px);
  }
}
</style>
