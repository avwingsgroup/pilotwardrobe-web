import { computed, reactive, ref, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import { useRoute, useRouter } from 'vue-router'
import type { AdminQuery } from '@/types/admin'
import type { AdminTableResponse } from '@/api/admin.api'
import { useResource } from './useResource'

/**
 * Shared state for every Control Tower table: tab, debounced search, filters,
 * server-side sort + pagination, row selection. State is mirrored to the URL so
 * views are shareable and survive refresh.
 */
export function useAdminTable<T extends { id: string }>(
  loader: (q: AdminQuery, signal: AbortSignal) => Promise<AdminTableResponse<T>>,
  options: { tab?: string; filters?: Record<string, string>; perPage?: number } = {},
) {
  const route = useRoute()
  const router = useRouter()
  const q = route.query
  const str = (v: unknown, d = '') => (typeof v === 'string' ? v : d)

  const tab = ref(str(q.tab, options.tab ?? ''))
  const search = ref(str(q.search))
  const page = ref(Number(q.page) || 1)
  const sort = ref<string | null>(str(q.sort) || null)
  const filters = reactive<Record<string, string>>({ ...(options.filters ?? {}) })
  for (const key of Object.keys(filters)) filters[key] = str(q[key], filters[key])
  const selected = ref<string[]>([])
  const debounced = refDebounced(search, 350)

  const query = computed<AdminQuery>(() => ({
    tab: tab.value || undefined,
    search: debounced.value || undefined,
    page: page.value,
    perPage: options.perPage,
    sort: sort.value ?? undefined,
    ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
  }))

  const resource = useResource((signal) => loader(query.value, signal), { watch: [query], keepPrevious: true })

  watch([tab, debounced, () => ({ ...filters })], () => {
    page.value = 1
    selected.value = []
  })

  watch(query, (value) => {
    const next: Record<string, string> = {}
    for (const [k, v] of Object.entries(value)) if (v !== undefined && k !== 'perPage' && !(k === 'page' && v === 1)) next[k] = String(v)
    void router.replace({ query: next })
  })

  function toggleSort(key: string) {
    sort.value = sort.value === key ? `-${key}` : sort.value === `-${key}` ? null : key
  }

  return {
    ...resource,
    tab,
    search,
    page,
    sort,
    filters,
    selected,
    query,
    toggleSort,
    rows: computed(() => resource.data.value?.data ?? []),
    meta: computed(() => resource.data.value?.meta ?? null),
    counts: computed(() => resource.data.value?.meta.counts ?? {}),
  }
}
