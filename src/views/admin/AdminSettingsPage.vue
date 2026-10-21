<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Settings, TowerControl } from '@lucide/vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import AppTabs from '@/components/common/AppTabs.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import AppToggle from '@/components/forms/AppToggle.vue'
import AppSelect from '@/components/forms/AppSelect.vue'
import AppInput from '@/components/forms/AppInput.vue'
import { adminService, type DualControlResult } from '@/api/admin.api'
import { toApiError } from '@/api/errors'
import { useResource } from '@/composables/useResource'
import { useUiStore } from '@/stores/ui.store'
import { CURRENCIES } from '@/constants/labels'
import type { PlatformSettings } from '@/types/admin'

/**
 * AD20 — platform settings (Super admin). Changes to payments and markets need a
 * second approver. Gateway SECRET keys are write-only on the server and are
 * never displayed or sent to this app; only masked public keys appear.
 */
const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const { data: s, state, error, reload, mutate } = useResource((sig) => adminService.settings(sig))

const TABS = [
  { value: 'general', label: 'General' },
  { value: 'markets', label: 'Markets & currencies' },
  { value: 'payments', label: 'Payments & PSPs' },
  { value: 'kyc', label: 'KYC provider' },
  { value: 'freight', label: 'Freight' },
  { value: 'flags', label: 'Feature flags' },
  { value: 'api', label: 'API & webhooks' },
]
const tab = computed({
  get: () => (route.path.endsWith('payment-gateways') ? 'payments' : TABS.some((t) => t.value === route.params.tab) ? String(route.params.tab) : 'markets'),
  set: (v: string) => void router.replace({ name: 'admin-settings', params: { tab: v } }),
})

const maintOpen = ref(false)
const maint = reactive({ startsAt: '', endsAt: '', message: 'Pilotwardrobe is down for upgrades. Orders and escrow are not affected.' })
const busy = ref(false)

function report(res: DualControlResult) {
  ui.success(res.status === 'pending_approval' ? `Submitted — awaiting ${res.approver ?? 'second approver'}` : 'Saved')
}

async function patch(update: Partial<PlatformSettings>, optimistic: (cur: PlatformSettings) => PlatformSettings) {
  const prev = s.value
  if (!prev) return
  mutate(() => optimistic(prev))
  try {
    report(await adminService.updateSettings(update))
  } catch (e) {
    mutate(() => prev)
    ui.error("Couldn't save", toApiError(e).message)
  }
}

function toggleMarket(code: string, enabled: boolean) {
  const markets = s.value!.markets.map((m) => (m.countryCode === code ? { ...m, enabled } : m))
  void patch({ markets }, (cur) => ({ ...cur, markets }))
}

function toggleFlag(key: string, enabled: boolean) {
  const featureFlags = s.value!.featureFlags.map((f) => (f.key === key ? { ...f, enabled } : f))
  void patch({ featureFlags }, (cur) => ({ ...cur, featureFlags }))
}

function toggleGateway(code: string, enabled: boolean) {
  const gateways = s.value!.gateways.map((g) => (g.code === code ? { ...g, enabled } : g))
  void patch({ gateways }, (cur) => ({ ...cur, gateways }))
}

function setSettlement(currency: string) {
  void patch({ settlementCurrency: currency as PlatformSettings['settlementCurrency'] }, (cur) => ({ ...cur, settlementCurrency: currency as PlatformSettings['settlementCurrency'] }))
}

function setFx(value: string) {
  const fx = Number(value)
  if (Number.isNaN(fx) || fx < 0 || fx > 10) return
  void patch({ fxMarginPercent: fx }, (cur) => ({ ...cur, fxMarginPercent: fx }))
}

async function schedule() {
  busy.value = true
  try {
    report(await adminService.scheduleMaintenance(maint))
    maintOpen.value = false
  } catch (e) {
    ui.error("Couldn't schedule", toApiError(e).message)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div>
    <AdminPageHeader title="Platform settings" subtitle="Changes to payments and markets need Super admin + a second approver" />
    <AppTabs v-model="tab" :items="TABS" label="Settings sections" class="pw-as__tabs" />
    <ErrorState v-if="state === 'error'" :error="error" class="pw-card" @retry="reload" />
    <AppSkeleton v-else-if="!s" height="420px" radius="var(--pw-radius-lg)" />

    <div v-else-if="tab === 'markets' || tab === 'flags'" class="pw-as">
      <div class="pw-stack">
        <section class="pw-card pw-card-pad" aria-labelledby="markets">
          <div class="pw-between"><h2 id="markets" class="pw-card-title">Markets</h2></div>
          <ul class="pw-as__list" role="list">
            <li v-for="m in s.markets" :key="m.countryCode">
              <span class="pw-as__code">{{ m.countryCode }}</span>
              <span class="pw-as__text"><strong>{{ m.name }}</strong><small>{{ m.detail }}</small></span>
              <AppBadge :tone="m.status === 'live' ? 'success' : 'warning'">{{ m.status === 'beta' ? 'Beta · waitlist' : m.status }}</AppBadge>
              <AppToggle :model-value="m.enabled" :label="`${m.name} enabled`" sr-only-label @update:model-value="toggleMarket(m.countryCode, $event)" />
            </li>
          </ul>
        </section>
        <section class="pw-card pw-card-pad" aria-labelledby="cur">
          <h2 id="cur" class="pw-card-title">Currencies</h2>
          <ul class="pw-as__list" role="list">
            <li>
              <span class="pw-as__text"><strong>Display currencies</strong><small>{{ s.displayCurrencies.join(', ') }} · rates refresh every 15 min</small></span>
            </li>
            <li>
              <span class="pw-as__text"><strong>Settlement currency</strong><small>Converted at release</small></span>
              <AppSelect :model-value="s.settlementCurrency" label="Settlement currency" sr-only-label :options="CURRENCIES.map((c) => ({ value: c, label: c }))" class="pw-as__narrow" @update:model-value="setSettlement" />
            </li>
            <li>
              <span class="pw-as__text"><strong>FX margin</strong><small>Applied to buyer at checkout</small></span>
              <AppInput :model-value="String(s.fxMarginPercent)" label="FX margin" sr-only-label suffix="%" inputmode="decimal" class="pw-as__narrow" @blur="setFx(($event.target as HTMLInputElement).value)" />
            </li>
          </ul>
        </section>
      </div>
      <div class="pw-stack">
        <section class="pw-card pw-card-pad" aria-labelledby="flags">
          <h2 id="flags" class="pw-card-title">Feature flags</h2>
          <ul class="pw-as__list" role="list">
            <li v-for="f in s.featureFlags" :key="f.key">
              <span class="pw-as__text"><strong>{{ f.label }}</strong><small>{{ f.detail }}</small></span>
              <AppToggle :model-value="f.enabled" :label="f.label" sr-only-label @update:model-value="toggleFlag(f.key, $event)" />
            </li>
          </ul>
        </section>
        <p class="pw-as__maint"><TowerControl :size="16" aria-hidden="true" /> <span><strong>Maintenance mode</strong> shows the VB20 maintenance screen to all users. Escrow timers pause automatically.<template v-if="s.maintenance.scheduled"> Scheduled: {{ s.maintenance.window }}</template></span></p>
        <AppButton variant="secondary" block @click="maintOpen = true">Schedule maintenance window</AppButton>
      </div>
    </div>

    <section v-else-if="tab === 'payments'" class="pw-card pw-card-pad" aria-labelledby="psp">
      <h2 id="psp" class="pw-card-title">Payment gateways</h2>
      <p class="pw-muted pw-as__small">Secret keys and webhook signing secrets are write-only and stored server-side (encrypted). They are never returned to this app.</p>
      <ul class="pw-as__list" role="list">
        <li v-for="g in s.gateways" :key="g.code">
          <span class="pw-as__text">
            <strong>{{ g.name }} <AppBadge :tone="g.mode === 'live' ? 'success' : 'warning'">{{ g.mode }}</AppBadge></strong>
            <small>{{ g.currencies.join(', ') }} · {{ g.countries.join(', ') }} · public key {{ g.publicKeyMasked ?? 'not set' }}</small>
          </span>
          <AppBadge :tone="g.webhookStatus === 'healthy' ? 'success' : g.webhookStatus === 'failing' ? 'danger' : 'neutral'">Webhook {{ g.webhookStatus }}</AppBadge>
          <AppToggle :model-value="g.enabled" :label="`${g.name} enabled`" sr-only-label @update:model-value="toggleGateway(g.code, $event)" />
        </li>
      </ul>
    </section>

    <AppEmptyState v-else :icon="Settings" tone="neutral" :title="TABS.find((t) => t.value === tab)?.label ?? 'Settings'" body="This section follows the same dual-control save flow as Markets. Its fields depend on provider choices still being finalised with the backend team." class="pw-card" />

    <AppModal :open="maintOpen" title="Schedule maintenance window" description="All users see the maintenance screen during this window. Requires a second approver." size="sm" @close="maintOpen = false">
      <div class="pw-stack">
        <AppInput v-model="maint.startsAt" label="Starts" type="datetime-local" />
        <AppInput v-model="maint.endsAt" label="Ends" type="datetime-local" />
        <AppInput v-model="maint.message" label="Message" />
      </div>
      <template #footer>
        <AppButton variant="secondary" @click="maintOpen = false">Cancel</AppButton>
        <AppButton :loading="busy" :disabled="!maint.startsAt || !maint.endsAt" @click="schedule">Submit for approval</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<style scoped>
.pw-as__tabs {
  margin-bottom: var(--pw-space-4);
}

.pw-as {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-4);
}

.pw-as__list li {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  padding: var(--pw-space-3) 0;
  border-top: 1px solid var(--pw-border);
}

.pw-as__list {
  margin-top: var(--pw-space-3);
}

.pw-as__code {
  width: 28px;
  font-size: var(--pw-text-xs);
  font-weight: var(--pw-weight-bold);
}

.pw-as__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  font-size: var(--pw-text-sm);
}

.pw-as__text strong {
  display: flex;
  align-items: center;
  gap: var(--pw-space-2);
}

.pw-as__text small {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-as__narrow {
  width: 120px;
}

.pw-as__small {
  margin-top: var(--pw-space-2);
  font-size: var(--pw-text-xs);
}

.pw-as__maint {
  display: flex;
  gap: var(--pw-space-2);
  padding: var(--pw-space-4);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-warning-100);
  color: var(--pw-warning-700);
  font-size: var(--pw-text-sm);
}

.pw-as__maint svg {
  flex: none;
  margin-top: 2px;
}

@media (min-width: 1100px) {
  .pw-as {
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
    align-items: start;
  }
}
</style>
