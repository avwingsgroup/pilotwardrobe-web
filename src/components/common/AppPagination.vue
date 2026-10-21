<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'

const props = withDefaults(defineProps<{ page: number; lastPage: number; variant?: 'default' | 'compact'; showNext?: boolean }>(), {
  variant: 'default',
  showNext: true,
})
const emit = defineEmits<{ change: [page: number] }>()

/** 1 2 3 … 14 style window around the current page. */
const pages = computed<(number | '…')[]>(() => {
  const { page, lastPage } = props
  if (lastPage <= 7) return Array.from({ length: lastPage }, (_, i) => i + 1)
  const set = new Set([1, lastPage, page - 1, page, page + 1].filter((p) => p >= 1 && p <= lastPage))
  if (page <= 3) [2, 3].forEach((p) => set.add(p))
  const sorted = [...set].sort((a, b) => a - b)
  const out: (number | '…')[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1]! > 1) out.push('…')
    out.push(p)
  })
  return out
})

function go(p: number) {
  if (p >= 1 && p <= props.lastPage && p !== props.page) emit('change', p)
}
</script>

<template>
  <nav v-if="lastPage > 1" class="pw-pagination" :class="`pw-pagination--${variant}`" aria-label="Pagination">
    <button v-if="variant === 'compact'" type="button" class="pw-pagination__btn" :disabled="page <= 1" aria-label="Previous page" @click="go(page - 1)">
      <ChevronLeft :size="16" />
    </button>
    <template v-for="(p, i) in pages" :key="`${p}-${i}`">
      <span v-if="p === '…'" class="pw-pagination__gap" aria-hidden="true">…</span>
      <button
        v-else
        type="button"
        class="pw-pagination__btn"
        :class="{ 'is-active': p === page }"
        :aria-current="p === page ? 'page' : undefined"
        :aria-label="`Page ${p}`"
        @click="go(p)"
      >
        {{ p }}
      </button>
    </template>
    <button v-if="variant === 'compact'" type="button" class="pw-pagination__btn" :disabled="page >= lastPage" aria-label="Next page" @click="go(page + 1)">
      <ChevronRight :size="16" />
    </button>
    <button v-else-if="showNext" type="button" class="pw-pagination__btn pw-pagination__next" :disabled="page >= lastPage" @click="go(page + 1)">Next</button>
  </nav>
</template>

<style scoped>
.pw-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--pw-space-3);
}

.pw-pagination__btn {
  display: grid;
  place-items: center;
  min-width: var(--pw-touch);
  height: var(--pw-touch);
  padding: 0 var(--pw-space-3);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-md);
  background: var(--pw-surface);
  font-weight: var(--pw-weight-medium);
  color: var(--pw-ink);
  font-variant-numeric: tabular-nums;
}

.pw-pagination__btn:hover:not(:disabled) {
  border-color: var(--pw-navy-300);
}

.pw-pagination__btn.is-active {
  background: var(--pw-navy-700);
  border-color: var(--pw-navy-700);
  color: #fff;
}

.pw-pagination__btn:disabled {
  color: var(--pw-disabled);
}

.pw-pagination__next {
  padding: 0 var(--pw-space-5);
  font-weight: var(--pw-weight-semibold);
  color: var(--pw-navy-700);
}

.pw-pagination__gap {
  color: var(--pw-muted);
}

.pw-pagination--compact {
  gap: var(--pw-space-2);
}

.pw-pagination--compact .pw-pagination__btn {
  min-width: 32px;
  height: 32px;
  font-size: var(--pw-text-sm);
}
</style>
