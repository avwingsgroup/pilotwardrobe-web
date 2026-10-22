<script setup lang="ts">
import { Cookie } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import { useCookieConsent } from '@/composables/useCookieConsent'

/**
 * VC14 first-visit consent banner. Non-modal (the page stays usable), shown until
 * the visitor accepts, rejects or saves preferences. "Reject all" is as prominent
 * as "Accept all" so declining is as easy as agreeing.
 */
const consent = useCookieConsent()
</script>

<template>
  <Transition name="pw-cookiebar">
    <section v-if="!consent.decided.value && !consent.preferencesOpen.value" class="pw-cookiebar" role="region" aria-labelledby="pw-cookiebar-title" aria-describedby="pw-cookiebar-body">
      <div class="pw-container pw-cookiebar__inner">
        <span class="pw-cookiebar__icon" aria-hidden="true"><Cookie :size="20" /></span>
        <div class="pw-cookiebar__text">
          <h2 id="pw-cookiebar-title">We use cookies</h2>
          <p id="pw-cookiebar-body">
            Essential cookies keep you signed in and your checkout secure. With your permission we also use analytics and marketing cookies to improve listings and show relevant gear. You can change your choice at any time.
            <RouterLink :to="{ name: 'cookies' }">Cookies policy</RouterLink>
          </p>
        </div>
        <div class="pw-cookiebar__actions">
          <AppButton variant="ghost" @click="consent.openPreferences">Manage preferences</AppButton>
          <AppButton variant="outline" @click="consent.rejectAll">Reject all</AppButton>
          <AppButton @click="consent.acceptAll">Accept all</AppButton>
        </div>
      </div>
    </section>
  </Transition>
</template>

<style scoped>
.pw-cookiebar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: calc(var(--pw-z-modal) - 1);
  background: var(--pw-surface);
  border-top: 1px solid var(--pw-border);
  box-shadow: 0 -12px 32px rgb(16 26 45 / 10%);
}

.pw-cookiebar__inner {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--pw-space-4);
  align-items: center;
  padding-top: var(--pw-space-5);
  padding-bottom: var(--pw-space-5);
}

.pw-cookiebar__icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: var(--pw-radius-md);
  background: var(--pw-navy-100);
  color: var(--pw-navy-700);
  align-self: start;
}

.pw-cookiebar__text h2 {
  font-size: var(--pw-text-md);
}

.pw-cookiebar__text p {
  margin-top: var(--pw-space-1);
  max-width: 640px;
  font-size: var(--pw-text-sm);
  line-height: var(--pw-leading-relaxed);
  color: var(--pw-ink-2);
}

.pw-cookiebar__text a {
  font-weight: var(--pw-weight-semibold);
  text-decoration: underline;
}

.pw-cookiebar__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pw-space-3);
  grid-column: 1 / -1;
}

.pw-cookiebar__actions :deep(.pw-btn) {
  flex: 1 1 auto;
}

.pw-cookiebar-enter-active,
.pw-cookiebar-leave-active {
  transition: transform var(--pw-duration-slow) var(--pw-ease);
}

.pw-cookiebar-enter-from,
.pw-cookiebar-leave-to {
  transform: translateY(100%);
}

@media (min-width: 1024px) {
  .pw-cookiebar__inner {
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: var(--pw-space-6);
  }
  .pw-cookiebar__actions {
    grid-column: auto;
    flex-wrap: nowrap;
  }
  .pw-cookiebar__actions :deep(.pw-btn) {
    flex: none;
  }
  .pw-cookiebar__icon {
    align-self: center;
  }
}

@media (max-width: 479px) {
  .pw-cookiebar__icon {
    display: none;
  }
  .pw-cookiebar__inner {
    grid-template-columns: minmax(0, 1fr);
    padding-top: var(--pw-space-4);
    padding-bottom: var(--pw-space-4);
  }
  /* Accept / Reject side by side, Manage underneath. */
  .pw-cookiebar__actions :deep(.pw-btn--ghost) {
    order: 3;
    flex-basis: 100%;
  }
}

@media print {
  .pw-cookiebar {
    display: none;
  }
}
</style>
