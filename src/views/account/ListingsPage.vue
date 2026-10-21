<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { refDebounced } from '@vueuse/core'
import { MoreHorizontal, Plus, Search, Upload, Tag } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import AppTabs from '@/components/common/AppTabs.vue'
import AppImage from '@/components/common/AppImage.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import AppDropdown from '@/components/common/AppDropdown.vue'
import AppConfirmDialog from '@/components/common/AppConfirmDialog.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import DataTable from '@/components/common/DataTable.vue'
import BulkPriceModal from '@/components/dashboard/BulkPriceModal.vue'
import ImportListingsModal from '@/components/dashboard/ImportListingsModal.vue'
import { listingService, type MyListingsQuery } from '@/api/listings.api'
import { toApiError } from '@/api/errors'
import { useResource } from '@/composables/useResource'
import { useSeo } from '@/composables/useSeo'
import { useUiStore } from '@/stores/ui.store'
import { LISTING_STATUS } from '@/constants/labels'
import { formatMoney } from '@/utils/money'
import { formatShortDate, timeAgo } from '@/utils/date'
import type { Listing, ListingAction } from '@/types/product'
import type { Column } from '@/types/ui'

/** VB4 — seller listing management. Row actions come from `allowedActions` (backend state machine). */
useSeo({ title: 'Listings', noindex: true })
const route = useRoute()
const router = useRouter()
const ui = useUiStore()

type Tab = 'all' | 'live' | 'drafts' | 'paused' | 'sold' | 'removed'
const tab = ref<Tab>((route.query.tab as Tab) ?? 'all')
const search = ref('')
const promoted = ref(false)
const page = ref(1)
const selected = ref<string[]>([])
const debounced = refDebounced(search, 350)
const confirm = ref<{ ids: string[]; action: 'delete' | 'mark_sold' } | null>(null)
const busy = ref(false)
const priceOpen = ref(false)
const importOpen = ref(false)

const query = computed<MyListingsQuery>(() => ({ status: tab.value, search: debounced.value || undefined, promoted: promoted.value || undefined, page: page.value }))
const { data, state, error, reload, refreshing } = useResource((s) => listingService.mine(query.value, s), { watch: [query], keepPrevious: true })

watch([tab, debounced, promoted], () => {
  page.value = 1
  selected.value = []
  void router.replace({ query: { ...route.query, tab: tab.value === 'all' ? undefined : tab.value } })
})

const counts = computed(() => data.value?.meta.counts)
const tabs = computed(() => [
  { value: 'all' as const, label: `All ${counts.value?.all ?? ''}` },
  { value: 'live' as const, label: `Live ${counts.value?.live ?? ''}` },
  { value: 'drafts' as const, label: `Drafts ${counts.value?.drafts ?? ''}` },
  { value: 'paused' as const, label: `Paused ${counts.value?.paused ?? ''}` },
  { value: 'sold' as const, label: `Sold ${counts.value?.sold ?? ''}` },
  { value: 'removed' as const, label: `Removed ${counts.value?.removed ?? ''}` },
])

const columns: Column<Listing>[] = [
  { key: 'item', label: 'Item' },
  { key: 'price', label: 'Price', align: 'right' },
  { key: 'status', label: 'Status' },
  { key: 'stats', label: 'Views · saves', hideOnMobile: true },
  { key: 'offers', label: 'Offers', align: 'right', hideOnMobile: true },
  { key: 'actions', label: '', align: 'right' },
]

const primaryAction = (l: Listing): { label: string; action: ListingAction } | null => {
  const a = l.allowedActions ?? []
  if (a.includes('finish')) return { label: 'Finish', action: 'finish' }
  if (a.includes('resubmit')) return { label: 'Fix & resubmit', action: 'resubmit' }
  if (a.includes('resume')) return { label: 'Resume', action: 'resume' }
  if (a.includes('relist')) return { label: 'Relist', action: 'relist' }
  if (a.includes('edit')) return { label: 'Edit', action: 'edit' }
  return null
}

const ACTION_LABELS: Partial<Record<ListingAction, string>> = {
  preview: 'Preview',
  promote: 'Promote',
  pause: 'Pause',
  mark_sold: 'Mark sold',
  mark_unavailable: 'Mark unavailable',
  archive: 'Archive',
  delete: 'Delete',
  edit: 'Edit',
}

async function run(l: Listing, action: ListingAction) {
  if (['edit', 'finish', 'resubmit'].includes(action)) return router.push({ name: 'listing-edit', params: { id: l.id } })
  if (action === 'preview') return router.push({ name: 'listing', params: { slug: l.slug } })
  if (action === 'delete' || action === 'mark_sold') {
    confirm.value = { ids: [l.id], action }
    return
  }
  try {
    await listingService.transition(l.id, action as Parameters<typeof listingService.transition>[1])
    ui.success(`Listing ${ACTION_LABELS[action]?.toLowerCase() ?? 'updated'}`)
    await reload()
  } catch (e) {
    ui.error("Couldn't update listing", toApiError(e).message)
  }
}

async function bulk(action: 'pause' | 'promote' | 'mark_sold' | 'delete') {
  if (action === 'delete' || action === 'mark_sold') {
    confirm.value = { ids: [...selected.value], action }
    return
  }
  try {
    const res = await listingService.bulk(selected.value, action)
    ui.success(`${res.updated} listing${res.updated === 1 ? '' : 's'} updated`)
    selected.value = []
    await reload()
  } catch (e) {
    ui.error('Bulk update failed', toApiError(e).message)
  }
}

async function confirmDestructive() {
  if (!confirm.value) return
  busy.value = true
  try {
    const { ids, action } = confirm.value
    if (ids.length === 1 && action === 'delete') await listingService.remove(ids[0]!)
    else if (ids.length === 1) await listingService.transition(ids[0]!, 'mark_sold')
    else await listingService.bulk(ids, action)
    ui.success(action === 'delete' ? 'Deleted' : 'Marked as sold')
    selected.value = []
    confirm.value = null
    await reload()
  } catch (e) {
    ui.error('Action failed', toApiError(e).message)
  } finally {
    busy.value = false
  }
}

function onRepriced() {
  selected.value = []
  void reload()
}

function subtitle(l: Listing) {
  if (l.status === 'draft') return `Draft · ${l.images.length} of 8 photos`
  if (l.status === 'needs_changes') return `${l.moderation?.reason ?? 'Removed by moderator'} · reason: ${l.moderation?.note ?? '—'}`
  if (l.status === 'sold') return `Sold ${formatShortDate(l.updatedAt)}`
  if (l.boost) return `Listed ${formatShortDate(l.createdAt)} · ★ ${l.boost.package === 'jetstream' ? 'Jetstream' : 'Runway'} boost active`
  return `Listed ${formatShortDate(l.createdAt)} · updated ${timeAgo(l.updatedAt)}`
}
</script>

<template>
  <div>
    <header class="pw-page-head">
      <div>
        <h1 class="pw-page-title">Listings</h1>
        <p v-if="counts" class="pw-page-sub">{{ counts.live }} live · {{ counts.drafts }} drafts · {{ counts.paused }} paused · {{ counts.sold }} sold</p>
      </div>
      <div class="pw-page-head__actions">
        <AppButton variant="secondary" @click="importOpen = true">
          <template #icon><Upload :size="16" /></template>Import CSV
        </AppButton>
        <AppButton :to="{ name: 'listing-new' }"><template #icon><Plus :size="18" /></template>New listing</AppButton>
      </div>
    </header>

    <AppTabs v-model="tab" :items="tabs" label="Listing status" />

    <div class="pw-lst__filters">
      <label class="pw-lst__search">
        <Search :size="16" aria-hidden="true" />
        <span class="sr-only">Search your listings</span>
        <input v-model="search" type="search" placeholder="Search your listings" />
      </label>
      <button type="button" class="pw-lst__chip" :class="{ 'is-on': promoted }" :aria-pressed="promoted" @click="promoted = !promoted">Promoted</button>
      <span class="pw-muted pw-lst__sort">Sort: Recently updated</span>
    </div>

    <ErrorState v-if="state === 'error'" :error="error" class="pw-card" @retry="reload" />
    <AppEmptyState v-else-if="state === 'success' && !data?.data.length && tab === 'all' && !search" :icon="Tag" title="Your hangar is empty" body="List your first item in about 4 minutes. Verified sellers get unlimited listings." class="pw-card">
      <AppButton :to="{ name: 'listing-new' }"><template #icon><Plus :size="16" /></template>List an item</AppButton>
    </AppEmptyState>
    <DataTable
      v-else
      v-model:selected="selected"
      :columns="columns"
      :rows="data?.data ?? []"
      :loading="state === 'loading' || refreshing"
      selectable
      caption="Your listings"
      :row-class="(r) => (r.status === 'needs_changes' ? 'is-highlight' : undefined)"
    >
      <template #bulk>
        <button type="button" @click="priceOpen = true">Edit price</button>
        <button type="button" @click="bulk('pause')">Pause</button>
        <button type="button" @click="bulk('promote')">Promote</button>
        <button type="button" @click="bulk('mark_sold')">Mark sold</button>
        <button type="button" class="is-danger" @click="bulk('delete')">Delete</button>
      </template>
      <template #cell-item="{ row }">
        <div class="pw-lst__item">
          <AppImage :media="row.images[0]" ratio="1" sizes="48px" class="pw-lst__thumb" />
          <span>
            <RouterLink :to="{ name: 'listing', params: { slug: row.slug } }" class="pw-lst__title" @click.stop>{{ row.title }}</RouterLink>
            <small>{{ subtitle(row) }}</small>
          </span>
        </div>
      </template>
      <template #cell-price="{ row }"><strong>{{ formatMoney(row.price) }}</strong></template>
      <template #cell-status="{ row }">
        <StatusBadge :status="row.promoted && row.status === 'active' ? { label: 'Promoted', tone: 'gold' } : LISTING_STATUS[row.status]" />
      </template>
      <template #cell-stats="{ row }">{{ row.status === 'draft' || row.status === 'needs_changes' ? '—' : `${row.viewsCount.toLocaleString()} · ${row.favoritesCount}` }}</template>
      <template #cell-offers="{ row }">{{ row.status === 'draft' ? '—' : row.offersCount ?? 0 }}</template>
      <template #cell-actions="{ row }">
        <div class="pw-lst__actions" @click.stop>
          <button v-if="primaryAction(row)" type="button" class="pw-link-btn" @click="run(row, primaryAction(row)!.action)">{{ primaryAction(row)!.label }}</button>
          <AppDropdown :label="`More actions for ${row.title}`">
            <template #trigger="{ toggle, attrs }">
              <button type="button" class="pw-lst__more" v-bind="attrs" :aria-label="`More actions for ${row.title}`" @click="toggle"><MoreHorizontal :size="18" /></button>
            </template>
            <template #items>
              <template v-for="a in row.allowedActions ?? []" :key="a">
                <button v-if="ACTION_LABELS[a] && a !== primaryAction(row)?.action" type="button" role="menuitem" @click="run(row, a)">{{ ACTION_LABELS[a] }}</button>
              </template>
            </template>
          </AppDropdown>
        </div>
      </template>
      <template #empty>No listings match. <button type="button" class="pw-link-btn" @click="(search = ''), (promoted = false), (tab = 'all')">Clear filters</button></template>
      <template v-if="data" #footer>
        <span>Showing {{ data.meta.from ?? 0 }}–{{ data.meta.to ?? 0 }} of {{ data.meta.total }}</span>
        <AppPagination variant="compact" :page="data.meta.currentPage" :last-page="data.meta.lastPage" @change="page = $event" />
      </template>
    </DataTable>

    <BulkPriceModal :open="priceOpen" :ids="selected" @close="priceOpen = false" @done="onRepriced" />
    <ImportListingsModal :open="importOpen" @close="importOpen = false" @done="reload" />
    <AppConfirmDialog
      :open="!!confirm"
      :title="confirm?.action === 'delete' ? `Delete ${confirm.ids.length === 1 ? 'this listing' : `${confirm.ids.length} listings`}?` : 'Mark as sold?'"
      :body="confirm?.action === 'delete' ? 'Deleted listings cannot be recovered. Listings with orders can only be archived.' : 'Buyers will no longer be able to purchase. Use this only for items sold outside an active order.'"
      :confirm-label="confirm?.action === 'delete' ? 'Delete' : 'Mark sold'"
      :tone="confirm?.action === 'delete' ? 'danger' : 'primary'"
      :loading="busy"
      @confirm="confirmDestructive"
      @cancel="confirm = null"
    />
  </div>
</template>

<style scoped>
.pw-lst__filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--pw-space-2);
  margin: var(--pw-space-4) 0;
}

.pw-lst__search {
  display: flex;
  align-items: center;
  gap: var(--pw-space-2);
  flex: 1 1 260px;
  max-width: 360px;
  min-height: 40px;
  padding: 0 var(--pw-space-3);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-md);
  background: var(--pw-surface);
  color: var(--pw-muted);
}

.pw-lst__search input {
  flex: 1;
  border: 0;
  outline: none;
  background: none;
}

.pw-lst__search:focus-within {
  border-color: var(--pw-navy-700);
}

.pw-lst__chip {
  min-height: 40px;
  padding: 0 var(--pw-space-4);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-md);
  background: var(--pw-surface);
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-medium);
}

.pw-lst__chip.is-on {
  border-color: var(--pw-navy-700);
  background: var(--pw-navy-100);
  color: var(--pw-navy-700);
}

.pw-lst__sort {
  margin-left: auto;
  font-size: var(--pw-text-sm);
}

.pw-lst__item {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  text-align: left;
}

.pw-lst__thumb {
  width: 48px;
  flex: none;
  border-radius: var(--pw-radius-md);
}

.pw-lst__item span {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pw-lst__title {
  color: var(--pw-ink);
  font-weight: var(--pw-weight-medium);
}

.pw-lst__item small {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-lst__actions {
  display: inline-flex;
  align-items: center;
  gap: var(--pw-space-2);
}

.pw-lst__more {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--pw-muted);
}

.pw-lst__more:hover {
  background: var(--pw-surface-sunken);
}
</style>
