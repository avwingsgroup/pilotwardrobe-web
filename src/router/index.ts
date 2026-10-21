import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { appConfig } from '@/constants/config'
import { resolveAccess } from './access'
import { routes } from './routes'

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    // Clears the sticky header plus the info-centre sub-nav.
    if (to.hash) return { el: to.hash, top: 136, behavior: 'smooth' }
    // Keep scroll position when only the query changes (filters, tabs, pagination is handled by the page).
    if (to.path === from.path) return false
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (auth.status !== 'ready') await auth.init()
  return resolveAccess(to, auth.user)
})

router.afterEach((to) => {
  const title = [...to.matched].reverse().find((r) => r.meta.title)?.meta.title
  if (title) document.title = `${title} · ${appConfig.name}`
  // Move focus to main content for screen-reader users after navigation.
  requestAnimationFrame(() => {
    const main = document.getElementById('main')
    if (main && !main.contains(document.activeElement)) main.focus({ preventScroll: true })
  })
})

/* Recover from stale chunks after a deploy (dynamic import 404). */
router.onError((error, to) => {
  if (/Failed to fetch dynamically imported module|Importing a module script failed/i.test(String(error))) {
    window.location.assign(to.fullPath)
  }
})
