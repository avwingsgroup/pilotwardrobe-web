<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Check, CircleAlert, FileText, ShieldCheck } from '@lucide/vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import AppTabs from '@/components/common/AppTabs.vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppImage from '@/components/common/AppImage.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import AppSelect from '@/components/forms/AppSelect.vue'
import { adminService } from '@/api/admin.api'
import { toApiError } from '@/api/errors'
import { useResource } from '@/composables/useResource'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { formatDateTime } from '@/utils/date'

/** AD5 — KYC review queue. Keyboard: A approve · R reject · J/K next/prev. 24h SLA. */
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()
const tab = ref<'pending' | 'escalated' | 'done'>('pending')
const reason = ref('')
const busy = ref<string | null>(null)

const { data: queue, state, error, reload } = useResource((s) => adminService.kycQueue({ tab: tab.value }, s), { watch: [tab] })
const selectedId = computed(() => (route.params.id ? String(route.params.id) : (queue.value?.data[0]?.id ?? null)))
const { data: kase, state: caseState } = useResource((s) => (selectedId.value ? adminService.kycCase(selectedId.value, s) : Promise.resolve(null)), { watch: [selectedId] })
watch(selectedId, () => (reason.value = ''))

const rows = computed(() => queue.value?.data ?? [])
const index = computed(() => rows.value.findIndex((r) => r.id === selectedId.value))
const canReview = computed(() => auth.can('kyc.review'))

function go(delta: number) {
  const next = rows.value[index.value + delta]
  if (next) void router.replace({ name: 'admin-kyc', params: { id: next.id } })
}

async function decide(decision: 'approve' | 'reject' | 'escalate' | 'request_info') {
  if (!selectedId.value || !canReview.value) return
  if (decision === 'reject' && !reason.value) {
    ui.error('Choose a rejection reason', 'The applicant sees this reason.')
    return
  }
  busy.value = decision
  try {
    await adminService.kycDecision(selectedId.value, decision, reason.value || undefined)
    ui.success({ approve: 'Approved — badge granted', reject: 'Rejected', escalate: 'Escalated', request_info: 'More info requested' }[decision])
    const nextId = rows.value[index.value + 1]?.id
    await reload()
    if (nextId) void router.replace({ name: 'admin-kyc', params: { id: nextId } })
  } catch (e) {
    ui.error('Decision failed', toApiError(e).message)
  } finally {
    busy.value = null
  }
}

function onKey(e: KeyboardEvent) {
  const target = e.target as HTMLElement
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || e.metaKey || e.ctrlKey) return
  const k = e.key.toLowerCase()
  if (k === 'j') go(1)
  else if (k === 'k') go(-1)
  else if (k === 'a') void decide('approve')
  else if (k === 'r') void decide('reject')
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div>
    <AdminPageHeader title="KYC review" subtitle="24h SLA · documents are deleted 90 days after approval" />
    <ErrorState v-if="state === 'error'" :error="error" class="pw-card" @retry="reload" />
    <div v-else class="pw-kr">
      <aside class="pw-card pw-kr__queue" aria-label="Queue">
        <div class="pw-kr__qhead">
          <p class="pw-row"><strong>Queue · {{ queue?.meta.counts?.pending ?? '…' }}</strong><AppBadge v-if="queue?.meta.counts?.overSla" tone="danger">{{ queue.meta.counts.overSla }} over SLA</AppBadge></p>
          <AppTabs v-model="tab" variant="pills" label="Queue status" :items="[{ value: 'pending', label: 'Pending' }, { value: 'escalated', label: 'Escalated' }, { value: 'done', label: 'Done' }]" />
        </div>
        <AppSkeleton v-if="state === 'loading'" :lines="5" height="44px" class="pw-kr__pad" />
        <AppEmptyState v-else-if="!rows.length" :icon="ShieldCheck" title="Queue clear" compact />
        <ul v-else role="list">
          <li v-for="r in rows" :key="r.id">
            <RouterLink :to="{ name: 'admin-kyc', params: { id: r.id } }" class="pw-kr__row" :class="{ 'is-active': r.id === selectedId }">
              <AppAvatar :name="r.displayName" :initials="r.initials" :size="32" />
              <span class="pw-kr__row-text"><strong>{{ r.displayName }}</strong><small>{{ r.documentLabel }}</small></span>
              <span class="pw-kr__age" :class="{ 'is-over': r.overSla }">{{ r.ageHours }}h</span>
            </RouterLink>
          </li>
        </ul>
      </aside>

      <section class="pw-kr__case" aria-label="Case">
        <AppSkeleton v-if="caseState === 'loading' || (!kase && rows.length)" height="480px" radius="var(--pw-radius-lg)" />
        <template v-else-if="kase">
          <div class="pw-kr__case-head">
            <div>
              <h2 class="pw-kr__name">{{ kase.displayName }} <AppBadge tone="warning">{{ kase.status }} · {{ kase.ageHours }}h</AppBadge></h2>
              <p class="pw-muted pw-kr__small">{{ kase.code }} · {{ kase.userId }} · submitted {{ formatDateTime(kase.submittedAt) }} · auto-checks passed {{ kase.autoChecksPassed }} of {{ kase.autoChecksTotal }}</p>
            </div>
            <div class="pw-row">
              <AppButton variant="secondary" size="sm" :disabled="!canReview" :loading="busy === 'escalate'" @click="decide('escalate')">Escalate</AppButton>
              <AppButton variant="secondary" size="sm" :disabled="!canReview" :loading="busy === 'request_info'" @click="decide('request_info')">Request more info</AppButton>
            </div>
          </div>

          <div class="pw-kr__docs">
            <figure class="pw-card pw-card-pad">
              <figcaption class="pw-eyebrow">{{ kase.documentLabel }} · data page</figcaption>
              <AppImage v-if="kase.document" :media="kase.document" fit="contain" sizes="600px" class="pw-kr__doc-img" />
              <div v-else class="pw-kr__doc" role="img" :aria-label="`${kase.documentLabel} preview unavailable`"><FileText :size="40" aria-hidden="true" /><span>Document preview unavailable — images are served via short-lived signed URLs.</span></div>
            </figure>
            <figure class="pw-card pw-card-pad">
              <figcaption class="pw-eyebrow">Selfie · liveness</figcaption>
              <div class="pw-kr__selfie"><AppAvatar :name="kase.displayName" :initials="kase.initials" :size="96" tone="soft" /></div>
            </figure>
          </div>

          <div class="pw-kr__checks">
            <section class="pw-card pw-card-pad" aria-labelledby="ext">
              <h3 id="ext" class="pw-card-title">Extracted vs. profile</h3>
              <table class="pw-kr__table">
                <tbody>
                  <tr v-for="f in kase.extracted" :key="f.field">
                    <th scope="row">{{ f.field }}</th>
                    <td class="pw-mono">{{ f.document }}</td>
                    <td>{{ f.profile }}</td>
                    <td>
                      <Check v-if="f.match === true" :size="16" class="is-ok" aria-label="Match" />
                      <AppBadge v-else-if="f.match === 'warn'" tone="warning">Check</AppBadge>
                      <CircleAlert v-else :size="16" class="is-bad" aria-label="Mismatch" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>
            <section class="pw-card pw-card-pad" aria-labelledby="auto">
              <h3 id="auto" class="pw-card-title">Automated checks</h3>
              <ul class="pw-kr__auto" role="list">
                <li v-for="c in kase.automatedChecks" :key="c.label">
                  <span class="pw-kr__dot" :class="c.passed === true ? 'is-ok' : c.passed === 'warn' ? 'is-warn' : 'is-bad'" aria-hidden="true" />
                  <span>{{ c.label }}</span>
                  <span class="pw-muted">{{ c.result }}</span>
                </li>
              </ul>
            </section>
          </div>

          <div class="pw-card pw-card-pad pw-kr__decide">
            <AppSelect
              v-model="reason"
              label="Rejection reason (if rejecting)"
              sr-only-label
              placeholder="Rejection reason (if rejecting)…"
              :options="[
                { value: 'blurry', label: 'Photo blurry or glare' },
                { value: 'expired', label: 'Document expired' },
                { value: 'mismatch', label: 'Name or DOB does not match' },
                { value: 'selfie_failed', label: 'Selfie / liveness failed' },
                { value: 'sanctions', label: 'Sanctions / PEP match' },
              ]"
            />
            <AppButton variant="danger-outline" :disabled="!canReview" :loading="busy === 'reject'" @click="decide('reject')">Reject</AppButton>
            <AppButton variant="success" :disabled="!canReview" :loading="busy === 'approve'" @click="decide('approve')"><template #icon><Check :size="16" /></template>Approve &amp; grant badge</AppButton>
            <p class="pw-kr__keys" aria-hidden="true"><kbd>A</kbd> approve · <kbd>R</kbd> reject · <kbd>J</kbd>/<kbd>K</kbd> next/prev</p>
          </div>
        </template>
      </section>
    </div>
  </div>
</template>

<style scoped>
.pw-kr {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-4);
}

.pw-kr__queue {
  align-self: start;
  overflow: hidden;
}

.pw-kr__qhead {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-3);
  padding: var(--pw-space-4);
  border-bottom: 1px solid var(--pw-border);
}

.pw-kr__pad {
  padding: var(--pw-space-4);
}

.pw-kr__row {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  padding: var(--pw-space-3) var(--pw-space-4);
  border-left: 3px solid transparent;
  border-bottom: 1px solid var(--pw-border);
  color: var(--pw-ink);
}

.pw-kr__row:hover {
  text-decoration: none;
  background: var(--pw-surface-sunken);
}

.pw-kr__row.is-active {
  border-left-color: var(--pw-navy-700);
  background: var(--pw-navy-50);
}

.pw-kr__row-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  font-size: var(--pw-text-sm);
}

.pw-kr__row-text small {
  font-size: var(--pw-text-2xs);
  color: var(--pw-muted);
}

.pw-kr__age {
  font-size: var(--pw-text-xs);
  font-weight: var(--pw-weight-semibold);
  color: var(--pw-muted);
}

.pw-kr__age.is-over {
  color: var(--pw-danger-600);
}

.pw-kr__case {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-4);
  min-width: 0;
}

.pw-kr__case-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--pw-space-3);
}

.pw-kr__name {
  display: flex;
  align-items: center;
  gap: var(--pw-space-2);
  font-size: var(--pw-text-xl);
}

.pw-kr__small {
  font-size: var(--pw-text-xs);
}

.pw-kr__docs,
.pw-kr__checks {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-4);
}

.pw-kr__docs figure {
  margin: 0;
}

.pw-kr__doc,
.pw-kr__selfie {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--pw-space-2);
  min-height: 200px;
  margin-top: var(--pw-space-3);
  border-radius: var(--pw-radius-md);
  background: linear-gradient(135deg, #eef2f9, #e2e8f2);
  color: var(--pw-navy-700);
  font-size: var(--pw-text-xs);
  text-align: center;
  padding: var(--pw-space-4);
}

.pw-kr__table {
  width: 100%;
  table-layout: fixed;
  overflow-wrap: anywhere;
  margin-top: var(--pw-space-3);
  font-size: var(--pw-text-sm);
}

.pw-kr__table th,
.pw-kr__table td {
  padding: var(--pw-space-2);
  border-bottom: 1px solid var(--pw-border);
  text-align: left;
}

.pw-kr__table th {
  font-weight: var(--pw-weight-regular);
  color: var(--pw-muted);
}

.is-ok {
  color: var(--pw-success-600);
}

.is-bad {
  color: var(--pw-danger-600);
}

.pw-kr__auto li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--pw-space-3);
  padding: var(--pw-space-2) 0;
  font-size: var(--pw-text-sm);
}

.pw-kr__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.pw-kr__dot.is-ok {
  background: var(--pw-success-600);
}
.pw-kr__dot.is-warn {
  background: var(--pw-gold-500);
}
.pw-kr__dot.is-bad {
  background: var(--pw-danger-600);
}

.pw-kr__decide {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--pw-space-3);
}

.pw-kr__decide > :first-child {
  flex: 1 1 240px;
}

.pw-kr__keys {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-kr__keys kbd {
  padding: 1px 5px;
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-xs);
  font-family: var(--pw-font-body);
}

@media (min-width: 768px) {
  .pw-kr__docs {
    grid-template-columns: 2fr 1fr;
  }
  .pw-kr__checks {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1100px) {
  .pw-kr {
    grid-template-columns: 280px minmax(0, 1fr);
  }
}
</style>
