<script setup lang="ts">
/** Numbered policy section ("01 About these terms"). The id is the TOC anchor. */
defineProps<{ id: string; number: number; title: string; lead?: string }>()
</script>

<template>
  <section :id="id" class="pw-psec" :aria-labelledby="`${id}-h`">
    <h2 :id="`${id}-h`" class="pw-psec__title">
      <span class="pw-psec__num">{{ String(number).padStart(2, '0') }}</span>
      {{ title }}
    </h2>
    <p v-if="lead" class="pw-psec__lead">{{ lead }}</p>
    <div v-if="$slots.default" class="pw-psec__body"><slot /></div>
  </section>
</template>

<style scoped>
.pw-psec {
  scroll-margin-top: 136px;
}

.pw-psec__title {
  display: flex;
  align-items: baseline;
  gap: var(--pw-space-3);
  font-size: var(--pw-text-xl);
}

.pw-psec__num {
  font-family: var(--pw-font-mono);
  font-size: var(--pw-text-xs);
  font-weight: var(--pw-weight-semibold);
  color: var(--pw-gold-600);
}

.pw-psec__lead {
  margin-top: var(--pw-space-3);
  color: var(--pw-ink-2);
  line-height: var(--pw-leading-relaxed);
}

.pw-psec__body {
  margin-top: var(--pw-space-4);
}

.pw-psec__body :deep(p) {
  color: var(--pw-ink-2);
  line-height: var(--pw-leading-relaxed);
}

.pw-psec__body :deep(p + *) {
  margin-top: var(--pw-space-3);
}
</style>
