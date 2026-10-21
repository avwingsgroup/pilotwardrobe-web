<script setup lang="ts">
import { computed, ref } from 'vue'
import { Check, Eye, MoreHorizontal, Plus } from '@lucide/vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppDropdown from '@/components/common/AppDropdown.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import DataTable from '@/components/common/DataTable.vue'
import AppInput from '@/components/forms/AppInput.vue'
import AppSelect from '@/components/forms/AppSelect.vue'
import { adminService } from '@/api/admin.api'
import { toApiError } from '@/api/errors'
import { useForm } from '@/composables/useForm'
import { useResource } from '@/composables/useResource'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { email, required } from '@/utils/validators'
import type { PermissionLevel, StaffMember, StaffRole } from '@/types/admin'
import type { Column } from '@/types/ui'

/**
 * AD18 — team & roles (Super admin). Clicking a matrix cell cycles
 * none → view → manage. Super admin is immutable. Roles are server-side RBAC;
 * this page only edits the policy, Laravel enforces it on every request.
 */
const auth = useAuthStore()
const ui = useUiStore()
const { data: roles, state, error, reload, mutate: mutateRoles } = useResource((s) => adminService.roles(s))
const { data: members, mutate: mutateMembers } = useResource((s) => adminService.members(s))
const canManage = computed(() => auth.can('roles.manage'))
const inviteOpen = ref(false)
const roleOpen = ref(false)
const newRole = ref('')

const AREAS: (keyof StaffRole['matrix'])[] = ['view', 'users', 'kyc', 'listings', 'orders', 'refunds', 'disputes', 'payouts', 'fees', 'content', 'team']
const NEXT: Record<PermissionLevel, PermissionLevel> = { none: 'view', view: 'manage', manage: 'none' }

async function cycle(role: StaffRole, area: keyof StaffRole['matrix']) {
  if (!canManage.value || role.id === 'role_super') return
  const matrix = { ...role.matrix, [area]: NEXT[role.matrix[area]] }
  mutateRoles((list) => list?.map((r) => (r.id === role.id ? { ...r, matrix } : r)) ?? null)
  try {
    await adminService.saveRole({ id: role.id, matrix })
  } catch (e) {
    mutateRoles((list) => list?.map((r) => (r.id === role.id ? role : r)) ?? null)
    ui.error("Couldn't update role", toApiError(e).message)
  }
}

const invite = useForm({ name: '', email: '', roleId: 'role_support' }, { name: [required()], email: [required(), email, (v: string) => (v.endsWith('@pilotwardrobe.com') ? true : 'Use a @pilotwardrobe.com Workspace address.')] })

async function sendInvite() {
  const m = await invite.submit((v) => adminService.inviteMember(v))
  if (m) {
    mutateMembers((list) => [...(list ?? []), m])
    inviteOpen.value = false
    invite.reset()
    ui.success('Invitation sent', 'They must enrol a security key on first sign-in.')
  }
}

async function createRole() {
  try {
    const r = await adminService.saveRole({ name: newRole.value })
    mutateRoles((list) => [...(list ?? []), r])
    roleOpen.value = false
    newRole.value = ''
  } catch (e) {
    ui.error("Couldn't create role", toApiError(e).message)
  }
}

async function setStatus(m: StaffMember, status: 'active' | 'suspended') {
  try {
    const updated = await adminService.updateMember(m.id, { status })
    mutateMembers((list) => list?.map((x) => (x.id === m.id ? updated : x)) ?? null)
  } catch (e) {
    ui.error('Update failed', toApiError(e).message)
  }
}

const columns: Column<StaffMember>[] = [
  { key: 'member', label: 'Member' },
  { key: 'role', label: 'Role' },
  { key: 'twofa', label: '2FA', hideOnMobile: true },
  { key: 'last', label: 'Last active', hideOnMobile: true },
  { key: 'status', label: 'Status' },
  { key: 'more', label: '', align: 'right' },
]
</script>

<template>
  <div>
    <AdminPageHeader title="Team & roles" :subtitle="`${members?.length ?? 0} staff · SSO via Google Workspace · security key required`">
      <AppButton v-if="canManage" variant="secondary" size="sm" @click="roleOpen = true">New role</AppButton>
      <AppButton v-can="'users.create'" size="sm" @click="inviteOpen = true"><template #icon><Plus :size="14" /></template>Invite member</AppButton>
    </AdminPageHeader>
    <ErrorState v-if="state === 'error'" :error="error" class="pw-card" @retry="reload" />
    <template v-else>
      <section class="pw-card pw-at__matrix" aria-labelledby="matrix">
        <div class="pw-between pw-at__head">
          <h2 id="matrix" class="pw-card-title">Permission matrix</h2>
          <p class="pw-at__legend"><span class="is-manage" /> Manage <span class="is-view" /> View only</p>
        </div>
        <AppSkeleton v-if="!roles" :lines="5" class="pw-at__pad" />
        <div v-else class="pw-scroll-x">
          <table>
            <thead><tr><th scope="col">Role</th><th v-for="a in AREAS" :key="a" scope="col">{{ a }}</th></tr></thead>
            <tbody>
              <tr v-for="r in roles" :key="r.id">
                <th scope="row"><strong>{{ r.name }}</strong><small>{{ r.members }} members</small></th>
                <td v-for="a in AREAS" :key="a">
                  <button
                    type="button"
                    class="pw-at__cell"
                    :class="`is-${r.matrix[a]}`"
                    :disabled="!canManage || r.id === 'role_super'"
                    :aria-label="`${r.name} · ${a}: ${r.matrix[a]}. Activate to change.`"
                    @click="cycle(r, a)"
                  >
                    <Check v-if="r.matrix[a] === 'manage'" :size="12" :stroke-width="3" />
                    <Eye v-else-if="r.matrix[a] === 'view'" :size="12" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="pw-at__members" aria-labelledby="members">
        <h2 id="members" class="pw-card-title pw-at__mh">Members</h2>
        <DataTable :columns="columns" :rows="members ?? []" :loading="!members" dense caption="Staff members">
          <template #cell-member="{ row }"><span class="pw-at__member"><AppAvatar :name="row.name" :initials="row.initials" :size="28" tone="gold" /><span><strong>{{ row.name }}</strong><small>{{ row.email }}</small></span></span></template>
          <template #cell-role="{ row }">{{ row.roleName }}</template>
          <template #cell-twofa="{ row }">{{ row.twoFactor }}</template>
          <template #cell-last="{ row }">{{ row.lastActive }}</template>
          <template #cell-status="{ row }"><AppBadge :tone="row.status === 'active' ? 'success' : row.status === 'invited' ? 'warning' : 'danger'">{{ row.status }}</AppBadge></template>
          <template #cell-more="{ row }">
            <AppDropdown v-if="canManage" :label="`Actions for ${row.name}`">
              <template #trigger="{ toggle, attrs }"><button type="button" class="pw-at__more" v-bind="attrs" :aria-label="`Actions for ${row.name}`" @click="toggle"><MoreHorizontal :size="16" /></button></template>
              <template #items>
                <button v-if="row.status !== 'suspended'" type="button" role="menuitem" @click="setStatus(row, 'suspended')">Suspend access</button>
                <button v-else type="button" role="menuitem" @click="setStatus(row, 'active')">Restore access</button>
              </template>
            </AppDropdown>
          </template>
        </DataTable>
      </section>
    </template>

    <AppModal :open="inviteOpen" title="Invite team member" size="sm" @close="inviteOpen = false">
      <form id="invite-form" class="pw-stack" novalidate @submit.prevent="sendInvite">
        <AppInput v-model="invite.values.name" label="Name" :error="invite.fieldError('name')" />
        <AppInput v-model="invite.values.email" label="Workspace email" type="email" :error="invite.fieldError('email')" />
        <AppSelect v-model="invite.values.roleId" label="Role" :options="(roles ?? []).filter((r) => r.id !== 'role_super').map((r) => ({ value: r.id, label: r.name }))" />
      </form>
      <template #footer>
        <AppButton variant="secondary" @click="inviteOpen = false">Cancel</AppButton>
        <AppButton type="submit" form="invite-form" :loading="invite.submitting.value">Send invite</AppButton>
      </template>
    </AppModal>
    <AppModal :open="roleOpen" title="New role" size="sm" @close="roleOpen = false">
      <AppInput v-model="newRole" label="Role name" placeholder="e.g. Payments analyst" hint="Starts with Support agent permissions; edit in the matrix." />
      <template #footer>
        <AppButton variant="secondary" @click="roleOpen = false">Cancel</AppButton>
        <AppButton :disabled="!newRole.trim()" @click="createRole">Create role</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<style scoped>
.pw-at__matrix {
  margin-bottom: var(--pw-space-5);
}

.pw-at__head {
  padding: var(--pw-space-4) var(--pw-space-5);
}

.pw-at__pad {
  padding: var(--pw-space-4);
}

.pw-at__legend {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-at__legend span {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.pw-at__legend .is-manage {
  background: var(--pw-navy-700);
}

.pw-at__legend .is-view {
  margin-left: var(--pw-space-2);
  border: 1px solid var(--pw-border-strong);
}

.pw-at__matrix table {
  font-size: var(--pw-text-sm);
}

.pw-at__matrix th,
.pw-at__matrix td {
  padding: var(--pw-space-3) var(--pw-space-4);
  border-top: 1px solid var(--pw-border);
  text-align: center;
}

.pw-at__matrix thead th {
  font-size: var(--pw-text-2xs);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--pw-muted);
}

.pw-at__matrix tbody th {
  display: flex;
  flex-direction: column;
  text-align: left;
  font-weight: var(--pw-weight-regular);
}

.pw-at__matrix small {
  font-size: var(--pw-text-2xs);
  color: var(--pw-muted);
}

.pw-at__cell {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border: 1px solid var(--pw-border-strong);
  border-radius: 4px;
  background: var(--pw-surface);
  color: var(--pw-navy-700);
}

.pw-at__cell.is-manage {
  background: var(--pw-navy-700);
  border-color: var(--pw-navy-700);
  color: #fff;
}

.pw-at__cell:disabled {
  cursor: default;
}

.pw-at__mh {
  margin-bottom: var(--pw-space-3);
}

.pw-at__member {
  display: inline-flex;
  align-items: center;
  gap: var(--pw-space-2);
  text-align: left;
}

.pw-at__member span {
  display: flex;
  flex-direction: column;
}

.pw-at__member small {
  font-size: var(--pw-text-2xs);
  color: var(--pw-muted);
}

.pw-at__more {
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
