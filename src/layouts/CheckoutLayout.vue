<script setup lang="ts">
import { Lock } from '@lucide/vue'
import BrandLogo from '@/components/navigation/BrandLogo.vue'

/** Focused checkout shell (V4): logo · stepper (teleported in by the page) · "Secure checkout". */
</script>

<template>
  <div class="pw-co">
    <header class="pw-co__header">
      <div class="pw-container pw-co__bar">
        <BrandLogo :height="42" />
        <div id="checkout-stepper" class="pw-co__stepper" />
        <p class="pw-co__secure"><Lock :size="16" aria-hidden="true" /> <span>Secure checkout</span></p>
      </div>
    </header>
    <main id="main" tabindex="-1" class="pw-container pw-co__main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.pw-co {
  min-height: 100vh;
  background: var(--pw-surface-sunken);
}

.pw-co__header {
  background: var(--pw-surface);
  border-bottom: 1px solid var(--pw-border);
}

.pw-co__bar {
  display: flex;
  align-items: center;
  gap: var(--pw-space-4);
  min-height: var(--pw-header-h);
}

.pw-co__stepper {
  flex: 1;
  display: flex;
  justify-content: center;
  min-width: 0;
}

.pw-co__secure {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--pw-ink-2);
  font-size: var(--pw-text-sm);
}

.pw-co__main {
  padding-top: var(--pw-space-8);
  padding-bottom: var(--pw-space-16);
  outline: none;
}

@media (max-width: 767px) {
  .pw-co__secure span {
    display: none;
  }
  .pw-co__bar {
    flex-wrap: wrap;
    padding-bottom: var(--pw-space-3);
  }
  .pw-co__stepper {
    order: 3;
    flex-basis: 100%;
  }
  .pw-co__main {
    padding-top: var(--pw-space-5);
  }
}
</style>
