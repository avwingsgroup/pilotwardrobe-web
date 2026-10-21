<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { BadgeCheck, Heart, LayoutGrid, MapPin, Package, Plane, Ruler, Scale, Settings, ShieldCheck, Star, Tag, Wallet, ArrowLeftRight } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth.store'

/** My Hangar navigation (V5 / VB4 / VB12). Counters come from /auth/me. */
const auth = useAuthStore()
const route = useRoute()
const c = computed(() => auth.user?.counters)

const groups = computed(() => [
  {
    label: 'Trading',
    items: [
      { name: 'hangar', label: 'Overview', icon: LayoutGrid, exact: true },
      { name: 'hangar-listings', label: 'Listings', icon: Tag, count: c.value?.activeListings, tone: 'gold' },
      { name: 'hangar-orders', label: 'Orders', icon: Package, count: c.value?.activeOrders, tone: 'gold' },
      { name: 'hangar-offers', label: 'Offers & swaps', icon: ArrowLeftRight, count: c.value?.openOffers, tone: 'gold' },
      { name: 'hangar-wallet', label: 'Wallet', icon: Wallet },
      { name: 'hangar-reviews', label: 'Reviews', icon: Star },
      { name: 'hangar-disputes', label: 'Disputes', icon: Scale, count: c.value?.openDisputes, tone: 'red' },
    ],
  },
  {
    label: 'Account',
    items: [
      { name: 'hangar-favorites', label: 'Saved items', icon: Heart },
      { name: 'hangar-fit-kit', label: 'Fit Kit', icon: Ruler },
      { name: 'hangar-addresses', label: 'Addresses', icon: MapPin },
      { name: 'hangar-verification', label: 'Verification', icon: ShieldCheck },
      ...(auth.hasRole('aviator') ? [{ name: 'hangar-aviator', label: 'Aviator credentials', icon: Plane }] : []),
      { name: 'hangar-settings', label: 'Settings', icon: Settings },
    ],
  },
])

const isActive = (name: string, exact?: boolean) =>
  exact ? route.name === name : route.matched.some((r) => r.name === name) || String(route.name ?? '').startsWith(name.replace(/s$/, ''))
</script>

<template>
  <nav class="pw-hangar-nav" aria-label="My Hangar">
    <div v-for="group in groups" :key="group.label" class="pw-hangar-nav__group">
      <p class="pw-hangar-nav__group-label">{{ group.label }}</p>
      <ul role="list">
        <li v-for="item in group.items" :key="item.name">
          <RouterLink :to="{ name: item.name }" class="pw-hangar-nav__link" :class="{ 'is-active': isActive(item.name, item.exact) }" :aria-current="isActive(item.name, item.exact) ? 'page' : undefined">
            <component :is="item.icon" :size="18" aria-hidden="true" />
            <span class="pw-hangar-nav__label">{{ item.label }}</span>
            <span v-if="'count' in item && item.count" class="pw-hangar-nav__count" :class="`is-${item.tone}`">{{ item.count }}</span>
          </RouterLink>
        </li>
      </ul>
    </div>
    <p v-if="auth.user?.verification.kycStatus === 'approved'" class="pw-hangar-nav__verified"><BadgeCheck :size="14" aria-hidden="true" /> Verified seller</p>
  </nav>
</template>

<style scoped>
.pw-hangar-nav {
  padding: var(--pw-space-3);
  background: var(--pw-surface);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
}

.pw-hangar-nav__group + .pw-hangar-nav__group {
  margin-top: var(--pw-space-3);
  padding-top: var(--pw-space-3);
  border-top: 1px solid var(--pw-border);
}

.pw-hangar-nav__group-label {
  padding: var(--pw-space-1) var(--pw-space-3) var(--pw-space-2);
  font-size: var(--pw-text-2xs);
  font-weight: var(--pw-weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--pw-subtle);
}

.pw-hangar-nav__link {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  min-height: 40px;
  padding: 0 var(--pw-space-3);
  border-radius: var(--pw-radius-md);
  color: var(--pw-ink-2);
  font-size: var(--pw-text-base);
}

.pw-hangar-nav__link:hover {
  background: var(--pw-surface-sunken);
  text-decoration: none;
}

.pw-hangar-nav__link.is-active {
  background: var(--pw-navy-100);
  color: var(--pw-navy-700);
  font-weight: var(--pw-weight-semibold);
}

.pw-hangar-nav__label {
  flex: 1;
}

.pw-hangar-nav__count {
  display: grid;
  place-items: center;
  min-width: 22px;
  height: 20px;
  padding: 0 6px;
  border-radius: var(--pw-radius-full);
  font-size: var(--pw-text-2xs);
  font-weight: var(--pw-weight-bold);
  color: #fff;
}

.pw-hangar-nav__count.is-gold {
  background: var(--pw-gold-500);
}
.pw-hangar-nav__count.is-red {
  background: var(--pw-danger-600);
}

.pw-hangar-nav__verified {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: var(--pw-space-3) var(--pw-space-3) var(--pw-space-1);
  font-size: var(--pw-text-xs);
  font-weight: var(--pw-weight-semibold);
  color: var(--pw-gold-600);
}

/* Mobile: horizontal scrolling chip nav */
@media (max-width: 1023px) {
  .pw-hangar-nav {
    display: flex;
    gap: var(--pw-space-2);
    padding: 0;
    border: 0;
    background: none;
    overflow-x: auto;
    scrollbar-width: none;
  }
  .pw-hangar-nav::-webkit-scrollbar {
    display: none;
  }
  .pw-hangar-nav__group,
  .pw-hangar-nav__group + .pw-hangar-nav__group {
    margin: 0;
    padding: 0;
    border: 0;
  }
  .pw-hangar-nav__group ul {
    display: flex;
    gap: var(--pw-space-2);
  }
  .pw-hangar-nav__group-label,
  .pw-hangar-nav__verified {
    display: none;
  }
  .pw-hangar-nav__link {
    white-space: nowrap;
    border: 1px solid var(--pw-border);
    background: var(--pw-surface);
    border-radius: var(--pw-radius-full);
    min-height: 40px;
    font-size: var(--pw-text-sm);
  }
  .pw-hangar-nav__link.is-active {
    border-color: var(--pw-navy-700);
  }
}
</style>
