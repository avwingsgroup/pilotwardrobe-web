<script setup lang="ts">
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Camera, Gauge, Grid2x2, House, LayoutGrid, LogIn, LogOut, MessageCircle, PlusCircle, Store, Users } from '@lucide/vue'
import AppDrawer from '@/components/common/AppDrawer.vue'
import SearchBar from './SearchBar.vue'
import { useAuthStore } from '@/stores/auth.store'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

watch(
  () => route.fullPath,
  () => emit('close'),
)

async function logout() {
  await auth.logout()
  emit('close')
  await router.push({ name: 'home' })
}
</script>

<template>
  <AppDrawer :open="open" title="Menu" side="left" @close="emit('close')">
    <SearchBar class="pw-mnav__search" />
    <nav aria-label="Mobile">
      <ul role="list" class="pw-mnav__list">
        <li><RouterLink :to="{ name: 'home' }"><House :size="18" /> Home</RouterLink></li>
        <li><RouterLink :to="{ name: 'marketplace' }"><Store :size="18" /> Marketplace</RouterLink></li>
        <li><RouterLink :to="{ name: 'categories' }"><Grid2x2 :size="18" /> Categories</RouterLink></li>
        <li><RouterLink :to="{ name: 'listing-new' }"><PlusCircle :size="18" /> Sell / Swap</RouterLink></li>
        <li><RouterLink :to="{ name: 'photographers' }"><Camera :size="18" /> Photographers</RouterLink></li>
        <li><RouterLink :to="{ name: 'aviators' }"><Users :size="18" /> Verified aviators</RouterLink></li>
        <template v-if="auth.isAuthenticated">
          <li class="pw-mnav__sep" role="separator" />
          <li><RouterLink :to="{ name: 'hangar' }"><LayoutGrid :size="18" /> My Hangar</RouterLink></li>
          <li><RouterLink :to="{ name: 'messages' }"><MessageCircle :size="18" /> Messages</RouterLink></li>
          <li v-if="auth.isAdmin"><RouterLink :to="{ name: 'admin-overview' }"><Gauge :size="18" /> Control Tower</RouterLink></li>
        </template>
      </ul>
    </nav>
    <template #footer>
      <button v-if="auth.isAuthenticated" type="button" class="pw-mnav__auth" @click="logout"><LogOut :size="18" /> Log out</button>
      <RouterLink v-else class="pw-mnav__auth" :to="{ name: 'auth' }"><LogIn :size="18" /> Sign up or log in</RouterLink>
      <p class="pw-mnav__locale">English · USD</p>
    </template>
  </AppDrawer>
</template>

<style scoped>
.pw-mnav__search {
  margin-bottom: var(--pw-space-4);
}

.pw-mnav__list a,
.pw-mnav__auth {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  width: 100%;
  min-height: 48px;
  padding: 0 var(--pw-space-2);
  border: 0;
  border-radius: var(--pw-radius-md);
  background: none;
  color: var(--pw-ink);
  font-size: var(--pw-text-md);
  font-weight: var(--pw-weight-medium);
}

.pw-mnav__list a.router-link-exact-active {
  background: var(--pw-navy-100);
  color: var(--pw-navy-700);
}

.pw-mnav__list a:hover {
  text-decoration: none;
  background: var(--pw-surface-sunken);
}

.pw-mnav__sep {
  height: 1px;
  margin: var(--pw-space-2) 0;
  background: var(--pw-border);
}

.pw-mnav__locale {
  margin-top: var(--pw-space-2);
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}
</style>
