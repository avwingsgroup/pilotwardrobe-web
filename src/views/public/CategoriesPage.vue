<script setup lang="ts">
import AppBreadcrumb from '@/components/common/AppBreadcrumb.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import CategoryTile from '@/components/marketplace/CategoryTile.vue'
import { productService } from '@/api/products.api'
import { useResource } from '@/composables/useResource'
import { useSeo } from '@/composables/useSeo'

useSeo({ title: 'All categories', description: 'Browse aviation headsets, uniforms, flight bags, avionics, manuals and photography from verified sellers.', canonicalPath: '/categories' })
const { data, state, error, reload } = useResource(() => productService.categories())
</script>

<template>
  <div class="pw-container pw-cats">
    <AppBreadcrumb :items="[{ label: 'Marketplace', to: { name: 'marketplace' } }, { label: 'All categories' }]" />
    <h1 class="pw-page-title pw-cats__title">All categories</h1>
    <ErrorState v-if="state === 'error'" :error="error" @retry="reload" />
    <ul v-else class="pw-cats__grid" role="list" :aria-busy="state === 'loading'">
      <template v-if="state === 'loading'">
        <li v-for="n in 8" :key="n"><AppSkeleton height="200px" radius="var(--pw-radius-lg)" /></li>
      </template>
      <li v-for="c in data ?? []" v-else :key="c.id" class="pw-cats__item">
        <CategoryTile :category="c" />
        <ul v-if="c.children?.length" class="pw-cats__children" role="list">
          <li v-for="child in c.children" :key="child.id">
            <RouterLink :to="{ name: 'category', params: { slug: child.slug } }">{{ child.name }} <span>{{ child.listingsCount }}</span></RouterLink>
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.pw-cats {
  padding-top: var(--pw-space-5);
  padding-bottom: var(--pw-space-16);
}

.pw-cats__title {
  margin: var(--pw-space-5) 0 var(--pw-space-6);
}

.pw-cats__grid {
  display: grid;
  gap: var(--pw-space-6);
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
}

.pw-cats__children {
  margin-top: var(--pw-space-3);
  font-size: var(--pw-text-sm);
}

.pw-cats__children a {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  color: var(--pw-ink-2);
}

.pw-cats__children span {
  color: var(--pw-subtle);
}
</style>
