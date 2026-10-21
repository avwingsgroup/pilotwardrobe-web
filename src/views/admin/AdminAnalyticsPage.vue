<script setup lang="ts">
import { ref } from 'vue'
import { Download } from '@lucide/vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import FilterSelect from '@/components/admin/FilterSelect.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import { adminService } from '@/api/admin.api'
import { useResource } from '@/composables/useResource'
import { useCsvExport } from '@/composables/useCsvExport'

/** AD17 — analytics: buyer funnel, GMV by category, seller retention cohorts, trust & safety. */
const segment = ref('')
const { data, state, error, reload } = useResource((s) => adminService.analytics(segment.value || 'all', s), { watch: [segment] })
const csv = useCsvExport('analytics', ref({ segment: segment.value }))
const TONES: Record<string, string> = { navy: 'var(--pw-navy-700)', slate: 'var(--pw-navy-500)', gold: 'var(--pw-gold-500)', green: 'var(--pw-success-600)', brown: '#8a6d1f', grey: 'var(--pw-subtle)' }
const cohortBg = (v: number) => `color-mix(in srgb, var(--pw-navy-700) ${Math.round(v)}%, #dfe5ef)`
</script>

<template>
  <div>
    <AdminPageHeader title="Analytics" :subtitle="data?.periodLabel ?? ''">
      <FilterSelect v-model="segment" label="Segment: All" :options="[{ value: 'ng', label: 'Nigeria' }, { value: 'gh', label: 'Ghana' }, { value: 'new', label: 'New users' }]" />
      <AppButton variant="secondary" size="sm" :loading="csv.exporting.value" @click="csv.run"><template #icon><Download :size="14" /></template>Export</AppButton>
    </AdminPageHeader>
    <ErrorState v-if="state === 'error'" :error="error" class="pw-card" @retry="reload" />
    <AppSkeleton v-else-if="!data" height="420px" radius="var(--pw-radius-lg)" />
    <div v-else class="pw-an">
      <section class="pw-card pw-card-pad" aria-labelledby="funnel">
        <h2 id="funnel" class="pw-card-title">Buyer funnel</h2>
        <table class="pw-an__funnel">
          <caption class="sr-only">Buyer funnel</caption>
          <tbody>
            <tr v-for="f in data.funnel" :key="f.label">
              <th scope="row">{{ f.label }}</th>
              <td class="pw-an__bar-cell"><span class="pw-an__bar" :style="{ width: `${Math.max(2, f.percent)}%` }" /></td>
              <td class="pw-tabular"><strong>{{ f.value.toLocaleString() }}</strong></td>
              <td class="pw-tabular pw-muted">{{ f.percent }}%</td>
            </tr>
          </tbody>
        </table>
      </section>
      <section class="pw-card pw-card-pad" aria-labelledby="gmvcat">
        <h2 id="gmvcat" class="pw-card-title">GMV by category</h2>
        <ul class="pw-an__cats" role="list">
          <li v-for="c in data.gmvByCategory" :key="c.label">
            <span class="pw-an__swatch" :style="{ background: TONES[c.tone] }" aria-hidden="true" />
            <span class="pw-an__cat-label">{{ c.label }}</span>
            <span class="pw-an__track"><span :style="{ width: `${(c.share / 40) * 100}%`, background: TONES[c.tone] }" /></span>
            <strong>{{ c.share }}%</strong>
          </li>
        </ul>
      </section>
      <section class="pw-card pw-card-pad" aria-labelledby="cohorts">
        <h2 id="cohorts" class="pw-card-title">Seller retention · monthly cohorts</h2>
        <div class="pw-scroll-x">
          <table class="pw-an__cohorts">
            <thead><tr><th scope="col"><span class="sr-only">Cohort</span></th><th v-for="n in 6" :key="n" scope="col">M{{ n - 1 }}</th></tr></thead>
            <tbody>
              <tr v-for="c in data.cohorts" :key="c.month">
                <th scope="row">{{ c.month }}</th>
                <td v-for="(v, i) in c.values" :key="i" :style="{ background: cohortBg(v), color: v > 55 ? '#fff' : 'var(--pw-ink)' }">{{ v }}%</td>
                <td v-for="n in 6 - c.values.length" :key="`e${n}`" />
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section class="pw-card pw-card-pad" aria-labelledby="ts">
        <h2 id="ts" class="pw-card-title">Trust &amp; safety</h2>
        <dl class="pw-dl pw-an__ts">
          <template v-for="t in data.trustSafety" :key="t.label"><dt>{{ t.label }}</dt><dd>{{ t.value }}</dd></template>
        </dl>
      </section>
    </div>
  </div>
</template>

<style scoped>
.pw-an {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-4);
}

.pw-an__funnel {
  margin-top: var(--pw-space-3);
  font-size: var(--pw-text-sm);
}

.pw-an__funnel th,
.pw-an__funnel td {
  padding: var(--pw-space-2);
  text-align: left;
  font-weight: var(--pw-weight-regular);
}

.pw-an__bar-cell {
  width: 45%;
}

.pw-an__bar {
  display: block;
  height: 16px;
  border-radius: 3px;
  background: var(--pw-navy-700);
}

.pw-an__cats li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) minmax(0, 1.4fr) auto;
  align-items: center;
  gap: var(--pw-space-3);
  padding: var(--pw-space-2) 0;
  font-size: var(--pw-text-sm);
}

.pw-an__swatch {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.pw-an__track {
  height: 6px;
  border-radius: 3px;
  background: var(--pw-border);
  overflow: hidden;
}

.pw-an__track span {
  display: block;
  height: 100%;
}

.pw-an__cohorts {
  margin-top: var(--pw-space-3);
  font-size: var(--pw-text-xs);
  border-collapse: separate;
  border-spacing: 4px;
}

.pw-an__cohorts th {
  font-weight: var(--pw-weight-regular);
  color: var(--pw-muted);
  text-align: left;
  white-space: nowrap;
}

.pw-an__cohorts td {
  min-width: 52px;
  padding: 6px;
  border-radius: 3px;
  text-align: center;
  font-weight: var(--pw-weight-semibold);
}

.pw-an__ts {
  margin-top: var(--pw-space-3);
}

@media (min-width: 1100px) {
  .pw-an {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
