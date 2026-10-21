<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Clock, Users, X } from '@lucide/vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppCheckbox from '@/components/forms/AppCheckbox.vue'
import AppInput from '@/components/forms/AppInput.vue'
import AppTextarea from '@/components/forms/AppTextarea.vue'
import AppSelect from '@/components/forms/AppSelect.vue'
import AppToggle from '@/components/forms/AppToggle.vue'
import { adminService } from '@/api/admin.api'
import { toApiError } from '@/api/errors'
import { useUiStore } from '@/stores/ui.store'
import type { BroadcastDraft } from '@/types/admin'

/**
 * AD14 — new broadcast. Email delivery is sent by Laravel via ZeptoMail; push via
 * FCM/APNs. The frontend never talks to ZeptoMail directly.
 */
const ui = useUiStore()
const draft = reactive<BroadcastDraft>({
  channels: ['push', 'email'],
  audience: ['Country: Nigeria, Ghana', 'Has Fit Kit', 'Viewed headsets 30d', 'Not purchased 60d'],
  pushTitle: 'Headset Week is boarding',
  pushBody: 'ANR headsets from verified crews, with buyer protection on us until Sunday.',
  emailSubject: 'Headset Week: the best ANR deals from verified crews',
  deepLink: 'pilotwardrobe://search?cat=headsets&promo=hw26',
  sendAt: '',
  timezone: 'recipient',
  respectQuietHours: true,
})
const reach = ref<{ reach: number; optedOut: number } | null>(null)
const errors = reactive<Record<string, string | undefined>>({})
const saving = ref(false)
const testing = ref(false)
const condition = ref('')
const savedAt = ref<number | null>(null)

const TIMEZONES = [
  { value: 'recipient', label: "Recipient's local time" },
  { value: 'wat', label: 'WAT (Lagos)' },
  { value: 'utc', label: 'UTC' },
]

const CHANNELS = [
  { key: 'push' as const, label: 'Push' },
  { key: 'email' as const, label: 'Email' },
  { key: 'in_app' as const, label: 'In-app banner' },
  { key: 'sms' as const, label: 'SMS' },
]

function toggleChannel(key: BroadcastDraft['channels'][number], on: boolean) {
  draft.channels = on ? [...new Set([...draft.channels, key])] : draft.channels.filter((c) => c !== key)
}

watch(
  () => [...draft.audience],
  async (audience) => {
    try {
      reach.value = await adminService.broadcastReach(audience)
    } catch {
      reach.value = null
    }
  },
  { immediate: true },
)

function addCondition() {
  const c = condition.value.trim()
  if (c && !draft.audience.includes(c)) draft.audience.push(c)
  condition.value = ''
}

const hasPush = computed(() => draft.channels.includes('push'))

async function schedule() {
  saving.value = true
  for (const k of Object.keys(errors)) errors[k] = undefined
  try {
    await adminService.saveBroadcast({ ...draft })
    savedAt.value = Date.now()
    ui.success('Broadcast scheduled', draft.sendAt ? `Sends ${new Date(draft.sendAt).toLocaleString()}` : 'Sends shortly')
  } catch (e) {
    const err = toApiError(e)
    for (const [k, v] of Object.entries(err.fieldErrors)) errors[k] = v[0]
    ui.error("Couldn't schedule", err.message)
  } finally {
    saving.value = false
  }
}

async function test() {
  testing.value = true
  try {
    await adminService.testBroadcast({ ...draft })
    ui.success('Test sent', 'Check your device and inbox.')
  } catch (e) {
    ui.error('Test failed', toApiError(e).message)
  } finally {
    testing.value = false
  }
}
</script>

<template>
  <div>
    <AdminPageHeader title="New broadcast" :subtitle="savedAt ? 'Scheduled · saved just now' : 'Draft'">
      <AppButton variant="secondary" size="sm" :loading="testing" @click="test">Send test</AppButton>
      <AppButton size="sm" :loading="saving" @click="schedule"><template #icon><Clock :size="14" /></template>Schedule</AppButton>
    </AdminPageHeader>

    <div class="pw-bc">
      <div class="pw-stack">
        <section class="pw-card pw-card-pad">
          <h2 class="pw-card-title">Channels</h2>
          <div class="pw-bc__channels">
            <div v-for="c in CHANNELS" :key="c.key" class="pw-bc__channel" :class="{ 'is-on': draft.channels.includes(c.key) }">
              <AppCheckbox :model-value="draft.channels.includes(c.key)" :label="c.label" @update:model-value="toggleChannel(c.key, $event)" />
            </div>
          </div>
          <p v-if="errors.channels" class="pw-bc__err" role="alert">{{ errors.channels }}</p>
        </section>

        <section class="pw-card pw-card-pad">
          <h2 class="pw-card-title">Audience</h2>
          <ul class="pw-bc__chips" role="list">
            <li v-for="a in draft.audience" :key="a">{{ a }} <button type="button" :aria-label="`Remove condition ${a}`" @click="draft.audience = draft.audience.filter((x) => x !== a)"><X :size="12" /></button></li>
            <li class="pw-bc__add"><input v-model="condition" placeholder="+ Add condition" aria-label="Add audience condition" @keydown.enter.prevent="addCondition" /></li>
          </ul>
          <p class="pw-bc__reach"><Users :size="14" aria-hidden="true" /> Estimated reach <strong>{{ reach ? reach.reach.toLocaleString() : '…' }} users</strong> · excludes {{ reach?.optedOut ?? '…' }} opted out</p>
        </section>

        <section class="pw-card pw-card-pad pw-stack">
          <h2 class="pw-card-title">Message</h2>
          <AppInput v-model="draft.pushTitle" label="Push title" :maxlength="50" :hint="`${draft.pushTitle.length} / 50`" :error="errors.pushTitle" />
          <AppTextarea v-model="draft.pushBody" label="Push body" :rows="2" :maxlength="150" show-count />
          <AppInput v-if="draft.channels.includes('email')" v-model="draft.emailSubject" label="Email subject" hint="Sent by Laravel via ZeptoMail using the broadcast template." />
          <AppInput v-model="draft.deepLink" label="Deep link" />
        </section>
      </div>

      <aside class="pw-stack">
        <section v-if="hasPush" class="pw-card pw-card-pad">
          <p class="pw-eyebrow">Preview · iOS lock screen</p>
          <div class="pw-bc__phone">
            <div class="pw-bc__notif">
              <span class="pw-bc__app" aria-hidden="true">PW</span>
              <div>
                <p class="pw-between"><strong>Pilotwardrobe</strong><small>now</small></p>
                <p class="pw-bc__ntitle">{{ draft.pushTitle || 'Push title' }}</p>
                <p>{{ draft.pushBody || 'Push body' }}</p>
              </div>
            </div>
          </div>
        </section>
        <section class="pw-card pw-card-pad pw-stack">
          <h2 class="pw-card-title">Schedule</h2>
          <AppInput v-model="draft.sendAt" label="Send at" type="datetime-local" />
          <AppSelect v-model="draft.timezone" label="Time zone" :options="TIMEZONES" />
          <AppToggle v-model="draft.respectQuietHours" label="Respect quiet hours" hint="No push 22:00–07:00" />
        </section>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.pw-bc {
  display: grid;
  gap: var(--pw-space-4);
}

.pw-bc__channels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: var(--pw-space-2);
  margin-top: var(--pw-space-3);
}

.pw-bc__channel {
  padding: 4px var(--pw-space-3);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-md);
}

.pw-bc__channel.is-on {
  border: 2px solid var(--pw-navy-700);
}

.pw-bc__err {
  margin-top: var(--pw-space-2);
  color: var(--pw-danger-600);
  font-size: var(--pw-text-sm);
}

.pw-bc__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pw-space-2);
  margin-top: var(--pw-space-3);
}

.pw-bc__chips li:not(.pw-bc__add) {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 4px 0 10px;
  border-radius: var(--pw-radius-full);
  background: var(--pw-navy-700);
  color: #fff;
  font-size: var(--pw-text-xs);
  font-weight: var(--pw-weight-semibold);
}

.pw-bc__chips button {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: 50%;
  background: none;
  color: #fff;
}

.pw-bc__add input {
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-full);
  font-size: var(--pw-text-xs);
}

.pw-bc__reach {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: var(--pw-space-3);
  font-size: var(--pw-text-sm);
  color: var(--pw-muted);
}

.pw-bc__reach strong {
  color: var(--pw-ink);
}

.pw-bc__phone {
  margin-top: var(--pw-space-3);
  padding: var(--pw-space-5) var(--pw-space-3);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-navy-700);
}

.pw-bc__notif {
  display: flex;
  gap: var(--pw-space-2);
  padding: var(--pw-space-3);
  border-radius: var(--pw-radius-md);
  background: rgb(255 255 255 / 92%);
  font-size: var(--pw-text-xs);
}

.pw-bc__notif small {
  color: var(--pw-muted);
}

.pw-bc__app {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  flex: none;
  border-radius: 6px;
  background: var(--pw-navy-900);
  color: #fff;
  font-size: 0.5625rem;
  font-weight: var(--pw-weight-bold);
}

.pw-bc__ntitle {
  font-weight: var(--pw-weight-semibold);
}

@media (min-width: 1100px) {
  .pw-bc {
    grid-template-columns: minmax(0, 2fr) minmax(260px, 1fr);
  }
}
</style>
