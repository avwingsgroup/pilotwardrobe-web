<script setup lang="ts" generic="Row extends { id: string }">
import { computed } from 'vue'
import { ArrowDown, ArrowUp, ArrowUpDown, X } from '@lucide/vue'
import AppSkeleton from './AppSkeleton.vue'
import type { Column } from '@/types/ui'

/**
 * Reusable server-driven table (admin + My Hangar):
 *  - typed columns, per-cell slots `#cell-<key>="{ row }"`
 *  - column sorting (emits; the API sorts)
 *  - row selection + bulk action bar (`#bulk="{ selected, clear }"`)
 *  - loading skeleton rows, empty slot, highlighted rows
 *  - < 768px: rows render as stacked cards using column labels
 */

const props = withDefaults(
  defineProps<{
    columns: Column<Row>[]
    rows: Row[]
    loading?: boolean
    selectable?: boolean
    sort?: string | null
    caption: string
    dense?: boolean
    rowClass?: (row: Row) => string | undefined
    skeletonRows?: number
  }>(),
  { skeletonRows: 6 },
)

const selected = defineModel<string[]>('selected', { default: () => [] })
const emit = defineEmits<{ sort: [key: string]; rowClick: [row: Row] }>()

const allSelected = computed(() => props.rows.length > 0 && props.rows.every((r) => selected.value.includes(r.id)))
const someSelected = computed(() => selected.value.length > 0 && !allSelected.value)

function toggleAll() {
  selected.value = allSelected.value ? [] : props.rows.map((r) => r.id)
}

function toggle(id: string) {
  selected.value = selected.value.includes(id) ? selected.value.filter((x) => x !== id) : [...selected.value, id]
}

const sortState = (key: string) => {
  if (!props.sort) return 'none'
  if (props.sort === key) return 'ascending'
  if (props.sort === `-${key}`) return 'descending'
  return 'none'
}

function cellValue(col: Column<Row>, row: Row) {
  if (col.value) return col.value(row)
  return (row as Record<string, unknown>)[col.key] as string | number | null | undefined
}
</script>

<template>
  <div class="pw-table" :class="{ 'pw-table--dense': dense }">
    <div v-if="selectable && selected.length" class="pw-table__bulk" role="region" aria-label="Bulk actions">
      <strong>{{ selected.length }} selected</strong>
      <div class="pw-table__bulk-actions"><slot name="bulk" :selected="selected" :clear="() => (selected = [])" /></div>
      <button type="button" class="pw-table__bulk-close" aria-label="Clear selection" @click="selected = []"><X :size="16" /></button>
    </div>

    <div class="pw-table__scroll">
      <table>
        <caption class="sr-only">{{ caption }}</caption>
        <thead>
          <tr>
            <th v-if="selectable" scope="col" class="pw-table__check">
              <input type="checkbox" :checked="allSelected" :indeterminate="someSelected" aria-label="Select all rows" @change="toggleAll" />
            </th>
            <th
              v-for="col in columns"
              :key="col.key"
              scope="col"
              :style="{ width: col.width, textAlign: col.align ?? 'left' }"
              :aria-sort="col.sortable ? sortState(col.key) : undefined"
            >
              <button v-if="col.sortable" type="button" class="pw-table__sort" @click="emit('sort', col.key)">
                {{ col.label }}
                <ArrowUp v-if="sortState(col.key) === 'ascending'" :size="12" aria-hidden="true" />
                <ArrowDown v-else-if="sortState(col.key) === 'descending'" :size="12" aria-hidden="true" />
                <ArrowUpDown v-else :size="12" aria-hidden="true" class="pw-table__sort-idle" />
              </button>
              <template v-else>{{ col.label }}</template>
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-if="loading && !rows.length">
            <tr v-for="n in skeletonRows" :key="`sk${n}`" aria-hidden="true">
              <td v-if="selectable" class="pw-table__check" />
              <td v-for="col in columns" :key="col.key"><AppSkeleton height="12px" :width="col.align === 'right' ? '60%' : '80%'" /></td>
            </tr>
          </template>
          <tr v-else-if="!rows.length">
            <td :colspan="columns.length + (selectable ? 1 : 0)" class="pw-table__empty">
              <slot name="empty">No records found.</slot>
            </td>
          </tr>
          <tr
            v-for="row in rows"
            v-else
            :key="row.id"
            :class="[rowClass?.(row), { 'is-selected': selected.includes(row.id) }]"
            @click="emit('rowClick', row)"
          >
            <td v-if="selectable" class="pw-table__check" @click.stop>
              <input type="checkbox" :checked="selected.includes(row.id)" :aria-label="`Select row ${row.id}`" @change="toggle(row.id)" />
            </td>
            <td v-for="col in columns" :key="col.key" :data-label="col.label" :class="{ 'hide-mobile': col.hideOnMobile }" :style="{ textAlign: col.align ?? 'left' }">
              <slot :name="`cell-${col.key}`" :row="row">{{ cellValue(col, row) ?? '—' }}</slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="$slots.footer" class="pw-table__footer"><slot name="footer" /></div>
  </div>
</template>

<style scoped>
.pw-table {
  background: var(--pw-surface);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
  overflow: hidden;
}

.pw-table__bulk {
  display: flex;
  align-items: center;
  gap: var(--pw-space-4);
  padding: var(--pw-space-2) var(--pw-space-4);
  background: var(--pw-navy-900);
  color: #fff;
  font-size: var(--pw-text-sm);
}

.pw-table__bulk-actions {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: var(--pw-space-1);
}

.pw-table__bulk-actions :deep(button) {
  min-height: 32px;
  padding: 0 var(--pw-space-3);
  border: 0;
  border-radius: var(--pw-radius-sm);
  background: transparent;
  color: #fff;
  font-weight: var(--pw-weight-semibold);
  font-size: var(--pw-text-sm);
}

.pw-table__bulk-actions :deep(button:hover) {
  background: rgb(255 255 255 / 10%);
}

.pw-table__bulk-actions :deep(button.is-danger) {
  color: #ff9d94;
}

.pw-table__bulk-close {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #fff;
}

.pw-table__scroll {
  overflow-x: auto;
}

table {
  font-size: var(--pw-text-sm);
}

th {
  padding: var(--pw-space-3) var(--pw-space-4);
  border-bottom: 1px solid var(--pw-border);
  background: var(--pw-surface);
  font-size: var(--pw-text-2xs);
  font-weight: var(--pw-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--pw-muted);
  white-space: nowrap;
}

td {
  padding: var(--pw-space-4);
  border-bottom: 1px solid var(--pw-border);
  vertical-align: middle;
  font-variant-numeric: tabular-nums;
}

tbody tr:last-child td {
  border-bottom: 0;
}

tbody tr:hover td {
  background: #fafbfc;
}

tbody tr.is-selected td {
  background: var(--pw-navy-50);
}

tbody tr.is-highlight td {
  background: #fdfaf0;
}

.pw-table--dense {
  --pw-text-sm: var(--pw-admin-text, 0.78125rem);
}

.pw-table--dense td {
  padding: var(--pw-space-3) var(--pw-space-4);
}

.pw-table__check {
  width: 44px;
  padding-right: 0;
}

.pw-table__check input {
  width: 18px;
  height: 18px;
  accent-color: var(--pw-navy-700);
  cursor: pointer;
}

.pw-table__sort {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  color: inherit;
}

.pw-table__sort-idle {
  opacity: 0.4;
}

.pw-table__empty {
  padding: var(--pw-space-10) var(--pw-space-4);
  text-align: center;
  color: var(--pw-muted);
}

.pw-table__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--pw-space-3);
  padding: var(--pw-space-3) var(--pw-space-4);
  border-top: 1px solid var(--pw-border);
  font-size: var(--pw-text-sm);
  color: var(--pw-muted);
}

/* Mobile: stacked cards */
@media (max-width: 767px) {
  thead {
    display: none;
  }
  table,
  tbody,
  tr,
  td {
    display: block;
    width: 100%;
  }
  tbody tr {
    position: relative;
    padding: var(--pw-space-3) var(--pw-space-4);
    border-bottom: 1px solid var(--pw-border);
  }
  td {
    display: flex;
    justify-content: space-between;
    gap: var(--pw-space-4);
    padding: 6px 0;
    border: 0;
    text-align: right !important;
  }
  td::before {
    content: attr(data-label);
    flex: none;
    font-size: var(--pw-text-2xs);
    font-weight: var(--pw-weight-semibold);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--pw-muted);
    text-align: left;
  }
  td[data-label='']::before {
    display: none;
  }
  td.hide-mobile {
    display: none;
  }
  .pw-table__check {
    position: absolute;
    top: var(--pw-space-3);
    right: var(--pw-space-4);
    width: auto;
  }
  .pw-table__check::before {
    display: none;
  }
  .pw-table__empty::before {
    display: none;
  }
}
</style>
