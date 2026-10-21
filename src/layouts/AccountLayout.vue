<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SiteHeader from '@/components/navigation/SiteHeader.vue'
import MobileTabBar from '@/components/navigation/MobileTabBar.vue'
import HangarSidebar from '@/components/dashboard/HangarSidebar.vue'

/**
 * My Hangar shell (V5): public header + left sidebar + content.
 * Also serves Aviator-only sections (gated per route by role/permission).
 */
const route = useRoute()
const fullWidth = computed(() => route.matched.some((r) => r.meta.fullWidth))
</script>

<template>
  <div class="pw-account">
    <SiteHeader />
    <div class="pw-container pw-account__body" :class="{ 'is-full': fullWidth }">
      <aside v-if="!fullWidth" class="pw-account__aside">
        <HangarSidebar />
      </aside>
      <main id="main" tabindex="-1" class="pw-account__main">
        <RouterView />
      </main>
    </div>
    <MobileTabBar />
  </div>
</template>

<style scoped>
.pw-account {
  min-height: 100vh;
  background: var(--pw-surface-sunken);
}

.pw-account__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-5);
  padding-top: var(--pw-space-5);
  padding-bottom: calc(var(--pw-space-16) + 56px);
}

.pw-account__main {
  min-width: 0;
  outline: none;
}

@media (min-width: 1024px) {
  .pw-account__body {
    grid-template-columns: var(--pw-hangar-sidebar-w) minmax(0, 1fr);
    gap: var(--pw-space-8);
    padding-top: var(--pw-space-8);
    padding-bottom: var(--pw-space-16);
  }
  .pw-account__body.is-full {
    grid-template-columns: minmax(0, 1fr);
  }
  .pw-account__aside {
    position: sticky;
    top: calc(var(--pw-header-h) + var(--pw-space-6));
    align-self: start;
  }
}
</style>
