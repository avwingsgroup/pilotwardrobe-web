<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Activity,
  BarChart3,
  Banknote,
  Flag,
  Image,
  KeyRound,
  LayoutGrid,
  List,
  Megaphone,
  Package,
  Receipt,
  Scale,
  Settings,
  ShieldCheck,
  Sparkles,
  Tag,
  Users,
  MoreHorizontal,
} from '@lucide/vue'
import BrandLogo from '@/components/navigation/BrandLogo.vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import { useAuthStore } from '@/stores/auth.store'
import type { Permission } from '@/types/permissions'

/**
 * Control Tower navigation (AD0). Items are filtered by the session's
 * permissions so staff only see what their role grants. Counts mirror work queues.
 */
const auth = useAuthStore()
const route = useRoute()

interface Item {
  name: string
  label: string
  icon: unknown
  permission: Permission
  count?: string
  tone?: 'gold' | 'muted'
  superOnly?: boolean
}

const sections: { label: string; items: Item[] }[] = [
  {
    label: 'Operations',
    items: [
      { name: 'admin-overview', label: 'Overview', icon: LayoutGrid, permission: 'dashboard.view' },
      { name: 'admin-users', label: 'Users', icon: Users, permission: 'users.view', count: '12.4k', tone: 'muted' },
      { name: 'admin-kyc', label: 'KYC review', icon: ShieldCheck, permission: 'kyc.view', count: '38', tone: 'gold' },
      { name: 'admin-listings', label: 'Listings', icon: Tag, permission: 'listings.view', count: '9', tone: 'muted' },
      { name: 'admin-orders', label: 'Orders & escrow', icon: Package, permission: 'orders.view' },
      { name: 'admin-disputes', label: 'Disputes', icon: Scale, permission: 'disputes.view', count: '6', tone: 'gold' },
      { name: 'admin-reports', label: 'Reports & flags', icon: Flag, permission: 'reports.view', count: '14', tone: 'gold' },
    ],
  },
  {
    label: 'Money',
    items: [
      { name: 'admin-payouts', label: 'Payouts', icon: Banknote, permission: 'payouts.view', count: '21', tone: 'gold' },
      { name: 'admin-fees', label: 'Fees & revenue', icon: Receipt, permission: 'fees.view' },
    ],
  },
  {
    label: 'Growth',
    items: [
      { name: 'admin-promotions', label: 'Promotions', icon: Sparkles, permission: 'promotions.manage' },
      { name: 'admin-broadcasts', label: 'Broadcasts', icon: Megaphone, permission: 'broadcasts.manage' },
      { name: 'admin-content', label: 'Content & pages', icon: Image, permission: 'content.manage' },
    ],
  },
  {
    label: 'Platform',
    items: [
      { name: 'admin-catalogue', label: 'Catalogue & sizes', icon: List, permission: 'catalogue.manage' },
      { name: 'admin-analytics', label: 'Analytics', icon: BarChart3, permission: 'analytics.view' },
      { name: 'admin-team', label: 'Team & roles', icon: KeyRound, permission: 'team.view' },
      { name: 'admin-audit', label: 'Audit log', icon: Activity, permission: 'audit.view' },
      { name: 'admin-settings', label: 'Settings', icon: Settings, permission: 'settings.manage', superOnly: true },
    ],
  },
]

const visible = computed(() =>
  sections
    .map((s) => ({ ...s, items: s.items.filter((i) => auth.can(i.permission) && (!i.superOnly || auth.hasRole('super_admin'))) }))
    .filter((s) => s.items.length),
)

const isActive = (name: string) => route.matched.some((r) => r.name === name) || route.name === name || String(route.name).startsWith(`${name.replace(/s$/, '')}`)
</script>

<template>
  <div class="pw-asb">
    <div class="pw-asb__brand">
      <BrandLogo inverse :height="34" :tile="false" to="/admin/overview" />
      <span class="pw-asb__tag">Control Tower</span>
    </div>
    <nav class="pw-asb__nav" aria-label="Control Tower">
      <div v-for="section in visible" :key="section.label" class="pw-asb__section">
        <p class="pw-asb__label">{{ section.label }}</p>
        <ul role="list">
          <li v-for="item in section.items" :key="item.name">
            <RouterLink :to="{ name: item.name }" class="pw-asb__link" :class="{ 'is-active': isActive(item.name) }" :aria-current="isActive(item.name) ? 'page' : undefined">
              <component :is="item.icon" :size="16" aria-hidden="true" />
              <span>{{ item.label }}</span>
              <span v-if="item.count" class="pw-asb__count" :class="`is-${item.tone}`">{{ item.count }}</span>
            </RouterLink>
          </li>
        </ul>
      </div>
    </nav>
    <div class="pw-asb__me">
      <AppAvatar :name="auth.displayName" :initials="auth.initials" tone="gold" :size="34" />
      <div class="pw-asb__me-text">
        <p>{{ auth.displayName }}</p>
        <p class="pw-asb__me-role">{{ auth.user?.staffRole ?? 'Staff' }}</p>
      </div>
      <RouterLink to="/" class="pw-asb__me-more" aria-label="Back to marketplace"><MoreHorizontal :size="18" /></RouterLink>
    </div>
  </div>
</template>

<style scoped>
.pw-asb {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--pw-navy-900);
  color: rgb(255 255 255 / 82%);
}

.pw-asb__brand {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  padding: var(--pw-space-4) var(--pw-space-4) var(--pw-space-5);
}

.pw-asb__tag {
  padding: 3px 6px;
  border: 1px solid var(--pw-gold-500);
  border-radius: var(--pw-radius-xs);
  color: var(--pw-gold-400);
  font-size: 0.5625rem;
  font-weight: var(--pw-weight-bold);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;
}

.pw-asb__nav {
  flex: 1;
  overflow-y: auto;
  padding: 0 var(--pw-space-3);
}

.pw-asb__section + .pw-asb__section {
  margin-top: var(--pw-space-4);
}

.pw-asb__label {
  padding: 0 var(--pw-space-2) var(--pw-space-2);
  font-size: 0.625rem;
  font-weight: var(--pw-weight-semibold);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(255 255 255 / 45%);
}

.pw-asb__link {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  min-height: 34px;
  padding: 0 var(--pw-space-3);
  border-radius: var(--pw-radius-md);
  color: rgb(255 255 255 / 82%);
  font-size: var(--pw-text-sm);
}

.pw-asb__link span:first-of-type {
  flex: 1;
}

.pw-asb__link:hover {
  background: rgb(255 255 255 / 6%);
  color: #fff;
  text-decoration: none;
}

.pw-asb__link.is-active {
  background: rgb(255 255 255 / 10%);
  color: #fff;
  font-weight: var(--pw-weight-semibold);
}

.pw-asb__count {
  padding: 2px 6px;
  border-radius: var(--pw-radius-full);
  font-size: 0.625rem;
  font-weight: var(--pw-weight-bold);
}

.pw-asb__count.is-gold {
  background: var(--pw-gold-500);
  color: var(--pw-navy-900);
}

.pw-asb__count.is-muted {
  background: rgb(255 255 255 / 12%);
  color: rgb(255 255 255 / 80%);
}

.pw-asb__me {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  margin: var(--pw-space-3);
  padding: var(--pw-space-3) var(--pw-space-2) 0;
  border-top: 1px solid rgb(255 255 255 / 10%);
}

.pw-asb__me-text {
  flex: 1;
  min-width: 0;
  font-size: var(--pw-text-sm);
  color: #fff;
  font-weight: var(--pw-weight-semibold);
}

.pw-asb__me-role {
  font-size: var(--pw-text-xs);
  font-weight: var(--pw-weight-regular);
  color: rgb(255 255 255 / 60%);
}

.pw-asb__me-more {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  color: rgb(255 255 255 / 70%);
}
</style>
