<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Paperclip } from '@lucide/vue'
import AppBreadcrumb from '@/components/common/AppBreadcrumb.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppTimeline from '@/components/common/AppTimeline.vue'
import AppConfirmDialog from '@/components/common/AppConfirmDialog.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import { disputeService } from '@/api/account.api'
import { mediaService } from '@/api/listings.api'
import { toApiError } from '@/api/errors'
import { useResource } from '@/composables/useResource'
import { useSeo } from '@/composables/useSeo'
import { useUiStore } from '@/stores/ui.store'
import { DISPUTE_STATUS } from '@/constants/labels'
import { formatMoney } from '@/utils/money'
import { formatDateTime, formatShortDate } from '@/utils/date'

/** VB15 — dispute case: activity thread with mediator, status, seller proposal. */
const route = useRoute()
const ui = useUiStore()
const id = computed(() => String(route.params.id))
const { data: d, state, error, reload, mutate } = useResource((s) => disputeService.get(id.value, s), { watch: [id] })
const ROLE_LABEL = { buyer: 'Buyer', seller: 'Seller', mediator: 'Mediator', system: 'System' } as const
const reply = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const attaching = ref(false)
const sending = ref(false)
const withdrawOpen = ref(false)
const busy = ref(false)

useSeo(() => ({ title: d.value ? `Dispute #${d.value.number}` : 'Dispute', noindex: true }))

const can = (a: string) => (d.value?.allowedActions as string[] | undefined)?.includes(a)

async function send() {
  if (!reply.value.trim() || !d.value) return
  sending.value = true
  try {
    const updated = await disputeService.reply(d.value.id, reply.value.trim())
    mutate(() => updated)
    reply.value = ''
  } catch (e) {
    ui.error("Couldn't send reply", toApiError(e).message)
  } finally {
    sending.value = false
  }
}

/** Evidence: upload each file (Laravel → private storage), then post them to the thread. */
async function attach(event: Event) {
  const files = Array.from((event.target as HTMLInputElement).files ?? []).slice(0, 10)
  if (!files.length || !d.value) return
  attaching.value = true
  try {
    const ids: string[] = []
    for (const f of files) ids.push((await mediaService.upload(f, 'dispute_evidence')).id)
    const updated = await disputeService.reply(d.value.id, reply.value.trim() || `Attached ${ids.length} file${ids.length === 1 ? '' : 's'}.`, ids)
    mutate(() => updated)
    reply.value = ''
    ui.success('Evidence attached')
  } catch (e) {
    ui.error("Couldn't attach files", toApiError(e).message)
  } finally {
    attaching.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function respond(accept: boolean) {
  if (!d.value) return
  busy.value = true
  try {
    const updated = await disputeService.respondToProposal(id.value, accept)
    mutate(() => updated)
    ui.success(accept ? 'Proposal accepted' : 'Proposal declined', accept ? 'Ship the item back using the prepaid label. Refund releases on arrival.' : 'The mediator will decide.')
  } catch (e) {
    ui.error('Action failed', toApiError(e).message)
    void reload()
  } finally {
    busy.value = false
  }
}

async function withdraw() {
  busy.value = true
  try {
    const updated = await disputeService.withdraw(id.value)
    mutate(() => updated)
    withdrawOpen.value = false
    ui.success('Dispute withdrawn', 'Escrow will release to the seller.')
  } catch (e) {
    ui.error("Couldn't withdraw", toApiError(e).message)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div>
    <AppBreadcrumb separator="chevron" :items="[{ label: 'My Hangar', to: { name: 'hangar' } }, { label: 'Disputes', to: { name: 'hangar-disputes' } }, { label: d ? `#${d.number}` : '…' }]" />

    <ErrorState v-if="state === 'error'" :error="error" not-found-title="Dispute not found" class="pw-card pw-dc__top" @retry="reload" />
    <div v-else-if="!d" class="pw-dc__grid pw-dc__top"><AppSkeleton height="360px" radius="var(--pw-radius-lg)" /><AppSkeleton height="360px" radius="var(--pw-radius-lg)" /></div>

    <template v-else>
      <header class="pw-page-head pw-dc__top">
        <div>
          <h1 class="pw-page-title pw-row">Dispute #{{ d.number }} <StatusBadge :status="DISPUTE_STATUS[d.status]" /></h1>
          <p class="pw-page-sub">{{ d.reasonLabel }} · opened {{ formatShortDate(d.openedAt) }}<template v-if="d.mediator"> · mediator: {{ d.mediator.displayName }}</template></p>
        </div>
        <div class="pw-page-head__actions">
          <AppButton v-if="can('withdraw')" variant="secondary" @click="withdrawOpen = true">Withdraw dispute</AppButton>
        </div>
      </header>

      <div class="pw-dc__grid">
        <section class="pw-card pw-card-pad" aria-labelledby="activity">
          <h2 id="activity" class="pw-card-title">Case activity</h2>
          <ol class="pw-dc__thread" role="list">
            <li v-for="m in [...d.messages].reverse()" :key="m.id" class="pw-dc__msg" :class="`is-${m.author.role}`">
              <AppAvatar :name="m.author.displayName" :initials="m.author.initials" :size="36" :tone="m.author.role === 'mediator' ? 'navy' : 'soft'" />
              <div class="pw-dc__bubble">
                <p class="pw-between pw-dc__meta">
                  <strong>{{ m.author.displayName }} · {{ ROLE_LABEL[m.author.role] }}</strong>
                  <span>{{ formatDateTime(m.createdAt) }}</span>
                </p>
                <p>{{ m.body }}</p>
              </div>
            </li>
          </ol>
          <form v-if="can('reply')" class="pw-dc__reply" @submit.prevent="send">
            <label for="dc-reply" class="sr-only">Reply to the mediator</label>
            <input id="dc-reply" v-model="reply" placeholder="Reply to the mediator…" maxlength="2000" />
            <input ref="fileInput" type="file" class="sr-only" accept="image/jpeg,image/png,image/webp,image/heic,application/pdf" multiple tabindex="-1" aria-hidden="true" @change="attach" />
            <AppButton variant="secondary" type="button" :loading="attaching" @click="fileInput?.click()"><template #icon><Paperclip :size="16" /></template>Attach</AppButton>
            <AppButton type="submit" :loading="sending" :disabled="!reply.trim()">Send</AppButton>
          </form>
        </section>

        <aside class="pw-stack">
          <div class="pw-card pw-card-pad">
            <h2 class="pw-card-title pw-dc__h">Status</h2>
            <AppTimeline :items="d.steps" />
          </div>
          <div v-if="d.sellerProposal" class="pw-card pw-card-pad">
            <h2 class="pw-card-title">Seller's proposal</h2>
            <p class="pw-dc__proposal">{{ d.sellerProposal.summary }}</p>
            <div v-if="d.sellerProposal.status === 'pending' && can('accept_proposal')" class="pw-row">
              <AppButton variant="success" size="sm" :loading="busy" @click="respond(true)">Accept proposal</AppButton>
              <AppButton variant="secondary" size="sm" :disabled="busy" @click="respond(false)">Decline</AppButton>
            </div>
            <p v-else class="pw-muted pw-dc__small">Proposal {{ d.sellerProposal.status }}.</p>
          </div>
          <div class="pw-card pw-card-pad">
            <dl class="pw-dl">
              <dt>Escrow frozen</dt><dd>{{ formatMoney(d.escrowFrozen) }}</dd>
              <template v-if="d.requestedAmount"><dt>Requested</dt><dd>{{ formatMoney(d.requestedAmount) }} partial refund</dd></template>
              <dt>Order</dt><dd><RouterLink :to="{ name: 'hangar-order', params: { id: d.orderId } }">#{{ d.orderNumber }}</RouterLink></dd>
            </dl>
          </div>
        </aside>
      </div>

      <AppConfirmDialog :open="withdrawOpen" title="Withdraw this dispute?" body="Escrow will release to the seller and the case closes. This can't be undone." confirm-label="Withdraw" tone="danger" :loading="busy" @confirm="withdraw" @cancel="withdrawOpen = false" />
    </template>
  </div>
</template>

<style scoped>
.pw-dc__top {
  margin-top: var(--pw-space-5);
}

.pw-dc__grid {
  display: grid;
  gap: var(--pw-space-5);
}

.pw-dc__h {
  margin-bottom: var(--pw-space-4);
}

.pw-dc__thread {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-3);
  margin: var(--pw-space-4) 0;
}

.pw-dc__msg {
  display: flex;
  gap: var(--pw-space-3);
}

.pw-dc__bubble {
  flex: 1;
  padding: var(--pw-space-3) var(--pw-space-4);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
  font-size: var(--pw-text-sm);
  color: var(--pw-ink-2);
}

.is-mediator .pw-dc__bubble {
  border-color: color-mix(in srgb, var(--pw-navy-700) 25%, white);
  background: var(--pw-navy-50);
}

.pw-dc__meta {
  margin-bottom: 4px;
  font-size: var(--pw-text-xs);
  color: var(--pw-subtle);
}

.pw-dc__meta strong {
  color: var(--pw-ink);
}

.pw-dc__reply {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pw-space-2);
}

.pw-dc__reply input {
  flex: 1 1 220px;
  min-height: var(--pw-touch);
  padding: 0 var(--pw-space-3);
  border: 1px solid var(--pw-border-strong);
  border-radius: var(--pw-radius-md);
}

.pw-dc__proposal {
  margin: var(--pw-space-3) 0;
  font-size: var(--pw-text-sm);
  color: var(--pw-ink-2);
}

.pw-dc__small {
  font-size: var(--pw-text-xs);
}

@media (min-width: 1024px) {
  .pw-dc__grid {
    grid-template-columns: minmax(0, 1fr) 320px;
    align-items: start;
  }
}
</style>
