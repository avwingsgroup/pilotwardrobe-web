<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeftRight, ChevronRight, Flag, Lock, MessageCircle, Package, RotateCcw, Ruler, Search, Send, ShieldCheck, Tag, User } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppImage from '@/components/common/AppImage.vue'
import InfoHero from '@/components/info/InfoHero.vue'
import { contentService } from '@/api/messages.api'
import { orderService } from '@/api/orders.api'
import { useResource } from '@/composables/useResource'
import { useSeo } from '@/composables/useSeo'
import { useAuthStore } from '@/stores/auth.store'
import { ORDER_STATUS } from '@/constants/labels'
import { PLATFORM } from '@/content/info/nav'
import { FAQS, type FaqTopic } from '@/content/info/faqs'
import { dateRangeLabel } from '@/utils/date'

useSeo({ title: 'Help Center', description: 'Search answers about orders, escrow, swaps, selling and your account, or talk to the Pilotwardrobe crew.', canonicalPath: '/help' })

const router = useRouter()
const auth = useAuthStore()
const query = ref('')

const firstName = computed(() => auth.user?.firstName)
const greeting = computed(() => (firstName.value ? `How can we help, ${firstName.value}?` : 'How can we help, Captain?'))

function search() {
  const q = query.value.trim()
  void router.push({ name: 'faq', query: q ? { q } : {} })
}

const shortcuts = [
  { label: 'Track my order', to: { name: 'hangar-orders' } },
  { label: 'Payout pending', to: { name: 'hangar-wallet' } },
  { label: 'Open a dispute', to: { name: 'hangar-disputes' } },
  { label: 'Change Fit Kit size', to: { name: 'hangar-fit-kit' } },
]

const count = (topic: FaqTopic) => FAQS.filter((f) => f.topic === topic).length
const answers = (n: number) => `${n} answer${n === 1 ? '' : 's'}`
const topics = [
  { icon: Package, title: 'Orders & tracking', meta: answers(count('buying')), to: { name: 'faq', query: { topic: 'buying' } } },
  { icon: Lock, title: 'Escrow & payments', meta: answers(count('escrow')), to: { name: 'faq', query: { topic: 'escrow' } } },
  { icon: ArrowLeftRight, title: 'Offers & swaps', meta: answers(count('swaps')), to: { name: 'faq', query: { topic: 'swaps' } } },
  { icon: Tag, title: 'Selling', meta: answers(count('selling')), to: { name: 'faq', query: { topic: 'selling' } } },
  { icon: RotateCcw, title: 'Returns & refunds', meta: 'Full policy', to: { name: 'returns' } },
  { icon: ShieldCheck, title: 'Verification & KYC', meta: answers(count('account')), to: { name: 'faq', query: { topic: 'account' } } },
  { icon: Ruler, title: 'Fit Kit & sizing', meta: 'Size profiles', to: { name: 'hangar-fit-kit' } },
  { icon: User, title: 'Account & security', meta: 'Settings', to: { name: 'hangar-settings', params: { tab: 'security' } } },
]

const { data: summary, state: summaryState } = useResource((signal) => contentService.helpSummary(signal))
const maxViews = computed(() => Math.max(1, ...(summary.value?.popular.map((p) => p.views) ?? [1])))
const kViews = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n))

// Signed-in help is tailored: show the buyer's most recent in-flight order.
const { data: activeOrder, state: orderState } = useResource(async (signal) => {
  if (!auth.isAuthenticated) return null
  const res = await orderService.list({ role: 'buyer', status: 'active' }, signal)
  return res.data[0] ?? null
})
</script>

<template>
  <div>
    <InfoHero variant="center" eyebrow="Support · Help Center" :title="greeting" lead="Search our answers or pick a topic. Signed-in help is tailored to your orders.">
      <form class="pw-helpsearch" role="search" @submit.prevent="search">
        <label for="help-q" class="sr-only">Search help</label>
        <Search :size="18" aria-hidden="true" />
        <input id="help-q" v-model="query" type="search" placeholder="Try “escrow release”, “return label”, “verify licence”" autocomplete="off" />
        <AppButton type="submit">Search</AppButton>
      </form>
      <ul class="pw-helpchips" role="list" aria-label="Common tasks">
        <li v-for="s in shortcuts" :key="s.label"><RouterLink :to="s.to">{{ s.label }}</RouterLink></li>
      </ul>
    </InfoHero>

    <div class="pw-container pw-help">
      <div class="pw-help__main">
        <section aria-labelledby="topics">
          <h2 id="topics" class="pw-help__h2">Browse by topic</h2>
          <ul class="pw-help__topics" role="list">
            <li v-for="t in topics" :key="t.title">
              <RouterLink :to="t.to" class="pw-info-card pw-topic">
                <span class="pw-info-icon pw-info-icon--lg"><component :is="t.icon" :size="18" aria-hidden="true" /></span>
                <strong>{{ t.title }}</strong>
                <small>{{ t.meta }}</small>
              </RouterLink>
            </li>
          </ul>
        </section>

        <section class="pw-info-card pw-popular" aria-labelledby="popular">
          <div class="pw-popular__head">
            <h2 id="popular" class="pw-info-card-title">Most read this week</h2>
            <RouterLink :to="{ name: 'faq' }">All questions</RouterLink>
          </div>
          <AppSkeleton v-if="summaryState === 'loading'" :lines="5" height="20px" />
          <ol v-else-if="summary" class="pw-popular__list" role="list">
            <li v-for="(p, i) in summary.popular" :key="p.faqId">
              <span class="pw-popular__rank">{{ i + 1 }}</span>
              <RouterLink :to="{ name: 'faq', hash: `#${p.faqId}` }" class="pw-popular__q">{{ p.question }}</RouterLink>
              <span class="pw-info-pill pw-info-pill--neutral">{{ p.tag }}</span>
              <span class="pw-info-bar pw-popular__bar" aria-hidden="true"><span :style="{ width: `${(p.views / maxViews) * 100}%` }" /></span>
              <span class="pw-popular__views"><span class="sr-only">Views: </span>{{ kViews(p.views) }}</span>
            </li>
          </ol>
          <p v-else class="pw-muted">Popular questions are unavailable right now.</p>
        </section>
      </div>

      <aside class="pw-help__aside">
        <section v-if="auth.isAuthenticated" class="pw-info-card pw-active" aria-labelledby="active-order">
          <div class="pw-active__head">
            <h2 id="active-order" class="pw-info-eyebrow">Your active order</h2>
            <span v-if="activeOrder" class="pw-info-pill">{{ ORDER_STATUS[activeOrder.status].label }}</span>
          </div>
          <AppSkeleton v-if="orderState === 'loading'" :lines="3" />
          <template v-else-if="activeOrder">
            <div class="pw-active__item">
              <AppImage :media="activeOrder.items[0]?.image" ratio="1" fit="contain" sizes="48px" class="pw-active__img" />
              <span>
                <strong>{{ activeOrder.items[0]?.title }}</strong>
                <small>#{{ activeOrder.number }}<template v-if="activeOrder.estimatedDelivery"> · ETA {{ dateRangeLabel(activeOrder.estimatedDelivery.from, activeOrder.estimatedDelivery.to) }}</template></small>
              </span>
            </div>
            <span v-if="activeOrder.route" class="pw-info-bar pw-active__bar" role="progressbar" :aria-valuenow="Math.round(activeOrder.route.progress * 100)" aria-valuemin="0" aria-valuemax="100" aria-label="Delivery progress">
              <span :style="{ width: `${activeOrder.route.progress * 100}%` }" />
            </span>
            <ul class="pw-active__links" role="list">
              <li><RouterLink :to="{ name: 'hangar-order', params: { id: activeOrder.id } }"><Send :size="16" aria-hidden="true" /> Track this order <ChevronRight :size="16" aria-hidden="true" /></RouterLink></li>
              <li><RouterLink :to="{ name: 'messages' }"><MessageCircle :size="16" aria-hidden="true" /> Message the seller <ChevronRight :size="16" aria-hidden="true" /></RouterLink></li>
              <li><RouterLink :to="{ name: 'hangar-disputes' }"><Flag :size="16" aria-hidden="true" /> Report a problem <ChevronRight :size="16" aria-hidden="true" /></RouterLink></li>
            </ul>
          </template>
          <p v-else class="pw-muted pw-active__empty">No orders in the air right now.</p>
        </section>

        <section v-if="summary" class="pw-info-card pw-status" aria-labelledby="status">
          <h2 id="status" class="pw-status__title">
            <span class="pw-status__dot" :class="`is-${summary.status.overall}`" aria-hidden="true" />
            {{ summary.status.overall === 'operational' ? 'All systems normal' : summary.status.overall === 'degraded' ? 'Some systems degraded' : 'Service disruption' }}
          </h2>
          <ul class="pw-status__list" role="list">
            <li v-for="c in summary.status.components" :key="c.name">
              <span>{{ c.name }}</span>
              <span class="pw-status__days" :aria-label="`${c.name}: ${c.days.filter((d) => d !== 'up').length} incident days in the last ${summary.status.windowDays} days`">
                <i v-for="(d, i) in c.days" :key="i" :class="`is-${d}`" />
              </span>
            </li>
          </ul>
          <p class="pw-muted pw-status__foot">Last {{ summary.status.windowDays }} days · {{ summary.status.uptimePercent }}% uptime</p>
        </section>

        <section class="pw-hand" aria-labelledby="hand">
          <MessageCircle :size="20" aria-hidden="true" />
          <h2 id="hand">Still need a hand?</h2>
          <p>Our crew replies in about 4 minutes on chat, {{ PLATFORM.chatHours }}.</p>
          <AppButton variant="inverse" block :to="{ name: 'contact', hash: '#message' }">Message the crew</AppButton>
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.pw-helpsearch {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  width: min(560px, 100%);
  margin: var(--pw-space-6) auto 0;
  padding: 6px 6px 6px var(--pw-space-4);
  border-radius: var(--pw-radius-lg);
  background: #fff;
  color: var(--pw-muted);
  box-shadow: var(--pw-shadow-lg);
}

.pw-helpsearch input {
  flex: 1;
  min-width: 0;
  min-height: 40px;
  border: 0;
  background: none;
  color: var(--pw-ink);
  font-size: var(--pw-text-sm);
}

.pw-helpsearch input:focus {
  outline: none;
}

.pw-helpsearch:focus-within {
  box-shadow: 0 0 0 3px var(--pw-gold-400), var(--pw-shadow-lg);
}

.pw-helpchips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--pw-space-2);
  margin-top: var(--pw-space-5);
}

.pw-helpchips a {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 var(--pw-space-3);
  border: 1px solid rgb(255 255 255 / 30%);
  border-radius: 999px;
  color: #fff;
  font-size: var(--pw-text-xs);
}

.pw-helpchips a:hover {
  background: rgb(255 255 255 / 10%);
  text-decoration: none;
}

.pw-help {
  display: grid;
  gap: var(--pw-space-6);
  grid-template-columns: minmax(0, 1fr);
  padding-top: var(--pw-space-8);
  padding-bottom: var(--pw-space-12);
}

.pw-help__main,
.pw-help__aside {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-5);
  align-content: start;
  min-width: 0;
}

.pw-help__h2 {
  margin-bottom: var(--pw-space-4);
  font-size: var(--pw-text-xl);
}

.pw-help__topics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--pw-space-3);
}

.pw-topic {
  display: grid;
  gap: 2px;
  height: 100%;
  color: var(--pw-ink);
}

.pw-topic:hover {
  border-color: var(--pw-navy-300);
  text-decoration: none;
}

.pw-topic strong {
  margin-top: var(--pw-space-4);
  font-size: var(--pw-text-sm);
}

.pw-topic small {
  color: var(--pw-muted);
  font-size: var(--pw-text-xs);
}

.pw-popular__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: var(--pw-space-3);
}

.pw-popular__head a {
  font-size: var(--pw-text-xs);
}

.pw-popular__list li {
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--pw-space-2) var(--pw-space-4);
  padding: var(--pw-space-3) 0;
  border-top: 1px solid var(--pw-border);
  font-size: var(--pw-text-sm);
}

.pw-popular__rank {
  color: var(--pw-subtle);
  font-size: var(--pw-text-xs);
}

.pw-popular__q {
  color: var(--pw-ink);
}

.pw-popular__bar,
.pw-popular__views {
  display: none;
}

.pw-popular__views {
  width: 36px;
  text-align: right;
  color: var(--pw-muted);
  font-size: var(--pw-text-xs);
}

.pw-active__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--pw-space-4);
}

.pw-active__item {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  font-size: var(--pw-text-sm);
}

.pw-active__item > span {
  display: grid;
  min-width: 0;
}

.pw-active__item small {
  color: var(--pw-muted);
  font-size: var(--pw-text-2xs);
}

.pw-active__img {
  width: 48px;
  flex: none;
  border-radius: var(--pw-radius-sm);
}

.pw-active__bar {
  display: block;
  margin-top: var(--pw-space-4);
}

.pw-active__links {
  margin-top: var(--pw-space-3);
}

.pw-active__links a {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  min-height: 44px;
  border-bottom: 1px solid var(--pw-border);
  color: var(--pw-ink);
  font-size: var(--pw-text-sm);
}

.pw-active__links li:last-child a {
  border-bottom: 0;
}

.pw-active__links a svg:last-child {
  margin-left: auto;
  color: var(--pw-subtle);
}

.pw-active__empty {
  font-size: var(--pw-text-sm);
}

.pw-status__title {
  display: flex;
  align-items: center;
  gap: var(--pw-space-2);
  font-family: var(--pw-font-body);
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-semibold);
}

.pw-status__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--pw-success-600);
}

.pw-status__dot.is-degraded {
  background: var(--pw-warning-600);
}

.pw-status__dot.is-outage {
  background: var(--pw-danger-600);
}

.pw-status__list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-2);
  margin-top: var(--pw-space-4);
}

.pw-status__list li {
  display: grid;
  grid-template-columns: 90px minmax(0, 1fr);
  align-items: center;
  gap: var(--pw-space-3);
  font-size: var(--pw-text-xs);
}

.pw-status__days {
  display: flex;
  gap: 2px;
  height: 16px;
}

.pw-status__days i {
  flex: 1;
  border-radius: 1px;
  background: #7cc9a0;
}

.pw-status__days i.is-degraded {
  background: var(--pw-warning-600);
}

.pw-status__days i.is-down {
  background: var(--pw-danger-600);
}

.pw-status__foot {
  margin-top: var(--pw-space-3);
  font-size: var(--pw-text-2xs);
}

.pw-hand {
  padding: var(--pw-space-5);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-navy-900);
  color: rgb(255 255 255 / 80%);
  font-size: var(--pw-text-xs);
}

.pw-hand svg {
  color: #fff;
}

.pw-hand h2 {
  margin: var(--pw-space-3) 0 var(--pw-space-2);
  font-size: var(--pw-text-md);
  color: #fff;
}

.pw-hand p {
  margin-bottom: var(--pw-space-4);
}

@media (min-width: 768px) {
  .pw-help__topics {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .pw-popular__list li {
    grid-template-columns: 20px minmax(0, 1fr) auto 100px 36px;
  }
  .pw-popular__bar {
    display: block;
  }
  .pw-popular__views {
    display: inline;
  }
}

@media (min-width: 1024px) {
  .pw-help {
    grid-template-columns: minmax(0, 1fr) 316px;
  }
}

@media (max-width: 479px) {
  .pw-helpsearch {
    flex-wrap: wrap;
    padding: var(--pw-space-2);
  }
  .pw-helpsearch input {
    flex-basis: calc(100% - 40px);
  }
  .pw-helpsearch :deep(.pw-btn) {
    width: 100%;
  }
}
</style>
