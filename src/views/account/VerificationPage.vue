<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BadgeCheck, Check, Clock, QrCode, ShieldAlert } from '@lucide/vue'
import AppBreadcrumb from '@/components/common/AppBreadcrumb.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppStepper from '@/components/common/AppStepper.vue'
import AppImage from '@/components/common/AppImage.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import AppInput from '@/components/forms/AppInput.vue'
import AppSelect from '@/components/forms/AppSelect.vue'
import AppRadioCard from '@/components/forms/AppRadioCard.vue'
import AppFileDrop from '@/components/forms/AppFileDrop.vue'
import { verificationService } from '@/api/account.api'
import { mediaService } from '@/api/listings.api'
import { toApiError } from '@/api/errors'
import { useResource } from '@/composables/useResource'
import { useSeo } from '@/composables/useSeo'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { COUNTRIES } from '@/constants/labels'
import { safeRedirect } from '@/utils/security'
import type { KycDocumentType, KycSession } from '@/types/verification'
import type { MediaAsset } from '@/types/media'

/**
 * VB16 — identity verification (KYC). Documents upload to Laravel which forwards to
 * the KYC provider (Smile ID / Onfido); the selfie/liveness step hands off to the
 * phone via a short-lived QR link.
 */
useSeo({ title: 'Verify your identity', noindex: true })
const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const auth = useAuthStore()
const { data: session, state, error, reload, mutate } = useResource((s) => verificationService.kyc(s))

const STEPS = ['Personal details', 'ID document', 'Selfie check', 'Review']
const stepIndex = computed(() => ({ personal_details: 0, id_document: 1, selfie: 2, review: 3 })[session.value?.step ?? 'personal_details'])
const personal = reactive({ legalFirstName: auth.user?.firstName ?? '', legalLastName: auth.user?.lastName ?? '', dateOfBirth: '', nationality: auth.user?.countryCode ?? 'NG' })
const errors = reactive<Record<string, string | undefined>>({})
const docType = ref<KycDocumentType>('passport')
const front = ref<MediaAsset | null>(null)
const back = ref<MediaAsset | null>(null)
const busy = ref(false)

/* Selfie/liveness happens on the phone; the provider webhook advances the session. Poll until it does. */
let poll: ReturnType<typeof setInterval> | null = null
watch(
  () => session.value?.step,
  (step) => {
    if (poll) clearInterval(poll)
    poll = null
    if (step === 'selfie') {
      poll = setInterval(async () => {
        try {
          const s = await verificationService.kyc()
          if (s.step !== 'selfie') mutate(() => s)
        } catch {
          /* keep polling */
        }
      }, 3000)
    }
  },
)
onBeforeUnmount(() => poll && clearInterval(poll))

onMounted(() => {
  if (route.query.reason === 'kyc') ui.info('Verification required', 'Selling, swapping and withdrawals over $500 need a verified identity.')
})

const docOptions = [
  { value: 'passport' as const, label: 'Passport' },
  { value: 'drivers_licence' as const, label: "Driver's licence" },
  { value: 'national_id' as const, label: 'National ID (NIN)' },
  { value: 'pilot_licence' as const, label: 'Pilot licence + ID' },
]

async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
  busy.value = true
  for (const k of Object.keys(errors)) errors[k] = undefined
  try {
    return await fn()
  } catch (e) {
    const err = toApiError(e)
    for (const [k, v] of Object.entries(err.fieldErrors)) errors[k] = v[0]
    if (!Object.keys(err.fieldErrors).length) ui.error('Something went wrong', err.message)
    return undefined
  } finally {
    busy.value = false
  }
}

async function savePersonal() {
  const s = await run(() => verificationService.savePersonal(personal))
  if (s) mutate(() => s)
}

async function upload(files: File[], side: 'front' | 'back') {
  const file = files[0]
  if (!file) return
  const m = await run(() => mediaService.upload(file, 'kyc'))
  if (m) (side === 'front' ? front : back).value = m
}

async function saveDocument() {
  if (!front.value) {
    errors.frontMediaId = 'Upload a photo of your document.'
    return
  }
  const s = await run(() => verificationService.saveDocument({ documentType: docType.value, frontMediaId: front.value!.id, backMediaId: back.value?.id ?? null }))
  if (s) mutate(() => s)
}

async function submit() {
  const s = await run(() => verificationService.submit())
  if (s) {
    mutate(() => s)
    await auth.refresh()
    ui.success('Submitted for review', 'Our compliance team usually reviews within 24 hours.')
  }
}

function back_() {
  const order: KycSession['step'][] = ['personal_details', 'id_document', 'selfie', 'review']
  mutate((s) => (s ? { ...s, step: order[Math.max(0, stepIndex.value - 1)]! } : s))
}

const next = computed(() => safeRedirect(route.query.next, ''))
</script>

<template>
  <div>
    <AppBreadcrumb separator="chevron" :items="[{ label: 'My Hangar', to: { name: 'hangar' } }, { label: 'Verification' }]" />
    <header class="pw-page-head pw-kyc__head">
      <div>
        <h1 class="pw-page-title">Verify your identity</h1>
        <p class="pw-page-sub">Required to sell, swap or withdraw over $500. Takes about 3 minutes. Encrypted and reviewed by our compliance team.</p>
      </div>
    </header>

    <ErrorState v-if="state === 'error'" :error="error" class="pw-card" @retry="reload" />
    <AppSkeleton v-else-if="!session" height="420px" radius="var(--pw-radius-lg)" />

    <div v-else-if="session.status === 'approved'" class="pw-card">
      <AppEmptyState :icon="BadgeCheck" tone="success" title="You're verified" body="Your Verified badge is live on all listings. You can sell without limits and withdraw any amount (2FA applies over $2,000).">
        <AppButton v-if="next" :to="next">Continue</AppButton>
        <AppButton v-else :to="{ name: 'hangar-aviator' }" variant="secondary">Add aviator credentials</AppButton>
      </AppEmptyState>
    </div>

    <div v-else-if="session.status === 'pending' && session.step === 'review' && session.submittedAt" class="pw-card">
      <AppEmptyState :icon="Clock" tone="warning" title="Under review" body="We received your documents. Reviews usually take under 24 hours — we'll email you when you're cleared." />
    </div>

    <div v-else class="pw-kyc__grid">
      <div class="pw-stack">
        <div class="pw-card pw-kyc__stepper"><AppStepper :steps="STEPS" :current="stepIndex" /></div>

        <div v-if="session.status === 'rejected'" class="pw-kyc__rejected" role="alert"><ShieldAlert :size="18" aria-hidden="true" /> {{ session.rejectionReason ?? 'Your last submission was rejected. Please try again with a clearer photo.' }}</div>

        <section v-if="session.step === 'personal_details'" class="pw-card pw-card-pad pw-stack" aria-labelledby="k1">
          <h2 id="k1" class="pw-card-title">Personal details</h2>
          <p class="pw-muted pw-kyc__small">Enter your name exactly as it appears on your ID.</p>
          <div class="pw-kyc__row">
            <AppInput v-model="personal.legalFirstName" label="Legal first name" autocomplete="given-name" :error="errors.legalFirstName" />
            <AppInput v-model="personal.legalLastName" label="Legal last name" autocomplete="family-name" :error="errors.legalLastName" />
          </div>
          <div class="pw-kyc__row">
            <AppInput v-model="personal.dateOfBirth" label="Date of birth" type="date" autocomplete="bday" :error="errors.dateOfBirth" />
            <AppSelect v-model="personal.nationality" label="Nationality" :options="COUNTRIES.map((c) => ({ value: c.code, label: c.name }))" :error="errors.nationality" />
          </div>
          <div class="pw-kyc__actions"><AppButton :loading="busy" @click="savePersonal">Continue to ID document</AppButton></div>
        </section>

        <section v-else-if="session.step === 'id_document'" class="pw-card pw-card-pad pw-stack" aria-labelledby="k2">
          <AppRadioCard v-model="docType" :options="docOptions" legend="Choose your document" :columns="4" />
          <div class="pw-kyc__docs">
            <div class="pw-kyc__doc">
              <AppImage v-if="front" :media="front" ratio="1.58" fit="cover" sizes="320px" rounded />
              <AppFileDrop v-else :label="docType === 'passport' ? 'Photo page' : 'Front of document'" hint="Drag a photo or scan here, or browse files · JPG, PNG, PDF" accept="image/jpeg,image/png,image/webp,image/heic" @files="upload($event, 'front')" />
              <ul v-if="front" class="pw-kyc__checks" role="list">
                <li><Check :size="14" aria-hidden="true" /> All four corners visible</li>
                <li><Check :size="14" aria-hidden="true" /> No glare or blur</li>
                <li><Check :size="14" aria-hidden="true" /> Not expired</li>
              </ul>
              <p v-if="errors.frontMediaId" class="pw-kyc__err" role="alert">{{ errors.frontMediaId }}</p>
            </div>
            <div class="pw-kyc__doc">
              <AppImage v-if="back" :media="back" ratio="1.58" fit="cover" sizes="320px" rounded />
              <AppFileDrop v-else :label="docType === 'passport' ? 'Signature page (optional)' : 'Back of document'" hint="Drag a photo or scan here, or browse files" accept="image/jpeg,image/png,image/webp,image/heic" @files="upload($event, 'back')" />
            </div>
          </div>
          <div class="pw-kyc__actions">
            <AppButton variant="secondary" @click="back_">Back</AppButton>
            <AppButton :loading="busy" @click="saveDocument">Continue to selfie check</AppButton>
          </div>
        </section>

        <section v-else-if="session.step === 'selfie'" class="pw-card pw-card-pad pw-stack" aria-labelledby="k3">
          <h2 id="k3" class="pw-card-title">Selfie check</h2>
          <p class="pw-muted">Use your phone camera for a quick liveness check. Scan the QR code on the right, or open <span class="pw-mono">{{ session.handoffUrl }}</span> on your phone. This page updates when you're done.</p>
          <div class="pw-kyc__actions">
            <AppButton variant="secondary" @click="back_">Back</AppButton>
            <AppButton variant="ghost" :loading="busy" @click="reload">Check status</AppButton>
          </div>
        </section>

        <section v-else class="pw-card pw-card-pad pw-stack" aria-labelledby="k4">
          <h2 id="k4" class="pw-card-title">Review &amp; submit</h2>
          <dl class="pw-dl">
            <dt>Name</dt><dd>{{ session.personal?.legalFirstName ?? personal.legalFirstName }} {{ session.personal?.legalLastName ?? personal.legalLastName }}</dd>
            <dt>Document</dt><dd>{{ docOptions.find((d) => d.value === (session?.documentType ?? docType))?.label }}</dd>
            <dt>Selfie</dt><dd>Completed on phone</dd>
          </dl>
          <div class="pw-kyc__actions">
            <AppButton variant="secondary" @click="back_">Back</AppButton>
            <AppButton :loading="busy" @click="submit">Submit for review</AppButton>
          </div>
        </section>
      </div>

      <aside class="pw-stack">
        <div class="pw-kyc__phone">
          <p class="pw-kyc__phone-title">Use your phone for the selfie</p>
          <p class="pw-kyc__phone-sub">Scan with your phone camera. You'll continue in the app and this page updates when you're done.</p>
          <div class="pw-kyc__qr" role="img" :aria-label="`QR code linking to ${session.handoffUrl}`"><QrCode :size="120" :stroke-width="1" /></div>
          <p class="pw-kyc__waiting" role="status"><span aria-hidden="true" /> {{ session.step === 'selfie' ? 'Waiting for phone…' : session.step === 'review' ? 'Selfie received' : 'Available at the selfie step' }}</p>
        </div>
        <div class="pw-card pw-card-pad">
          <h2 class="pw-card-title">Why we verify</h2>
          <ul class="pw-kyc__why" role="list">
            <li>Unlocks the gold Verified badge and unlimited listings</li>
            <li>Required by our payment partners for escrow payouts</li>
            <li>Documents are deleted 90 days after approval</li>
          </ul>
        </div>
      </aside>
    </div>
    <p v-if="next && session?.status !== 'approved'" class="pw-muted pw-kyc__back">After verification you'll return to <button type="button" class="pw-link-btn" @click="router.push(next)">where you left off</button>.</p>
  </div>
</template>

<style scoped>
.pw-kyc__head {
  margin-top: var(--pw-space-5);
}

.pw-kyc__grid {
  display: grid;
  gap: var(--pw-space-5);
}

.pw-kyc__stepper {
  padding: var(--pw-space-4) var(--pw-space-5);
}

.pw-kyc__rejected {
  display: flex;
  gap: var(--pw-space-2);
  padding: var(--pw-space-4);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-danger-100);
  color: var(--pw-danger-700);
}

.pw-kyc__row,
.pw-kyc__docs {
  display: grid;
  gap: var(--pw-space-4);
}

.pw-kyc__small {
  font-size: var(--pw-text-sm);
}

.pw-kyc__checks {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pw-space-3);
  margin-top: var(--pw-space-2);
  font-size: var(--pw-text-xs);
  color: var(--pw-success-600);
}

.pw-kyc__checks li {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pw-kyc__err {
  margin-top: var(--pw-space-2);
  color: var(--pw-danger-600);
  font-size: var(--pw-text-sm);
}

.pw-kyc__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--pw-space-3);
}

.pw-kyc__phone {
  padding: var(--pw-space-5);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-navy-900);
  color: rgb(255 255 255 / 82%);
  text-align: center;
}

.pw-kyc__phone-title {
  font-weight: var(--pw-weight-semibold);
  color: #fff;
  text-align: left;
}

.pw-kyc__phone-sub {
  margin: var(--pw-space-2) 0 var(--pw-space-4);
  font-size: var(--pw-text-xs);
  text-align: left;
}

.pw-kyc__qr {
  display: grid;
  place-items: center;
  width: 160px;
  height: 160px;
  margin: 0 auto;
  border-radius: var(--pw-radius-md);
  background: #fff;
  color: var(--pw-navy-900);
}

.pw-kyc__waiting {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--pw-space-2);
  margin-top: var(--pw-space-3);
  font-size: var(--pw-text-xs);
  color: #fff;
}

.pw-kyc__waiting span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--pw-gold-500);
  animation: pw-pulse 1.4s ease-in-out infinite;
}

@keyframes pw-pulse {
  50% {
    opacity: 0.3;
  }
}

.pw-kyc__why {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-2);
  margin-top: var(--pw-space-3);
  font-size: var(--pw-text-sm);
  color: var(--pw-ink-2);
}

.pw-kyc__back {
  margin-top: var(--pw-space-4);
  font-size: var(--pw-text-sm);
}

@media (min-width: 768px) {
  .pw-kyc__row,
  .pw-kyc__docs {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1024px) {
  .pw-kyc__grid {
    grid-template-columns: minmax(0, 1fr) 300px;
    align-items: start;
  }
}
</style>
