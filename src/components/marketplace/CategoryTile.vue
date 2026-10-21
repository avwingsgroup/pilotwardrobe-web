<script setup lang="ts">
import type { Category } from '@/types/product'
import AppImage from '@/components/common/AppImage.vue'

defineProps<{ category: Category }>()
</script>

<template>
  <RouterLink :to="{ name: 'category', params: { slug: category.slug } }" class="pw-cat">
    <AppImage :media="category.image" ratio="4 / 3" sizes="(min-width: 1024px) 210px, 40vw" fit="cover" class="pw-cat__img" />
    <span class="pw-cat__name">{{ category.name }}</span>
    <span class="pw-cat__count">{{ category.listingsCount.toLocaleString() }} listings</span>
  </RouterLink>
</template>

<style scoped>
.pw-cat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
  color: var(--pw-ink);
}

.pw-cat:hover {
  text-decoration: none;
}

.pw-cat__img {
  margin-bottom: var(--pw-space-3);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
  background: #fff;
  transition: box-shadow var(--pw-duration) var(--pw-ease);
}

.pw-cat:hover .pw-cat__img {
  box-shadow: var(--pw-shadow-md);
}

.pw-cat__name {
  font-weight: var(--pw-weight-semibold);
  font-size: var(--pw-text-base);
}

.pw-cat__count {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}
</style>
