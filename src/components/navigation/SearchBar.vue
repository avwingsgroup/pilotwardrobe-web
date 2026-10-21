<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Search, X } from '@lucide/vue'
import { track } from '@/utils/analytics'

withDefaults(defineProps<{ placeholder?: string; size?: 'md' | 'lg' }>(), { placeholder: 'Search headsets, flight bags, avionics…', size: 'md' })

const route = useRoute()
const router = useRouter()
const query = ref(typeof route.query.search === 'string' ? route.query.search : '')

watch(
  () => route.query.search,
  (value) => (query.value = typeof value === 'string' ? value : ''),
)

function submit() {
  const search = query.value.trim()
  track('search_performed', { query: search, resultCount: -1 })
  void router.push({ name: 'marketplace', query: { ...(route.name === 'marketplace' ? route.query : {}), search: search || undefined, page: undefined } })
}
</script>

<template>
  <form class="pw-search" :class="`pw-search--${size}`" role="search" @submit.prevent="submit">
    <label for="pw-site-search" class="sr-only">Search the marketplace</label>
    <Search class="pw-search__icon" :size="18" aria-hidden="true" />
    <input id="pw-site-search" v-model="query" type="search" :placeholder="placeholder" autocomplete="off" enterkeyhint="search" class="pw-search__input" />
    <button v-if="query" type="button" class="pw-search__clear" aria-label="Clear search" @click="query = ''"><X :size="16" /></button>
    <button type="submit" class="sr-only">Search</button>
  </form>
</template>

<style scoped>
.pw-search {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 42px;
  padding: 0 var(--pw-space-3);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-md);
  background: var(--pw-surface-sunken);
  transition: all var(--pw-duration) var(--pw-ease);
}

.pw-search--lg {
  background: var(--pw-surface);
  min-height: 44px;
}

.pw-search:focus-within {
  border-color: var(--pw-navy-700);
  background: var(--pw-surface);
  box-shadow: 0 0 0 3px var(--pw-navy-100);
}

.pw-search__icon {
  flex: none;
  color: var(--pw-muted);
}

.pw-search--lg .pw-search__icon {
  order: 3;
}

.pw-search__input {
  flex: 1;
  min-width: 0;
  height: 40px;
  padding: 0 var(--pw-space-2);
  border: 0;
  outline: none;
  background: transparent;
  font-size: var(--pw-text-md);
}

@media (min-width: 768px) {
  .pw-search__input {
    font-size: var(--pw-text-base);
  }
}

.pw-search__input::placeholder {
  color: var(--pw-subtle);
}

.pw-search__input::-webkit-search-cancel-button {
  display: none;
}

.pw-search__clear {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--pw-muted);
}
</style>
