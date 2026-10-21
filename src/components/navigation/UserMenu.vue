<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ChevronRight, Heart, LayoutGrid, LogOut, MapPin, Settings, ShieldCheck, Tag, Wallet, Gauge, Plane } from '@lucide/vue'
import AppDropdown from '@/components/common/AppDropdown.vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()

async function logout() {
  await auth.logout()
  ui.info('Logged out', 'See you on the next flight.')
  await router.push({ name: 'home' })
}
</script>

<template>
  <AppDropdown label="Account menu">
    <template #trigger="{ toggle, attrs }">
      <button type="button" class="pw-usermenu__trigger" v-bind="attrs" :aria-label="`Account menu for ${auth.displayName}`" @click="toggle">
        <AppAvatar :name="auth.displayName" :initials="auth.initials" :src="auth.user?.avatar?.url" :size="36" />
        <ChevronRight :size="16" class="pw-usermenu__chev" aria-hidden="true" />
      </button>
    </template>
    <template #items>
      <div class="pw-usermenu__head" role="none">
        <p class="pw-usermenu__name">{{ auth.displayName }}</p>
        <p class="pw-usermenu__email">{{ auth.user?.email }}</p>
      </div>
      <div role="separator" />
      <RouterLink role="menuitem" :to="{ name: 'hangar' }"><LayoutGrid :size="16" /> My Hangar</RouterLink>
      <RouterLink role="menuitem" :to="{ name: 'hangar-listings' }"><Tag :size="16" /> Listings</RouterLink>
      <RouterLink role="menuitem" :to="{ name: 'hangar-wallet' }"><Wallet :size="16" /> Wallet</RouterLink>
      <RouterLink role="menuitem" :to="{ name: 'hangar-favorites' }"><Heart :size="16" /> Saved items</RouterLink>
      <RouterLink role="menuitem" :to="{ name: 'hangar-addresses' }"><MapPin :size="16" /> Addresses</RouterLink>
      <RouterLink role="menuitem" :to="{ name: 'hangar-verification' }"><ShieldCheck :size="16" /> Verification</RouterLink>
      <RouterLink v-if="auth.hasRole('aviator')" role="menuitem" :to="{ name: 'hangar-aviator' }"><Plane :size="16" /> Aviator credentials</RouterLink>
      <RouterLink role="menuitem" :to="{ name: 'hangar-settings' }"><Settings :size="16" /> Settings</RouterLink>
      <template v-if="auth.isAdmin">
        <div role="separator" />
        <RouterLink role="menuitem" :to="{ name: 'admin-overview' }"><Gauge :size="16" /> Control Tower</RouterLink>
      </template>
      <div role="separator" />
      <button type="button" role="menuitem" @click="logout"><LogOut :size="16" /> Log out</button>
    </template>
  </AppDropdown>
</template>

<style scoped>
.pw-usermenu__trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px;
  border: 0;
  border-radius: var(--pw-radius-full);
  background: none;
  color: var(--pw-muted);
}

.pw-usermenu__head {
  padding: var(--pw-space-2) var(--pw-space-3);
}

.pw-usermenu__name {
  font-weight: var(--pw-weight-semibold);
}

.pw-usermenu__email {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 767px) {
  .pw-usermenu__chev {
    display: none;
  }
}
</style>
