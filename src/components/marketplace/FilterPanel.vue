<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { ChevronDown, Ruler } from '@lucide/vue'
import type { DealType, ListingFacets, ListingFilters, ProductCondition } from '@/types/product'
import AppCheckbox from '@/components/forms/AppCheckbox.vue'
import AppToggle from '@/components/forms/AppToggle.vue'
import AppButton from '@/components/common/AppButton.vue'
import PriceRange from './PriceRange.vue'

/**
 * V2 filter rail. Edits a local draft; "Apply filters" commits to the URL so
 * the server does the filtering (never client-side over the whole catalogue).
 */
const props = defineProps<{ filters: ListingFilters; facets: ListingFacets | null; fitKitName?: string | null; signedIn: boolean }>()
const emit = defineEmits<{ apply: [ListingFilters]; clear: [] }>()

const draft = reactive<ListingFilters>({})
const open = reactive({ category: true, condition: true, price: true, deal: true, seller: true })

watch(
  () => props.filters,
  (f) => {
    for (const key of Object.keys(draft)) delete (draft as Record<string, unknown>)[key]
    Object.assign(draft, structuredClone({ ...f }))
  },
  { immediate: true, deep: true },
)

function toggleIn<T extends string>(key: 'category' | 'condition' | 'dealType', value: T, on: boolean) {
  const list = new Set<string>((draft[key] as string[] | undefined) ?? [])
  if (on) list.add(value)
  else list.delete(value)
  ;(draft as Record<string, unknown>)[key] = [...list]
}

const has = (key: 'category' | 'condition' | 'dealType', value: string) => ((draft[key] as string[] | undefined) ?? []).includes(value)

const price = computed({
  get: () => [draft.minPrice ?? 20000, draft.maxPrice ?? 90000] as [number, number],
  set: ([min, max]) => {
    draft.minPrice = min
    draft.maxPrice = max
  },
})

const fitOnly = computed({
  get: () => !!draft.fitsMySize,
  set: (v: boolean) => (draft.fitsMySize = v || undefined),
})
</script>

<template>
  <form class="pw-filters" aria-label="Filters" @submit.prevent="emit('apply', { ...draft, page: 1 })">
    <div class="pw-filters__head">
      <h2 class="pw-filters__title">Filters</h2>
      <button type="button" class="pw-link-btn pw-filters__clear" @click="emit('clear')">Clear all</button>
    </div>

    <div v-if="signedIn" class="pw-filters__fit">
      <Ruler :size="16" aria-hidden="true" />
      <AppToggle v-model="fitOnly" reverse label="Show my size only" :hint="fitKitName ? `Uniform fit — ${fitKitName}` : 'Uses your default Fit Kit'" class="pw-filters__fit-toggle" />
    </div>

    <fieldset v-if="facets?.categories.length" class="pw-filters__group">
      <legend>
        <button type="button" class="pw-filters__toggle" :aria-expanded="open.category" @click="open.category = !open.category">Category <ChevronDown :size="16" /></button>
      </legend>
      <div v-show="open.category">
        <AppCheckbox v-for="c in facets.categories" :key="c.value" :model-value="has('category', c.value)" :label="c.label" :count="c.count.toLocaleString()" @update:model-value="toggleIn('category', c.value, $event)" />
      </div>
    </fieldset>

    <fieldset v-if="facets" class="pw-filters__group">
      <legend>
        <button type="button" class="pw-filters__toggle" :aria-expanded="open.condition" @click="open.condition = !open.condition">Condition <ChevronDown :size="16" /></button>
      </legend>
      <div v-show="open.condition">
        <AppCheckbox v-for="c in facets.conditions" :key="c.value" :model-value="has('condition', c.value)" :label="c.label" :count="c.count" @update:model-value="toggleIn<ProductCondition>('condition', c.value as ProductCondition, $event)" />
      </div>
    </fieldset>

    <fieldset class="pw-filters__group">
      <legend>
        <button type="button" class="pw-filters__toggle" :aria-expanded="open.price" @click="open.price = !open.price">Price (USD) <ChevronDown :size="16" /></button>
      </legend>
      <div v-show="open.price">
        <PriceRange v-model="price" :min="0" :max="facets?.priceRange.max ?? 200000" />
      </div>
    </fieldset>

    <fieldset v-if="facets" class="pw-filters__group">
      <legend>
        <button type="button" class="pw-filters__toggle" :aria-expanded="open.deal" @click="open.deal = !open.deal">Deal type <ChevronDown :size="16" /></button>
      </legend>
      <div v-show="open.deal">
        <AppCheckbox v-for="d in facets.dealTypes" :key="d.value" :model-value="has('dealType', d.value)" :label="d.label" :count="d.count" @update:model-value="toggleIn<DealType>('dealType', d.value as DealType, $event)" />
      </div>
    </fieldset>

    <fieldset class="pw-filters__group">
      <legend>
        <button type="button" class="pw-filters__toggle" :aria-expanded="open.seller" @click="open.seller = !open.seller">Seller <ChevronDown :size="16" /></button>
      </legend>
      <div v-show="open.seller">
        <AppCheckbox :model-value="!!draft.verifiedOnly" label="KYC verified only" :count="facets?.seller[0]?.count" @update:model-value="draft.verifiedOnly = $event || undefined" />
        <AppCheckbox :model-value="!!draft.minRating" label="Rating 4.5+" :count="facets?.seller[1]?.count" @update:model-value="draft.minRating = $event ? 4.5 : undefined" />
        <AppCheckbox :model-value="!!draft.freeDelivery" label="Free delivery" :count="facets?.seller[2]?.count" @update:model-value="draft.freeDelivery = $event || undefined" />
      </div>
    </fieldset>

    <AppButton type="submit" block size="lg" class="pw-filters__apply">Apply filters</AppButton>
  </form>
</template>

<style scoped>
.pw-filters {
  display: flex;
  flex-direction: column;
  padding: var(--pw-space-5);
  background: var(--pw-surface);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
}

.pw-filters__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--pw-space-4);
}

.pw-filters__title {
  font-family: var(--pw-font-body);
  font-size: var(--pw-text-md);
  font-weight: var(--pw-weight-semibold);
}

.pw-filters__clear {
  font-size: var(--pw-text-sm);
}

.pw-filters__fit {
  display: flex;
  gap: var(--pw-space-2);
  align-items: flex-start;
  padding: var(--pw-space-3) var(--pw-space-4);
  margin-bottom: var(--pw-space-2);
  border-radius: var(--pw-radius-md);
  background: var(--pw-navy-100);
  color: var(--pw-navy-700);
}

.pw-filters__fit-toggle {
  flex: 1;
}

.pw-filters__group {
  margin: 0;
  padding: var(--pw-space-4) 0;
  border: 0;
  border-bottom: 1px solid var(--pw-border);
  min-width: 0;
}

.pw-filters__group legend {
  float: left;
  width: 100%;
  padding: 0;
  margin-bottom: var(--pw-space-2);
}

.pw-filters__group legend + * {
  clear: both;
}

.pw-filters__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 32px;
  padding: 0;
  border: 0;
  background: none;
  font-weight: var(--pw-weight-semibold);
  color: var(--pw-ink);
}

.pw-filters__toggle svg {
  color: var(--pw-muted);
  transition: transform var(--pw-duration) var(--pw-ease);
}

.pw-filters__toggle[aria-expanded='false'] svg {
  transform: rotate(-90deg);
}

.pw-filters__apply {
  margin-top: var(--pw-space-5);
}
</style>
