<script setup lang="ts">
import type { Component } from 'vue'

/** "In plain words" summary box at the top of each policy. */
defineProps<{ items: { icon: Component; title: string; body: string }[] }>()
</script>

<template>
  <section class="pw-psum" aria-label="Summary in plain words">
    <p class="pw-psum__head"><span class="pw-psum__tag">In plain words</span> A summary, not a replacement for the full text below</p>
    <div class="pw-psum__grid">
      <div v-for="i in items" :key="i.title">
        <span class="pw-info-icon"><component :is="i.icon" :size="18" aria-hidden="true" /></span>
        <h2 class="pw-psum__title">{{ i.title }}</h2>
        <p class="pw-psum__body">{{ i.body }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pw-psum {
  padding: var(--pw-space-5);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-surface);
}

.pw-psum__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--pw-space-3);
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-psum__tag {
  padding: 3px 8px;
  border-radius: var(--pw-radius-xs);
  background: var(--pw-gold-500);
  color: #fff;
  font-size: var(--pw-text-2xs);
  font-weight: var(--pw-weight-bold);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.pw-psum__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-5);
  margin-top: var(--pw-space-5);
}

.pw-psum__title {
  margin-top: var(--pw-space-3);
  font-family: var(--pw-font-body);
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-semibold);
}

.pw-psum__body {
  margin-top: var(--pw-space-2);
  font-size: var(--pw-text-xs);
  line-height: var(--pw-leading-relaxed);
  color: var(--pw-muted);
}

@media (min-width: 768px) {
  .pw-psum__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--pw-space-8);
  }
}
</style>
