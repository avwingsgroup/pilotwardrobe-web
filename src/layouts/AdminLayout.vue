<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Bell, Menu, Search } from '@lucide/vue'
import AdminSidebar from '@/components/admin/AdminSidebar.vue'
import AppDrawer from '@/components/common/AppDrawer.vue'

/**
 * Control Tower shell (AD2+): navy sidebar, breadcrumb top bar with global
 * ⌘K search, system status pill and alerts bell. Dense 12.5px tables inside.
 */
const route = useRoute()
const router = useRouter()
const mobileNav = ref(false)
const searchInput = ref<HTMLInputElement | null>(null)
const query = ref('')

const crumb = computed(() => {
  const parts = ['Control Tower']
  const title = [...route.matched].reverse().find((r) => r.meta.title)?.meta.title
  if (title) parts.push(title)
  if (route.params.id) parts.push(String(route.params.id).toUpperCase().replace(/^USR_/, 'U-'))
  return parts
})

function onKey(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchInput.value?.focus()
  }
}

function search() {
  const q = query.value.trim()
  if (!q) return
  if (/^#?PW-\d+/i.test(q)) void router.push({ name: 'admin-orders', query: { search: q.replace('#', '') } })
  else if (/^DS-\d+/i.test(q)) void router.push({ name: 'admin-disputes', query: { search: q } })
  else void router.push({ name: 'admin-users', query: { search: q } })
}

watch(() => route.fullPath, () => (mobileNav.value = false))
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="pw-admin">
    <aside class="pw-admin__sidebar"><AdminSidebar /></aside>
    <AppDrawer :open="mobileNav" title="Control Tower" side="left" @close="mobileNav = false">
      <div class="pw-admin__drawer"><AdminSidebar /></div>
    </AppDrawer>
    <div class="pw-admin__main">
      <header class="pw-admin__top">
        <button type="button" class="pw-admin__burger" aria-label="Open navigation" @click="mobileNav = true"><Menu :size="20" /></button>
        <nav class="pw-admin__crumb" aria-label="Breadcrumb">
          <template v-for="(c, i) in crumb" :key="c">
            <span v-if="i">/</span>
            <span :aria-current="i === crumb.length - 1 ? 'page' : undefined">{{ c }}</span>
          </template>
        </nav>
        <form class="pw-admin__search" role="search" @submit.prevent="search">
          <Search :size="15" aria-hidden="true" />
          <label for="admin-search" class="sr-only">Search users, orders, listings, case IDs</label>
          <input id="admin-search" ref="searchInput" v-model="query" type="search" placeholder="Search users, orders, listings, case IDs…" />
          <kbd aria-hidden="true">⌘K</kbd>
        </form>
        <span class="pw-admin__status" role="status"><span aria-hidden="true" /> All systems normal</span>
        <RouterLink :to="{ name: 'admin-reports' }" class="pw-admin__bell" aria-label="Alerts, 7 new">
          <Bell :size="18" />
          <span class="pw-admin__bell-count" aria-hidden="true">7</span>
        </RouterLink>
      </header>
      <main id="main" tabindex="-1" class="pw-admin__content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.pw-admin {
  --pw-admin-text: 0.78125rem; /* 12.5px dense tables */
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  min-height: 100vh;
  background: var(--pw-surface-sunken);
}

.pw-admin__sidebar {
  display: none;
}

.pw-admin__drawer {
  margin: calc(var(--pw-space-5) * -1);
  height: calc(100% + var(--pw-space-10));
}

.pw-admin__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pw-admin__top {
  position: sticky;
  top: 0;
  z-index: var(--pw-z-header);
  display: flex;
  align-items: center;
  gap: var(--pw-space-4);
  min-height: 58px;
  padding: 0 var(--pw-space-5);
  background: var(--pw-surface);
  border-bottom: 1px solid var(--pw-border);
}

.pw-admin__burger {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin-left: -8px;
  border: 0;
  background: none;
}

.pw-admin__crumb {
  display: flex;
  gap: 6px;
  font-size: var(--pw-text-sm);
  color: var(--pw-muted);
  white-space: nowrap;
  overflow: hidden;
}

.pw-admin__crumb [aria-current] {
  color: var(--pw-ink-2);
}

.pw-admin__search {
  display: none;
  align-items: center;
  gap: var(--pw-space-2);
  flex: 1;
  max-width: 420px;
  margin-left: auto;
  padding: 0 var(--pw-space-3);
  height: 36px;
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-md);
  background: var(--pw-surface-sunken);
  color: var(--pw-muted);
}

.pw-admin__search:focus-within {
  border-color: var(--pw-navy-700);
  background: var(--pw-surface);
}

.pw-admin__search input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: none;
  background: transparent;
  font-size: var(--pw-text-sm);
}

.pw-admin__search kbd {
  padding: 1px 6px;
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-xs);
  background: var(--pw-surface);
  font-family: var(--pw-font-body);
  font-size: var(--pw-text-2xs);
}

.pw-admin__status {
  display: none;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--pw-radius-sm);
  background: var(--pw-success-100);
  color: var(--pw-success-700);
  font-size: var(--pw-text-xs);
  font-weight: var(--pw-weight-semibold);
  white-space: nowrap;
}

.pw-admin__status span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--pw-success-600);
}

.pw-admin__bell {
  position: relative;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin-left: auto;
  color: var(--pw-ink-2);
}

.pw-admin__bell-count {
  position: absolute;
  top: 4px;
  right: 4px;
  display: grid;
  place-items: center;
  min-width: 15px;
  height: 15px;
  border-radius: var(--pw-radius-full);
  background: var(--pw-danger-600);
  color: #fff;
  font-size: 0.5625rem;
  font-weight: var(--pw-weight-bold);
}

.pw-admin__content {
  flex: 1;
  padding: var(--pw-space-5);
  outline: none;
}

@media (min-width: 768px) {
  .pw-admin__search,
  .pw-admin__status {
    display: flex;
  }
  .pw-admin__bell {
    margin-left: 0;
  }
  .pw-admin__content {
    padding: var(--pw-space-6) var(--pw-space-6) var(--pw-space-10);
  }
}

@media (min-width: 1100px) {
  .pw-admin {
    grid-template-columns: var(--pw-admin-sidebar-w) minmax(0, 1fr);
  }
  .pw-admin__sidebar {
    display: block;
    position: sticky;
    top: 0;
    height: 100vh;
  }
  .pw-admin__burger {
    display: none;
  }
}
</style>
