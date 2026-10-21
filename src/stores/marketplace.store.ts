import { ref } from 'vue'
import { defineStore } from 'pinia'
import { favoriteService } from '@/api/products.api'
import type { Listing } from '@/types'
import { track } from '@/utils/analytics'

/**
 * Viewer-specific marketplace state shared across cards/pages: favourites
 * (optimistic toggles) and the display currency preference. Search results
 * themselves live in the page (URL is the source of truth for filters).
 */
export const useMarketplaceStore = defineStore('marketplace', () => {
  const favorites = ref(new Set<string>())
  const pending = ref(new Set<string>())
  const currency = ref<'USD' | 'NGN' | 'GHS' | 'GBP' | 'EUR'>('USD')

  function hydrate(listings: Pick<Listing, 'id' | 'isFavorited'>[]) {
    const next = new Set(favorites.value)
    for (const l of listings) {
      if (l.isFavorited) next.add(l.id)
    }
    favorites.value = next
  }

  const isFavorite = (id: string) => favorites.value.has(id)

  async function toggleFavorite(id: string) {
    if (pending.value.has(id)) return
    const wasFavorite = favorites.value.has(id)
    const next = new Set(favorites.value)
    if (wasFavorite) next.delete(id)
    else next.add(id)
    favorites.value = next
    pending.value.add(id)
    try {
      if (wasFavorite) await favoriteService.remove(id)
      else {
        await favoriteService.add(id)
        track('favorite_added', { listingId: id })
      }
    } catch (error) {
      const rollback = new Set(favorites.value)
      if (wasFavorite) rollback.add(id)
      else rollback.delete(id)
      favorites.value = rollback
      throw error
    } finally {
      pending.value.delete(id)
    }
  }

  function reset() {
    favorites.value = new Set()
    pending.value = new Set()
  }

  return { favorites, currency, hydrate, isFavorite, toggleFavorite, reset }
})
