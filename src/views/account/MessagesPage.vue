<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Flag, ImageIcon, MessageCircle, MoreHorizontal, Search, Send, ShieldAlert, Tag } from '@lucide/vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppImage from '@/components/common/AppImage.vue'
import AppTabs from '@/components/common/AppTabs.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppDropdown from '@/components/common/AppDropdown.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import { messageService } from '@/api/messages.api'
import { offerService } from '@/api/trades.api'
import { toApiError } from '@/api/errors'
import { useResource } from '@/composables/useResource'
import { useSeo } from '@/composables/useSeo'
import { useUiStore } from '@/stores/ui.store'
import { useNotificationStore } from '@/stores/notification.store'
import { formatMoney } from '@/utils/money'
import { formatMonthYear, formatTime, timeAgoShort } from '@/utils/date'
import type { Message } from '@/types/messaging'
import { refDebounced } from '@vueuse/core'

/** VB10 — conversation list · thread · listing context. User content always rendered as text. */
useSeo({ title: 'Messages', noindex: true })
const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const notifications = useNotificationStore()
const filter = ref<'all' | 'buying' | 'selling' | 'unread'>('all')
const search = ref('')
const debounced = refDebounced(search, 300)
const draft = ref('')
const sending = ref(false)
const thread = ref<HTMLElement | null>(null)
const activeId = computed(() => (route.params.conversationId ? String(route.params.conversationId) : null))

const { data: conversations, state, error, reload: reloadList, mutate: mutateList } = useResource((s) => messageService.conversations({ context: filter.value, search: debounced.value || undefined }, s), { watch: [filter, debounced] })
const { data: messages, state: msgState, mutate: mutateMessages } = useResource(
  async (s) => {
    if (!activeId.value) return null
    const res = await messageService.messages(activeId.value, s)
    void messageService.markRead(activeId.value).catch(() => undefined)
    mutateList((list) => list?.map((c) => (c.id === activeId.value ? { ...c, unreadCount: 0 } : c)) ?? null)
    return res.data
  },
  { watch: [activeId] },
)

const active = computed(() => conversations.value?.find((c) => c.id === activeId.value) ?? null)
const unread = computed(() => conversations.value?.filter((c) => c.unreadCount > 0).length ?? 0)
watch(unread, (n) => notifications.setCounts({ unreadMessages: n }))

watch(conversations, (list) => {
  if (!activeId.value && list?.length && window.matchMedia('(min-width: 1024px)').matches) void router.replace({ name: 'messages', params: { conversationId: list[0]!.id } })
})

watch(messages, async () => {
  await nextTick()
  thread.value?.scrollTo({ top: thread.value.scrollHeight })
})

async function send() {
  const body = draft.value.trim()
  if (!body || !activeId.value) return
  sending.value = true
  const optimistic: Message = { id: `tmp-${Date.now()}`, conversationId: activeId.value, senderId: 'me', mine: true, kind: 'text', body, sentAt: new Date().toISOString() }
  mutateMessages((list) => [...(list ?? []), optimistic])
  draft.value = ''
  try {
    const saved = await messageService.send(activeId.value, { body })
    mutateMessages((list) => list?.map((m) => (m.id === optimistic.id ? saved : m)) ?? null)
    mutateList((list) => list?.map((c) => (c.id === activeId.value ? { ...c, lastMessagePreview: body, lastMessageAt: saved.sentAt } : c)) ?? null)
  } catch (e) {
    mutateMessages((list) => list?.filter((m) => m.id !== optimistic.id) ?? null)
    draft.value = body
    ui.error('Message not sent', toApiError(e).message)
  } finally {
    sending.value = false
  }
}

async function offerAction(offerId: string, action: 'accept' | 'decline') {
  try {
    await (action === 'accept' ? offerService.accept(offerId) : offerService.decline(offerId))
    mutateMessages((list) => list?.map((m) => (m.offer?.id === offerId ? { ...m, offer: { ...m.offer, status: action === 'accept' ? 'accepted' : 'declined' } } : m)) ?? null)
    ui.success(action === 'accept' ? 'Offer accepted' : 'Offer declined')
  } catch (e) {
    ui.error('Action failed', toApiError(e).message)
  }
}

async function report() {
  if (!activeId.value) return
  try {
    await messageService.report(activeId.value, { reason: 'off_platform_payment' })
    ui.success('Reported', 'Our Trust & Safety team will review this conversation.')
  } catch (e) {
    ui.error("Couldn't report", toApiError(e).message)
  }
}

async function reserve() {
  if (!active.value?.listing) return
  try {
    await messageService.reserveListing(active.value.listing.id)
    mutateList((list) => list?.map((c) => (c.id === activeId.value && c.listing ? { ...c, listing: { ...c.listing, reserved: true } } : c)) ?? null)
    ui.success('Marked as reserved')
  } catch (e) {
    ui.error("Couldn't reserve", toApiError(e).message)
  }
}

const dayLabel = (iso: string) => (new Date(iso).toDateString() === new Date().toDateString() ? 'Today' : new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
</script>

<template>
  <div class="pw-container pw-msg" :class="{ 'has-active': !!activeId }">
    <aside class="pw-card pw-msg__list" aria-label="Conversations">
      <h1 class="pw-msg__title">Messages</h1>
      <label class="pw-msg__search">
        <Search :size="16" aria-hidden="true" />
        <span class="sr-only">Search messages</span>
        <input v-model="search" type="search" placeholder="Search messages" />
      </label>
      <AppTabs v-model="filter" variant="pills" label="Filter conversations" :items="[{ value: 'all', label: 'All' }, { value: 'buying', label: 'Buying' }, { value: 'selling', label: 'Selling' }, { value: 'unread', label: `Unread ${unread || ''}` }]" class="pw-msg__filters" />
      <ErrorState v-if="state === 'error'" :error="error" compact @retry="reloadList" />
      <ul v-else-if="state === 'loading'" class="pw-msg__convos"><li v-for="n in 4" :key="n" class="pw-msg__sk"><AppSkeleton :lines="2" /></li></ul>
      <AppEmptyState v-else-if="!conversations?.length" :icon="MessageCircle" title="No conversations" body="Message a seller from any listing." compact />
      <ul v-else class="pw-msg__convos" role="list">
        <li v-for="c in conversations" :key="c.id">
          <RouterLink :to="{ name: 'messages', params: { conversationId: c.id } }" class="pw-msg__convo" :class="{ 'is-active': c.id === activeId }" :aria-current="c.id === activeId ? 'true' : undefined">
            <AppAvatar :name="c.participant.displayName" :initials="c.participant.initials" :size="40" :tone="c.participant.isSupport ? 'navy' : 'cream'" />
            <span class="pw-msg__convo-text">
              <span class="pw-between"><strong>{{ c.participant.displayName }}</strong><small>{{ timeAgoShort(c.lastMessageAt) }}</small></span>
              <span class="pw-msg__preview" :class="{ 'is-unread': c.unreadCount }">{{ c.lastMessagePreview || 'New conversation' }}</span>
            </span>
            <AppImage v-if="c.listing" :media="c.listing.image" ratio="1" sizes="32px" class="pw-msg__convo-img" />
            <span v-if="c.unreadCount" class="sr-only">{{ c.unreadCount }} unread</span>
          </RouterLink>
        </li>
      </ul>
    </aside>

    <section class="pw-card pw-msg__thread" aria-label="Conversation">
      <template v-if="active">
        <header class="pw-msg__head">
          <RouterLink :to="{ name: 'messages' }" class="pw-msg__back" aria-label="Back to conversations"><ArrowLeft :size="20" /></RouterLink>
          <AppAvatar :name="active.participant.displayName" :initials="active.participant.initials" :size="38" tone="cream" />
          <div class="pw-msg__who">
            <p class="pw-row"><strong>{{ active.participant.displayName }}</strong><AppBadge v-if="active.participant.verified" tone="gold" solid>Verified</AppBadge></p>
            <p class="pw-msg__sub">{{ [active.participant.responseTime, active.participant.location].filter(Boolean).join(' · ') }}</p>
          </div>
          <button type="button" class="pw-msg__icon" aria-label="Report conversation" @click="report"><Flag :size="18" /></button>
          <AppDropdown label="Conversation actions">
            <template #trigger="{ toggle, attrs }"><button type="button" class="pw-msg__icon" v-bind="attrs" aria-label="More actions" @click="toggle"><MoreHorizontal :size="18" /></button></template>
            <template #items>
              <RouterLink v-if="active.listing" role="menuitem" :to="{ name: 'listing', params: { slug: active.listing.slug } }"><Tag :size="16" /> View listing</RouterLink>
              <button type="button" role="menuitem" @click="report"><Flag :size="16" /> Report</button>
            </template>
          </AppDropdown>
        </header>

        <div ref="thread" class="pw-msg__body" role="log" aria-live="polite" aria-label="Messages">
          <AppSkeleton v-if="msgState === 'loading'" :lines="4" height="40px" />
          <template v-for="(m, i) in messages ?? []" v-else :key="m.id">
            <p v-if="i === 0 || dayLabel(m.sentAt) !== dayLabel(messages![i - 1]!.sentAt)" class="pw-msg__day">{{ dayLabel(m.sentAt) }}</p>
            <div class="pw-msg__row" :class="{ 'is-mine': m.mine, 'is-system': m.kind === 'system' }">
              <div v-if="m.kind === 'offer' && m.offer" class="pw-msg__offer">
                <div class="pw-msg__offer-head">
                  <AppImage v-if="active.listing" :media="active.listing.image" ratio="1" sizes="40px" class="pw-msg__offer-img" />
                  <div>
                    <p class="pw-msg__offer-amt">Offer · {{ formatMoney(m.offer.amount) }}</p>
                    <p class="pw-msg__sub">{{ m.offer.listingTitle }} · listed {{ formatMoney(m.offer.listedPrice, { whole: true }) }} · expires in {{ m.offer.expiresIn }}</p>
                  </div>
                </div>
                <div v-if="m.offer.status === 'pending' && !m.mine" class="pw-msg__offer-actions">
                  <button type="button" class="is-accept" @click="offerAction(m.offer.id, 'accept')">Accept</button>
                  <RouterLink :to="{ name: 'hangar-offers', query: { id: m.offer.id } }">Counter</RouterLink>
                  <button type="button" class="is-decline" @click="offerAction(m.offer.id, 'decline')">Decline</button>
                </div>
                <p v-else class="pw-msg__offer-status">{{ m.offer.status[0]!.toUpperCase() + m.offer.status.slice(1) }}</p>
              </div>
              <p v-else class="pw-msg__bubble">{{ m.body }}</p>
              <span class="pw-msg__time">{{ formatTime(m.sentAt) }}<template v-if="m.mine && m.readAt"> · Read</template></span>
            </div>
          </template>
        </div>

        <p class="pw-msg__warn"><ShieldAlert :size="16" aria-hidden="true" /> Keep payments on Pilotwardrobe. Off-platform payments aren't covered by escrow or buyer protection.</p>
        <form class="pw-msg__compose" @submit.prevent="send">
          <button type="button" class="pw-msg__icon" aria-label="Attach photo" @click="ui.info('Photos in messages', 'Photo attachments are moderated; enable once the attachments endpoint ships.')"><ImageIcon :size="18" /></button>
          <label for="msg-input" class="sr-only">Write a message</label>
          <input id="msg-input" v-model="draft" placeholder="Write a message…" maxlength="2000" autocomplete="off" />
          <AppButton type="submit" :loading="sending" :disabled="!draft.trim()"><template #icon><Send :size="16" /></template>Send</AppButton>
        </form>
      </template>
      <AppEmptyState v-else :icon="MessageCircle" title="Select a conversation" body="Messages keep the listing and escrow context together." />
    </section>

    <aside v-if="active?.listing" class="pw-card pw-msg__ctx" aria-label="About this item">
      <p class="pw-eyebrow">About this item</p>
      <AppImage :media="active.listing.image" ratio="4 / 3" fit="cover" sizes="240px" rounded class="pw-msg__ctx-img" />
      <p class="pw-msg__ctx-title">{{ active.listing.title }}</p>
      <p class="pw-msg__sub">{{ formatMoney(active.listing.price) }} · {{ active.listing.conditionLabel }} · {{ active.listing.offersCount }} offers</p>
      <AppButton variant="secondary" block :to="{ name: 'listing', params: { slug: active.listing.slug } }" class="pw-msg__ctx-btn">View listing</AppButton>
      <button v-if="active.context === 'selling' && !active.listing.reserved" type="button" class="pw-link-btn pw-msg__reserve" @click="reserve">Mark as reserved</button>
      <AppBadge v-else-if="active.listing.reserved" tone="info">Reserved</AppBadge>
      <dl class="pw-dl pw-msg__facts">
        <template v-if="active.participant.rating"><dt>Rating</dt><dd>{{ active.participant.rating }} · {{ active.participant.trades }} trades</dd></template>
        <dt>KYC</dt><dd>{{ active.participant.kycVerified ? 'Verified' : 'Not verified' }}</dd>
        <template v-if="active.participant.memberSince"><dt>Member since</dt><dd>{{ formatMonthYear(active.participant.memberSince) }}</dd></template>
      </dl>
    </aside>
  </div>
</template>

<style scoped>
.pw-msg {
  display: grid;
  gap: var(--pw-space-4);
  padding-top: var(--pw-space-5);
  padding-bottom: calc(var(--pw-space-8) + 56px);
}

.pw-msg__list {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.pw-msg__title {
  padding: var(--pw-space-4) var(--pw-space-4) 0;
  font-size: var(--pw-text-lg);
}

.pw-msg__search {
  display: flex;
  align-items: center;
  gap: var(--pw-space-2);
  margin: var(--pw-space-3) var(--pw-space-4);
  padding: 0 var(--pw-space-3);
  min-height: 40px;
  border-radius: var(--pw-radius-md);
  background: var(--pw-surface-sunken);
  color: var(--pw-muted);
}

.pw-msg__search input {
  flex: 1;
  border: 0;
  outline: none;
  background: none;
}

.pw-msg__filters {
  padding: 0 var(--pw-space-4) var(--pw-space-3);
  border-bottom: 1px solid var(--pw-border);
}

.pw-msg__convos {
  overflow-y: auto;
}

.pw-msg__sk {
  padding: var(--pw-space-4);
}

.pw-msg__convo {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  padding: var(--pw-space-3) var(--pw-space-4);
  border-left: 3px solid transparent;
  border-bottom: 1px solid var(--pw-border);
  color: var(--pw-ink);
}

.pw-msg__convo:hover {
  text-decoration: none;
  background: var(--pw-surface-sunken);
}

.pw-msg__convo.is-active {
  border-left-color: var(--pw-navy-700);
  background: var(--pw-navy-50);
}

.pw-msg__convo-text {
  flex: 1;
  min-width: 0;
  font-size: var(--pw-text-sm);
}

.pw-msg__convo-text small {
  color: var(--pw-subtle);
  font-size: var(--pw-text-2xs);
}

.pw-msg__preview {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-msg__preview.is-unread {
  color: var(--pw-ink);
  font-weight: var(--pw-weight-semibold);
}

.pw-msg__convo-img {
  width: 32px;
  flex: none;
  border-radius: var(--pw-radius-sm);
}

.pw-msg__thread {
  display: none;
  flex-direction: column;
  min-height: 70dvh;
  overflow: hidden;
}

.pw-msg__head {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  padding: var(--pw-space-3) var(--pw-space-4);
  border-bottom: 1px solid var(--pw-border);
}

.pw-msg__back {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  color: var(--pw-ink);
}

.pw-msg__who {
  flex: 1;
  min-width: 0;
  font-size: var(--pw-text-sm);
}

.pw-msg__sub {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-msg__icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--pw-muted);
}

.pw-msg__icon:hover {
  background: var(--pw-surface-sunken);
}

.pw-msg__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-2);
  padding: var(--pw-space-4);
  overflow-y: auto;
  max-height: 60dvh;
}

.pw-msg__day {
  align-self: center;
  margin: var(--pw-space-2) 0;
  font-size: var(--pw-text-xs);
  color: var(--pw-subtle);
}

.pw-msg__row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  max-width: 78%;
}

.pw-msg__row.is-mine {
  align-self: flex-end;
  align-items: flex-end;
}

.pw-msg__bubble {
  padding: var(--pw-space-3) var(--pw-space-4);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-surface);
  font-size: var(--pw-text-sm);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.is-mine .pw-msg__bubble {
  border-color: var(--pw-navy-700);
  background: var(--pw-navy-700);
  color: #fff;
}

.is-system .pw-msg__bubble {
  background: var(--pw-navy-50);
}

.pw-msg__time {
  font-size: var(--pw-text-2xs);
  color: var(--pw-subtle);
}

.pw-msg__offer {
  min-width: 260px;
  overflow: hidden;
  border: 1.5px solid var(--pw-navy-700);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-surface);
}

.pw-msg__offer-head {
  display: flex;
  gap: var(--pw-space-3);
  padding: var(--pw-space-3);
}

.pw-msg__offer-img {
  width: 40px;
  flex: none;
  border-radius: var(--pw-radius-sm);
}

.pw-msg__offer-amt {
  font-weight: var(--pw-weight-semibold);
}

.pw-msg__offer-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-top: 1px solid var(--pw-border);
}

.pw-msg__offer-actions > * {
  display: grid;
  place-items: center;
  min-height: 40px;
  border: 0;
  border-right: 1px solid var(--pw-border);
  background: none;
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-semibold);
}

.pw-msg__offer-actions > :last-child {
  border-right: 0;
}

.pw-msg__offer-actions .is-accept {
  color: var(--pw-success-600);
}

.pw-msg__offer-actions .is-decline {
  color: var(--pw-danger-600);
}

.pw-msg__offer-status {
  padding: var(--pw-space-2) var(--pw-space-3);
  border-top: 1px solid var(--pw-border);
  font-size: var(--pw-text-xs);
  font-weight: var(--pw-weight-semibold);
  color: var(--pw-muted);
}

.pw-msg__warn {
  display: flex;
  align-items: center;
  gap: var(--pw-space-2);
  padding: var(--pw-space-2) var(--pw-space-4);
  background: var(--pw-warning-100);
  color: var(--pw-warning-700);
  font-size: var(--pw-text-xs);
}

.pw-msg__compose {
  display: flex;
  align-items: center;
  gap: var(--pw-space-2);
  padding: var(--pw-space-3) var(--pw-space-4);
  border-top: 1px solid var(--pw-border);
}

.pw-msg__compose input {
  flex: 1;
  min-width: 0;
  min-height: var(--pw-touch);
  padding: 0 var(--pw-space-3);
  border: 1px solid var(--pw-border-strong);
  border-radius: var(--pw-radius-md);
}

.pw-msg__ctx {
  display: none;
  padding: var(--pw-space-4);
  align-self: start;
}

.pw-msg__ctx-img {
  margin: var(--pw-space-3) 0;
}

.pw-msg__ctx-title {
  font-weight: var(--pw-weight-semibold);
  font-size: var(--pw-text-sm);
}

.pw-msg__ctx-btn {
  margin: var(--pw-space-4) 0 var(--pw-space-2);
}

.pw-msg__reserve {
  display: block;
  width: 100%;
  margin-bottom: var(--pw-space-4);
  font-size: var(--pw-text-sm);
}

.pw-msg__facts {
  padding-top: var(--pw-space-4);
  border-top: 1px solid var(--pw-border);
}

/* Mobile: list OR thread */
.pw-msg.has-active .pw-msg__list {
  display: none;
}

.pw-msg.has-active .pw-msg__thread {
  display: flex;
}

@media (min-width: 1024px) {
  .pw-msg {
    grid-template-columns: 300px minmax(0, 1fr);
    height: calc(100dvh - var(--pw-header-h) - var(--pw-space-8));
    padding-bottom: var(--pw-space-5);
  }
  .pw-msg__list,
  .pw-msg.has-active .pw-msg__list {
    display: flex;
  }
  .pw-msg__thread {
    display: flex;
    min-height: 0;
  }
  .pw-msg__body {
    max-height: none;
  }
  .pw-msg__back {
    display: none;
  }
}

@media (min-width: 1280px) {
  .pw-msg {
    grid-template-columns: 300px minmax(0, 1fr) 260px;
  }
  .pw-msg__ctx {
    display: block;
  }
}
</style>
