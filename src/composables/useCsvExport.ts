import { ref, type Ref } from 'vue'
import { adminService } from '@/api/admin.api'
import { toApiError } from '@/api/errors'
import { useUiStore } from '@/stores/ui.store'
import type { AdminQuery } from '@/types/admin'

/** Server-side CSV export (AD0: "All tables: server-side paging, sort, CSV export"). */
export function useCsvExport(resource: string, query: Ref<AdminQuery>) {
  const ui = useUiStore()
  const exporting = ref(false)

  async function run() {
    exporting.value = true
    try {
      const { url } = await adminService.exportCsv(resource, query.value)
      ui.success('Export queued', 'Your CSV will download when ready.')
      // Signed download URLs come back absolute (https). Mock mode returns a relative placeholder.
      if (url.startsWith('https://')) window.open(url, '_blank', 'noopener')
    } catch (e) {
      ui.error('Export failed', toApiError(e).message)
    } finally {
      exporting.value = false
    }
  }

  return { exporting, run }
}
