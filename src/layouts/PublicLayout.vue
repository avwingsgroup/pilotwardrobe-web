<script setup lang="ts">
import SiteHeader from '@/components/navigation/SiteHeader.vue'
import SiteFooter from '@/components/navigation/SiteFooter.vue'
import MobileTabBar from '@/components/navigation/MobileTabBar.vue'
</script>

<template>
  <div class="pw-shell">
    <SiteHeader />
    <main id="main" tabindex="-1" class="pw-shell__main">
      <RouterView />
    </main>
    <SiteFooter />
    <MobileTabBar />
  </div>
</template>

<style scoped>
.pw-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.pw-shell__main {
  flex: 1;
  outline: none;
}
</style>
