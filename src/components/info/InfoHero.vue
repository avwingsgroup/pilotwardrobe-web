<script setup lang="ts">
/**
 * Navy hero used by the guides and support pages (VC1–VC4, VC10, VC12, VC13).
 *  - `split`: copy on the left, illustrative card in the `aside` slot
 *  - `center`: centred copy with a search slot (Help Center, FAQs)
 *  - `image`: photo background with a navy wash (About)
 */
withDefaults(
  defineProps<{
    eyebrow: string
    title: string
    lead?: string
    meta?: string[]
    variant?: 'split' | 'center' | 'image'
    image?: string
  }>(),
  { variant: 'split', meta: () => [] },
)
</script>

<template>
  <section class="pw-ihero" :class="`pw-ihero--${variant}`" :style="variant === 'image' && image ? { '--pw-ihero-img': `url(${image})` } : undefined">
    <div class="pw-container pw-ihero__inner">
      <div class="pw-ihero__copy">
        <p class="pw-ihero__eyebrow">{{ eyebrow }}</p>
        <h1 class="pw-ihero__title">{{ title }}</h1>
        <p v-if="lead" class="pw-ihero__lead">{{ lead }}</p>
        <div v-if="$slots.actions" class="pw-ihero__actions"><slot name="actions" /></div>
        <slot />
        <ul v-if="meta.length" class="pw-ihero__meta" role="list">
          <li v-for="m in meta" :key="m">{{ m }}</li>
        </ul>
      </div>
      <div v-if="$slots.aside" class="pw-ihero__aside"><slot name="aside" /></div>
    </div>
  </section>
</template>

<style scoped>
.pw-ihero {
  position: relative;
  overflow: hidden;
  background-color: var(--pw-navy-900);
  /* Faint chart grid, as in the VC heroes. */
  background-image:
    linear-gradient(rgb(255 255 255 / 4%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(255 255 255 / 4%) 1px, transparent 1px);
  background-size: 32px 32px;
  color: #fff;
}

.pw-ihero__inner {
  display: grid;
  gap: var(--pw-space-8);
  grid-template-columns: minmax(0, 1fr);
  align-items: center;
  padding-top: var(--pw-space-10);
  padding-bottom: var(--pw-space-10);
}

.pw-ihero__eyebrow {
  font-size: var(--pw-text-2xs);
  font-weight: var(--pw-weight-semibold);
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--pw-gold-500);
}

.pw-ihero__title {
  margin-top: var(--pw-space-3);
  max-width: 620px;
  font-size: clamp(2rem, 4vw, 2.75rem);
  line-height: 1.1;
  color: #fff;
}

.pw-ihero__lead {
  margin-top: var(--pw-space-4);
  max-width: 560px;
  font-size: var(--pw-text-md);
  line-height: var(--pw-leading-relaxed);
  color: rgb(255 255 255 / 85%);
}

.pw-ihero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pw-space-3);
  margin-top: var(--pw-space-6);
}

.pw-ihero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pw-space-5);
  margin-top: var(--pw-space-6);
  font-size: var(--pw-text-xs);
  color: rgb(255 255 255 / 75%);
}

.pw-ihero__aside {
  min-width: 0;
  color: var(--pw-ink);
}

/* Centred (Help Center, FAQs) */
.pw-ihero--center .pw-ihero__inner {
  text-align: center;
  justify-items: center;
}

.pw-ihero--center .pw-ihero__title,
.pw-ihero--center .pw-ihero__lead {
  margin-left: auto;
  margin-right: auto;
}

.pw-ihero--center .pw-ihero__lead {
  font-size: var(--pw-text-base);
}

/* Photo (About) */
.pw-ihero--image {
  background-image:
    linear-gradient(90deg, rgb(13 42 87 / 96%) 0%, rgb(13 42 87 / 80%) 45%, rgb(13 42 87 / 35%) 100%),
    var(--pw-ihero-img);
  background-size: cover;
  background-position: center;
}

.pw-ihero--image .pw-ihero__inner {
  min-height: 360px;
}

@media (min-width: 1024px) {
  .pw-ihero__inner {
    padding-top: var(--pw-space-12);
    padding-bottom: var(--pw-space-12);
  }
  .pw-ihero--split .pw-ihero__inner {
    grid-template-columns: minmax(0, 1fr) minmax(0, 470px);
    gap: var(--pw-space-16);
  }
  .pw-ihero--image .pw-ihero__inner {
    min-height: 430px;
  }
}

@media print {
  .pw-ihero {
    background: none;
    color: var(--pw-ink);
  }
  .pw-ihero__title {
    color: var(--pw-ink);
  }
  .pw-ihero__actions,
  .pw-ihero__aside {
    display: none;
  }
}
</style>
