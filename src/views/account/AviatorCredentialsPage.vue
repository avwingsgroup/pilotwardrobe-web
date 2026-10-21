<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { BadgeCheck, Clock, Plane, X } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import AppInput from '@/components/forms/AppInput.vue'
import AppSelect from '@/components/forms/AppSelect.vue'
import AppFileDrop from '@/components/forms/AppFileDrop.vue'
import { verificationService } from '@/api/account.api'
import { mediaService } from '@/api/listings.api'
import { toApiError } from '@/api/errors'
import { useResource } from '@/composables/useResource'
import { useSeo } from '@/composables/useSeo'
import { useAuthStore } from '@/stores/auth.store'
import { useUiStore } from '@/stores/ui.store'
import { KYC_STATUS } from '@/constants/labels'
import { formatShortDate } from '@/utils/date'
import type { AviatorCredentials } from '@/types/user'

/**
 * Aviator credentials (derived from VB16 language). Licence-holders verify a licence
 * for the Aviator badge. Elevated capabilities are granted by the backend via
 * permissions — this page never assumes privileges from the badge alone.
 */
useSeo({ title: 'Aviator credentials', noindex: true })
const auth = useAuthStore()
const ui = useUiStore()
const { data: creds, state, error, reload, mutate } = useResource((s) => verificationService.aviator(s))
const editing = ref(false)
const busy = ref(false)
const errors = reactive<Record<string, string | undefined>>({})
const licenceFile = ref<string | null>(null)
const ratingInput = ref('')
const form = reactive({ licenceType: 'cpl' as AviatorCredentials['licenceType'], licenceNumber: '', issuingAuthority: 'NCAA (Nigeria)', jobTitle: '', organisation: '', typeRatings: [] as string[] })

const showForm = computed(() => editing.value || (state.value === 'success' && !creds.value))
const LICENCES = [
  { value: 'ppl', label: 'PPL — Private pilot' },
  { value: 'cpl', label: 'CPL — Commercial pilot' },
  { value: 'atpl', label: 'ATPL — Airline transport pilot' },
  { value: 'mpl', label: 'MPL — Multi-crew pilot' },
  { value: 'amel', label: 'AME — Aircraft maintenance engineer' },
  { value: 'cabin_crew', label: 'Cabin crew attestation' },
  { value: 'atc', label: 'Air traffic controller' },
  { value: 'other', label: 'Other aviation credential' },
]

function addRating() {
  const r = ratingInput.value.trim().toUpperCase()
  if (r && !form.typeRatings.includes(r)) form.typeRatings.push(r)
  ratingInput.value = ''
}

async function upload(files: File[]) {
  if (!files[0]) return
  try {
    licenceFile.value = (await mediaService.upload(files[0], 'kyc')).id
  } catch (e) {
    errors.licenceMediaId = toApiError(e).message
  }
}

async function submit() {
  busy.value = true
  for (const k of Object.keys(errors)) errors[k] = undefined
  try {
    const result = await verificationService.applyAviator({ ...form, licenceMediaId: licenceFile.value ?? '' })
    mutate(() => result)
    editing.value = false
    ui.success('Application received', 'Credential checks usually take 1–2 business days.')
  } catch (e) {
    const err = toApiError(e)
    for (const [k, v] of Object.entries(err.fieldErrors)) errors[k] = v[0]
    if (err.code === 'KYC_REQUIRED' || !Object.keys(err.fieldErrors).length) ui.error("Couldn't submit", err.message)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div>
    <header class="pw-page-head">
      <div>
        <h1 class="pw-page-title">Aviator credentials</h1>
        <p class="pw-page-sub">Verify your licence to earn the Aviator badge and access aviation-specific seller tools.</p>
      </div>
    </header>

    <ErrorState v-if="state === 'error'" :error="error" class="pw-card" @retry="reload" />
    <AppSkeleton v-else-if="state === 'loading'" height="260px" radius="var(--pw-radius-lg)" />

    <div v-else-if="!auth.kycApproved" class="pw-card">
      <AppEmptyState :icon="Clock" tone="warning" title="Verify your identity first" body="Aviator credentials are checked against your verified identity.">
        <AppButton :to="{ name: 'hangar-verification' }">Verify identity</AppButton>
      </AppEmptyState>
    </div>

    <section v-else-if="creds && !editing" class="pw-card pw-card-pad pw-av" aria-labelledby="av-title">
      <div class="pw-between">
        <h2 id="av-title" class="pw-card-title pw-row"><Plane :size="18" aria-hidden="true" /> {{ LICENCES.find((l) => l.value === creds!.licenceType)?.label }}</h2>
        <StatusBadge :status="KYC_STATUS[creds.status]" />
      </div>
      <dl class="pw-dl pw-av__dl">
        <dt>Licence</dt><dd class="pw-mono">{{ creds.licenceNumberMasked }}</dd>
        <dt>Issued by</dt><dd>{{ creds.issuingAuthority }}</dd>
        <template v-if="creds.jobTitle"><dt>Role</dt><dd>{{ creds.jobTitle }}<template v-if="creds.organisation"> · {{ creds.organisation }}</template></dd></template>
        <dt>Type ratings</dt>
        <dd><span class="pw-av__ratings"><AppBadge v-for="r in creds.typeRatings" :key="r" tone="navy">{{ r }}</AppBadge></span></dd>
        <template v-if="creds.verifiedAt"><dt>Verified</dt><dd>{{ formatShortDate(creds.verifiedAt) }}</dd></template>
      </dl>
      <p v-if="creds.status === 'approved'" class="pw-av__ok"><BadgeCheck :size="16" aria-hidden="true" /> Your Aviator badge shows on your profile and listings.</p>
      <AppButton variant="secondary" @click="editing = true">Update credentials</AppButton>
    </section>

    <form v-else-if="showForm" class="pw-card pw-card-pad pw-stack" novalidate @submit.prevent="submit">
      <div class="pw-av__row">
        <AppSelect v-model="form.licenceType" label="Licence type" :options="LICENCES" />
        <AppInput v-model="form.licenceNumber" label="Licence number" autocomplete="off" :error="errors.licenceNumber" hint="Stored encrypted; shown masked." />
      </div>
      <div class="pw-av__row">
        <AppInput v-model="form.issuingAuthority" label="Issuing authority" :error="errors.issuingAuthority" />
        <AppInput v-model="form.jobTitle" label="Job title (optional)" placeholder="First Officer" />
      </div>
      <AppInput v-model="form.organisation" label="Airline / organisation (optional)" />
      <div>
        <label for="ratings" class="pw-av__label">Type ratings</label>
        <div class="pw-av__ratings">
          <span v-for="r in form.typeRatings" :key="r" class="pw-av__chip">{{ r }} <button type="button" :aria-label="`Remove ${r}`" @click="form.typeRatings = form.typeRatings.filter((x) => x !== r)"><X :size="12" /></button></span>
          <input id="ratings" v-model="ratingInput" class="pw-av__chip-input" placeholder="e.g. B737" @keydown.enter.prevent="addRating" @blur="addRating" />
        </div>
      </div>
      <AppFileDrop :label="licenceFile ? 'Licence uploaded — replace' : 'Upload a photo of your licence'" hint="JPG or PNG · we check it against the issuing authority" @files="upload" />
      <p v-if="errors.licenceMediaId" class="pw-av__err" role="alert">{{ errors.licenceMediaId }}</p>
      <div class="pw-row pw-av__actions">
        <AppButton v-if="creds" variant="secondary" @click="editing = false">Cancel</AppButton>
        <AppButton type="submit" :loading="busy">Submit for verification</AppButton>
      </div>
    </form>
  </div>
</template>

<style scoped>
.pw-av__dl {
  margin: var(--pw-space-4) 0;
}

.pw-av__ratings {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px;
}

.pw-av__ok {
  display: flex;
  align-items: center;
  gap: var(--pw-space-2);
  margin-bottom: var(--pw-space-4);
  color: var(--pw-success-600);
  font-size: var(--pw-text-sm);
}

.pw-av__row {
  display: grid;
  gap: var(--pw-space-4);
}

.pw-av__label {
  display: block;
  margin-bottom: var(--pw-space-2);
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-medium);
}

form .pw-av__ratings {
  justify-content: flex-start;
}

.pw-av__chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 30px;
  padding: 0 4px 0 10px;
  border-radius: var(--pw-radius-full);
  background: var(--pw-navy-700);
  color: #fff;
  font-size: var(--pw-text-xs);
  font-weight: var(--pw-weight-semibold);
}

.pw-av__chip button {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: 50%;
  background: none;
  color: #fff;
}

.pw-av__chip-input {
  height: 30px;
  width: 140px;
  padding: 0 10px;
  border: 1px solid var(--pw-border-strong);
  border-radius: var(--pw-radius-full);
}

.pw-av__err {
  color: var(--pw-danger-600);
  font-size: var(--pw-text-sm);
}

.pw-av__actions {
  justify-content: flex-end;
}

@media (min-width: 768px) {
  .pw-av__row {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
