<script setup lang="ts">
import type { SizeInfo } from '@/types/product'
import AppBadge from '@/components/common/AppBadge.vue'

defineProps<{ chart: NonNullable<SizeInfo['chart']>; fitSize?: string | null }>()
</script>

<template>
  <div class="pw-sizechart">
    <div class="pw-scroll-x">
      <table>
        <caption class="sr-only">Size chart (cm)</caption>
        <thead>
          <tr>
            <th scope="col">Size</th>
            <th v-for="c in chart.columns" :key="c" scope="col">{{ c }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in chart.rows" :key="row.size" :class="{ 'is-fit': row.size === fitSize }">
            <th scope="row">
              {{ row.size }}
              <AppBadge v-if="row.size === fitSize" tone="navy">Your fit</AppBadge>
            </th>
            <td v-for="c in chart.columns" :key="c">{{ row.measurements[c] }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="chart.note" class="pw-sizechart__note">{{ chart.note }}</p>
  </div>
</template>

<style scoped>
.pw-sizechart table {
  min-width: 520px;
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
  border-collapse: separate;
  border-spacing: 0;
  overflow: hidden;
  font-variant-numeric: tabular-nums;
}

.pw-sizechart th,
.pw-sizechart td {
  padding: var(--pw-space-3);
  text-align: center;
  font-size: var(--pw-text-base);
  border-bottom: 1px solid var(--pw-border);
}

.pw-sizechart thead th {
  background: var(--pw-surface-sunken);
  font-size: var(--pw-text-2xs);
  font-weight: var(--pw-weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--pw-muted);
}

.pw-sizechart tbody th {
  font-weight: var(--pw-weight-semibold);
  white-space: nowrap;
}

.pw-sizechart tbody tr:last-child > * {
  border-bottom: 0;
}

.pw-sizechart tr.is-fit > * {
  background: var(--pw-navy-100);
  color: var(--pw-navy-700);
  font-weight: var(--pw-weight-semibold);
}

.pw-sizechart__note {
  margin-top: var(--pw-space-2);
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}
</style>
