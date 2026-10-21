<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Download, MessageCircle, Printer } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import { useScrollSpy } from '@/composables/useScrollSpy'
import { PLATFORM } from '@/content/info/nav'

/**
 * Policy page frame (VC5–VC9): title block with Download PDF / Print, a sticky
 * "On this page" index with scrollspy, a support card, and the document body.
 * "Download PDF" opens the browser's print dialog (choose "Save as PDF"); the
 * print stylesheet strips site chrome so the output is the policy text only.
 */
const props = defineProps<{
  title: string
  effective: string
  version: string
  readMinutes: number
  sections: { id: string; title: string }[]
}>()

const ids = computed(() => props.sections.map((s) => s.id))
const { active } = useScrollSpy(ids)

const print = () => window.print()

// Index starts expanded beside the text on desktop, collapsed above it on phones.
const tocOpen = ref(true)
onMounted(() => (tocOpen.value = window.matchMedia('(min-width: 1024px)').matches))
</script>

<template>
  <div class="pw-policy">
    <header class="pw-policy__head">
      <div class="pw-container pw-policy__head-inner">
        <div>
          <p class="pw-info-eyebrow">Policies</p>
          <h1 class="pw-policy__title">{{ title }}</h1>
          <ul class="pw-policy__meta" role="list">
            <li>Effective {{ effective }}</li>
            <li>Version {{ version }}</li>
            <li>{{ readMinutes }} min read</li>
          </ul>
        </div>
        <div class="pw-policy__tools">
          <AppButton variant="secondary" title="Opens the print dialog — choose “Save as PDF”" @click="print">
            <template #icon><Download :size="16" /></template>
            Download PDF
          </AppButton>
          <AppButton variant="ghost" @click="print">
            <template #icon><Printer :size="16" /></template>
            Print
          </AppButton>
        </div>
      </div>
    </header>

    <div class="pw-container pw-policy__body">
      <aside class="pw-policy__aside">
        <details class="pw-policy__toc" :open="tocOpen" @toggle="tocOpen = ($event.target as HTMLDetailsElement).open">
          <summary class="pw-policy__toc-title">On this page</summary>
          <ol role="list">
            <li v-for="(s, i) in sections" :key="s.id">
              <a :href="`#${s.id}`" :class="{ 'is-active': active === s.id }" :aria-current="active === s.id ? 'location' : undefined">
                <span class="pw-policy__toc-num">{{ String(i + 1).padStart(2, '0') }}</span>
                {{ s.title }}
              </a>
            </li>
          </ol>
        </details>
        <div class="pw-policy__help">
          <MessageCircle :size="18" aria-hidden="true" />
          <p class="pw-policy__help-title">Questions about this policy?</p>
          <p>
            Write to <a :href="`mailto:${PLATFORM.legalEmail}`">{{ PLATFORM.legalEmail }}</a> or message
            <RouterLink :to="{ name: 'contact' }">Support</RouterLink> from any order.
          </p>
        </div>
      </aside>

      <article class="pw-policy__doc">
        <slot />
      </article>
    </div>
  </div>
</template>

<style scoped>
.pw-policy__head {
  background: var(--pw-surface);
  border-bottom: 1px solid var(--pw-border);
}

.pw-policy__head-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--pw-space-5);
  padding-top: var(--pw-space-8);
  padding-bottom: var(--pw-space-8);
}

.pw-policy__title {
  margin-top: var(--pw-space-2);
  font-size: clamp(2rem, 4vw, 2.5rem);
  line-height: 1.1;
}

.pw-policy__meta {
  display: flex;
  flex-wrap: wrap;
  margin-top: var(--pw-space-3);
  font-size: var(--pw-text-sm);
  color: var(--pw-muted);
}

.pw-policy__meta li + li::before {
  content: '';
  display: inline-block;
  width: 1px;
  height: 12px;
  margin: 0 var(--pw-space-4);
  background: var(--pw-border-strong);
  vertical-align: -1px;
}

.pw-policy__tools {
  display: flex;
  gap: var(--pw-space-2);
}

.pw-policy__body {
  display: grid;
  gap: var(--pw-space-6);
  grid-template-columns: minmax(0, 1fr);
  padding-top: var(--pw-space-8);
  padding-bottom: var(--pw-space-12);
}

.pw-policy__aside {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-4);
  align-content: start;
}

.pw-policy__toc {
  padding: var(--pw-space-4);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-surface);
}

.pw-policy__toc-title {
  padding: 0 var(--pw-space-2);
  font-size: var(--pw-text-2xs);
  font-weight: var(--pw-weight-semibold);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--pw-subtle);
  cursor: pointer;
}

.pw-policy__toc ol {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2px;
  margin-top: var(--pw-space-3);
}

.pw-policy__toc a {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  min-height: 36px;
  padding: 0 var(--pw-space-2);
  border-radius: var(--pw-radius-md);
  color: var(--pw-ink-2);
  font-size: var(--pw-text-sm);
}

.pw-policy__toc a:hover {
  background: var(--pw-surface-sunken);
  text-decoration: none;
}

.pw-policy__toc a.is-active {
  background: var(--pw-navy-100);
  color: var(--pw-navy-700);
  font-weight: var(--pw-weight-semibold);
}

.pw-policy__toc-num {
  width: 18px;
  font-family: var(--pw-font-mono);
  font-size: var(--pw-text-2xs);
  color: var(--pw-subtle);
}

.pw-policy__toc a.is-active .pw-policy__toc-num {
  color: var(--pw-navy-700);
}

.pw-policy__help {
  padding: var(--pw-space-4);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-navy-100);
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
  line-height: var(--pw-leading-relaxed);
}

.pw-policy__help svg {
  color: var(--pw-navy-700);
}

.pw-policy__help-title {
  margin: var(--pw-space-2) 0 var(--pw-space-1);
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-semibold);
  color: var(--pw-ink);
}

.pw-policy__doc {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-8);
  align-content: start;
  max-width: 900px;
  min-width: 0;
}

@media (min-width: 1024px) {
  .pw-policy__body {
    grid-template-columns: 250px minmax(0, 1fr);
    gap: var(--pw-space-10);
  }
  .pw-policy__aside {
    position: sticky;
    top: calc(var(--pw-header-h) + 64px);
  }
  .pw-policy__toc-title {
    pointer-events: none;
    list-style: none;
  }
  .pw-policy__toc-title::-webkit-details-marker {
    display: none;
  }
}

@media print {
  .pw-policy__tools,
  .pw-policy__aside {
    display: none;
  }
  .pw-policy__body {
    display: block;
    padding: 0;
  }
  .pw-policy__doc {
    max-width: none;
  }
}
</style>
