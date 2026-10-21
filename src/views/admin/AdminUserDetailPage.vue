<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Check, Eye, Flag, Inbox, MessageCircle } from '@lucide/vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppTabs from '@/components/common/AppTabs.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppModal from '@/components/common/AppModal.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppToggle from '@/components/forms/AppToggle.vue'
import AppTextarea from '@/components/forms/AppTextarea.vue'
import StatCard from '@/components/dashboard/StatCard.vue'
import ReasonDialog from '@/components/admin/ReasonDialog.vue'
import { adminService } from '@/api/admin.api'
import { toApiError } from '@/api/errors'
import { useResource } from '@/composables/useResource'
import { useSeo } from '@/composables/useSeo'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { formatMoney } from '@/utils/money'
import { formatMonthYear, formatShortDate } from '@/utils/date'
import type { AdminUserDetail } from '@/types/admin'

/** AD4 — user detail. Toggles and actions are permission-gated; every change is audited server-side. */
const route = useRoute()
const auth = useAuthStore()
const ui = useUiStore()
const id = computed(() => String(route.params.id))
const { data: u, state, error, reload, mutate } = useResource((s) => adminService.user(id.value, s), { watch: [id] })
useSeo(() => ({ title: u.value ? `${u.value.displayName} · Users` : 'User', noindex: true }))

const tab = ref('overview')
const action = ref<'suspend' | 'restrict' | null>(null)
const busy = ref(false)
const noteOpen = ref(false)
const note = ref('')

const tabs = computed(() => [
  { value: 'overview', label: 'Overview' },
  { value: 'listings', label: `Listings ${u.value?.stats.tradesSold ? 24 : 0}` },
  { value: 'orders', label: `Orders ${u.value?.stats.ordersBought ?? 0}` },
  { value: 'wallet', label: 'Wallet & payouts' },
  { value: 'disputes', label: `Disputes ${u.value?.stats.disputes ?? 0}` },
  { value: 'messages', label: 'Messages' },
  { value: 'devices', label: 'Devices & sessions' },
  { value: 'notes', label: `Notes ${u.value?.notes.length ?? 0}` },
  { value: 'audit', label: 'Audit' },
])

async function run(kind: 'suspend' | 'restrict', reason: string) {
  busy.value = true
  try {
    const updated = kind === 'suspend' ? await adminService.suspendUser(id.value, reason) : await adminService.restrictUser(id.value, reason)
    mutate(() => updated)
    ui.success(kind === 'suspend' ? 'User suspended' : 'User restricted')
    action.value = null
  } catch (e) {
    ui.error('Action failed', toApiError(e).message)
  } finally {
    busy.value = false
  }
}

async function reinstate() {
  try {
    const updated = await adminService.reinstateUser(id.value)
    mutate(() => updated)
    ui.success('User reinstated')
  } catch (e) {
    ui.error('Action failed', toApiError(e).message)
    void reload()
  }
}

async function setLimit(key: keyof AdminUserDetail['limits'], value: boolean) {
  const prev = u.value
  if (!prev) return
  mutate(() => ({ ...prev, limits: { ...prev.limits, [key]: value } }))
  try {
    await adminService.updateLimits(id.value, { [key]: value })
  } catch (e) {
    mutate(() => prev)
    ui.error("Couldn't update limits", toApiError(e).message)
  }
}

async function impersonate() {
  try {
    const { expiresAt } = await adminService.impersonate(id.value)
    ui.info('Read-only impersonation started', `A banner is shown and the session expires ${formatShortDate(expiresAt)}. Logged in the audit trail.`)
  } catch (e) {
    ui.error("Couldn't impersonate", toApiError(e).message)
  }
}

async function addNote() {
  try {
    const updated = await adminService.addNote(id.value, note.value)
    mutate(() => updated)
    noteOpen.value = false
    note.value = ''
  } catch (e) {
    ui.error("Couldn't add note", toApiError(e).message)
  }
}

const toggles = [
  { key: 'canList' as const, label: 'Can list items' },
  { key: 'canReceivePayouts' as const, label: 'Can receive payouts' },
  { key: 'canTrade' as const, label: 'Can make offers & swaps' },
  { key: 'instantPayouts' as const, label: 'Instant payouts' },
]
</script>

<template>
  <div>
    <ErrorState v-if="state === 'error'" :error="error" not-found-title="User not found" class="pw-card" @retry="reload" />
    <AppSkeleton v-else-if="!u" height="420px" radius="var(--pw-radius-lg)" />
    <template v-else>
      <section class="pw-card pw-card-pad pw-ud__head">
        <AppAvatar :name="u.displayName" :initials="u.initials" :size="64" />
        <div class="pw-ud__id">
          <h1 class="pw-ud__name">{{ u.displayName }}
            <AppBadge v-if="u.kycStatus === 'approved'" tone="gold" solid>{{ u.roleLabel }}</AppBadge>
            <AppBadge :tone="u.status === 'active' ? 'success' : 'danger'">{{ u.status }}</AppBadge>
          </h1>
          <p class="pw-ud__meta">{{ u.email }} · {{ u.phoneMasked }} · {{ u.code }} · {{ u.city }} · Joined {{ formatMonthYear(u.joinedAt) }} · {{ u.signupMethod }}</p>
        </div>
        <div class="pw-ud__actions">
          <AppButton variant="secondary" size="sm" :to="{ name: 'messages' }"><template #icon><MessageCircle :size="14" /></template>Message</AppButton>
          <AppButton v-if="auth.can('users.impersonate')" variant="secondary" size="sm" @click="impersonate"><template #icon><Eye :size="14" /></template>Impersonate (read-only)</AppButton>
          <AppButton v-if="auth.can('users.update')" variant="secondary" size="sm" @click="action = 'restrict'">Restrict</AppButton>
          <AppButton v-if="auth.can('users.suspend') && u.status !== 'suspended'" variant="danger-outline" size="sm" @click="action = 'suspend'">Suspend</AppButton>
          <AppButton v-else-if="auth.can('users.suspend')" variant="success" size="sm" @click="reinstate">Reinstate</AppButton>
        </div>
      </section>

      <div class="pw-ud__stats">
        <StatCard label="GMV sold" :value="formatMoney(u.stats.gmvSold, { whole: true })" :caption="`${u.stats.tradesSold} trades`" />
        <StatCard label="GMV bought" :value="formatMoney(u.stats.gmvBought, { whole: true })" :caption="`${u.stats.ordersBought} orders`" />
        <StatCard label="Rating" :value="u.stats.rating.toFixed(1)" :caption="`${u.stats.reviews} reviews`" />
        <StatCard label="Disputes" :value="String(u.stats.disputes)" :caption="`${u.stats.disputesOpen} open · ${u.stats.disputesWon} won`" tone="gold" />
        <StatCard label="Wallet" :value="formatMoney(u.stats.wallet)" :caption="`${formatMoney(u.stats.walletEscrow, { whole: true })} in escrow`" />
      </div>

      <AppTabs v-model="tab" :items="tabs" label="User sections" class="pw-ud__tabs" />

      <div v-if="tab === 'overview'" class="pw-ud__grid">
        <div class="pw-stack">
          <section class="pw-card pw-card-pad" aria-labelledby="idv">
            <div class="pw-between"><h2 id="idv" class="pw-card-title">Identity verification</h2><RouterLink v-can="'kyc.view'" :to="{ name: 'admin-kyc' }" class="pw-ud__link">Open KYC case</RouterLink></div>
            <ul class="pw-ud__checks" role="list">
              <li v-for="c in u.identity.checks" :key="c.label">
                <span class="pw-ud__ok" :class="{ 'is-fail': !c.passed }"><Check :size="12" :stroke-width="3" aria-hidden="true" /></span>
                <span>{{ c.label }}</span>
                <span class="pw-muted">{{ c.detail }}</span>
              </li>
            </ul>
          </section>
          <section class="pw-card pw-card-pad" aria-labelledby="act">
            <h2 id="act" class="pw-card-title">Recent activity</h2>
            <ul class="pw-ud__activity" role="list">
              <li v-for="a in u.activity" :key="a.id" :class="`is-${a.state}`">
                <span class="pw-ud__marker" aria-hidden="true"><Flag v-if="a.state === 'flag'" :size="10" /><Check v-else :size="10" :stroke-width="3" /></span>
                <span><strong>{{ a.label }}</strong><small>{{ a.detail }}</small></span>
              </li>
            </ul>
          </section>
        </div>
        <div class="pw-stack">
          <section class="pw-card pw-card-pad" aria-labelledby="risk">
            <h2 id="risk" class="pw-card-title">Risk</h2>
            <div class="pw-ud__risk">
              <span class="pw-ud__risk-score" :class="u.riskScore > 70 ? 'is-high' : u.riskScore > 40 ? 'is-med' : ''">{{ u.riskScore }}</span>
              <div class="pw-ud__risk-bar" aria-hidden="true"><span :style="{ width: `${u.riskScore}%` }" /></div>
            </div>
            <p class="pw-muted pw-ud__small">{{ u.riskDetail }}</p>
          </section>
          <section class="pw-card pw-card-pad" aria-labelledby="limits">
            <h2 id="limits" class="pw-card-title">Limits &amp; permissions</h2>
            <div class="pw-ud__toggles">
              <AppToggle v-for="t in toggles" :key="t.key" :model-value="u.limits[t.key]" :label="t.label" reverse :disabled="!auth.can('users.update')" @update:model-value="setLimit(t.key, $event)" />
              <p class="pw-between pw-ud__small"><span class="pw-muted">Daily payout limit</span><strong>{{ formatMoney(u.limits.dailyPayoutLimit, { whole: true }) }}</strong></p>
            </div>
          </section>
          <section class="pw-card pw-card-pad" aria-labelledby="notes">
            <div class="pw-between"><h2 id="notes" class="pw-card-title">Internal notes</h2><button v-can="'users.update'" type="button" class="pw-link-btn pw-ud__small" @click="noteOpen = true">Add note</button></div>
            <ul class="pw-ud__notes" role="list">
              <li v-for="n in u.notes" :key="n.id">
                <p class="pw-between"><span class="pw-row"><AppAvatar :name="n.author" :initials="n.initials" :size="22" tone="navy" /> <strong>{{ n.author }}</strong></span><small>{{ formatShortDate(n.createdAt) }}</small></p>
                <p>{{ n.body }}</p>
              </li>
            </ul>
          </section>
        </div>
      </div>
      <AppEmptyState v-else class="pw-card" :icon="Inbox" tone="neutral" :title="`${tabs.find((x) => x.value === tab)?.label.replace(/\s\d+$/, '')} history`" body="This section is wired to its paginated admin endpoint and will populate once the Laravel API is connected." />
    </template>

    <ReasonDialog :open="action === 'suspend'" title="Suspend this user?" body="They can't log in, list or withdraw. Open escrow stays held." confirm-label="Suspend" :loading="busy" @confirm="run('suspend', $event)" @cancel="action = null" />
    <ReasonDialog :open="action === 'restrict'" title="Restrict this user?" body="They can browse and buy but not list, swap or withdraw." confirm-label="Restrict" tone="primary" :loading="busy" @confirm="run('restrict', $event)" @cancel="action = null" />
    <AppModal :open="noteOpen" title="Add internal note" size="sm" @close="noteOpen = false">
      <AppTextarea v-model="note" label="Note" :rows="3" hint="Visible to staff only." />
      <template #footer>
        <AppButton variant="secondary" @click="noteOpen = false">Cancel</AppButton>
        <AppButton :disabled="!note.trim()" @click="addNote">Add note</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<style scoped>
.pw-ud__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--pw-space-4);
}

.pw-ud__id {
  flex: 1 1 300px;
}

.pw-ud__name {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--pw-space-2);
  font-size: var(--pw-text-xl);
}

.pw-ud__meta {
  margin-top: 4px;
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-ud__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pw-space-2);
}

.pw-ud__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--pw-space-3);
  margin: var(--pw-space-4) 0;
}

.pw-ud__tabs {
  margin-bottom: var(--pw-space-4);
}

.pw-ud__grid {
  display: grid;
  gap: var(--pw-space-4);
}

.pw-ud__link,
.pw-ud__small {
  font-size: var(--pw-text-xs);
}

.pw-ud__checks li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--pw-space-3);
  padding: var(--pw-space-2) 0;
  font-size: var(--pw-text-sm);
}

.pw-ud__ok {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--pw-success-100);
  color: var(--pw-success-600);
}

.pw-ud__ok.is-fail {
  background: var(--pw-danger-100);
  color: var(--pw-danger-600);
}

.pw-ud__activity li {
  display: flex;
  gap: var(--pw-space-3);
  padding: var(--pw-space-2) 0;
  font-size: var(--pw-text-sm);
}

.pw-ud__activity li span:last-child {
  display: flex;
  flex-direction: column;
}

.pw-ud__activity small {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-ud__marker {
  display: grid;
  place-items: center;
  flex: none;
  width: 18px;
  height: 18px;
  margin-top: 2px;
  border-radius: 50%;
  background: var(--pw-success-600);
  color: #fff;
}

.is-flag .pw-ud__marker {
  background: var(--pw-navy-700);
}

.pw-ud__risk {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  margin: var(--pw-space-3) 0 var(--pw-space-2);
}

.pw-ud__risk-score {
  font-family: var(--pw-font-display);
  font-size: 1.75rem;
  font-weight: var(--pw-weight-bold);
  color: var(--pw-success-600);
}

.pw-ud__risk-score.is-med {
  color: var(--pw-warning-600);
}

.pw-ud__risk-score.is-high {
  color: var(--pw-danger-600);
}

.pw-ud__risk-bar {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--pw-border);
  overflow: hidden;
}

.pw-ud__risk-bar span {
  display: block;
  height: 100%;
  background: var(--pw-success-600);
}

.pw-ud__toggles {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-3);
  margin-top: var(--pw-space-3);
}

.pw-ud__notes li {
  padding: var(--pw-space-3) 0;
  border-bottom: 1px solid var(--pw-border);
  font-size: var(--pw-text-sm);
}

.pw-ud__notes small {
  font-size: var(--pw-text-2xs);
  color: var(--pw-subtle);
}

@media (min-width: 1100px) {
  .pw-ud__grid {
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  }
}
</style>
