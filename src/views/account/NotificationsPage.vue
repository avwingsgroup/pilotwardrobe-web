<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeftRight, Bell, Check, CreditCard, MessageCircle, Scale, Send, ShieldCheck, Star } from '@lucide/vue'
import AppTabs from '@/components/common/AppTabs.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import { notificationService } from '@/api/messages.api'
import { userService } from '@/api/account.api'
import { toApiError } from '@/api/errors'
import { useResource } from '@/composables/useResource'
import { useSeo } from '@/composables/useSeo'
import { useUiStore } from '@/stores/ui.store'
import { useNotificationStore } from '@/stores/notification.store'
import { dayBucket, timeAgoShort } from '@/utils/date'
import { safeRedirect } from '@/utils/security'
import type { AppNotification, NotificationCategory, NotificationIcon } from '@/types/notification'
import type { NotificationPreference } from '@/types/user'

useSeo({ title: 'Notifications', noindex: true })
const router = useRouter()
const ui = useUiStore()
const store = useNotificationStore()
const category = ref<NotificationCategory | 'all'>('all')
const page = ref(1)

const { data, state, error, reload, mutate } = useResource((s) => notificationService.list({ category: category.value, page: page.value }, s), { watch: [category, page] })
const { data: prefs, mutate: mutatePrefs } = useResource((s) => userService.notificationPreferences(s))

const unread = computed(() => data.value?.data.filter((n) => !n.readAt).length ?? 0)
const groups = computed(() => {
  const out: { key: 'today' | 'yesterday' | 'earlier'; label: string; items: AppNotification[] }[] = [
    { key: 'today', label: 'Today', items: [] },
    { key: 'yesterday', label: 'Yesterday', items: [] },
    { key: 'earlier', label: 'Earlier', items: [] },
  ]
  for (const n of data.value?.data ?? []) out.find((g) => g.key === dayBucket(n.createdAt))!.items.push(n)
  return out.filter((g) => g.items.length)
})

const ICONS: Record<NotificationIcon, { icon: unknown; tone: string }> = {
  offer: { icon: ArrowLeftRight, tone: 'navy' },
  order: { icon: Send, tone: 'navy' },
  landed: { icon: Check, tone: 'green' },
  dispute: { icon: Scale, tone: 'red' },
  review: { icon: Star, tone: 'gold' },
  payout: { icon: CreditCard, tone: 'green' },
  verified: { icon: ShieldCheck, tone: 'gold' },
  message: { icon: MessageCircle, tone: 'navy' },
}

async function open(n: AppNotification, to?: string | null) {
  if (!n.readAt) {
    mutate((d) => (d ? { ...d, data: d.data.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)) } : d))
    store.unread = Math.max(0, store.unread - 1)
    void notificationService.markRead(n.id).catch(() => undefined)
  }
  const target = to ?? n.link
  if (target) await router.push(safeRedirect(target, '/notifications'))
}

async function markAll() {
  try {
    await notificationService.markAllRead()
    mutate((d) => (d ? { ...d, data: d.data.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() })) } : d))
    store.unread = 0
  } catch (e) {
    ui.error("Couldn't mark as read", toApiError(e).message)
  }
}

async function togglePref(p: NotificationPreference, channel: 'email' | 'push') {
  const prev = prefs.value
  const next = (prev ?? []).map((x) => (x.category === p.category ? { ...x, [channel]: !x[channel] } : x))
  mutatePrefs(() => next)
  try {
    await userService.updateNotificationPreferences(next)
  } catch (e) {
    mutatePrefs(() => prev)
    ui.error("Couldn't save preference", toApiError(e).message)
  }
}
</script>

<template>
  <div class="pw-container pw-ntf">
    <div class="pw-ntf__main">
      <header class="pw-page-head">
        <div>
          <h1 class="pw-page-title">Notifications</h1>
          <p class="pw-page-sub">{{ unread }} unread</p>
        </div>
        <AppButton variant="secondary" size="sm" :disabled="!unread" @click="markAll">Mark all as read</AppButton>
      </header>
      <AppTabs
        v-model="category"
        variant="pills"
        label="Filter notifications"
        :items="[
          { value: 'all', label: 'All' },
          { value: 'orders', label: 'Orders' },
          { value: 'offers_swaps', label: 'Offers & swaps' },
          { value: 'messages', label: 'Messages' },
          { value: 'account', label: 'Account' },
        ]"
      />
      <div class="pw-card pw-ntf__list">
        <ErrorState v-if="state === 'error'" :error="error" compact @retry="reload" />
        <div v-else-if="state === 'loading'" class="pw-card-pad"><AppSkeleton :lines="6" height="44px" /></div>
        <AppEmptyState v-else-if="!groups.length" :icon="Bell" title="You're all caught up" body="New offers, order updates and account alerts appear here." compact />
        <template v-for="g in groups" v-else :key="g.key">
          <h2 class="pw-ntf__group">{{ g.label }}</h2>
          <ul role="list">
            <li v-for="n in g.items" :key="n.id" class="pw-ntf__item" :class="{ 'is-unread': !n.readAt }">
              <span class="pw-ntf__icon" :class="`is-${ICONS[n.icon].tone}`" aria-hidden="true"><component :is="ICONS[n.icon].icon" :size="16" /></span>
              <div class="pw-ntf__text">
                <button type="button" class="pw-ntf__title" @click="open(n)">{{ n.title }}</button>
                <p class="pw-ntf__body">{{ n.body }}</p>
                <div v-if="n.actions?.length" class="pw-ntf__actions">
                  <AppButton v-for="a in n.actions" :key="a.label" size="sm" :variant="a.variant === 'secondary' ? 'secondary' : a.variant" @click="open(n, a.to)">{{ a.label }}</AppButton>
                </div>
              </div>
              <span class="pw-ntf__meta">
                <time :datetime="n.createdAt">{{ timeAgoShort(n.createdAt) }}</time>
                <span v-if="!n.readAt" class="pw-ntf__dot"><span class="sr-only">Unread</span></span>
              </span>
            </li>
          </ul>
        </template>
      </div>
      <AppPagination v-if="data" class="pw-ntf__pages" :page="data.meta.currentPage" :last-page="data.meta.lastPage" @change="page = $event" />
    </div>

    <aside class="pw-card pw-card-pad pw-ntf__prefs" aria-labelledby="dp">
      <h2 id="dp" class="pw-card-title">Delivery preferences</h2>
      <table>
        <thead><tr><th scope="col"><span class="sr-only">Category</span></th><th scope="col">Email</th><th scope="col">Push</th></tr></thead>
        <tbody>
          <tr v-for="p in prefs ?? []" :key="p.category">
            <th scope="row">{{ p.label }}</th>
            <td><input type="checkbox" :checked="p.email" :aria-label="`${p.label} by email`" @change="togglePref(p, 'email')" /></td>
            <td><input type="checkbox" :checked="p.push" :aria-label="`${p.label} by push`" @change="togglePref(p, 'push')" /></td>
          </tr>
        </tbody>
      </table>
      <p class="pw-ntf__note">Security and payment alerts are always sent.</p>
    </aside>
  </div>
</template>

<style scoped>
.pw-ntf {
  display: grid;
  gap: var(--pw-space-5);
  padding-top: var(--pw-space-8);
  padding-bottom: var(--pw-space-16);
}

.pw-ntf__main {
  min-width: 0;
}

.pw-ntf__list {
  margin-top: var(--pw-space-4);
  overflow: hidden;
}

.pw-ntf__group {
  padding: var(--pw-space-3) var(--pw-space-4);
  background: var(--pw-surface-sunken);
  border-bottom: 1px solid var(--pw-border);
  font-family: var(--pw-font-body);
  font-size: var(--pw-text-2xs);
  font-weight: var(--pw-weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--pw-muted);
}

.pw-ntf__item {
  display: flex;
  gap: var(--pw-space-3);
  padding: var(--pw-space-4);
  border-bottom: 1px solid var(--pw-border);
}

.pw-ntf__icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: var(--pw-radius-md);
}

.pw-ntf__icon.is-navy {
  background: var(--pw-navy-100);
  color: var(--pw-navy-700);
}
.pw-ntf__icon.is-green {
  background: var(--pw-success-100);
  color: var(--pw-success-600);
}
.pw-ntf__icon.is-red {
  background: var(--pw-danger-100);
  color: var(--pw-danger-600);
}
.pw-ntf__icon.is-gold {
  background: var(--pw-gold-100);
  color: var(--pw-gold-600);
}

.pw-ntf__text {
  flex: 1;
  min-width: 0;
}

.pw-ntf__title {
  padding: 0;
  border: 0;
  background: none;
  text-align: left;
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-medium);
  color: var(--pw-ink);
}

.is-unread .pw-ntf__title {
  font-weight: var(--pw-weight-semibold);
}

.pw-ntf__title:hover {
  text-decoration: underline;
}

.pw-ntf__body {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-ntf__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pw-space-2);
  margin-top: var(--pw-space-3);
}

.pw-ntf__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--pw-space-2);
  font-size: var(--pw-text-2xs);
  color: var(--pw-subtle);
}

.pw-ntf__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--pw-navy-700);
}

.pw-ntf__pages {
  margin-top: var(--pw-space-5);
}

.pw-ntf__prefs {
  align-self: start;
}

.pw-ntf__prefs table {
  margin-top: var(--pw-space-4);
  font-size: var(--pw-text-sm);
}

.pw-ntf__prefs th,
.pw-ntf__prefs td {
  padding: var(--pw-space-2) var(--pw-space-1);
  text-align: center;
}

.pw-ntf__prefs thead th {
  font-size: var(--pw-text-2xs);
  color: var(--pw-muted);
  text-transform: uppercase;
}

.pw-ntf__prefs tbody th {
  text-align: left;
  font-weight: var(--pw-weight-regular);
}

.pw-ntf__prefs input {
  width: 18px;
  height: 18px;
  accent-color: var(--pw-navy-700);
}

.pw-ntf__note {
  margin-top: var(--pw-space-3);
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

@media (min-width: 1024px) {
  .pw-ntf {
    grid-template-columns: minmax(0, 1fr) 320px;
  }
}
</style>
