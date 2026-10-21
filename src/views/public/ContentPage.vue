<script setup lang="ts">
import { computed } from 'vue'
import AppBreadcrumb from '@/components/common/AppBreadcrumb.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import SafeHtml from '@/components/common/SafeHtml.vue'
import { contentService } from '@/api/messages.api'
import { useResource } from '@/composables/useResource'
import { useSeo } from '@/composables/useSeo'
import { formatShortDate } from '@/utils/date'

/** CMS-managed pages (about, how it works, FAQ, legal, help articles — AD15). */
const props = defineProps<{ slug: string }>()
const slug = computed(() => props.slug)
const { data, state, error, reload } = useResource((s) => contentService.page(slug.value, s), { watch: [slug] })

useSeo(() => ({ title: data.value?.title ?? 'Pilotwardrobe', canonicalPath: `/${slug.value}`, type: 'article' }))
</script>

<template>
  <div class="pw-container pw-content">
    <AppBreadcrumb :items="[{ label: 'Home', to: '/' }, { label: data?.title ?? '…' }]" />
    <ErrorState v-if="state === 'error'" :error="error" @retry="reload" />
    <article v-else class="pw-card pw-content__card">
      <template v-if="data">
        <h1 class="pw-page-title">{{ data.title }}</h1>
        <p class="pw-content__updated">Last updated {{ formatShortDate(data.updatedAt) }}</p>
        <SafeHtml :html="data.html" class="pw-prose" />
      </template>
      <div v-else aria-busy="true">
        <AppSkeleton height="34px" width="50%" />
        <AppSkeleton :lines="8" style="margin-top: 24px" />
      </div>
    </article>
  </div>
</template>

<style scoped>
.pw-content {
  padding-top: var(--pw-space-5);
  padding-bottom: var(--pw-space-16);
}

.pw-content__card {
  max-width: 820px;
  margin: var(--pw-space-5) auto 0;
  padding: var(--pw-space-6);
}

.pw-content__updated {
  margin: var(--pw-space-2) 0 var(--pw-space-6);
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

@media (min-width: 768px) {
  .pw-content__card {
    padding: var(--pw-space-10);
  }
}
</style>
