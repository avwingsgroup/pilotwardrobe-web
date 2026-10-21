<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { INFO_GROUPS } from '@/content/info/nav'

/**
 * VC sub-navigation: Guides · Policies · Support. Scrolls horizontally on small
 * screens and keeps the current page in view.
 */
const route = useRoute()
const strip = ref<HTMLElement | null>(null)

const isActive = (name: string) => route.name === name || (name === 'help-center' && route.name === 'help')

watch(
  () => route.name,
  async () => {
    await nextTick()
    strip.value?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ block: 'nearest', inline: 'center' })
  },
  { immediate: true },
)
</script>

<template>
  <nav class="pw-infonav" aria-label="Guides, policies and support">
    <div ref="strip" class="pw-container pw-infonav__strip">
      <div v-for="g in INFO_GROUPS" :key="g.key" class="pw-infonav__group">
        <span class="pw-infonav__label" aria-hidden="true">{{ g.title }}</span>
        <ul role="list" :aria-label="g.title">
          <li v-for="l in g.links" :key="l.name">
            <RouterLink :to="{ name: l.name }" class="pw-infonav__link" :class="{ 'is-active': isActive(l.name) }" :aria-current="isActive(l.name) ? 'page' : undefined">
              {{ l.label }}
            </RouterLink>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.pw-infonav {
  position: sticky;
  top: var(--pw-header-h);
  z-index: calc(var(--pw-z-header) - 1);
  background: var(--pw-surface);
  border-bottom: 1px solid var(--pw-border);
}

.pw-infonav__strip {
  display: flex;
  align-items: stretch;
  gap: var(--pw-space-4);
  overflow-x: auto;
  scrollbar-width: none;
}

.pw-infonav__strip::-webkit-scrollbar {
  display: none;
}

.pw-infonav__group {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  flex: none;
}

.pw-infonav__group + .pw-infonav__group {
  padding-left: var(--pw-space-4);
  border-left: 1px solid var(--pw-border);
}

.pw-infonav__label {
  font-size: var(--pw-text-2xs);
  font-weight: var(--pw-weight-semibold);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--pw-subtle);
}

.pw-infonav ul {
  display: flex;
  gap: var(--pw-space-3);
}

.pw-infonav__link {
  display: flex;
  align-items: center;
  min-height: 44px;
  border-bottom: 2px solid transparent;
  color: var(--pw-ink-2);
  font-size: 0.8125rem;
  white-space: nowrap;
}

.pw-infonav__link:hover {
  color: var(--pw-navy-700);
  text-decoration: none;
}

.pw-infonav__link.is-active {
  border-bottom-color: var(--pw-navy-700);
  color: var(--pw-navy-700);
  font-weight: var(--pw-weight-semibold);
}

@media (max-width: 767px) {
  .pw-infonav {
    position: static;
  }
}
</style>
