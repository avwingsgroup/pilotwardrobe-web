<script setup lang="ts">
import { House, MessageCircle, Plus, Search, User } from '@lucide/vue'
import { useNotificationStore } from '@/stores/notification.store'

/** Bottom tab bar on phones — mirrors the iOS/Android app navigation shown in V1. */
const notifications = useNotificationStore()
</script>

<template>
  <nav class="pw-tabbar" aria-label="Quick navigation">
    <RouterLink :to="{ name: 'home' }" class="pw-tabbar__item" exact-active-class="is-active"><House :size="20" /><span>Home</span></RouterLink>
    <RouterLink :to="{ name: 'marketplace' }" class="pw-tabbar__item" active-class="is-active"><Search :size="20" /><span>Search</span></RouterLink>
    <RouterLink :to="{ name: 'listing-new' }" class="pw-tabbar__item"><Plus :size="20" /><span>Sell</span></RouterLink>
    <RouterLink :to="{ name: 'messages' }" class="pw-tabbar__item" active-class="is-active">
      <span class="pw-tabbar__icon"><MessageCircle :size="20" /><span v-if="notifications.unreadMessages" class="pw-tabbar__dot" aria-hidden="true" /></span>
      <span>Inbox</span>
    </RouterLink>
    <RouterLink :to="{ name: 'hangar' }" class="pw-tabbar__item" active-class="is-active"><User :size="20" /><span>Me</span></RouterLink>
  </nav>
</template>

<style scoped>
.pw-tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--pw-z-header);
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--pw-surface);
  border-top: 1px solid var(--pw-border);
}

.pw-tabbar__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 56px;
  color: var(--pw-muted);
  font-size: 0.6875rem;
}

.pw-tabbar__item:hover {
  text-decoration: none;
}

.pw-tabbar__item.is-active {
  color: var(--pw-navy-700);
  font-weight: var(--pw-weight-semibold);
}

.pw-tabbar__icon {
  position: relative;
  display: inline-flex;
}

.pw-tabbar__dot {
  position: absolute;
  top: -1px;
  right: -3px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--pw-danger-600);
  border: 2px solid var(--pw-surface);
}

@media (min-width: 768px) {
  .pw-tabbar {
    display: none;
  }
}
</style>
