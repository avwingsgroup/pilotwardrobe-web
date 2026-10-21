/**
 * Tiny in-memory GET cache with TTL and in-flight de-duplication, for reference data
 * that changes rarely (categories, payment methods, boost packages). User-specific
 * data is never cached here, and the cache is cleared on logout.
 */
interface Entry {
  expires: number
  promise: Promise<unknown>
}

const store = new Map<string, Entry>()

export function cached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const now = Date.now()
  const hit = store.get(key)
  if (hit && hit.expires > now) return hit.promise as Promise<T>
  const promise = loader().catch((error: unknown) => {
    store.delete(key)
    throw error
  })
  store.set(key, { expires: now + ttlMs, promise })
  return promise
}

export function invalidate(prefix?: string) {
  if (!prefix) return store.clear()
  for (const key of store.keys()) if (key.startsWith(prefix)) store.delete(key)
}
