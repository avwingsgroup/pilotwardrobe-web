<script setup lang="ts">
import { computed, ref } from 'vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import TableToolbar from '@/components/admin/TableToolbar.vue'
import FilterSelect from '@/components/admin/FilterSelect.vue'
import AppTabs from '@/components/common/AppTabs.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppConfirmDialog from '@/components/common/AppConfirmDialog.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import DataTable from '@/components/common/DataTable.vue'
import { adminService } from '@/api/admin.api'
import { toApiError } from '@/api/errors'
import { useAdminTable } from '@/composables/useAdminTable'
import { useCsvExport } from '@/composables/useCsvExport'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import type { ReportRow } from '@/types/admin'
import type { Column } from '@/types/ui'

/** AD10 — reports & flags (user reports + automated NLP/OCR/device-graph signals). */
const auth = useAuthStore()
const ui = useUiStore()
const t = useAdminTable<ReportRow>((q, s) => adminService.reports(q, s), { tab: 'all', filters: { type: '', severity: '', source: '', assignee: '' } })
const csv = useCsvExport('reports', t.query)
const confirm = ref<{ row: ReportRow; action: string; label: string } | null>(null)
const busy = ref(false)

const tabs = computed(() => [
  { value: 'all', label: `All ${t.counts.value.all ?? ''}` },
  { value: 'listing', label: `Listings ${t.counts.value.listing ?? ''}` },
  { value: 'user', label: `Users ${t.counts.value.user ?? ''}` },
  { value: 'message', label: `Messages ${t.counts.value.message ?? ''}` },
  { value: 'review', label: `Reviews ${t.counts.value.review ?? ''}` },
])

const columns: Column<ReportRow>[] = [
  { key: 'severity', label: 'Severity' },
  { key: 'report', label: 'Report' },
  { key: 'target', label: 'Target', hideOnMobile: true },
  { key: 'source', label: 'Source', hideOnMobile: true },
  { key: 'reported', label: 'Reported', sortable: true },
  { key: 'assignee', label: 'Assignee', hideOnMobile: true },
  { key: 'actions', label: '', align: 'right' },
]

const SEV = { critical: 'danger', high: 'danger', medium: 'warning', low: 'neutral' } as const

async function run() {
  if (!confirm.value) return
  busy.value = true
  try {
    await adminService.reportAction(confirm.value.row.id, confirm.value.action)
    ui.success(`${confirm.value.label} — report closed`)
    confirm.value = null
    void t.reload()
  } catch (e) {
    ui.error('Action failed', toApiError(e).message)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div>
    <AdminPageHeader title="Reports & flags" :subtitle="`${t.counts.value.all ?? 0} open · median first response 2h 10m`" />
    <AppTabs v-model="t.tab.value" :items="tabs" label="Report types" class="pw-ar__tabs" />
    <TableToolbar v-model:search="t.search.value" placeholder="Search reports" exportable :exporting="csv.exporting.value" @export="csv.run">
      <FilterSelect v-model="t.filters.severity" label="Severity" :options="['critical', 'high', 'medium', 'low'].map((v) => ({ value: v, label: v[0]!.toUpperCase() + v.slice(1) }))" />
      <FilterSelect v-model="t.filters.source" label="Source" :options="[{ value: 'user', label: 'User reports' }, { value: 'auto', label: 'Automated' }]" />
      <FilterSelect v-model="t.filters.assignee" label="Assignee" :options="[{ value: 'me', label: 'Me' }, { value: 'unassigned', label: 'Unassigned' }]" />
    </TableToolbar>
    <ErrorState v-if="t.state.value === 'error'" :error="t.error.value" class="pw-card" @retry="t.reload" />
    <DataTable v-else :columns="columns" :rows="t.rows.value" :loading="t.state.value === 'loading'" :sort="t.sort.value" dense caption="Reports" :row-class="(r) => (r.severity === 'critical' ? 'is-highlight' : undefined)" @sort="t.toggleSort">
      <template #cell-severity="{ row }"><AppBadge :tone="SEV[row.severity]">{{ row.severity === 'medium' ? 'Med' : row.severity }}</AppBadge></template>
      <template #cell-report="{ row }"><span class="pw-ar__rep"><strong>{{ row.title }}</strong><small>{{ row.detail }}</small></span></template>
      <template #cell-target="{ row }">{{ row.target }}</template>
      <template #cell-source="{ row }">{{ row.source }}</template>
      <template #cell-reported="{ row }">{{ row.reportedAgo }}</template>
      <template #cell-assignee="{ row }">
        <AppAvatar v-if="row.assignee" :name="row.assignee.name" :initials="row.assignee.initials" :size="24" tone="navy" />
        <span v-else class="pw-muted">Unassigned</span>
      </template>
      <template #cell-actions="{ row }">
        <span class="pw-ar__actions">
          <AppButton
            v-if="row.primaryAction && auth.can('reports.manage')"
            size="sm"
            :variant="row.primaryAction.tone === 'danger' ? 'danger-outline' : 'secondary'"
            @click="confirm = { row, action: row.primaryAction.key, label: row.primaryAction.label }"
          >
            {{ row.primaryAction.label }}
          </AppButton>
          <AppButton size="sm" variant="secondary" :to="row.type === 'user' ? { name: 'admin-users', query: { search: row.target.split(' ')[1] } } : row.type === 'listing' ? { name: 'admin-listings' } : { name: 'admin-reports' }">Open</AppButton>
        </span>
      </template>
    </DataTable>
    <AppConfirmDialog :open="!!confirm" :title="`${confirm?.label}?`" :body="confirm ? `${confirm.row.title} — ${confirm.row.target}. This action is audited and the report will be closed.` : ''" :confirm-label="confirm?.label" tone="danger" :loading="busy" @confirm="run" @cancel="confirm = null" />
  </div>
</template>

<style scoped>
.pw-ar__tabs {
  margin-bottom: var(--pw-space-4);
}

.pw-ar__rep {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.pw-ar__rep small {
  font-size: var(--pw-text-2xs);
  color: var(--pw-muted);
}

.pw-ar__actions {
  display: inline-flex;
  gap: var(--pw-space-2);
}
</style>
