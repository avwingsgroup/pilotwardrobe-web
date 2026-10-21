import '@fontsource-variable/inter'
import '@fontsource-variable/space-grotesk'
import './styles/base.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router'
import { httpEvents } from './api/client'
import { useAuthStore } from './stores/auth.store'
import { useUiStore } from './stores/ui.store'
import { useCartStore } from './stores/cart.store'
import { useNotificationStore } from './stores/notification.store'
import { useMarketplaceStore } from './stores/marketplace.store'
import { vCan } from './directives/can'
import { registerAnalyticsSink } from './utils/analytics'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.directive('can', vCan)

const auth = useAuthStore()
const ui = useUiStore()

/* Reset every user-scoped store whenever the session is cleared (logout / 401). */
auth.$onAction(({ name, after }) => {
  if (name !== 'clearSession') return
  after(() => {
    useCartStore().reset()
    useNotificationStore().reset()
    useMarketplaceStore().reset()
  })
})

/* Global HTTP reactions. */
httpEvents.on('unauthenticated', () => {
  if (!auth.isAuthenticated) return
  auth.clearSession()
  const current = router.currentRoute.value
  if (current.meta.requiresAuth) {
    void router.replace({ name: 'login', query: { next: current.fullPath, reason: 'expired' } })
  }
})
httpEvents.on('session-expired', () => {
  auth.clearSession()
  void router.replace({ name: 'session-expired', query: { next: router.currentRoute.value.fullPath } })
})
httpEvents.on('maintenance', () => {
  ui.maintenance = true
  void router.replace({ name: 'maintenance' })
})

/* Connectivity banner. */
window.addEventListener('online', () => (ui.online = true))
window.addEventListener('offline', () => (ui.online = false))

/* Analytics: development sink only; register a vendor sink here in production. */
if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console -- dev-only analytics sink
  registerAnalyticsSink((name, props) => console.debug('[analytics]', name, props))
}

app.config.errorHandler = (error, _instance, info) => {
  console.error('[app]', info, error)
  ui.error('Something went wrong', 'Please try again. If it keeps happening, contact support.')
}

void auth.init().finally(() => {
  app.mount('#app')
})
