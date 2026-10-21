<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Globe, Lock, ShieldCheck, ArrowLeftRight } from '@lucide/vue'
import BrandLogo from '@/components/navigation/BrandLogo.vue'

/**
 * VA1–VA13 split-screen: navy photo panel (left) + form (right).
 * Panel art rotates per step like the designs: cockpit (welcome/login),
 * headset (verify/reset), uniform shirt (finish setup/ready).
 */
const route = useRoute()

const panels = {
  cockpit: { image: '/brand/auth-cockpit.webp', lines: ['Buy, sell or swap', 'aviation gear with'], accent: 'verified crews.' },
  headset: { image: '/brand/auth-headset.webp', lines: ['Every payment', 'held in escrow until'], accent: 'your gear lands.' },
  shirt: { image: '/brand/auth-shirt.webp', lines: ['Your kit, your sizes,', 'one account across'], accent: 'web and app.' },
} as const

const panel = computed(() => panels[[...route.matched].reverse().find((r) => r.meta.authPanel)?.meta.authPanel ?? panelFor(String(route.name))])

function panelFor(name: string): keyof typeof panels {
  if (['verify-email', 'two-step', 'forgot-password', 'reset-password'].includes(name)) return 'headset'
  if (['finish-setup', 'account-ready'].includes(name)) return 'shirt'
  return 'cockpit'
}

const topLink = computed(() => {
  const name = String(route.name)
  if (['signup', 'verify-email'].includes(name)) return { lead: 'Already a member?', label: 'Log in', to: { name: 'login', query: route.query } }
  if (['login', 'forgot-password'].includes(name)) return { lead: 'New to Pilotwardrobe?', label: 'Create account', to: { name: 'auth', query: route.query } }
  return null
})

</script>

<template>
  <div class="pw-auth">
    <header class="pw-auth__top">
      <BrandLogo :height="44" />
      <nav class="pw-auth__links" aria-label="Help">
        <span class="pw-auth__locale"><Globe :size="16" aria-hidden="true" /> English - USD</span>
        <RouterLink to="/faq">Help centre</RouterLink>
        <p v-if="topLink" class="pw-auth__switch">
          {{ topLink.lead }} <RouterLink :to="topLink.to">{{ topLink.label }}</RouterLink>
        </p>
      </nav>
    </header>
    <div class="pw-auth__body">
      <aside class="pw-auth__panel" :style="{ backgroundImage: `url(${panel.image})` }" aria-hidden="true">
        <div class="pw-auth__panel-inner">
          <p class="pw-auth__headline">
            <span v-for="line in panel.lines" :key="line">{{ line }}<br /></span>
            <span class="pw-auth__accent">{{ panel.accent }}</span>
          </p>
          <ul class="pw-auth__points" role="list">
            <li><span><ShieldCheck :size="18" /></span> KYC-verified sellers on every listing</li>
            <li><span><Lock :size="18" /></span> Escrow-protected payments, released on delivery</li>
            <li><span><ArrowLeftRight :size="18" /></span> Swap gear directly with cash top-ups</li>
          </ul>
          <div class="pw-auth__trust">
            <span class="pw-auth__avatars"><i>NO</i><i class="is-cream">AO</i><i class="is-mint">KT</i></span>
            Trusted by 18,400 pilots, crew and engineers
          </div>
        </div>
      </aside>
      <main id="main" tabindex="-1" class="pw-auth__main">
        <div class="pw-auth__form">
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.pw-auth {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: var(--pw-surface);
}

.pw-auth__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--pw-space-4);
  min-height: 66px;
  padding: 0 var(--pw-gutter);
  border-bottom: 1px solid var(--pw-border);
}

.pw-auth__links {
  display: flex;
  align-items: center;
  gap: var(--pw-space-6);
  font-size: var(--pw-text-base);
}

.pw-auth__links a {
  color: var(--pw-ink-2);
}

.pw-auth__locale {
  display: none;
  align-items: center;
  gap: 6px;
  color: var(--pw-ink-2);
}

.pw-auth__switch {
  display: none;
  color: var(--pw-muted);
}

.pw-auth__switch a {
  color: var(--pw-navy-700);
  font-weight: var(--pw-weight-semibold);
}

.pw-auth__body {
  flex: 1;
  display: grid;
}

.pw-auth__panel {
  display: none;
  position: relative;
  background-color: var(--pw-navy-900);
  background-size: cover;
  background-position: center;
}

.pw-auth__panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgb(22 56 110 / 72%) 0%, rgb(13 42 87 / 92%) 58%, var(--pw-navy-900) 100%);
}

.pw-auth__panel-inner {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 100%;
  padding: var(--pw-space-10) var(--pw-space-10) var(--pw-space-8);
  color: #fff;
}

.pw-auth__headline {
  font-family: var(--pw-font-display);
  font-size: clamp(2rem, 2.6vw, 2.5rem);
  font-weight: var(--pw-weight-bold);
  line-height: 1.15;
  letter-spacing: -0.01em;
}

.pw-auth__accent {
  color: var(--pw-gold-400);
}

.pw-auth__points {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-3);
  margin: var(--pw-space-8) 0;
  font-size: var(--pw-text-md);
  font-weight: var(--pw-weight-medium);
}

.pw-auth__points li {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
}

.pw-auth__points li > span {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--pw-radius-md);
  background: rgb(255 255 255 / 10%);
  color: var(--pw-gold-400);
}

.pw-auth__trust {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  padding-top: var(--pw-space-6);
  border-top: 1px solid rgb(255 255 255 / 15%);
  font-size: var(--pw-text-sm);
}

.pw-auth__avatars {
  display: flex;
}

.pw-auth__avatars i {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  margin-left: -6px;
  border: 2px solid var(--pw-navy-900);
  border-radius: 50%;
  background: #fff;
  color: var(--pw-navy-700);
  font-size: 0.625rem;
  font-style: normal;
  font-weight: var(--pw-weight-semibold);
}

.pw-auth__avatars i:first-child {
  margin-left: 0;
}
.pw-auth__avatars i.is-cream {
  background: var(--pw-gold-100);
}
.pw-auth__avatars i.is-mint {
  background: #e3efe8;
}

.pw-auth__main {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--pw-space-10) var(--pw-gutter);
  outline: none;
}

.pw-auth__form {
  width: 100%;
  max-width: 440px;
}

@media (min-width: 768px) {
  .pw-auth__locale,
  .pw-auth__switch {
    display: inline-flex;
    gap: 4px;
  }
}

@media (min-width: 1024px) {
  .pw-auth__body {
    grid-template-columns: minmax(380px, 5fr) 7fr;
  }
  .pw-auth__panel {
    display: block;
  }
}
</style>
