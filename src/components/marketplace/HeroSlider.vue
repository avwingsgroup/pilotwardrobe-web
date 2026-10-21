<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from '@lucide/vue'
import type { HeroSlide } from '@/types/admin'
import AppImage from '@/components/common/AppImage.vue'
import AppButton from '@/components/common/AppButton.vue'

/**
 * V1 hero: headline + CTA on the left, photo on the right with prev/next and
 * labelled thumbnails. Slides come from the CMS (AD15). Auto-advances unless the
 * user prefers reduced motion; pausable (WCAG 2.2.2).
 */
const props = defineProps<{ slides: HeroSlide[] }>()
const index = ref(0)
const playing = ref(true)
const current = computed(() => props.slides[index.value])
const thumbLabels = ['Verified gear', 'Headset deals', 'Uniform drop']
let timer: ReturnType<typeof setInterval> | null = null

function go(i: number) {
  index.value = (i + props.slides.length) % props.slides.length
}

function start() {
  stop()
  if (!playing.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  timer = setInterval(() => go(index.value + 1), 7000)
}

function stop() {
  if (timer) clearInterval(timer)
  timer = null
}

function toggle() {
  playing.value = !playing.value
  if (playing.value) start()
  else stop()
}

onMounted(start)
onBeforeUnmount(stop)
</script>

<template>
  <section v-if="current" class="pw-hero" aria-roledescription="carousel" aria-label="Featured" @mouseenter="stop" @mouseleave="start" @focusin="stop">
    <div class="pw-hero__copy">
      <div aria-live="polite">
        <h1 class="pw-hero__title">{{ current.headline }}</h1>
        <p class="pw-hero__sub">{{ current.subtext }}</p>
      </div>
      <div class="pw-hero__ctas">
        <AppButton :to="current.link" size="lg">{{ current.buttonLabel }}</AppButton>
        <RouterLink to="/how-to-swap" class="pw-hero__link">How swapping works <ArrowRight :size="16" aria-hidden="true" /></RouterLink>
      </div>
      <div class="pw-hero__progress">
        <span class="pw-hero__dots" aria-hidden="true">
          <span v-for="(s, i) in slides" :key="s.id" :class="{ 'is-active': i === index }" />
        </span>
        <span class="pw-hero__count">{{ String(index + 1).padStart(2, '0') }} / {{ String(slides.length).padStart(2, '0') }} · Escrow-protected gear</span>
        <button type="button" class="pw-hero__pause" :aria-label="playing ? 'Pause slideshow' : 'Play slideshow'" @click="toggle">
          <Pause v-if="playing" :size="14" />
          <Play v-else :size="14" />
        </button>
      </div>
    </div>
    <div class="pw-hero__media">
      <Transition name="pw-xfade" mode="out-in">
        <AppImage :key="current.id" :media="current.image" ratio="16 / 10" fit="cover" :priority="index === 0" sizes="(min-width: 1024px) 60vw, 100vw" class="pw-hero__img" />
      </Transition>
      <div class="pw-hero__fade" aria-hidden="true" />
      <div class="pw-hero__arrows">
        <button type="button" aria-label="Previous slide" @click="go(index - 1)"><ChevronLeft :size="20" /></button>
        <button type="button" aria-label="Next slide" @click="go(index + 1)"><ChevronRight :size="20" /></button>
      </div>
      <div class="pw-hero__thumbs" role="tablist" aria-label="Choose slide">
        <button
          v-for="(s, i) in slides"
          :key="s.id"
          type="button"
          role="tab"
          :aria-selected="i === index"
          :aria-label="`Slide ${i + 1}: ${s.headline}`"
          class="pw-hero__thumb"
          :class="{ 'is-active': i === index }"
          @click="go(i)"
        >
          <AppImage :media="s.image" ratio="16 / 9" sizes="110px" />
          <span>{{ thumbLabels[i] ?? s.buttonLabel }}</span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pw-hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  overflow: hidden;
  background: #edf0f4;
}

.pw-hero__copy {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--pw-space-6);
  padding: var(--pw-space-8) var(--pw-gutter);
}

.pw-hero__title {
  max-width: 520px;
  font-size: clamp(2rem, 4.2vw, 3rem);
  font-weight: var(--pw-weight-bold);
  line-height: 1.12;
  color: var(--pw-navy-900);
}

.pw-hero__sub {
  max-width: 470px;
  margin-top: var(--pw-space-4);
  font-size: var(--pw-text-md);
  line-height: var(--pw-leading-relaxed);
  color: var(--pw-ink-2);
}

.pw-hero__ctas {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--pw-space-5);
}

.pw-hero__link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: var(--pw-weight-semibold);
}

.pw-hero__progress {
  display: flex;
  align-items: center;
  gap: var(--pw-space-4);
  font-size: var(--pw-text-sm);
  color: var(--pw-ink-2);
}

.pw-hero__dots {
  display: flex;
  gap: 6px;
}

.pw-hero__dots span {
  width: 6px;
  height: 6px;
  border-radius: 3px;
  background: var(--pw-border-strong);
  transition: width var(--pw-duration) var(--pw-ease);
}

.pw-hero__dots span.is-active {
  width: 26px;
  background: var(--pw-navy-700);
}

.pw-hero__pause {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--pw-border-strong);
  border-radius: 50%;
  background: var(--pw-surface);
  color: var(--pw-ink-2);
}

.pw-hero__media {
  position: relative;
  min-height: 260px;
}

.pw-hero__img {
  height: 100%;
}

/* Main slide image only — thumbnails keep their own aspect ratio. */
.pw-hero__media > :deep(.pw-img) {
  height: 100%;
}

.pw-hero__fade {
  display: none;
}

.pw-hero__arrows {
  position: absolute;
  top: 50%;
  right: var(--pw-space-5);
  display: flex;
  gap: var(--pw-space-3);
  transform: translateY(-50%);
}

.pw-hero__arrows button {
  display: grid;
  place-items: center;
  width: var(--pw-touch);
  height: var(--pw-touch);
  border: 0;
  border-radius: 50%;
  background: #fff;
  color: var(--pw-navy-700);
  box-shadow: var(--pw-shadow-md);
}

.pw-hero__thumbs {
  position: absolute;
  right: var(--pw-space-5);
  bottom: var(--pw-space-5);
  display: none;
  gap: var(--pw-space-2);
}

.pw-hero__thumb {
  width: 108px;
  padding: 3px 3px 6px;
  border: 2px solid transparent;
  border-radius: var(--pw-radius-md);
  background: #fff;
  font-size: 0.625rem;
  color: var(--pw-ink-2);
  box-shadow: var(--pw-shadow-sm);
}

.pw-hero__thumb :deep(.pw-img) {
  border-radius: var(--pw-radius-sm);
  margin-bottom: 4px;
}

.pw-hero__thumb.is-active {
  border-color: var(--pw-navy-700);
}

.pw-xfade-enter-active,
.pw-xfade-leave-active {
  transition: opacity var(--pw-duration-slow) var(--pw-ease);
}
.pw-xfade-enter-from,
.pw-xfade-leave-to {
  opacity: 0;
}

@media (min-width: 1024px) {
  .pw-hero {
    grid-template-columns: 1fr;
    min-height: 400px;
  }
  .pw-hero__copy {
    grid-area: 1 / 1;
    padding-left: max(var(--pw-gutter), calc((100vw - var(--pw-container)) / 2));
    max-width: 640px;
  }
  .pw-hero__media {
    grid-area: 1 / 1;
    margin-left: 44%;
  }
  .pw-hero__fade {
    display: block;
    position: absolute;
    inset: 0 auto 0 0;
    width: 32%;
    background: linear-gradient(90deg, #edf0f4 0%, rgb(237 240 244 / 0%) 100%);
  }
  .pw-hero__thumbs {
    display: flex;
  }
}
</style>
