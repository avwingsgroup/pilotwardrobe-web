import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { cartService } from '@/api/orders.api'
import type { Cart } from '@/types'

export const useCartStore = defineStore('cart', () => {
  const cart = ref<Cart | null>(null)
  const loading = ref(false)

  const count = computed(() => cart.value?.items.length ?? 0)

  async function load() {
    loading.value = true
    try {
      cart.value = await cartService.get()
    } finally {
      loading.value = false
    }
  }

  async function add(listingId: string, size?: string | null) {
    cart.value = await cartService.add(listingId, size)
  }

  async function remove(itemId: string) {
    cart.value = await cartService.remove(itemId)
  }

  function reset() {
    cart.value = null
  }

  return { cart, loading, count, load, add, remove, reset }
})
