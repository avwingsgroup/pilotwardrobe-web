import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * Tracks which section is currently being read, for "On this page" navs.
 * A section counts as active once its heading crosses the top third of the
 * viewport (below the sticky header + sub-nav).
 */
export function useScrollSpy(ids: Ref<string[]> | string[], offsetPx = 160) {
  const active = ref<string | null>(null)
  let raf = 0

  const list = () => (Array.isArray(ids) ? ids : ids.value)

  function update() {
    raf = 0
    let current: string | null = list()[0] ?? null
    for (const id of list()) {
      const el = document.getElementById(id)
      if (el && el.getBoundingClientRect().top - offsetPx <= 0) current = id
    }
    // At the very bottom, the last section is the one being read.
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) current = list()[list().length - 1] ?? current
    active.value = current
  }

  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(update)
  }

  onMounted(() => {
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
  })
  onBeforeUnmount(() => {
    if (raf) cancelAnimationFrame(raf)
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
  })

  return { active }
}
