<script setup lang="ts">
import { ref } from 'vue'
import { Heart } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import ProductGrid from '@/components/products/ProductGrid.vue'
import { favoriteService } from '@/api/products.api'
import { useResource } from '@/composables/useResource'
import { useSeo } from '@/composables/useSeo'
import { useMarketplaceStore } from '@/stores/marketplace.store'

useSeo({ title: 'Saved items', noindex: true })
const marketplace = useMarketplaceStore()
const page = ref(1)
const { data, state, error, reload } = useResource(
  async (s) => {
    const res = await favoriteService.list(page.value, s)
    marketplace.hydrate(res.data)
    return res
  },
  { watch: [page] },
)
</script>

<template>
  <div>
    <header class="pw-page-head">
      <div>
        <h1 class="pw-page-title">Saved items</h1>
        <p class="pw-page-sub">We'll alert you when saved items drop in price.</p>
      </div>
    </header>
    <ErrorState v-if="state === 'error'" :error="error" class="pw-card" @retry="reload" />
    <AppEmptyState v-else-if="state === 'success' && !data?.data.length" :icon="Heart" title="Nothing saved yet" body="Tap the heart on any listing to save it here." class="pw-card">
      <AppButton :to="{ name: 'marketplace' }">Browse the marketplace</AppButton>
    </AppEmptyState>
    <template v-else>
      <ProductGrid :listings="data?.data ?? []" :loading="state === 'loading'" :columns="3" :skeletons="6" label="Saved items" />
      <AppPagination v-if="data" class="pw-fav-pages" :page="data.meta.currentPage" :last-page="data.meta.lastPage" @change="page = $event" />
    </template>
  </div>
</template>

<style scoped>
.pw-fav-pages {
  margin-top: var(--pw-space-6);
}
</style>
