<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Download, Plus } from '@lucide/vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import DataTable from '@/components/common/DataTable.vue'
import AppInput from '@/components/forms/AppInput.vue'
import { adminService } from '@/api/admin.api'
import { toApiError } from '@/api/errors'
import { useResource } from '@/composables/useResource'
import { useCsvExport } from '@/composables/useCsvExport'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { formatMoney } from '@/utils/money'
import type { CommissionRule } from '@/types/admin'
import type { Column } from '@/types/ui'

/** AD12 — fees & revenue. Changes apply to new listings/orders only and need Super admin + approver. */
const auth = useAuthStore()
const ui = useUiStore()
const { data, state, error, reload } = useResource((s) => adminService.fees(s))
const csv = useCsvExport('revenue', ref({}))
const editing = ref<Partial<CommissionRule> | null>(null)
const timings = reactive<Record<string, string>>({})
const savingTimings = ref(false)
const savingRule = ref(false)
const canManage = computed(() => auth.can('fees.manage'))

watch(data, (d) => d && d.escrowTimings.forEach((t) => (timings[t.key] = t.value)), { immediate: true })

const max = computed(() => Math.max(...(data.value?.monthly.map((m) => m.value) ?? [1])))
const columns: Column<CommissionRule>[] = [
  { key: 'rule', label: 'Rule' },
  { key: 'applies', label: 'Applies to', hideOnMobile: true },
  { key: 'rate', label: 'Rate', align: 'right' },
  { key: 'cap', label: 'Cap / min', hideOnMobile: true },
  { key: 'status', label: 'Status' },
  { key: 'edit', label: '', align: 'right' },
]
const TONE = { navy: 'var(--pw-navy-700)', slate: 'var(--pw-navy-500)', gold: 'var(--pw-gold-500)', green: 'var(--pw-success-600)' }

async function saveRule() {
  if (!editing.value) return
  savingRule.value = true
  try {
    const res = await adminService.saveCommissionRule(editing.value)
    ui.success(res.status === 'pending_approval' ? 'Submitted — awaiting a second approver' : 'Rule saved')
    editing.value = null
  } catch (e) {
    ui.error("Couldn't save rule", toApiError(e).message)
  } finally {
    savingRule.value = false
  }
}

async function saveTimings() {
  savingTimings.value = true
  try {
    await adminService.saveEscrowTimings({ ...timings })
    ui.success('Escrow timings submitted for approval')
  } catch (e) {
    ui.error("Couldn't save", toApiError(e).message)
  } finally {
    savingTimings.value = false
  }
}
</script>

<template>
  <div>
    <AdminPageHeader title="Fees & revenue" subtitle="Changes apply to new listings and orders only. Requires Finance role.">
      <AppButton variant="secondary" size="sm" :loading="csv.exporting.value" @click="csv.run"><template #icon><Download :size="14" /></template>Revenue report</AppButton>
    </AdminPageHeader>
    <ErrorState v-if="state === 'error'" :error="error" class="pw-card" @retry="reload" />
    <AppSkeleton v-else-if="!data" height="420px" radius="var(--pw-radius-lg)" />
    <div v-else class="pw-af">
      <div class="pw-stack">
        <section class="pw-card pw-card-pad" aria-labelledby="rev">
          <h2 id="rev" class="pw-card-title">Revenue · {{ data.monthLabel }}</h2>
          <div class="pw-af__rev">
            <div>
              <p class="pw-af__big">{{ formatMoney(data.revenue, { whole: true }) }}</p>
              <p class="pw-af__delta">{{ data.deltaLabel }}</p>
            </div>
            <div class="pw-af__bars" role="img" :aria-label="`Monthly revenue, last 12 months, current ${formatMoney(data.revenue)}`">
              <div v-for="(m, i) in data.monthly" :key="i" class="pw-af__bar">
                <span :style="{ height: `${(m.value / max) * 100}%` }" :class="{ 'is-current': m.current }" />
                <small>{{ m.month }}</small>
              </div>
            </div>
          </div>
          <div class="pw-af__split" aria-hidden="true"><span v-for="b in data.breakdown" :key="b.label" :style="{ flex: b.share, background: TONE[b.tone] }" /></div>
          <ul class="pw-af__legend" role="list">
            <li v-for="b in data.breakdown" :key="b.label"><strong>{{ formatMoney(b.amount, { whole: true }) }}</strong><small>{{ b.label }}</small></li>
          </ul>
        </section>

        <section aria-labelledby="rules">
          <div class="pw-between pw-af__rules-head">
            <h2 id="rules" class="pw-card-title">Commission rules</h2>
            <AppButton v-if="canManage" size="sm" @click="editing = { name: '', appliesTo: 'All categories', rate: 8, capMin: '—', status: 'scheduled' }"><template #icon><Plus :size="14" /></template>New rule</AppButton>
          </div>
          <DataTable :columns="columns" :rows="data.rules" dense caption="Commission rules" :row-class="(r) => (r.status === 'scheduled' ? 'is-highlight' : undefined)">
            <template #cell-rule="{ row }"><span class="pw-af__rule"><strong>{{ row.name }}</strong><small>{{ row.detail }}</small></span></template>
            <template #cell-applies="{ row }">{{ row.appliesTo }}</template>
            <template #cell-rate="{ row }"><strong>{{ row.rate.toFixed(1) }}%</strong></template>
            <template #cell-cap="{ row }">{{ row.capMin }}</template>
            <template #cell-status="{ row }"><AppBadge :tone="row.status === 'live' ? 'success' : 'warning'">{{ row.status }}</AppBadge></template>
            <template #cell-edit="{ row }"><button v-if="canManage" type="button" class="pw-link-btn" @click="editing = { ...row }">Edit</button></template>
          </DataTable>
        </section>
      </div>

      <aside class="pw-stack">
        <section class="pw-card pw-card-pad pw-stack" aria-labelledby="timings">
          <h2 id="timings" class="pw-card-title">Escrow timings</h2>
          <AppInput v-for="t in data.escrowTimings" :key="t.key" v-model="timings[t.key]!" :label="t.label" :disabled="!canManage" />
          <AppButton v-if="canManage" variant="secondary" :loading="savingTimings" @click="saveTimings">Submit for approval</AppButton>
        </section>
        <section class="pw-card pw-card-pad" aria-labelledby="boost">
          <h2 id="boost" class="pw-card-title">Boost packages</h2>
          <dl class="pw-dl pw-af__boost">
            <template v-for="b in data.boostPackages" :key="b.label"><dt>{{ b.label }}</dt><dd>{{ formatMoney(b.price) }}</dd></template>
          </dl>
        </section>
      </aside>
    </div>

    <AppModal :open="!!editing" :title="editing?.id ? 'Edit commission rule' : 'New commission rule'" description="Fee changes need Super admin + a second approver and apply to new listings only." size="sm" @close="editing = null">
      <div v-if="editing" class="pw-stack">
        <AppInput v-model="editing.name!" label="Rule name" />
        <AppInput v-model="editing.appliesTo!" label="Applies to" />
        <AppInput :model-value="String(editing.rate ?? '')" label="Rate" suffix="%" inputmode="decimal" @update:model-value="editing.rate = Number($event)" />
        <AppInput v-model="editing.capMin!" label="Cap / minimum" />
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="editing = null">Cancel</AppButton>
        <AppButton :loading="savingRule" @click="saveRule">Submit for approval</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<style scoped>
.pw-af {
  display: grid;
  gap: var(--pw-space-4);
}

.pw-af__rev {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--pw-space-6);
  margin: var(--pw-space-4) 0;
}

.pw-af__big {
  font-family: var(--pw-font-display);
  font-size: 2.25rem;
  font-weight: var(--pw-weight-bold);
}

.pw-af__delta {
  color: var(--pw-success-600);
  font-size: var(--pw-text-sm);
}

.pw-af__bars {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 120px;
  min-width: 240px;
}

.pw-af__bar {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
}

.pw-af__bar span {
  width: 100%;
  border-radius: 3px 3px 0 0;
  background: var(--pw-navy-700);
}

.pw-af__bar span.is-current {
  background: var(--pw-gold-500);
}

.pw-af__bar small {
  font-size: 0.625rem;
  color: var(--pw-muted);
}

.pw-af__split {
  display: flex;
  gap: 4px;
  height: 6px;
}

.pw-af__split span {
  border-radius: 3px;
}

.pw-af__legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pw-space-5);
  margin-top: var(--pw-space-3);
  font-size: var(--pw-text-sm);
}

.pw-af__legend li {
  display: flex;
  flex-direction: column;
}

.pw-af__legend small {
  font-size: var(--pw-text-2xs);
  color: var(--pw-muted);
}

.pw-af__rules-head {
  margin-bottom: var(--pw-space-3);
}

.pw-af__rule {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.pw-af__rule small {
  font-size: var(--pw-text-2xs);
  color: var(--pw-muted);
}

.pw-af__boost {
  margin-top: var(--pw-space-3);
}

@media (min-width: 1100px) {
  .pw-af {
    grid-template-columns: minmax(0, 2fr) minmax(260px, 1fr);
  }
}
</style>
