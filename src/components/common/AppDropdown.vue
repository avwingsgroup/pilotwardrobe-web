<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId } from 'vue'

/**
 * Menu button (WAI-ARIA menu pattern): opens on click/Enter/Space/ArrowDown,
 * arrow keys move between items, Escape/outside click closes and restores focus.
 * Pass items via the `items` slot using <button role="menuitem"> or RouterLink.
 */
withDefaults(defineProps<{ label: string; align?: 'start' | 'end' }>(), { align: 'end' })

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLElement | null>(null)
const menuId = useId()

function items(): HTMLElement[] {
  return Array.from(root.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
}

async function show(focusIndex = 0) {
  open.value = true
  await nextTick()
  items()[focusIndex]?.focus()
  document.addEventListener('mousedown', onOutside)
}

function hide(restore = true) {
  open.value = false
  document.removeEventListener('mousedown', onOutside)
  if (restore) trigger.value?.focus()
}

function onOutside(e: MouseEvent) {
  if (!root.value?.contains(e.target as Node)) hide(false)
}

function onTriggerKey(e: KeyboardEvent) {
  if (['ArrowDown', 'Enter', ' '].includes(e.key)) {
    e.preventDefault()
    void show(0)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    void show(items().length - 1)
  }
}

function onMenuKey(e: KeyboardEvent) {
  const list = items()
  const index = list.indexOf(document.activeElement as HTMLElement)
  if (e.key === 'Escape') {
    e.preventDefault()
    hide()
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    list[(index + 1) % list.length]?.focus()
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    list[(index - 1 + list.length) % list.length]?.focus()
  } else if (e.key === 'Tab') {
    hide(false)
  }
}

const triggerAttrs = computed(() => ({
  'aria-haspopup': 'menu' as const,
  'aria-expanded': open.value,
  'aria-controls': menuId,
  onKeydown: onTriggerKey,
}))

onBeforeUnmount(() => document.removeEventListener('mousedown', onOutside))
defineExpose({ close: () => hide(false) })
</script>

<template>
  <div ref="root" class="pw-dropdown">
    <span ref="trigger" class="pw-dropdown__trigger">
      <slot
        name="trigger"
        :open="open"
        :toggle="() => (open ? hide() : show())"
        :attrs="triggerAttrs"
      />
    </span>
    <Transition name="pw-pop">
      <div v-if="open" :id="menuId" class="pw-dropdown__menu" :class="`pw-dropdown__menu--${align}`" role="menu" :aria-label="label" @keydown="onMenuKey" @click="hide(false)">
        <slot name="items" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.pw-dropdown {
  position: relative;
  display: inline-flex;
}

.pw-dropdown__trigger {
  display: inline-flex;
}

.pw-dropdown__menu {
  position: absolute;
  top: calc(100% + 6px);
  z-index: var(--pw-z-drawer);
  min-width: 220px;
  padding: var(--pw-space-2);
  background: var(--pw-surface);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
  box-shadow: var(--pw-shadow-md);
}

.pw-dropdown__menu--end {
  right: 0;
}
.pw-dropdown__menu--start {
  left: 0;
}

.pw-dropdown__menu :deep([role='menuitem']) {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  width: 100%;
  min-height: 40px;
  padding: 0 var(--pw-space-3);
  border: 0;
  border-radius: var(--pw-radius-md);
  background: none;
  color: var(--pw-ink);
  font-size: var(--pw-text-sm);
  text-align: left;
  text-decoration: none;
}

.pw-dropdown__menu :deep([role='menuitem']:hover),
.pw-dropdown__menu :deep([role='menuitem']:focus-visible) {
  background: var(--pw-surface-sunken);
  outline: none;
}

.pw-dropdown__menu :deep([role='separator']) {
  height: 1px;
  margin: var(--pw-space-2) 0;
  background: var(--pw-border);
}

.pw-pop-enter-active,
.pw-pop-leave-active {
  transition:
    opacity var(--pw-duration-fast) var(--pw-ease),
    transform var(--pw-duration-fast) var(--pw-ease);
}
.pw-pop-enter-from,
.pw-pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
