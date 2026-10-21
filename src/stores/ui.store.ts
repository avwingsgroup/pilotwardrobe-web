import { ref } from 'vue'
import { defineStore } from 'pinia'

export interface Toast {
  id: number
  tone: 'success' | 'error' | 'info' | 'warning'
  title: string
  body?: string
  timeout: number
}

export interface AuthGateContext {
  /** e.g. "To buy this item" */
  intent: string
  title?: string
  priceLabel?: string
  imageUrl?: string
  /** Where to return after authentication. */
  redirect: string
}

/** Cross-cutting UI state: toasts, gated-action auth modal (VA14), connectivity. */
export const useUiStore = defineStore('ui', () => {
  const toasts = ref<Toast[]>([])
  const authGate = ref<AuthGateContext | null>(null)
  const online = ref(typeof navigator === 'undefined' ? true : navigator.onLine)
  const maintenance = ref(false)
  const mobileNavOpen = ref(false)
  let seq = 0

  function toast(input: Omit<Toast, 'id' | 'timeout'> & { timeout?: number }) {
    const id = ++seq
    const item: Toast = { timeout: input.tone === 'error' ? 7000 : 4500, ...input, id }
    toasts.value = [...toasts.value.slice(-3), item]
    if (item.timeout > 0) setTimeout(() => dismiss(id), item.timeout)
    return id
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  const success = (title: string, body?: string) => toast({ tone: 'success', title, body })
  const error = (title: string, body?: string) => toast({ tone: 'error', title, body })
  const info = (title: string, body?: string) => toast({ tone: 'info', title, body })

  function openAuthGate(context: AuthGateContext) {
    authGate.value = context
  }

  function closeAuthGate() {
    authGate.value = null
  }

  return {
    toasts,
    authGate,
    online,
    maintenance,
    mobileNavOpen,
    toast,
    dismiss,
    success,
    error,
    info,
    openAuthGate,
    closeAuthGate,
  }
})
