import type { Directive } from 'vue'
import { useAuthStore } from '@/stores/auth.store'
import type { Permission } from '@/types/permissions'

/**
 * `v-can="'users.suspend'"` / `v-can="['payouts.view', 'payouts.approve']"`
 * Removes the element from layout when the session lacks the permission.
 * UX only — the API enforces authorization on every request.
 */
export const vCan: Directive<HTMLElement, Permission | Permission[]> = {
  mounted(el, binding) {
    apply(el, binding.value)
  },
  updated(el, binding) {
    apply(el, binding.value)
  },
}

function apply(el: HTMLElement, permission: Permission | Permission[]) {
  const allowed = useAuthStore().can(permission)
  el.hidden = !allowed
  if (!allowed) el.setAttribute('aria-hidden', 'true')
  else el.removeAttribute('aria-hidden')
}
