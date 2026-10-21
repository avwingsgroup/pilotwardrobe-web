import { nextTick, onBeforeUnmount, watch, type Ref } from 'vue'

const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'

/**
 * Accessible dialog behaviour: trap Tab focus inside `container` while `active`,
 * close on Escape, lock body scroll, and restore focus to the opener on close.
 */
export function useFocusTrap(container: Ref<HTMLElement | null>, active: Ref<boolean>, onEscape?: () => void) {
  let previouslyFocused: HTMLElement | null = null
  let previousOverflow = ''

  function focusables(): HTMLElement[] {
    if (!container.value) return []
    return Array.from(container.value.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !el.hasAttribute('inert') && el.offsetParent !== null,
    )
  }

  function onKeydown(event: KeyboardEvent) {
    if (!active.value) return
    if (event.key === 'Escape' && onEscape) {
      event.stopPropagation()
      onEscape()
      return
    }
    if (event.key !== 'Tab') return
    const items = focusables()
    if (items.length === 0) {
      event.preventDefault()
      container.value?.focus()
      return
    }
    const first = items[0]!
    const last = items[items.length - 1]!
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  async function activate() {
    previouslyFocused = document.activeElement as HTMLElement | null
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeydown, true)
    await nextTick()
    const autofocus = container.value?.querySelector<HTMLElement>('[autofocus], [data-autofocus]')
    ;(autofocus ?? focusables()[0] ?? container.value)?.focus()
  }

  function deactivate() {
    document.removeEventListener('keydown', onKeydown, true)
    document.body.style.overflow = previousOverflow
    if (previouslyFocused && document.contains(previouslyFocused)) previouslyFocused.focus()
    previouslyFocused = null
  }

  watch(
    active,
    (value) => {
      if (value) void activate()
      else deactivate()
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    if (active.value) deactivate()
  })
}
