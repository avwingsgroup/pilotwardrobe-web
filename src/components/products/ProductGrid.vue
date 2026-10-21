<script setup lang="ts">
import type { Listing } from '@/types/product'
import ProductCard from './ProductCard.vue'
import ProductCardSkeleton from './ProductCardSkeleton.vue'

withDefaults(
  defineProps<{
    listings: Listing[]
    loading?: boolean
    skeletons?: number
    columns?: 3 | 4
    variant?: 'full' | 'compact'
    showCondition?: boolean
    /** Number of leading cards to load eagerly (above the fold). */
    eager?: number
    label?: string
  }>(),
  { skeletons: 8, columns: 4, variant: 'full', eager: 0 },
)
</script>

<template>
  <div class="pw-grid" :class="`pw-grid--${columns}`" :aria-busy="loading || undefined" :aria-label="label" role="list">
    <template v-if="loading && !listings.length">
      <ProductCardSkeleton v-for="n in skeletons" :key="`s${n}`" :variant="variant" role="listitem" />
    </template>
    <ProductCard
      v-for="(l, i) in listings"
      v-else
      :key="l.id"
      role="listitem"
      :listing="l"
      :variant="variant"
      :show-condition="showCondition"
      :priority="i < eager"
      :sizes="columns === 3 ? '(min-width: 1280px) 330px, (min-width: 640px) 33vw, 50vw' : undefined"
    />
  </div>
</template>

<style scoped>
.pw-grid {
  display: grid;
  gap: var(--pw-space-3);
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (min-width: 640px) {
  .pw-grid {
    gap: var(--pw-space-5);
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .pw-grid--4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 359px) {
  .pw-grid {
    grid-template-columns: 1fr;
  }
}
</style>
