<script setup lang="ts">
import { computed, ref } from 'vue'
import { Tag } from '@lucide/vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import TableToolbar from '@/components/admin/TableToolbar.vue'
import FilterSelect from '@/components/admin/FilterSelect.vue'
import ReasonDialog from '@/components/admin/ReasonDialog.vue'
import AppTabs from '@/components/common/AppTabs.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppImage from '@/components/common/AppImage.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import { adminService } from '@/api/admin.api'
import { toApiError } from '@/api/errors'
import { useAdminTable } from '@/composables/useAdminTable'
import { useCsvExport } from '@/composables/useCsvExport'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import type { ModerationItem } from '@/types/admin'

/** AD6 — listing moderation grid with bulk decisions. */
const auth = useAuthStore()
const ui = useUiStore()
const t = useAdminTable<ModerationItem>((q, s) => adminService.moderation(q, s), { tab: 'needs_review', filters: { reason: '', category: '', kyc: '', price: '' } })
const csv = useCsvExport('moderation', t.query)
const pending = ref<{ ids: string[]; action: 'request_changes' | 'remove' } | null>(null)
const busy = ref(false)

const tabs = computed(() => [
  { value: 'needs_review', label: `Needs review ${t.counts.value.needs_review ?? ''}` },
  { value: 'live', label: `Live ${(t.counts.value.live ?? 0).toLocaleString()}` },
  { value: 'changes_requested', label: `Changes requested ${t.counts.value.changes_requested ?? ''}` },
  { value: 'removed', label: `Removed ${t.counts.value.removed ?? ''}` },
  { value: 'all', label: 'All' },
])

function toggle(id: string) {
  t.selected.value = t.selected.value.includes(id) ? t.selected.value.filter((x) => x !== id) : [...t.selected.value, id]
}

async function decide(ids: string[], action: 'approve' | 'request_changes' | 'remove', note?: string) {
  if (action !== 'approve' && !note) {
    pending.value = { ids, action }
    return
  }
  busy.value = true
  try {
    const { updated } = await adminService.moderate(ids, action, note)
    ui.success(`${updated} listing${updated === 1 ? '' : 's'} ${action === 'approve' ? 'approved' : action === 'remove' ? 'removed' : 'sent back for changes'}`)
    t.selected.value = []
    pending.value = null
    void t.reload()
  } catch (e) {
    ui.error('Moderation failed', toApiError(e).message)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div>
    <AdminPageHeader title="Listing moderation" :subtitle="`${t.counts.value.needs_review ?? 0} waiting · auto-rules flagged 6 · user reports 3`" />
    <AppTabs v-model="t.tab.value" :items="tabs" label="Moderation queues" class="pw-mod__tabs" />
    <TableToolbar v-model:search="t.search.value" placeholder="Search title, seller, listing ID" exportable :exporting="csv.exporting.value" @export="csv.run">
      <FilterSelect v-model="t.filters.reason" label="Reason" :options="[{ value: 'price', label: 'Price anomaly' }, { value: 'counterfeit', label: 'Counterfeit risk' }, { value: 'restricted', label: 'Restricted item' }, { value: 'contact', label: 'Off-platform contact' }]" />
      <FilterSelect v-model="t.filters.category" label="Category" :options="[{ value: 'headsets', label: 'Headsets' }, { value: 'avionics', label: 'Avionics' }, { value: 'eyewear', label: 'Eyewear' }]" />
      <FilterSelect v-model="t.filters.kyc" label="Seller KYC" :options="[{ value: 'approved', label: 'Approved' }, { value: 'pending', label: 'Pending' }]" />
      <FilterSelect v-model="t.filters.price" label="Price" :options="[{ value: 'under_100', label: 'Under $100' }, { value: 'over_500', label: 'Over $500' }]" />
    </TableToolbar>

    <div v-if="t.selected.value.length" class="pw-mod__bulk" role="region" aria-label="Bulk actions">
      <strong>{{ t.selected.value.length }} selected</strong>
      <button v-can="'listings.approve'" type="button" @click="decide(t.selected.value, 'approve')">Approve</button>
      <button v-can="'listings.reject'" type="button" @click="decide(t.selected.value, 'request_changes')">Request changes</button>
      <button v-can="'listings.reject'" type="button" class="is-danger" @click="decide(t.selected.value, 'remove')">Remove</button>
    </div>

    <ErrorState v-if="t.state.value === 'error'" :error="t.error.value" class="pw-card" @retry="t.reload" />
    <AppEmptyState v-else-if="t.state.value === 'success' && !t.rows.value.length" :icon="Tag" title="Nothing to moderate" body="New flags appear here as auto-rules and user reports come in." class="pw-card" />
    <ul v-else class="pw-mod__grid" role="list" :aria-busy="t.state.value === 'loading'">
      <template v-if="t.state.value === 'loading'"><li v-for="n in 8" :key="n"><AppSkeleton height="280px" radius="var(--pw-radius-lg)" /></li></template>
      <li v-for="m in t.rows.value" v-else :key="m.id" class="pw-mod__card" :class="{ 'is-selected': t.selected.value.includes(m.id) }">
        <div class="pw-mod__media">
          <AppImage :media="m.image" ratio="16 / 11" fit="cover" sizes="260px" />
          <label class="pw-mod__check"><input type="checkbox" :checked="t.selected.value.includes(m.id)" :aria-label="`Select ${m.title}`" @change="toggle(m.id)" /></label>
          <span class="pw-mod__flag" :class="`is-${m.flagTone}`">{{ m.flag }}</span>
        </div>
        <div class="pw-mod__body">
          <p class="pw-mod__title">{{ m.title }}</p>
          <p class="pw-mod__detail">{{ m.detail }}</p>
          <div v-if="m.queue === 'needs_review'" class="pw-mod__actions">
            <AppButton variant="success" size="sm" :disabled="!auth.can('listings.approve') || busy" @click="decide([m.id], 'approve')">Approve</AppButton>
            <AppButton variant="secondary" size="sm" :disabled="!auth.can('listings.reject')" @click="decide([m.id], 'request_changes')">Edit</AppButton>
            <AppButton variant="danger-outline" size="sm" :disabled="!auth.can('listings.reject')" @click="decide([m.id], 'remove')">Remove</AppButton>
          </div>
          <p v-else class="pw-mod__detail">{{ m.queue.replace('_', ' ') }}</p>
        </div>
      </li>
    </ul>
    <AppPagination v-if="t.meta.value" class="pw-mod__pages" :page="t.meta.value.currentPage" :last-page="t.meta.value.lastPage" @change="t.page.value = $event" />

    <ReasonDialog
      :open="!!pending"
      :title="pending?.action === 'remove' ? 'Remove listing(s)?' : 'Request changes?'"
      :body="pending?.action === 'remove' ? 'The seller is notified with your reason. Removal is logged.' : 'The seller sees this note and can fix and resubmit.'"
      :confirm-label="pending?.action === 'remove' ? 'Remove' : 'Send request'"
      :tone="pending?.action === 'remove' ? 'danger' : 'primary'"
      :loading="busy"
      @confirm="decide(pending!.ids, pending!.action, $event)"
      @cancel="pending = null"
    />
  </div>
</template>

<style scoped>
.pw-mod__tabs {
  margin-bottom: var(--pw-space-4);
}

.pw-mod__bulk {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--pw-space-2);
  margin-bottom: var(--pw-space-4);
  padding: var(--pw-space-2) var(--pw-space-4);
  border-radius: var(--pw-radius-md);
  background: var(--pw-navy-900);
  color: #fff;
  font-size: var(--pw-text-sm);
}

.pw-mod__bulk button {
  min-height: 30px;
  padding: 0 var(--pw-space-3);
  border: 0;
  border-radius: var(--pw-radius-sm);
  background: transparent;
  color: #fff;
  font-weight: var(--pw-weight-semibold);
}

.pw-mod__bulk button:hover {
  background: rgb(255 255 255 / 10%);
}

.pw-mod__bulk .is-danger {
  color: #ff9d94;
}

.pw-mod__grid {
  display: grid;
  gap: var(--pw-space-4);
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}

.pw-mod__card {
  overflow: hidden;
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-surface);
}

.pw-mod__card.is-selected {
  border: 2px solid var(--pw-navy-700);
}

.pw-mod__media {
  position: relative;
}

.pw-mod__check {
  position: absolute;
  top: 8px;
  left: 8px;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--pw-radius-sm);
  background: rgb(255 255 255 / 92%);
}

.pw-mod__check input {
  width: 18px;
  height: 18px;
  accent-color: var(--pw-navy-700);
}

.pw-mod__flag {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 3px 7px;
  border-radius: var(--pw-radius-xs);
  font-size: 0.625rem;
  font-weight: var(--pw-weight-bold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  background: #fff;
}

.pw-mod__flag.is-danger {
  color: var(--pw-danger-600);
  background: var(--pw-danger-100);
}
.pw-mod__flag.is-warning {
  color: var(--pw-warning-700);
  background: var(--pw-warning-100);
}
.pw-mod__flag.is-neutral {
  color: var(--pw-ink-2);
}

.pw-mod__body {
  padding: var(--pw-space-3);
}

.pw-mod__title {
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-semibold);
}

.pw-mod__detail {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-mod__actions {
  display: flex;
  gap: var(--pw-space-2);
  margin-top: var(--pw-space-3);
}

.pw-mod__pages {
  margin-top: var(--pw-space-6);
}
</style>
