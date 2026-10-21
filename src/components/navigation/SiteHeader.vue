<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Bell, Globe, Menu, MessageCircle, ShoppingCart } from '@lucide/vue'
import BrandLogo from './BrandLogo.vue'
import SearchBar from './SearchBar.vue'
import UserMenu from './UserMenu.vue'
import MobileNavDrawer from './MobileNavDrawer.vue'
import AppButton from '@/components/common/AppButton.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useNotificationStore } from '@/stores/notification.store'
import { useCartStore } from '@/stores/cart.store'

/**
 * Two compositions from the designs:
 *  - Visitor (V1): logo · wide search · Sell / Swap · locale · Sign Up | Login
 *  - Signed in (V2+): logo · Marketplace / Sell / My Hangar / Photographers · search · messages · bell · cart · avatar
 */
const auth = useAuthStore()
const notifications = useNotificationStore()
const cart = useCartStore()
const route = useRoute()
const drawer = ref(false)

const nav = [
  { key: 'marketplace', label: 'Marketplace', to: { name: 'marketplace' } },
  { key: 'sell', label: 'Sell', to: { name: 'listing-new' } },
  { key: 'hangar', label: 'My Hangar', to: { name: 'hangar' } },
  { key: 'photographers', label: 'Photographers', to: { name: 'photographers' } },
] as const

const active = computed(() => [...route.matched].reverse().find((r) => r.meta.nav)?.meta.nav)
const authLink = computed(() => ({ name: 'auth', query: route.name && route.name !== 'home' ? { next: route.fullPath } : {} }))

onMounted(() => {
  if (auth.isAuthenticated) {
    notifications.setCounts(auth.user?.counters ?? {})
    void notifications.refresh()
    notifications.startPolling()
    void cart.load().catch(() => undefined)
  }
})
</script>

<template>
  <header class="pw-header">
    <div class="pw-container pw-header__bar">
      <button type="button" class="pw-header__burger" aria-label="Open menu" :aria-expanded="drawer" @click="drawer = true">
        <Menu :size="22" />
      </button>
      <BrandLogo :height="42" class="pw-header__logo" />

      <!-- Signed in: primary nav -->
      <nav v-if="auth.isAuthenticated" class="pw-header__nav" aria-label="Primary">
        <RouterLink v-for="item in nav" :key="item.key" :to="item.to" class="pw-header__link" :class="{ 'is-active': active === item.key }" :aria-current="active === item.key ? 'page' : undefined">
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="pw-header__search" :class="{ 'is-wide': !auth.isAuthenticated }">
        <SearchBar :size="auth.isAuthenticated ? 'md' : 'lg'" :placeholder="auth.isAuthenticated ? undefined : 'Search headsets, flight bags, uniform…'" />
      </div>

      <div class="pw-header__actions">
        <template v-if="auth.isAuthenticated">
          <RouterLink :to="{ name: 'messages' }" class="pw-header__icon" :aria-label="`Messages${notifications.unreadMessages ? `, ${notifications.unreadMessages} unread` : ''}`">
            <MessageCircle :size="20" />
            <span v-if="notifications.unreadMessages" class="pw-header__count pw-header__count--red">{{ notifications.unreadMessages }}</span>
          </RouterLink>
          <RouterLink :to="{ name: 'notifications' }" class="pw-header__icon" :aria-label="`Notifications${notifications.unread ? `, ${notifications.unread} unread` : ''}`">
            <Bell :size="20" />
            <span v-if="notifications.unread" class="pw-header__count pw-header__count--red">{{ notifications.unread }}</span>
          </RouterLink>
          <RouterLink :to="{ name: 'cart' }" class="pw-header__icon" :aria-label="`Cart${cart.count ? `, ${cart.count} items` : ''}`">
            <ShoppingCart :size="20" />
            <span v-if="cart.count" class="pw-header__count">{{ cart.count }}</span>
          </RouterLink>
          <UserMenu />
        </template>
        <template v-else>
          <AppButton :to="{ name: 'listing-new' }" size="sm" class="pw-header__sell">Sell / Swap</AppButton>
          <button type="button" class="pw-header__locale" aria-label="Language and currency: English, USD">
            <Globe :size="16" aria-hidden="true" /> <span>English - USD</span>
          </button>
          <AppButton :to="authLink" variant="secondary" size="sm" class="pw-header__auth">Sign Up | Login</AppButton>
        </template>
      </div>
    </div>
    <div class="pw-container pw-header__msearch">
      <SearchBar placeholder="Search gear" />
    </div>
    <MobileNavDrawer :open="drawer" @close="drawer = false" />
  </header>
</template>

<style scoped>
.pw-header {
  position: sticky;
  top: 0;
  z-index: var(--pw-z-header);
  background: var(--pw-surface);
  border-bottom: 1px solid var(--pw-border);
}

.pw-header__bar {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  min-height: var(--pw-header-h);
}

.pw-header__burger {
  display: grid;
  place-items: center;
  width: var(--pw-touch);
  height: var(--pw-touch);
  margin-left: -10px;
  border: 0;
  background: none;
  color: var(--pw-ink);
}

.pw-header__nav {
  display: none;
  align-self: stretch;
  gap: var(--pw-space-6);
  margin-left: var(--pw-space-6);
}

.pw-header__link {
  display: flex;
  align-items: center;
  border-bottom: 3px solid transparent;
  border-top: 3px solid transparent;
  color: var(--pw-ink-2);
  font-size: var(--pw-text-md);
  font-weight: var(--pw-weight-medium);
  white-space: nowrap;
}

.pw-header__link:hover {
  color: var(--pw-navy-700);
  text-decoration: none;
}

.pw-header__link.is-active {
  color: var(--pw-navy-700);
  font-weight: var(--pw-weight-semibold);
  border-bottom-color: var(--pw-navy-700);
}

.pw-header__search {
  display: none;
  flex: 1;
  min-width: 0;
  max-width: 460px;
  margin-left: auto;
}

.pw-header__search.is-wide {
  max-width: 600px;
  margin-left: var(--pw-space-6);
  margin-right: auto;
}

.pw-header__actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--pw-space-1);
  margin-left: auto;
}

.pw-header__search + .pw-header__actions {
  margin-left: var(--pw-space-4);
}

.pw-header__icon {
  position: relative;
  display: grid;
  place-items: center;
  width: var(--pw-touch);
  height: var(--pw-touch);
  border-radius: 50%;
  color: var(--pw-ink);
}

.pw-header__icon:hover {
  background: var(--pw-surface-sunken);
}

.pw-header__count {
  position: absolute;
  top: 6px;
  right: 4px;
  display: grid;
  place-items: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: var(--pw-radius-full);
  background: var(--pw-gold-500);
  color: #fff;
  font-size: 0.625rem;
  font-weight: var(--pw-weight-bold);
}

.pw-header__count--red {
  background: var(--pw-danger-600);
}

.pw-header__locale {
  display: none;
  align-items: center;
  gap: 6px;
  min-height: var(--pw-touch);
  padding: 0 var(--pw-space-3);
  border: 0;
  background: none;
  color: var(--pw-ink-2);
  font-size: var(--pw-text-sm);
}

.pw-header__sell {
  display: none;
}

.pw-header__msearch {
  padding-bottom: var(--pw-space-3);
}

@media (min-width: 768px) {
  .pw-header__msearch {
    display: none;
  }
  .pw-header__search {
    display: block;
  }
  .pw-header__sell {
    display: inline-flex;
  }
}

@media (min-width: 1024px) {
  .pw-header__burger {
    display: none;
  }
  .pw-header__nav {
    display: flex;
  }
  .pw-header__locale {
    display: inline-flex;
  }
  .pw-header__actions {
    gap: var(--pw-space-2);
  }
}

@media (max-width: 767px) {
  .pw-header__bar .pw-header__logo :deep(img) {
    height: 34px;
    width: auto;
  }
  .pw-header__auth {
    padding: 0 var(--pw-space-3);
  }
  .pw-header__icon:nth-child(1) {
    display: none;
  }
}
</style>
