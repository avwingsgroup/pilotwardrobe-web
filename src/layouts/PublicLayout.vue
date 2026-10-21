<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SiteHeader from '@/components/navigation/SiteHeader.vue'
import SiteFooter from '@/components/navigation/SiteFooter.vue'
import MobileTabBar from '@/components/navigation/MobileTabBar.vue'
import InfoSubNav from '@/components/info/InfoSubNav.vue'
import InfoFooter from '@/components/info/InfoFooter.vue'
import '@/styles/info.css'

/** Information-centre pages (meta.info, VC1–VC13) get the guides/policies sub-nav and info footer. */
const route = useRoute()
const isInfo = computed(() => route.meta.info === true)
</script>

<template>
  <div class="pw-shell" :class="{ 'pw-shell--info': isInfo }">
    <SiteHeader />
    <InfoSubNav v-if="isInfo" />
    <main id="main" tabindex="-1" class="pw-shell__main">
      <RouterView />
    </main>
    <InfoFooter v-if="isInfo" />
    <SiteFooter v-else />
    <MobileTabBar />
  </div>
</template>

<style scoped>
.pw-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.pw-shell--info {
  background: var(--pw-surface-sunken);
}

.pw-shell__main {
  flex: 1;
  outline: none;
}

@media print {
  .pw-shell--info > :not(main) {
    display: none !important;
  }
}
</style>
