<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronDown, ChevronRight, List } from '@lucide/vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppTabs from '@/components/common/AppTabs.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import { adminService } from '@/api/admin.api'
import { useResource } from '@/composables/useResource'
import type { CatalogueNode } from '@/types/admin'

/** AD16 — catalogue tree, category attributes and size charts (feed Fit Kit matching). */
const { data: tree, state, error, reload } = useResource((s) => adminService.catalogue(s))
const open = ref(new Set<string>(['cat_uniforms']))
const selectedId = ref('cat_uniform_shirts')
const unit = ref<'cm' | 'in'>('cm')
const { data: detail, state: detailState } = useResource((s) => adminService.categoryAttributes(selectedId.value, s), { watch: [selectedId] })

const total = computed(() => (tree.value ?? []).reduce((n, c) => n + 1 + (c.children?.length ?? 0), 0))
const selectedName = computed(() => {
  for (const c of tree.value ?? []) {
    if (c.id === selectedId.value) return c.name
    const child = c.children?.find((x) => x.id === selectedId.value)
    if (child) return child.name
  }
  return ''
})

function toggle(n: CatalogueNode) {
  const next = new Set(open.value)
  if (next.has(n.id)) next.delete(n.id)
  else next.add(n.id)
  open.value = next
}

const cmToIn = (v: string) => v.replace(/\d+(\.\d+)?/g, (m) => (Number(m) / 2.54).toFixed(1))
</script>

<template>
  <div>
    <AdminPageHeader title="Catalogue" :subtitle="`${tree?.length ?? 0} top categories · ${total} categories · 22 size charts`" />
    <ErrorState v-if="state === 'error'" :error="error" class="pw-card" @retry="reload" />
    <div v-else class="pw-cat">
      <nav class="pw-card pw-cat__tree" aria-label="Category tree">
        <AppSkeleton v-if="state === 'loading'" :lines="8" class="pw-cat__pad" />
        <ul v-else role="tree">
          <li v-for="c in tree ?? []" :key="c.id" role="treeitem" :aria-expanded="c.children ? open.has(c.id) : undefined" :aria-selected="c.id === selectedId">
            <div class="pw-cat__node" :class="{ 'is-active': c.id === selectedId }">
              <button v-if="c.children" type="button" class="pw-cat__caret" :aria-label="open.has(c.id) ? `Collapse ${c.name}` : `Expand ${c.name}`" @click="toggle(c)">
                <ChevronDown v-if="open.has(c.id)" :size="14" /><ChevronRight v-else :size="14" />
              </button>
              <span v-else class="pw-cat__caret" />
              <button type="button" class="pw-cat__name" @click="selectedId = c.id">{{ c.name }}</button>
              <span class="pw-cat__count">{{ c.count.toLocaleString() }}</span>
            </div>
            <ul v-if="c.children && open.has(c.id)" role="group">
              <li v-for="ch in c.children" :key="ch.id" role="treeitem" :aria-selected="ch.id === selectedId">
                <div class="pw-cat__node pw-cat__node--child" :class="{ 'is-active': ch.id === selectedId }">
                  <button type="button" class="pw-cat__name" @click="selectedId = ch.id">{{ ch.name }}</button>
                  <span class="pw-cat__count">{{ ch.count.toLocaleString() }}</span>
                </div>
              </li>
            </ul>
          </li>
        </ul>
      </nav>

      <div class="pw-stack">
        <section class="pw-card" aria-labelledby="attrs">
          <h2 id="attrs" class="pw-card-title pw-cat__head">{{ selectedName }} · attributes</h2>
          <AppSkeleton v-if="detailState === 'loading'" :lines="5" class="pw-cat__pad" />
          <div v-else class="pw-scroll-x">
            <table class="pw-cat__table">
              <thead><tr><th scope="col">Attribute</th><th scope="col">Type</th><th scope="col">Required</th><th scope="col">Filterable</th><th scope="col">Values</th></tr></thead>
              <tbody>
                <tr v-for="a in detail?.attributes ?? []" :key="a.name">
                  <th scope="row">{{ a.name }}</th>
                  <td>{{ a.type.replace('_', ' ') }}</td>
                  <td>{{ a.required ? 'Yes' : 'No' }}</td>
                  <td>{{ a.filterable ? 'Yes' : 'No' }}</td>
                  <td>{{ a.values }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section v-if="detail?.sizeChart" class="pw-card" aria-labelledby="chart">
          <div class="pw-between pw-cat__head">
            <h2 id="chart" class="pw-card-title">Size chart · {{ detail.sizeChart.name }}</h2>
            <AppTabs v-model="unit" variant="pills" label="Units" :items="[{ value: 'cm', label: 'cm' }, { value: 'in', label: 'in' }]" />
          </div>
          <div class="pw-scroll-x">
            <table class="pw-cat__table">
              <thead><tr><th v-for="c in detail.sizeChart.columns" :key="c" scope="col">{{ c }}</th></tr></thead>
              <tbody>
                <tr v-for="r in detail.sizeChart.rows" :key="r[0]">
                  <th scope="row">{{ r[0] }}</th>
                  <td v-for="(v, i) in r.slice(1)" :key="i">{{ unit === 'in' && i < 4 ? cmToIn(v) : v }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="pw-cat__note">Used by Fit Kit matching on listing pages (V3) and checkout (V4).</p>
        </section>
        <AppEmptyState v-else-if="detailState === 'success'" :icon="List" tone="neutral" title="No size chart" body="This category isn't sized. Link a size chart to enable Fit Kit matching." compact class="pw-card" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.pw-cat {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-4);
}

.pw-cat__tree {
  align-self: start;
  padding: var(--pw-space-2);
}

.pw-cat__pad {
  padding: var(--pw-space-4);
}

.pw-cat__node {
  display: flex;
  align-items: center;
  gap: 4px;
  min-height: 36px;
  padding: 0 var(--pw-space-2);
  border-radius: var(--pw-radius-md);
  font-size: var(--pw-text-sm);
}

.pw-cat__node.is-active {
  background: var(--pw-navy-100);
  color: var(--pw-navy-700);
  font-weight: var(--pw-weight-semibold);
}

.pw-cat__node--child {
  padding-left: var(--pw-space-8);
}

.pw-cat__caret {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border: 0;
  background: none;
  color: var(--pw-muted);
}

.pw-cat__name {
  flex: 1;
  padding: 0;
  border: 0;
  background: none;
  text-align: left;
  font: inherit;
  color: inherit;
}

.pw-cat__count {
  font-size: var(--pw-text-xs);
  color: var(--pw-subtle);
}

.pw-cat__head {
  padding: var(--pw-space-4) var(--pw-space-5);
}

.pw-cat__table {
  font-size: var(--pw-text-sm);
}

.pw-cat__table th,
.pw-cat__table td {
  padding: var(--pw-space-3) var(--pw-space-5);
  border-top: 1px solid var(--pw-border);
  text-align: left;
}

.pw-cat__table thead th {
  font-size: var(--pw-text-2xs);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--pw-muted);
}

.pw-cat__note {
  overflow-wrap: anywhere;
  padding: var(--pw-space-3) var(--pw-space-5);
  border-top: 1px solid var(--pw-border);
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

@media (min-width: 1100px) {
  .pw-cat {
    grid-template-columns: 260px minmax(0, 1fr);
  }
}
</style>
