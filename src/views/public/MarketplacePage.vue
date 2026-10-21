<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { LayoutGrid, List, SearchX, SlidersHorizontal, X } from '@lucide/vue'
import AppBreadcrumb from '@/components/common/AppBreadcrumb.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppDrawer from '@/components/common/AppDrawer.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import ProductGrid from '@/components/products/ProductGrid.vue'
import FilterPanel from '@/components/marketplace/FilterPanel.vue'
import { productService } from '@/api/products.api'
import { useResource } from '@/composables/useResource'
import { useListingQuery } from '@/composables/useListingQuery'
import { useSeo } from '@/composables/useSeo'
import { useAuthStore } from '@/stores/auth.store'
import { useMarketplaceStore } from '@/stores/marketplace.store'
import { CONDITION_LABELS, SORT_OPTIONS } from '@/constants/labels'
import { flatCategoryName } from '@/utils/categories'
import { formatMoney } from '@/utils/money'
import { track } from '@/utils/analytics'
import type { ListingFilters } from '@/types/product'

const route = useRoute()
const auth = useAuthStore()
const marketplace = useMarketplaceStore()
const { filters, categorySlug, update, clear } = useListingQuery()
const drawer = ref(false)
const columns = ref<3 | 4>(3)

const { data, state, error, refreshing, reload } = useResource(
  async (signal) => {
    const res = await productService.search(filters.value, signal)
    marketplace.hydrate(res.data)
    track('marketplace_viewed', { category: categorySlug.value, resultCount: res.meta.total })
    return res
  },
  { watch: [() => route.fullPath], keepPrevious: true, isEmpty: (r) => r.data.length === 0 },
)

const categoryName = computed(() => {
  const slug = categorySlug.value ?? filters.value.category?.[0]
  return slug ? flatCategoryName(slug) : null
})

const title = computed(() => {
  if (filters.value.search) return `Results for “${filters.value.search}”`
  if (filters.value.format === 'digital') return 'Digital products & prints'
  return categoryName.value ?? 'All aviation gear'
})

const crumbs = computed(() => [
  { label: 'Marketplace', to: { name: 'marketplace' } },
  ...(categoryName.value ? [{ label: categoryName.value }] : []),
  ...(filters.value.search ? [{ label: `Search` }] : []),
])

/** Active filter chips (removable). */
const chips = computed(() => {
  const f = filters.value
  const out: { key: string; label: string; remove: Partial<ListingFilters> }[] = []
  for (const c of f.condition ?? []) out.push({ key: `c-${c}`, label: CONDITION_LABELS[c].label, remove: { condition: f.condition!.filter((x) => x !== c) } })
  if (f.verifiedOnly) out.push({ key: 'kyc', label: 'KYC verified', remove: { verifiedOnly: undefined } })
  if (f.minRating) out.push({ key: 'rating', label: `Rating ${f.minRating}+`, remove: { minRating: undefined } })
  if (f.freeDelivery) out.push({ key: 'free', label: 'Free delivery', remove: { freeDelivery: undefined } })
  if (f.minPrice !== undefined || f.maxPrice !== undefined)
    out.push({ key: 'price', label: `${formatMoney({ amount: f.minPrice ?? 0, currency: 'USD' }, { whole: true })}–${formatMoney({ amount: f.maxPrice ?? 0, currency: 'USD' }, { whole: true })}`, remove: { minPrice: undefined, maxPrice: undefined } })
  for (const d of f.dealType ?? []) out.push({ key: `d-${d}`, label: d === 'offers' ? 'Accepts offers' : d === 'swaps' ? 'Open to swaps' : 'Buy now', remove: { dealType: f.dealType!.filter((x) => x !== d) } })
  if (f.fitsMySize) out.push({ key: 'fit', label: 'Fits my size', remove: { fitsMySize: undefined } })
  return out
})

const sort = computed({
  get: () => filters.value.sort ?? 'newest',
  set: (value) => update({ sort: value }),
})

function apply(next: ListingFilters) {
  drawer.value = false
  for (const [k, v] of Object.entries(next)) if (Array.isArray(v) && v.length) track('filter_applied', { filter: k, value: v.join(',') })
  update(next)
}

function goPage(page: number) {
  update({ page }, false)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function clearAll() {
  drawer.value = false
  clear()
}

useSeo(() => ({
  title: title.value,
  description: `Shop ${categoryName.value ?? 'aviation gear'} from KYC-verified pilots and crew. Escrow-protected on every order.`,
  canonicalPath: categorySlug.value ? `/category/${categorySlug.value}` : '/marketplace',
  noindex: !!filters.value.search || (filters.value.page ?? 1) > 1,
}))
</script>

<template>
  <div class="pw-container pw-mkt">
    <AppBreadcrumb :items="crumbs" class="pw-mkt__crumbs" />

    <div class="pw-mkt__layout">
      <aside class="pw-mkt__rail">
        <FilterPanel :filters="filters" :facets="data?.meta.facets ?? null" :signed-in="auth.isAuthenticated" :fit-kit-name="auth.user?.firstName" @apply="apply" @clear="clear" />
      </aside>

      <section class="pw-mkt__results" aria-labelledby="mkt-title">
        <header class="pw-mkt__head">
          <div>
            <h1 id="mkt-title" class="pw-mkt__title">{{ title }}</h1>
            <p class="pw-mkt__count" aria-live="polite">
              <template v-if="data">{{ data.meta.total.toLocaleString() }} results<template v-if="data.meta.facets.fitsSavedSizes"> · {{ data.meta.facets.fitsSavedSizes }} fit your saved sizes</template></template>
              <template v-else>&nbsp;</template>
            </p>
          </div>
          <ul v-if="chips.length" class="pw-mkt__chips" role="list" aria-label="Active filters">
            <li v-for="chip in chips" :key="chip.key">
              <button type="button" class="pw-mkt__chip" :aria-label="`Remove filter: ${chip.label}`" @click="update(chip.remove)">{{ chip.label }} <X :size="14" aria-hidden="true" /></button>
            </li>
          </ul>
          <div class="pw-mkt__tools">
            <button type="button" class="pw-mkt__filter-btn" @click="drawer = true"><SlidersHorizontal :size="16" /> Filters<span v-if="chips.length"> ({{ chips.length }})</span></button>
            <label class="pw-mkt__sort">
              <span>Sort</span>
              <select v-model="sort" aria-label="Sort results">
                <option v-for="o in SORT_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
              </select>
            </label>
            <button type="button" class="pw-mkt__view" :aria-pressed="columns === 4" :aria-label="columns === 3 ? 'Show 4 per row' : 'Show 3 per row'" @click="columns = columns === 3 ? 4 : 3">
              <LayoutGrid v-if="columns === 3" :size="18" />
              <List v-else :size="18" />
            </button>
          </div>
        </header>

        <ErrorState v-if="state === 'error'" :error="error" @retry="reload" />

        <AppEmptyState
          v-else-if="state === 'empty'"
          :icon="SearchX"
          :title="filters.search ? `No results for “${filters.search}”` : 'No gear matches these filters'"
          body="Try fewer filters, check spelling, or save this search and we'll alert you when one is listed."
          class="pw-card"
        >
          <AppButton variant="secondary" @click="clear">Clear filters</AppButton>
          <AppButton :to="auth.isAuthenticated ? { name: 'notifications' } : { name: 'auth', query: { next: route.fullPath } }">Save search</AppButton>
        </AppEmptyState>

        <div v-else :class="{ 'is-refreshing': refreshing }">
          <ProductGrid :listings="data?.data ?? []" :loading="state === 'loading'" :columns="columns" :skeletons="6" :eager="3" show-condition label="Search results" />
          <AppPagination v-if="data" class="pw-mkt__pages" :page="data.meta.currentPage" :last-page="data.meta.lastPage" @change="goPage" />
        </div>
      </section>
    </div>

    <AppDrawer :open="drawer" title="Filters" side="bottom" @close="drawer = false">
      <FilterPanel :filters="filters" :facets="data?.meta.facets ?? null" :signed-in="auth.isAuthenticated" class="pw-mkt__drawer-panel" @apply="apply" @clear="clearAll" />
    </AppDrawer>
  </div>
</template>

<style scoped>
.pw-mkt {
  padding-top: var(--pw-space-5);
  padding-bottom: var(--pw-space-16);
}

.pw-mkt__crumbs {
  margin-bottom: var(--pw-space-5);
}

.pw-mkt__layout {
  display: grid;
  gap: var(--pw-space-6);
}

.pw-mkt__rail {
  display: none;
}

.pw-mkt__results {
  min-width: 0;
}

.pw-mkt__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--pw-space-4);
  margin-bottom: var(--pw-space-5);
  padding: var(--pw-space-4) var(--pw-space-5);
  background: var(--pw-surface);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
}

.pw-mkt__title {
  font-size: var(--pw-text-xl);
}

.pw-mkt__count {
  font-size: var(--pw-text-sm);
  color: var(--pw-muted);
}

.pw-mkt__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pw-space-2);
  margin-left: auto;
}

.pw-mkt__chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  padding: 0 var(--pw-space-3);
  border: 0;
  border-radius: var(--pw-radius-full);
  background: var(--pw-navy-100);
  color: var(--pw-navy-700);
  font-size: var(--pw-text-sm);
}

.pw-mkt__chip:hover {
  background: color-mix(in srgb, var(--pw-navy-100) 70%, var(--pw-navy-300));
}

.pw-mkt__tools {
  display: flex;
  align-items: center;
  gap: var(--pw-space-2);
  width: 100%;
}

.pw-mkt__filter-btn,
.pw-mkt__sort,
.pw-mkt__view {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 40px;
  padding: 0 var(--pw-space-3);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-md);
  background: var(--pw-surface);
  font-size: var(--pw-text-sm);
}

.pw-mkt__sort {
  margin-left: auto;
  color: var(--pw-muted);
}

.pw-mkt__sort select {
  border: 0;
  background: transparent;
  font-weight: var(--pw-weight-semibold);
  color: var(--pw-ink);
  cursor: pointer;
}

.pw-mkt__view {
  width: 40px;
  justify-content: center;
  padding: 0;
  border: 0;
  color: var(--pw-navy-700);
}

.pw-mkt__pages {
  margin-top: var(--pw-space-8);
}

.is-refreshing {
  opacity: 0.55;
  transition: opacity var(--pw-duration) var(--pw-ease);
}

.pw-mkt__drawer-panel {
  border: 0;
  padding: 0;
}

@media (min-width: 1024px) {
  .pw-mkt__layout {
    grid-template-columns: 310px minmax(0, 1fr);
  }
  .pw-mkt__rail {
    display: block;
  }
  .pw-mkt__filter-btn {
    display: none;
  }
  .pw-mkt__tools {
    width: auto;
  }
  .pw-mkt__chips + .pw-mkt__tools {
    margin-left: 0;
  }
}
</style>
