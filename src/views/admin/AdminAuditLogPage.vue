<script setup lang="ts">
import { Download } from '@lucide/vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import FilterSelect from '@/components/admin/FilterSelect.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import DataTable from '@/components/common/DataTable.vue'
import { adminService } from '@/api/admin.api'
import { useAdminTable } from '@/composables/useAdminTable'
import { useCsvExport } from '@/composables/useCsvExport'
import { formatAuditTime } from '@/utils/date'
import type { AuditEntry } from '@/types/admin'
import type { Column } from '@/types/ui'

/** AD19 — append-only audit log, 7-year retention, signed CSV export. Read-only. */
const t = useAdminTable<AuditEntry>((q, s) => adminService.auditLog(q, s), { filters: { actor: '', action: '', target: '', range: '' } })
const csv = useCsvExport('audit-logs', t.query)

const columns: Column<AuditEntry>[] = [
  { key: 'time', label: 'Time (WAT)' },
  { key: 'actor', label: 'Actor' },
  { key: 'action', label: 'Action' },
  { key: 'target', label: 'Target' },
  { key: 'details', label: 'Details', hideOnMobile: true },
  { key: 'ip', label: 'IP', hideOnMobile: true },
]
const TONE = { danger: 'danger', warning: 'gold', success: 'success', info: 'info' } as const
</script>

<template>
  <div>
    <AdminPageHeader title="Audit log" subtitle="Retained 7 years · append-only · export signed with SHA-256">
      <AppButton variant="secondary" size="sm" :loading="csv.exporting.value" @click="csv.run"><template #icon><Download :size="14" /></template>Export signed CSV</AppButton>
    </AdminPageHeader>
    <div class="pw-al__filters">
      <FilterSelect v-model="t.filters.actor" label="Actor: Any" :options="['Amaka N.', 'Tolu A.', 'Jide O.', 'System'].map((v) => ({ value: v, label: v }))" />
      <FilterSelect v-model="t.filters.action" label="Action: Any" :options="['ORDER', 'USER', 'KYC', 'DISPUTE', 'FEE_RULE', 'ROLE', 'ESCROW', 'PAYOUT', 'SETTINGS'].map((v) => ({ value: v, label: v }))" />
      <FilterSelect v-model="t.filters.target" label="Target type: Any" :options="[{ value: 'order', label: 'Orders' }, { value: 'user', label: 'Users' }, { value: 'listing', label: 'Listings' }]" />
      <FilterSelect v-model="t.filters.range" label="Last 7 days" :options="[{ value: '24h', label: 'Last 24h' }, { value: '30d', label: 'Last 30 days' }, { value: '1y', label: 'Last year' }]" />
    </div>
    <ErrorState v-if="t.state.value === 'error'" :error="t.error.value" class="pw-card" @retry="t.reload" />
    <DataTable v-else :columns="columns" :rows="t.rows.value" :loading="t.state.value === 'loading'" dense caption="Audit log">
      <template #cell-time="{ row }"><span class="pw-mono">{{ formatAuditTime(row.at) }}</span></template>
      <template #cell-actor="{ row }"><span class="pw-al__actor"><AppAvatar :name="row.actor.name" :initials="row.actor.initials" :size="24" :tone="row.actor.system ? 'soft' : 'navy'" /> {{ row.actor.name }}</span></template>
      <template #cell-action="{ row }"><AppBadge :tone="TONE[row.tone]">{{ row.action }}</AppBadge></template>
      <template #cell-target="{ row }"><span class="pw-mono">{{ row.target }}</span></template>
      <template #cell-details="{ row }"><span class="pw-al__details">{{ row.details }}</span></template>
      <template #cell-ip="{ row }"><span class="pw-mono">{{ row.ip ?? '—' }}</span></template>
      <template v-if="t.meta.value && t.meta.value.lastPage > 1" #footer>
        <span>{{ t.meta.value.total }} entries</span>
        <AppPagination variant="compact" :page="t.meta.value.currentPage" :last-page="t.meta.value.lastPage" @change="t.page.value = $event" />
      </template>
    </DataTable>
  </div>
</template>

<style scoped>
.pw-al__filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pw-space-2);
  margin-bottom: var(--pw-space-4);
}

.pw-al__actor {
  display: inline-flex;
  align-items: center;
  gap: var(--pw-space-2);
}

.pw-al__details {
  display: block;
  max-width: 280px;
  text-align: left;
}
</style>
