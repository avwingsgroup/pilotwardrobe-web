import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore, type AuthGateContext } from '@/stores/ui.store'

/**
 * Wraps a transactional action (buy, offer, swap, message, sell). Visitors get the
 * VA14 "Log in or sign up" modal with the intended destination preserved; signed-in
 * users run the action immediately.
 */
export function useGatedAction() {
  const auth = useAuthStore()
  const ui = useUiStore()
  const route = useRoute()

  return function gate(
    action: () => unknown,
    context: Omit<AuthGateContext, 'redirect'> & { redirect?: string },
  ): boolean {
    if (auth.isAuthenticated) {
      void action()
      return true
    }
    ui.openAuthGate({ ...context, redirect: context.redirect ?? route.fullPath })
    return false
  }
}
