<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { MoreHorizontal } from '@lucide/vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import TableToolbar from '@/components/admin/TableToolbar.vue'
import ReasonDialog from '@/components/admin/ReasonDialog.vue'
import FilterSelect from '@/components/admin/FilterSelect.vue'
import AppTabs from '@/components/common/AppTabs.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppDropdown from '@/components/common/AppDropdown.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import DataTable from '@/components/common/DataTable.vue'
import AppTextarea from '@/components/forms/AppTextarea.vue'
import AppInput from '@/components/forms/AppInput.vue'
import { adminService } from '@/api/admin.api'
import { toApiError } from '@/api/errors'
import { useAdminTable } from '@/composables/useAdminTable'
import { useCsvExport } from '@/composables/useCsvExport'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { KYC_STATUS } from '@/constants/labels'
import { formatMoney } from '@/utils/money'
import { formatMonthYear } from '@/utils/date'
import type { AdminUserRow } from '@/types/admin'
import type { Column } from '@/types/ui'

/** AD3 — users. */
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()
const t = useAdminTable<AdminUserRow>((q, s) => adminService.users(q, s), { tab: 'all', filters: { country: '', role: '', kyc: '', risk: '' } })
const csv = useCsvExport('users', t.query)
const noteOpen = ref(false)
const note = ref('')
const inviteOpen = ref(false)
const invite = ref({ email: '', name: '' })

const tabs = computed(() => [
  { value: 'all', label: `All ${(t.counts.value.all ?? 0).toLocaleString()}` },
  { value: 'verified', label: `Verified sellers ${(t.counts.value.verified ?? 0).toLocaleString()}` },
  { value: 'buyers', label: `Buyers only ${(t.counts.value.buyers ?? 0).toLocaleString()}` },
  { value: 'photographers', label: `Photographers ${t.counts.value.photographers ?? 0}` },
  { value: 'pending_kyc', label: `Pending KYC ${t.counts.value.pending_kyc ?? 0}` },
  { value: 'suspended', label: `Suspended ${t.counts.value.suspended ?? 0}` },
])

const columns: Column<AdminUserRow>[] = [
  { key: 'user', label: 'User' },
  { key: 'role', label: 'Role' },
  { key: 'kyc', label: 'KYC' },
  { key: 'country', label: 'Country', hideOnMobile: true },
  { key: 'trades', label: 'Trades', align: 'right', sortable: true, hideOnMobile: true },
  { key: 'gmv', label: 'GMV', align: 'right', sortable: true },
  { key: 'risk', label: 'Risk' },
  { key: 'joined', label: 'Joined', sortable: true, hideOnMobile: true },
  { key: 'actions', label: '', align: 'right' },
]

const suspending = ref<AdminUserRow | null>(null)
const busy = ref(false)

async function suspend(reason: string) {
  if (!suspending.value) return
  busy.value = true
  try {
    await adminService.suspendUser(suspending.value.id, reason)
    ui.success('User suspended')
    suspending.value = null
    void t.reload()
  } catch (e) {
    ui.error('Suspend failed', toApiError(e).message)
  } finally {
    busy.value = false
  }
}

async function bulkNote() {
  try {
    await Promise.all(t.selected.value.map((id) => adminService.addNote(id, note.value)))
    ui.success(`Note added to ${t.selected.value.length} users`)
    noteOpen.value = false
    note.value = ''
    t.selected.value = []
  } catch (e) {
    ui.error("Couldn't add notes", toApiError(e).message)
  }
}

async function sendInvite() {
  busy.value = true
  try {
    await adminService.inviteUser(invite.value)
    ui.success('Invitation sent', `${invite.value.email} will receive a sign-up link.`)
    inviteOpen.value = false
    invite.value = { email: '', name: '' }
  } catch (e) {
    ui.error("Couldn't send invite", toApiError(e).message)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div>
    <AdminPageHeader title="Users" :subtitle="`${(t.counts.value.all ?? 0).toLocaleString()} total · ${(t.counts.value.verified ?? 0).toLocaleString()} verified sellers · ${t.counts.value.suspended ?? 0} suspended`">
      <AppButton v-can="'users.create'" variant="secondary" size="sm" @click="inviteOpen = true">Invite user</AppButton>
      <AppButton v-can="'users.update'" variant="secondary" size="sm" :disabled="!t.selected.value.length" @click="noteOpen = true">Add note in bulk</AppButton>
    </AdminPageHeader>

    <AppTabs v-model="t.tab.value" variant="pills" :items="tabs" label="User segments" class="pw-au__tabs" />
    <TableToolbar v-model:search="t.search.value" placeholder="Search name, email, phone, user ID" exportable :exporting="csv.exporting.value" @export="csv.run">
      <FilterSelect v-model="t.filters.country" label="Country" :options="[{ value: 'NG', label: 'Nigeria' }, { value: 'GH', label: 'Ghana' }, { value: 'GB', label: 'United Kingdom' }]" />
      <FilterSelect v-model="t.filters.role" label="Role" :options="[{ value: 'user', label: 'User' }, { value: 'aviator', label: 'Aviator' }, { value: 'admin', label: 'Admin' }]" />
      <FilterSelect v-model="t.filters.kyc" label="KYC" :options="[{ value: 'approved', label: 'Approved' }, { value: 'pending', label: 'Pending' }, { value: 'rejected', label: 'Rejected' }, { value: 'not_started', label: 'Not started' }]" />
      <FilterSelect v-model="t.filters.risk" label="Risk" :options="[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]" />
    </TableToolbar>

    <ErrorState v-if="t.state.value === 'error'" :error="t.error.value" class="pw-card" @retry="t.reload" />
    <DataTable
      v-else
      v-model:selected="t.selected.value"
      :columns="columns"
      :rows="t.rows.value"
      :loading="t.state.value === 'loading' || t.refreshing.value"
      :sort="t.sort.value"
      selectable
      dense
      caption="Users"
      :row-class="(r) => (r.risk === 'high' ? 'is-highlight' : undefined)"
      @sort="t.toggleSort"
      @row-click="(r) => router.push({ name: 'admin-user', params: { id: r.id } })"
    >
      <template #cell-user="{ row }">
        <span class="pw-au__user">
          <AppAvatar :name="row.displayName" :initials="row.initials" :size="30" />
          <span><RouterLink :to="{ name: 'admin-user', params: { id: row.id } }" @click.stop>{{ row.displayName }}</RouterLink><small>{{ row.email }} · {{ row.code }}</small></span>
        </span>
      </template>
      <template #cell-role="{ row }">
        <span class="pw-au__role">{{ row.roleLabel }}<AppBadge v-if="row.status === 'suspended'" tone="navy">Suspended</AppBadge></span>
      </template>
      <template #cell-kyc="{ row }"><StatusBadge :status="KYC_STATUS[row.kycStatus]" /></template>
      <template #cell-country="{ row }">{{ row.countryName }}</template>
      <template #cell-gmv="{ row }">{{ formatMoney(row.gmv, { whole: true }) }}</template>
      <template #cell-risk="{ row }"><AppBadge :tone="row.risk === 'high' ? 'danger' : row.risk === 'medium' ? 'warning' : 'success'">{{ row.risk === 'medium' ? 'Med' : row.risk }}</AppBadge></template>
      <template #cell-joined="{ row }">{{ formatMonthYear(row.joinedAt) }}</template>
      <template #cell-actions="{ row }">
        <span @click.stop>
          <AppDropdown :label="`Actions for ${row.displayName}`">
            <template #trigger="{ toggle, attrs }"><button type="button" class="pw-au__more" v-bind="attrs" :aria-label="`Actions for ${row.displayName}`" @click="toggle"><MoreHorizontal :size="16" /></button></template>
            <template #items>
              <RouterLink role="menuitem" :to="{ name: 'admin-user', params: { id: row.id } }">Open profile</RouterLink>
              <button v-if="auth.can('users.suspend') && row.status !== 'suspended'" type="button" role="menuitem" @click="suspending = row">Suspend…</button>
            </template>
          </AppDropdown>
        </span>
      </template>
      <template v-if="t.meta.value" #footer>
        <span>Showing {{ t.meta.value.from ?? 0 }}–{{ t.meta.value.to ?? 0 }} of {{ (t.counts.value[t.tab.value] ?? t.meta.value.total).toLocaleString() }}</span>
        <AppPagination variant="compact" :page="t.meta.value.currentPage" :last-page="t.meta.value.lastPage" @change="t.page.value = $event" />
      </template>
    </DataTable>

    <AppModal :open="noteOpen" :title="`Add note to ${t.selected.value.length} users`" size="sm" @close="noteOpen = false">
      <AppTextarea v-model="note" label="Internal note" :rows="3" hint="Visible to staff only. Written to the audit log." />
      <template #footer>
        <AppButton variant="secondary" @click="noteOpen = false">Cancel</AppButton>
        <AppButton :disabled="!note.trim()" @click="bulkNote">Add note</AppButton>
      </template>
    </AppModal>
    <AppModal :open="inviteOpen" title="Invite user" size="sm" @close="inviteOpen = false">
      <div class="pw-stack">
        <AppInput v-model="invite.name" label="Name" />
        <AppInput v-model="invite.email" label="Email" type="email" />
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="inviteOpen = false">Cancel</AppButton>
        <AppButton :disabled="!invite.email" :loading="busy" @click="sendInvite">Send invite</AppButton>
      </template>
    </AppModal>
    <ReasonDialog :open="!!suspending" :title="`Suspend ${suspending?.displayName ?? ''}?`" body="They can't log in, list or withdraw until reinstated. Open escrow is held." confirm-label="Suspend" :loading="busy" @confirm="suspend" @cancel="suspending = null" />
  </div>
</template>

<style scoped>
.pw-au__tabs {
  margin-bottom: var(--pw-space-4);
}

.pw-au__user {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  text-align: left;
}

.pw-au__user span {
  display: flex;
  flex-direction: column;
}

.pw-au__user a {
  color: var(--pw-ink);
  font-weight: var(--pw-weight-semibold);
}

.pw-au__user small {
  font-size: var(--pw-text-2xs);
  color: var(--pw-muted);
}

.pw-au__role {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.pw-au__more {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--pw-muted);
}
</style>
