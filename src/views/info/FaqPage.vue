<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MessageCircle, Minus, Plus, Search, SearchX } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import InfoHero from '@/components/info/InfoHero.vue'
import { useSeo } from '@/composables/useSeo'
import { PLATFORM } from '@/content/info/nav'
import { FAQS, FAQ_TOPICS, type FaqTopic } from '@/content/info/faqs'

const route = useRoute()
const router = useRouter()

useSeo({
  title: 'Frequently asked questions',
  description: 'Quick answers on buying, selling, swapping and getting paid on Pilotwardrobe.',
  canonicalPath: '/faq',
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  },
})

const isTopic = (v: unknown): v is FaqTopic => FAQ_TOPICS.some((t) => t.value === v)
const topic = computed<FaqTopic | 'all'>(() => (isTopic(route.query.topic) ? route.query.topic : 'all'))
const q = computed(() => (typeof route.query.q === 'string' ? route.query.q.trim() : ''))
const draft = ref(q.value)
watch(q, (v) => (draft.value = v))

const terms = computed(() => q.value.toLowerCase().split(/\s+/).filter(Boolean))
const visible = computed(() =>
  FAQS.filter((f) => (q.value ? true : topic.value === 'all' || f.topic === topic.value)).filter((f) => {
    if (!terms.value.length) return true
    const hay = `${f.q} ${f.a}`.toLowerCase()
    return terms.value.every((t) => hay.includes(t))
  }),
)

const heading = computed(() => (q.value ? `Results for “${q.value}”` : topic.value === 'all' ? 'All questions' : FAQ_TOPICS.find((t) => t.value === topic.value)!.label))

function setTopic(value: FaqTopic | 'all') {
  void router.replace({ query: value === 'all' ? {} : { topic: value } })
}

function search() {
  const v = draft.value.trim()
  void router.replace({ query: v ? { q: v } : topic.value === 'all' ? {} : { topic: topic.value } })
}

// One answer open at a time; the first is open by default, a #hash wins.
const openId = ref<string | null>(null)
const feedback = ref<Record<string, 'yes' | 'no'>>({})

watch(
  visible,
  (list) => {
    if (!list.some((f) => f.id === openId.value)) openId.value = list[0]?.id ?? null
  },
  { immediate: true },
)

async function openFromHash() {
  const id = route.hash.replace('#', '')
  const faq = FAQS.find((f) => f.id === id)
  if (!faq) return
  if (!visible.value.includes(faq)) await router.replace({ query: { topic: faq.topic }, hash: route.hash })
  openId.value = id
  await nextTick()
  document.getElementById(id)?.scrollIntoView({ block: 'center' })
}
onMounted(openFromHash)
watch(() => route.hash, openFromHash)

const toggle = (id: string) => (openId.value = openId.value === id ? null : id)

const glance = [
  { label: 'Seller must ship', value: `${PLATFORM.dispatchDays} days`, pct: 45 },
  { label: 'Inspection window', value: `${PLATFORM.inspectionHours} hours`, pct: 30 },
  { label: 'Seller reply to dispute', value: `${PLATFORM.sellerReplyHours} hours`, pct: 20 },
  { label: 'Mediator decision', value: `${PLATFORM.mediationBusinessDays} business days`, pct: 100 },
]
</script>

<template>
  <div>
    <InfoHero variant="center" eyebrow="Support · FAQs" title="Frequently asked questions" lead="Quick answers on buying, selling, swapping and getting paid.">
      <form class="pw-faqsearch" role="search" @submit.prevent="search">
        <label for="faq-q" class="sr-only">Search questions</label>
        <Search :size="18" aria-hidden="true" />
        <input id="faq-q" v-model="draft" type="search" placeholder="Search questions" autocomplete="off" />
        <AppButton type="submit">Search</AppButton>
      </form>
    </InfoHero>

    <div class="pw-container pw-faq">
      <div class="pw-faq__chips" role="group" aria-label="Filter by topic">
        <button type="button" :aria-pressed="topic === 'all' && !q" :class="{ 'is-on': topic === 'all' && !q }" @click="setTopic('all')">All</button>
        <button v-for="t in FAQ_TOPICS" :key="t.value" type="button" :aria-pressed="topic === t.value && !q" :class="{ 'is-on': topic === t.value && !q }" @click="setTopic(t.value)">{{ t.label }}</button>
      </div>

      <div class="pw-faq__grid">
        <section aria-labelledby="faq-list">
          <h2 id="faq-list" class="pw-faq__h2" aria-live="polite">
            {{ heading }} <span>{{ visible.length }} question{{ visible.length === 1 ? '' : 's' }}</span>
          </h2>

          <AppEmptyState v-if="!visible.length" :icon="SearchX" tone="neutral" title="No matching questions" body="Try different words, or ask the crew directly." compact class="pw-info-card">
            <AppButton variant="secondary" :to="{ name: 'contact', hash: '#message' }">Ask the crew</AppButton>
          </AppEmptyState>

          <ul v-else class="pw-faq__list" role="list">
            <li v-for="f in visible" :id="f.id" :key="f.id" class="pw-faq__item" :class="{ 'is-open': openId === f.id }">
              <h3>
                <button type="button" class="pw-faq__q" :aria-expanded="openId === f.id" :aria-controls="`${f.id}-a`" @click="toggle(f.id)">
                  <span>{{ f.q }}</span>
                  <span class="pw-faq__sign" aria-hidden="true"><Minus v-if="openId === f.id" :size="16" /><Plus v-else :size="16" /></span>
                </button>
              </h3>
              <div v-show="openId === f.id" :id="`${f.id}-a`" class="pw-faq__a">
                <p>{{ f.a }}</p>
                <div class="pw-faq__foot">
                  <div v-if="!feedback[f.id]" class="pw-faq__helpful" role="group" :aria-label="`Was the answer to “${f.q}” helpful?`">
                    <span>Was this helpful?</span>
                    <button type="button" @click="feedback[f.id] = 'yes'">Yes</button>
                    <button type="button" @click="feedback[f.id] = 'no'">No</button>
                  </div>
                  <p v-else class="pw-faq__thanks" role="status">
                    <template v-if="feedback[f.id] === 'yes'">Thanks for the feedback.</template>
                    <template v-else>Sorry about that. <RouterLink :to="{ name: 'contact', hash: '#message' }">Ask the crew</RouterLink> and we’ll help directly.</template>
                  </p>
                  <RouterLink v-if="f.policy" :to="{ name: f.policy.name }" class="pw-faq__policy">{{ f.policy.label }}</RouterLink>
                </div>
              </div>
            </li>
          </ul>
        </section>

        <aside class="pw-faq__aside">
          <section class="pw-info-card" aria-labelledby="glance">
            <h2 id="glance" class="pw-info-card-title">Escrow at a glance</h2>
            <dl class="pw-glance">
              <div v-for="g in glance" :key="g.label">
                <dt>{{ g.label }}</dt>
                <dd>{{ g.value }}</dd>
                <span class="pw-info-bar" aria-hidden="true"><span :style="{ width: `${g.pct}%` }" /></span>
              </div>
            </dl>
          </section>
          <section class="pw-info-card pw-notfound" aria-labelledby="notfound">
            <span class="pw-info-icon pw-info-icon--lg"><MessageCircle :size="18" aria-hidden="true" /></span>
            <h2 id="notfound" class="pw-info-card-title">Didn’t find it?</h2>
            <p class="pw-muted">Our crew answers in about 4 minutes, {{ PLATFORM.chatHours }}.</p>
            <div class="pw-notfound__actions">
              <AppButton size="sm" :to="{ name: 'contact', hash: '#message' }">Message us</AppButton>
              <AppButton size="sm" variant="secondary" :to="{ name: 'help-center' }">Help Center</AppButton>
            </div>
          </section>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pw-faqsearch {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  width: min(470px, 100%);
  margin: var(--pw-space-6) auto 0;
  padding: 6px 6px 6px var(--pw-space-4);
  border-radius: var(--pw-radius-lg);
  background: #fff;
  color: var(--pw-muted);
  box-shadow: var(--pw-shadow-lg);
}

.pw-faqsearch input {
  flex: 1;
  min-width: 0;
  min-height: 40px;
  border: 0;
  background: none;
  color: var(--pw-ink);
  font-size: var(--pw-text-sm);
}

.pw-faqsearch input:focus {
  outline: none;
}

.pw-faqsearch:focus-within {
  box-shadow: 0 0 0 3px var(--pw-gold-400), var(--pw-shadow-lg);
}

.pw-faq {
  padding-top: var(--pw-space-6);
  padding-bottom: var(--pw-space-12);
}

.pw-faq__chips {
  display: flex;
  gap: var(--pw-space-2);
  overflow-x: auto;
  padding-bottom: var(--pw-space-2);
  scrollbar-width: none;
}

.pw-faq__chips button {
  flex: none;
  min-height: 34px;
  padding: 0 var(--pw-space-4);
  border: 1px solid var(--pw-border-strong);
  border-radius: 999px;
  background: var(--pw-surface);
  color: var(--pw-ink-2);
  font-size: var(--pw-text-xs);
}

.pw-faq__chips button.is-on {
  border-color: var(--pw-navy-700);
  background: var(--pw-navy-700);
  color: #fff;
  font-weight: var(--pw-weight-semibold);
}

.pw-faq__grid {
  display: grid;
  gap: var(--pw-space-6);
  grid-template-columns: minmax(0, 1fr);
  margin-top: var(--pw-space-5);
}

.pw-faq__h2 {
  display: flex;
  align-items: baseline;
  gap: var(--pw-space-3);
  margin-bottom: var(--pw-space-4);
  font-size: var(--pw-text-xl);
}

.pw-faq__h2 span {
  font-family: var(--pw-font-body);
  font-size: var(--pw-text-xs);
  font-weight: var(--pw-weight-regular);
  color: var(--pw-muted);
}

.pw-faq__list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-3);
}

.pw-faq__item {
  scroll-margin-top: 136px;
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-surface);
}

.pw-faq__item.is-open {
  border-color: var(--pw-navy-700);
}

.pw-faq__q {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--pw-space-4);
  width: 100%;
  min-height: 56px;
  padding: var(--pw-space-3) var(--pw-space-5);
  border: 0;
  background: none;
  text-align: left;
  color: var(--pw-ink);
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-semibold);
}

.pw-faq__sign {
  display: grid;
  place-items: center;
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--pw-surface-sunken);
  color: var(--pw-ink-2);
}

.is-open .pw-faq__sign {
  background: var(--pw-navy-700);
  color: #fff;
}

.pw-faq__a {
  padding: 0 var(--pw-space-5) var(--pw-space-4);
  color: var(--pw-ink-2);
  font-size: var(--pw-text-sm);
  line-height: var(--pw-leading-relaxed);
}

.pw-faq__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--pw-space-3);
  margin-top: var(--pw-space-4);
  padding-top: var(--pw-space-3);
  border-top: 1px solid var(--pw-border);
  font-size: var(--pw-text-xs);
}

.pw-faq__helpful {
  display: flex;
  align-items: center;
  gap: var(--pw-space-2);
  color: var(--pw-muted);
}

.pw-faq__helpful button {
  min-height: 32px;
  padding: 0 var(--pw-space-3);
  border: 1px solid var(--pw-border-strong);
  border-radius: var(--pw-radius-md);
  background: var(--pw-surface);
  font-size: var(--pw-text-xs);
}

.pw-faq__helpful button:hover {
  border-color: var(--pw-navy-300);
}

.pw-faq__thanks {
  color: var(--pw-muted);
}

.pw-faq__policy {
  font-weight: var(--pw-weight-medium);
}

.pw-faq__aside {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-4);
  align-content: start;
}

.pw-glance {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-4);
  margin-top: var(--pw-space-4);
}

.pw-glance div {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--pw-space-2);
  font-size: var(--pw-text-xs);
}

.pw-glance dt {
  color: var(--pw-ink-2);
}

.pw-glance dd {
  margin: 0;
  font-weight: var(--pw-weight-semibold);
}

.pw-glance .pw-info-bar {
  grid-column: 1 / -1;
  height: 4px;
}

.pw-notfound h2 {
  margin-top: var(--pw-space-4);
}

.pw-notfound p {
  margin-top: var(--pw-space-2);
  font-size: var(--pw-text-xs);
}

.pw-notfound__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pw-space-2);
  margin-top: var(--pw-space-4);
}

@media (min-width: 768px) {
  .pw-faq__chips {
    justify-content: center;
    flex-wrap: wrap;
  }
}

@media (min-width: 1024px) {
  .pw-faq__grid {
    grid-template-columns: minmax(0, 1fr) 282px;
  }
}

@media (max-width: 479px) {
  .pw-faqsearch {
    padding-left: var(--pw-space-3);
  }
}
</style>
