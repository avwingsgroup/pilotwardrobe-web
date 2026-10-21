import { onBeforeUnmount, ref, shallowRef, watch, type Ref, type WatchSource } from 'vue'
import { ApiError, toApiError } from '@/api/errors'

export type ResourceState = 'idle' | 'loading' | 'success' | 'empty' | 'error'

export interface ResourceOptions<T> {
  /** Re-run when any of these change (debounce upstream if needed). */
  watch?: WatchSource[]
  immediate?: boolean
  /** Treat this result as the empty state. */
  isEmpty?: (data: T) => boolean
  /** Keep previous data visible while reloading (avoids skeleton flash on filter changes). */
  keepPrevious?: boolean
}

/**
 * Loading/empty/error state machine around a service call with automatic
 * cancellation of superseded requests (AbortController) and unmount cleanup.
 */
export function useResource<T>(loader: (signal: AbortSignal) => Promise<T>, options: ResourceOptions<T> = {}) {
  const data = shallowRef<T | null>(null) as Ref<T | null>
  const error = shallowRef<ApiError | null>(null)
  const state = ref<ResourceState>('idle')
  const refreshing = ref(false)
  let controller: AbortController | null = null

  async function load() {
    controller?.abort()
    const current = new AbortController()
    controller = current
    if (data.value !== null && options.keepPrevious) refreshing.value = true
    else state.value = 'loading'
    error.value = null
    try {
      const result = await loader(current.signal)
      if (current.signal.aborted) return
      data.value = result
      state.value = options.isEmpty?.(result) ? 'empty' : 'success'
    } catch (e) {
      const apiError = toApiError(e)
      if (apiError.isCancelled || current.signal.aborted) return
      error.value = apiError
      state.value = 'error'
    } finally {
      if (controller === current) refreshing.value = false
    }
  }

  function mutate(updater: (current: T | null) => T | null) {
    data.value = updater(data.value)
    if (data.value !== null) state.value = options.isEmpty?.(data.value) ? 'empty' : 'success'
  }

  if (options.watch?.length) {
    watch(options.watch, () => void load(), { deep: true })
  }
  if (options.immediate !== false) void load()

  onBeforeUnmount(() => controller?.abort())

  return { data, error, state, refreshing, load, reload: load, mutate }
}
