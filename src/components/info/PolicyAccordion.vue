<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronDown } from '@lucide/vue'

/**
 * Collapsed policy sections (the long tail under the expanded ones). Each item
 * keeps its TOC id; following an "On this page" link or a deep link opens it.
 */
export interface PolicyAccordionItem {
  id: string
  number: number
  title: string
  paragraphs: string[]
}

const props = defineProps<{ items: PolicyAccordionItem[] }>()
const route = useRoute()
const open = ref<Set<string>>(new Set())

function toggle(id: string) {
  const next = new Set(open.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  open.value = next
}

watch(
  () => route.hash,
  (hash) => {
    const id = hash.replace('#', '')
    if (props.items.some((i) => i.id === id)) open.value = new Set([...open.value, id])
  },
  { immediate: true },
)

// Same-page TOC clicks don't always change route.hash (e.g. clicking the same link twice).
function onTocClick(e: Event) {
  const a = (e.target as HTMLElement).closest('a[href^="#"]')
  const id = a?.getAttribute('href')?.slice(1)
  if (id && props.items.some((i) => i.id === id) && !open.value.has(id)) open.value = new Set([...open.value, id])
}
onMounted(() => document.addEventListener('click', onTocClick))
onBeforeUnmount(() => document.removeEventListener('click', onTocClick))
</script>

<template>
  <div class="pw-pacc">
    <section v-for="item in items" :id="item.id" :key="item.id" class="pw-pacc__item" :class="{ 'is-open': open.has(item.id) }">
      <h2>
        <button type="button" class="pw-pacc__btn" :aria-expanded="open.has(item.id)" :aria-controls="`${item.id}-panel`" @click="toggle(item.id)">
          <span class="pw-pacc__num">{{ String(item.number).padStart(2, '0') }}</span>
          <span class="pw-pacc__title">{{ item.title }}</span>
          <ChevronDown :size="18" class="pw-pacc__chev" aria-hidden="true" />
        </button>
      </h2>
      <div v-show="open.has(item.id)" :id="`${item.id}-panel`" class="pw-pacc__panel">
        <p v-for="(p, i) in item.paragraphs" :key="i">{{ p }}</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.pw-pacc {
  overflow: hidden;
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-surface);
}

.pw-pacc__item {
  scroll-margin-top: 136px;
}

.pw-pacc__item + .pw-pacc__item {
  border-top: 1px solid var(--pw-border);
}

.pw-pacc__btn {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  width: 100%;
  min-height: 56px;
  padding: var(--pw-space-3) var(--pw-space-5) var(--pw-space-3) var(--pw-space-4);
  border: 0;
  background: none;
  text-align: left;
  color: var(--pw-ink);
}

.pw-pacc__btn:hover {
  background: var(--pw-surface-sunken);
}

.pw-pacc__num {
  font-family: var(--pw-font-mono);
  font-size: var(--pw-text-xs);
  font-weight: var(--pw-weight-semibold);
  color: var(--pw-gold-600);
}

.pw-pacc__title {
  flex: 1;
  font-family: var(--pw-font-display);
  font-size: var(--pw-text-md);
  font-weight: var(--pw-weight-semibold);
}

.pw-pacc__chev {
  color: var(--pw-muted);
  transition: transform var(--pw-duration) var(--pw-ease);
}

.is-open .pw-pacc__chev {
  transform: rotate(180deg);
}

.pw-pacc__panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-3);
  padding: 0 var(--pw-space-5) var(--pw-space-5) calc(var(--pw-space-4) + 28px);
  color: var(--pw-ink-2);
  font-size: var(--pw-text-sm);
  line-height: var(--pw-leading-relaxed);
}

@media print {
  .pw-pacc__panel {
    display: grid !important;
  }
  .pw-pacc__chev {
    display: none;
  }
}
</style>
