<script setup lang="ts">
import { computed } from 'vue'
import { sanitizeHtml } from '@/utils/security'

/**
 * The only place raw HTML is rendered. Content comes from the CMS (staff-authored),
 * is sanitised server-side, and again here with DOMPurify. Never pass user-generated
 * content (listings, messages, reviews) to this component — render those as text.
 */
const props = defineProps<{ html: string }>()
const clean = computed(() => sanitizeHtml(props.html))
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -- sanitised CMS HTML only -->
  <div class="pw-safe-html" v-html="clean" />
</template>

<style scoped>
.pw-safe-html :deep(h2) {
  margin: var(--pw-space-8) 0 var(--pw-space-3);
  font-size: var(--pw-text-xl);
}

.pw-safe-html :deep(h3) {
  margin: var(--pw-space-6) 0 var(--pw-space-2);
  font-size: var(--pw-text-lg);
}

.pw-safe-html :deep(p),
.pw-safe-html :deep(li) {
  color: var(--pw-ink-2);
  font-size: var(--pw-text-md);
  line-height: var(--pw-leading-relaxed);
}

.pw-safe-html :deep(p + p) {
  margin-top: var(--pw-space-4);
}

.pw-safe-html :deep(ul),
.pw-safe-html :deep(ol) {
  padding-left: var(--pw-space-6);
}

.pw-safe-html :deep(li + li) {
  margin-top: var(--pw-space-2);
}

.pw-safe-html :deep(a) {
  text-decoration: underline;
}
</style>
