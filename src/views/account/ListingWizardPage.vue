<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { refDebounced } from '@vueuse/core'
import { ArrowLeftRight, Check, ShieldCheck, Sparkles, X } from '@lucide/vue'
import AppBreadcrumb from '@/components/common/AppBreadcrumb.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppStepper from '@/components/common/AppStepper.vue'
import AppImage from '@/components/common/AppImage.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import AppInput from '@/components/forms/AppInput.vue'
import AppSelect from '@/components/forms/AppSelect.vue'
import AppTextarea from '@/components/forms/AppTextarea.vue'
import AppToggle from '@/components/forms/AppToggle.vue'
import AppCheckbox from '@/components/forms/AppCheckbox.vue'
import AppRadioCard from '@/components/forms/AppRadioCard.vue'
import AppMoneyInput from '@/components/forms/AppMoneyInput.vue'
import PhotoManager from '@/components/dashboard/PhotoManager.vue'
import { listingService } from '@/api/listings.api'
import { productService } from '@/api/products.api'
import { ApiError, toApiError } from '@/api/errors'
import { useSeo } from '@/composables/useSeo'
import { useUiStore } from '@/stores/ui.store'
import { useAuthStore } from '@/stores/auth.store'
import { CONDITION_LABELS } from '@/constants/labels'
import { formatMoney } from '@/utils/money'
import { track } from '@/utils/analytics'
import type { BoostPackage, BoostPackageCode, Category, FeeQuote, ListingDraft, PriceCheck, ProductCondition } from '@/types/product'
import type { MediaAsset } from '@/types/media'

/** VB1 → VB2 → VB3. Six logical steps across three screens, matching the designs. */
const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const auth = useAuthStore()
const editingId = computed(() => (route.params.id ? String(route.params.id) : null))
useSeo({ title: editingId.value ? 'Edit listing' : 'List an item', noindex: true })

const STEPS = ['Photos', 'Details', 'Condition', 'Pricing', 'Freight', 'Review']
const screen = ref<0 | 1 | 2>(0)
const loadState = ref<'loading' | 'ready' | 'error'>(editingId.value ? 'loading' : 'ready')
const loadError = ref<ApiError | null>(null)
const draftId = ref<string | null>(editingId.value)
const savedAt = ref<number | null>(null)
const saving = ref(false)
const publishing = ref(false)
const dirty = ref(false)
const errors = reactive<Record<string, string | undefined>>({})
const photos = ref<MediaAsset[]>([])
const categories = ref<Category[]>([])
const boosts = ref<BoostPackage[]>([])
const priceCheck = ref<PriceCheck | null>(null)
const fee = ref<FeeQuote | null>(null)
const tagInput = ref('')
const now = ref(Date.now())

const draft = reactive<ListingDraft>({
  title: '',
  description: '',
  categoryId: '',
  brand: '',
  model: '',
  attributes: { plugType: '' },
  serialNumber: '',
  yearPurchased: '',
  tags: [],
  condition: '',
  format: 'physical',
  price: { amount: 0, currency: 'USD' },
  negotiable: true,
  minimumOffer: { amount: 0, currency: 'USD' },
  autoDeclineBelowMinimum: false,
  swappable: false,
  aircraftTypes: [],
  mediaIds: [],
  location: { countryCode: auth.user?.countryCode ?? 'NG', state: 'Lagos', city: 'Ikeja', airportCode: 'LOS' },
  shipping: { method: 'pilotwardrobe_freight', pickup: false, domestic: true, international: false, shipsFrom: 'LOS', parcelSize: 'medium', weightKg: null, payer: 'buyer', price: null },
  boost: 'none',
  attestations: { ownsItem: false, notCounterfeit: false, dispatchCommitment: false },
})

const flatCats = computed(() => categories.value.flatMap((c) => [c, ...(c.children ?? [])]))
const categoryOptions = computed(() => flatCats.value.map((c) => ({ value: c.id, label: c.parentId ? `— ${c.name}` : c.name })))
const isHeadset = computed(() => {
  const c = flatCats.value.find((x) => x.id === draft.categoryId)
  return !!c && (c.id === 'cat_headsets' || c.parentId === 'cat_headsets')
})
const stepIndex = computed(() => (screen.value === 0 ? (photos.value.length ? 1 : 0) : screen.value === 1 ? 3 : 5))
const savedLabel = computed(() => (savedAt.value ? `Draft autosaved ${Math.max(1, Math.round((now.value - savedAt.value) / 1000))}s ago` : 'Not saved yet'))
const minOffer = computed({
  get: () => draft.minimumOffer?.amount ?? 0,
  set: (v: number) => (draft.minimumOffer = { amount: v, currency: draft.price.currency }),
})

const conditionOptions = (['new', 'like_new', 'good', 'fair'] as ProductCondition[]).map((c) => ({ value: c, label: CONDITION_LABELS[c].label, hint: CONDITION_LABELS[c].hint }))
const freightOptions = [
  { value: 'pilotwardrobe_freight' as const, label: 'Pilotwardrobe Freight', hint: 'Prepaid label · tracked · insured to $1,000', extra: 'From $14' },
  { value: 'self_ship' as const, label: 'Ship it yourself', hint: 'Upload tracking within 3 days', extra: 'Set price' },
  { value: 'airfield_handoff' as const, label: 'Hand-off at airfield', hint: 'Meet at a listed airport · escrow still applies', extra: 'Free' },
]

/* ── Load ─────────────────────────────────────────────────────────── */
onMounted(async () => {
  const timer = setInterval(() => (now.value = Date.now()), 1000)
  onBeforeUnmount(() => clearInterval(timer))
  try {
    const [cats, packs] = await Promise.all([productService.categories(), productService.boostPackages()])
    categories.value = cats
    boosts.value = packs
  } catch {
    /* non-blocking */
  }
  if (!editingId.value) return
  try {
    const l = await listingService.get(editingId.value)
    Object.assign(draft, {
      title: l.title,
      description: l.description,
      categoryId: l.category.id,
      brand: l.brand ?? '',
      model: l.model ?? '',
      condition: l.condition,
      price: l.price,
      negotiable: l.negotiable,
      minimumOffer: l.minimumOffer ?? { amount: 0, currency: l.price.currency },
      swappable: l.swappable,
      tags: l.tags ?? [],
      aircraftTypes: l.aircraftTypes ?? [],
    })
    photos.value = l.images
    savedAt.value = Date.parse(l.updatedAt)
    loadState.value = 'ready'
    dirty.value = false
  } catch (e) {
    loadError.value = toApiError(e)
    loadState.value = 'error'
  }
})

watch(photos, (p) => {
  draft.mediaIds = p.map((m) => m.id)
  dirty.value = true
})
watch(draft, () => (dirty.value = true), { deep: true })

/* ── Pricing helpers (debounced, cancellable) ─────────────────────── */
const debouncedPrice = refDebounced(computed(() => draft.price.amount), 500)
watch([debouncedPrice, () => draft.condition, () => draft.categoryId], async ([amount]) => {
  if (screen.value !== 1 && screen.value !== 2) return
  try {
    if (amount > 0) fee.value = await listingService.feeQuote(draft.price)
    if (draft.categoryId) priceCheck.value = await listingService.priceCheck({ categoryId: draft.categoryId, brand: draft.brand, model: draft.model, condition: draft.condition || undefined, currency: draft.price.currency })
  } catch {
    /* advisory only */
  }
})

/* ── Autosave every 20s when dirty ────────────────────────────────── */
const autosave = setInterval(() => {
  if (dirty.value && !saving.value && !publishing.value && draft.title.trim()) void save(true)
}, 20_000)
onBeforeUnmount(() => clearInterval(autosave))

onBeforeRouteLeave(() => {
  if (dirty.value && !publishing.value && (draft.title || photos.value.length)) {
    return window.confirm('Leave without saving? Your latest changes will be lost.')
  }
  return true
})

function applyErrors(err: ApiError) {
  for (const key of Object.keys(errors)) errors[key] = undefined
  for (const [k, msgs] of Object.entries(err.fieldErrors)) errors[k] = msgs[0]
}

async function save(silent = false) {
  saving.value = true
  try {
    const l = draftId.value ? await listingService.update(draftId.value, draft) : await listingService.createDraft(draft)
    draftId.value = l.id
    savedAt.value = Date.now()
    dirty.value = false
    if (!silent) ui.success('Draft saved')
    if (!editingId.value) void router.replace({ name: 'listing-edit', params: { id: l.id } })
  } catch (e) {
    if (!silent) ui.error("Couldn't save draft", toApiError(e).message)
  } finally {
    saving.value = false
  }
}

/* ── Step validation (mirrors server rules) ───────────────────────── */
function validateScreen(): boolean {
  for (const key of Object.keys(errors)) errors[key] = undefined
  if (screen.value === 0) {
    if (!photos.value.length) errors.mediaIds = 'Add at least one photo.'
    if (draft.title.trim().length < 10) errors.title = 'Add a descriptive title (10+ characters).'
    if (!draft.categoryId) errors.categoryId = 'Choose a category.'
    if (draft.description.trim().length < 20) errors.description = 'Describe the item in at least 20 characters.'
  } else if (screen.value === 1) {
    if (!draft.condition) errors.condition = 'Choose the condition.'
    if (draft.price.amount <= 0) errors['price.amount'] = 'Enter an asking price.'
    if (draft.negotiable && draft.minimumOffer && draft.minimumOffer.amount >= draft.price.amount) errors['minimumOffer.amount'] = 'Minimum offer must be below the asking price.'
  } else if (!(draft.attestations.ownsItem && draft.attestations.notCounterfeit && draft.attestations.dispatchCommitment)) {
    errors.attestations = 'Please confirm all three statements.'
  }
  const firstError = Object.entries(errors).find(([, v]) => v)
  if (firstError) {
    requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"], .pw-wiz__err')?.focus?.())
    return false
  }
  return true
}

async function next() {
  if (!validateScreen()) return
  if (screen.value < 2) {
    screen.value = (screen.value + 1) as 0 | 1 | 2
    window.scrollTo({ top: 0, behavior: 'smooth' })
    void save(true)
    return
  }
  await publish()
}

async function publish() {
  publishing.value = true
  try {
    if (!draftId.value) {
      const l = await listingService.createDraft(draft)
      draftId.value = l.id
    }
    const l = await listingService.publish(draftId.value!, draft)
    dirty.value = false
    track('listing_created', { listingId: l.id, category: l.category.slug, boosted: draft.boost !== 'none' })
    ui.success(l.status === 'active' ? 'Your listing is live' : 'Submitted for review', l.status === 'active' ? 'Buyers can see it now.' : 'We review new sellers within a few hours.')
    await router.push({ name: 'hangar-listings' })
  } catch (e) {
    const err = toApiError(e)
    applyErrors(err)
    if (err.code === 'KYC_REQUIRED') ui.error('Verification required', err.message)
    else ui.error("Couldn't publish", err.isValidation ? 'Fix the highlighted fields and try again.' : err.message)
    if (err.fieldErrors.mediaIds || err.fieldErrors.title) screen.value = 0
  } finally {
    publishing.value = false
  }
}

function addTag() {
  const t = tagInput.value.trim().replace(/,$/, '')
  if (t && !draft.tags.includes(t) && draft.tags.length < 8) draft.tags.push(t)
  tagInput.value = ''
}

function goStep(i: number) {
  screen.value = i <= 1 ? 0 : i <= 4 ? 1 : 2
}

const boostOptions = computed(() =>
  boosts.value.map((b) => ({ value: b.code, label: b.label, hint: b.description, aside: b.price.amount ? formatMoney(b.price) : 'Free' })),
)
const previewPrice = computed(() => (draft.price.amount ? formatMoney(draft.price) : '$—'))
const pricePosition = computed(() => {
  const pc = priceCheck.value
  if (!pc || !draft.price.amount) return null
  const span = pc.high.amount - pc.low.amount || 1
  return Math.min(100, Math.max(0, ((draft.price.amount - pc.low.amount) / span) * 100))
})
const selectedCategoryName = computed(() => flatCats.value.find((c) => c.id === draft.categoryId)?.name ?? '—')
const freightLabel = computed(() => freightOptions.find((f) => f.value === draft.shipping.method)?.label ?? '—')
</script>

<template>
  <div class="pw-wiz">
    <AppBreadcrumb :items="[{ label: 'My Hangar', to: { name: 'hangar' } }, { label: 'Listings', to: { name: 'hangar-listings' } }, { label: editingId ? 'Edit listing' : 'New listing' }]" separator="chevron" />

    <header class="pw-wiz__head">
      <div class="pw-row">
        <h1 class="pw-page-title">{{ editingId ? 'Edit listing' : 'List an item' }}</h1>
        <span class="pw-wiz__saved" aria-live="polite">{{ saving ? 'Saving…' : savedLabel }}</span>
      </div>
      <div class="pw-page-head__actions">
        <AppButton variant="secondary" :loading="saving" @click="save()">Save draft</AppButton>
        <AppButton :loading="publishing" @click="next">{{ screen === 2 ? 'Publish listing' : 'Continue' }}</AppButton>
      </div>
    </header>

    <div class="pw-card pw-wiz__stepper">
      <AppStepper :steps="STEPS" :current="stepIndex" navigable @go="goStep" />
    </div>

    <ErrorState v-if="loadState === 'error'" :error="loadError" class="pw-card" />
    <div v-else-if="loadState === 'loading'" class="pw-wiz__grid"><AppSkeleton height="480px" radius="var(--pw-radius-lg)" /><AppSkeleton height="320px" radius="var(--pw-radius-lg)" /></div>

    <div v-else class="pw-wiz__grid">
      <div class="pw-wiz__main">
        <!-- Screen 1: Photos + Details (VB1) -->
        <template v-if="screen === 0">
          <section class="pw-card pw-card-pad" aria-labelledby="s-photos">
            <div class="pw-between pw-wiz__sec-head">
              <h2 id="s-photos" class="pw-card-title">Photos</h2>
              <span class="pw-wiz__hint">8 max · drag to reorder</span>
            </div>
            <PhotoManager v-model="photos" />
            <p v-if="errors.mediaIds" class="pw-wiz__err" tabindex="-1" role="alert">{{ errors.mediaIds }}</p>
          </section>

          <section class="pw-card pw-card-pad pw-wiz__form" aria-labelledby="s-details">
            <h2 id="s-details" class="pw-card-title">Details</h2>
            <AppInput v-model="draft.title" label="Title" :maxlength="80" :hint="`${draft.title.length} / 80 characters`" :error="errors.title" placeholder="e.g. Bose A20 Aviation Headset — dual GA plugs, Bluetooth" />
            <div class="pw-wiz__row3">
              <AppSelect v-model="draft.categoryId" label="Category" placeholder="Choose…" :options="categoryOptions" :error="errors.categoryId" />
              <AppInput v-model="draft.brand" label="Brand" placeholder="Bose" />
              <AppInput v-model="draft.model" label="Model" placeholder="A20 · 324843" />
            </div>
            <div class="pw-wiz__row3">
              <AppSelect
                v-if="isHeadset"
                :model-value="draft.attributes.plugType ?? ''"
                label="Plug type"
                placeholder="Choose…"
                :options="[
                  { value: 'dual_ga', label: 'Dual GA (PJ-055 / PJ-068)' },
                  { value: 'lemo', label: 'LEMO (6-pin)' },
                  { value: 'u174', label: 'U-174 (helicopter)' },
                  { value: 'xlr5', label: 'XLR-5 (Airbus)' },
                ]"
                @update:model-value="draft.attributes.plugType = $event"
              />
              <AppSelect v-model="draft.yearPurchased" label="Year purchased" placeholder="Choose…" :options="Array.from({ length: 15 }, (_, i) => ({ value: String(2026 - i), label: String(2026 - i) }))" />
              <AppInput v-model="draft.serialNumber" label="Serial number (private)" hint="Shown to buyer after payment only" autocomplete="off" />
            </div>
            <AppTextarea v-model="draft.description" label="Description" :rows="4" :maxlength="2000" :error="errors.description" placeholder="Hours used, aircraft, service history, what's in the box…" />
            <div class="pw-wiz__tags">
              <span id="tags-label" class="pw-wiz__label">Tags</span>
              <ul role="list" aria-labelledby="tags-label">
                <li v-for="t in draft.tags" :key="t" class="pw-wiz__tag">{{ t }} <button type="button" :aria-label="`Remove tag ${t}`" @click="draft.tags = draft.tags.filter((x) => x !== t)"><X :size="12" /></button></li>
                <li>
                  <input v-model="tagInput" class="pw-wiz__tag-input" placeholder="+ Add tag" aria-label="Add tag" @keydown.enter.prevent="addTag" @keydown.,.prevent="addTag" @blur="addTag" />
                </li>
              </ul>
            </div>
          </section>
        </template>

        <!-- Screen 2: Condition + Pricing + Freight (VB2) -->
        <template v-else-if="screen === 1">
          <section class="pw-card pw-card-pad">
            <AppRadioCard v-model="draft.condition" :options="conditionOptions" legend="Condition" :columns="4" :error="errors.condition" />
          </section>

          <section class="pw-card pw-card-pad" aria-labelledby="s-pricing">
            <h2 id="s-pricing" class="pw-card-title pw-wiz__sec-head">Pricing</h2>
            <div class="pw-wiz__pricing">
              <div class="pw-wiz__form">
                <AppMoneyInput v-model="draft.price.amount" label="Asking price" size="lg" show-currency :currency="draft.price.currency" :error="errors['price.amount']" />
                <AppToggle v-model="draft.negotiable" label="Accept offers" :hint="draft.minimumOffer?.amount ? `Minimum offer you'll see: ${formatMoney(draft.minimumOffer)}` : 'Buyers can send offers below asking'" />
                <AppMoneyInput v-if="draft.negotiable" v-model="minOffer" label="Minimum offer" :error="errors['minimumOffer.amount']" />
                <AppToggle v-model="draft.swappable" label="Open to swaps" hint="Buyers can propose items plus a cash top-up" />
                <AppToggle v-model="draft.autoDeclineBelowMinimum" label="Auto-decline offers below minimum" hint="Offers below your minimum are declined with a polite note" :disabled="!draft.negotiable" />
              </div>
              <aside class="pw-wiz__ai" aria-label="AI price check">
                <p class="pw-wiz__ai-label"><Sparkles :size="14" aria-hidden="true" /> AI price check</p>
                <template v-if="priceCheck">
                  <p class="pw-wiz__ai-range">{{ formatMoney(priceCheck.low, { whole: true }) }} – {{ formatMoney(priceCheck.high, { whole: true }) }}</p>
                  <p class="pw-wiz__ai-basis">{{ priceCheck.basis }}</p>
                  <div class="pw-wiz__ai-bar" aria-hidden="true"><span v-if="pricePosition !== null" :style="{ left: `${pricePosition}%` }" /></div>
                  <p class="pw-wiz__ai-verdict">{{ pricePosition === null ? 'Enter a price to compare' : pricePosition < 0.01 ? 'Below the typical range — may sell fast' : pricePosition > 99 ? 'Above the typical range' : 'Your price sits in the fast-sell range' }}</p>
                </template>
                <p v-else class="pw-wiz__ai-basis">Choose a category and condition to see recent sale prices.</p>
              </aside>
            </div>
            <dl class="pw-wiz__fees">
              <div><dt>Platform fee ({{ fee?.platformFeeRate ?? 8 }}%)</dt><dd>− {{ fee ? formatMoney(fee.platformFee) : '—' }}</dd></div>
              <div><dt>Escrow &amp; payment</dt><dd>Included</dd></div>
              <div><dt>You receive</dt><dd class="is-green">{{ fee ? formatMoney(fee.sellerReceives) : '—' }}</dd></div>
            </dl>
          </section>

          <section class="pw-card pw-card-pad pw-wiz__form" aria-labelledby="s-freight">
            <h2 id="s-freight" class="pw-card-title">Freight</h2>
            <AppRadioCard v-model="draft.shipping.method" :options="freightOptions" legend="Freight method" sr-only-legend :columns="3" />
            <div class="pw-wiz__row4">
              <AppSelect v-model="draft.shipping.shipsFrom" label="Ships from" :options="[{ value: 'LOS', label: 'Lagos, NG (LOS)' }, { value: 'ABV', label: 'Abuja, NG (ABV)' }, { value: 'ACC', label: 'Accra, GH (ACC)' }, { value: 'LHR', label: 'London, UK (LHR)' }]" />
              <AppSelect v-model="draft.shipping.parcelSize" label="Parcel size" :options="[{ value: 'small', label: 'Small · 30×20×10 cm' }, { value: 'medium', label: 'Medium · 40×30×20 cm' }, { value: 'large', label: 'Large · 60×40×30 cm' }]" />
              <AppInput :model-value="draft.shipping.weightKg?.toString() ?? ''" label="Weight" suffix="kg" inputmode="decimal" @update:model-value="draft.shipping.weightKg = $event ? Number($event) : null" />
              <AppSelect v-model="draft.shipping.payer" label="Who pays freight" :options="[{ value: 'buyer', label: 'Buyer' }, { value: 'seller', label: 'Seller (free delivery)' }]" />
            </div>
          </section>
        </template>

        <!-- Screen 3: Review & publish (VB3) -->
        <template v-else>
          <section class="pw-card pw-card-pad pw-wiz__review" aria-labelledby="s-review">
            <div class="pw-wiz__review-media">
              <AppImage :media="photos[0]" ratio="4 / 3" fit="cover" sizes="260px" rounded />
              <div class="pw-wiz__review-thumbs">
                <AppImage v-for="p in photos.slice(1, 4)" :key="p.id" :media="p" ratio="1" fit="contain" sizes="80px" />
              </div>
            </div>
            <div>
              <h2 id="s-review" class="pw-wiz__review-title">{{ draft.title || 'Untitled listing' }}</h2>
              <div class="pw-row pw-wiz__review-badges">
                <AppBadge v-if="draft.condition" tone="success">{{ CONDITION_LABELS[draft.condition as ProductCondition].label }}</AppBadge>
                <AppBadge v-if="draft.negotiable" tone="info">Offers on</AppBadge>
                <AppBadge v-if="draft.swappable" tone="info">Swaps on</AppBadge>
              </div>
              <p class="pw-wiz__review-price">{{ previewPrice }}</p>
              <dl class="pw-dl">
                <dt>Category</dt><dd>{{ selectedCategoryName }}<template v-if="draft.brand"> · {{ draft.brand }}</template><template v-if="draft.model"> · {{ draft.model }}</template></dd>
                <dt>Freight</dt><dd>{{ freightLabel }} · from {{ draft.shipping.shipsFrom }} · {{ draft.shipping.payer }} pays</dd>
                <template v-if="draft.negotiable && draft.minimumOffer?.amount"><dt>Minimum offer</dt><dd>{{ formatMoney(draft.minimumOffer) }}</dd></template>
                <dt>You receive</dt><dd>{{ fee ? `${formatMoney(fee.sellerReceives)} after ${fee.platformFeeRate}% fee` : '—' }}</dd>
              </dl>
            </div>
          </section>

          <section class="pw-card pw-card-pad" aria-labelledby="s-attest">
            <h2 id="s-attest" class="pw-card-title pw-wiz__sec-head">Before you publish</h2>
            <AppCheckbox v-model="draft.attestations.ownsItem" label="I own this item and it matches the photos" />
            <AppCheckbox v-model="draft.attestations.notCounterfeit" label="It's not counterfeit, stolen or subject to export restrictions" />
            <AppCheckbox v-model="draft.attestations.dispatchCommitment" label="I'll dispatch within 3 days of payment" />
            <p v-if="errors.attestations" class="pw-wiz__err" tabindex="-1" role="alert">{{ errors.attestations }}</p>
          </section>
        </template>
      </div>

      <aside class="pw-wiz__aside">
        <template v-if="screen < 2">
          <div class="pw-card pw-card-pad">
            <p class="pw-eyebrow">Buyer preview</p>
            <div class="pw-wiz__preview">
              <AppImage :media="photos[0]" ratio="16 / 11" fit="cover" sizes="300px" />
              <div class="pw-wiz__preview-body">
                <p class="pw-wiz__preview-title">{{ draft.title || 'Your listing title' }}</p>
                <p class="pw-row"><strong>{{ previewPrice }}</strong> <AppBadge v-if="draft.condition" tone="success">{{ CONDITION_LABELS[draft.condition as ProductCondition].label }}</AppBadge></p>
              </div>
            </div>
          </div>
          <div v-if="screen === 0" class="pw-card pw-card-pad">
            <h2 class="pw-card-title">Listings that sell faster</h2>
            <ul class="pw-wiz__tips" role="list">
              <li><Check :size="16" aria-hidden="true" /> At least 5 photos including plugs and labels</li>
              <li><Check :size="16" aria-hidden="true" /> Exact model and plug type in the title</li>
              <li><Check :size="16" aria-hidden="true" /> Mention hours used and service history</li>
            </ul>
          </div>
          <p v-else class="pw-wiz__swapnote"><ArrowLeftRight :size="16" aria-hidden="true" /> Swaps are escrow-protected on both sides. Each party ships to the other; funds and items release together after both confirm.</p>
        </template>
        <template v-else>
          <div class="pw-card pw-card-pad">
            <h2 class="pw-card-title"><Sparkles :size="16" aria-hidden="true" /> Boost visibility</h2>
            <p class="pw-muted pw-wiz__boost-sub">Optional. Promoted listings appear at the top of search and the home feed.</p>
            <AppRadioCard v-model="draft.boost" :options="boostOptions.length ? boostOptions : [{ value: 'none' as BoostPackageCode, label: 'No boost', hint: 'Standard placement', aside: 'Free' }]" legend="Boost package" sr-only-legend />
          </div>
          <p class="pw-wiz__verified" :class="{ 'is-warn': !auth.kycApproved }">
            <ShieldCheck :size="16" aria-hidden="true" />
            <template v-if="auth.kycApproved">Verified seller — your listing goes live immediately. Unverified accounts are capped at 3 live listings.</template>
            <template v-else>Unverified accounts are capped at 3 live listings and are reviewed first. <RouterLink :to="{ name: 'hangar-verification' }">Verify now</RouterLink></template>
          </p>
        </template>
      </aside>
    </div>

    <div class="pw-wiz__footer">
      <AppButton v-if="screen > 0" variant="secondary" @click="screen = (screen - 1) as 0 | 1">Back</AppButton>
      <AppButton :loading="publishing" @click="next">{{ screen === 2 ? 'Publish listing' : 'Continue' }}</AppButton>
    </div>
  </div>
</template>

<style scoped>
.pw-wiz__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--pw-space-4);
  margin: var(--pw-space-5) 0;
}

.pw-wiz__saved {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-wiz__stepper {
  padding: var(--pw-space-4) var(--pw-space-5);
  margin-bottom: var(--pw-space-5);
}

.pw-wiz__grid {
  display: grid;
  gap: var(--pw-space-5);
}

.pw-wiz__main,
.pw-wiz__aside {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-5);
  min-width: 0;
}

.pw-wiz__sec-head {
  margin-bottom: var(--pw-space-4);
}

.pw-wiz__hint {
  font-size: var(--pw-text-xs);
  color: var(--pw-navy-700);
}

.pw-wiz__form {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-4);
}

.pw-wiz__row3,
.pw-wiz__row4 {
  display: grid;
  gap: var(--pw-space-4);
}

.pw-wiz__err {
  margin-top: var(--pw-space-3);
  color: var(--pw-danger-600);
  font-size: var(--pw-text-sm);
}

.pw-wiz__label {
  display: block;
  margin-bottom: var(--pw-space-2);
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-medium);
}

.pw-wiz__tags ul {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pw-space-2);
}

.pw-wiz__tag {
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

.pw-wiz__tag button {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #fff;
}

.pw-wiz__tag-input {
  height: 28px;
  width: 100px;
  padding: 0 10px;
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-full);
  font-size: var(--pw-text-xs);
}

.pw-wiz__pricing {
  display: grid;
  gap: var(--pw-space-5);
}

.pw-wiz__ai {
  padding: var(--pw-space-5);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-navy-900);
  color: rgb(255 255 255 / 85%);
  align-self: start;
}

.pw-wiz__ai-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--pw-text-2xs);
  font-weight: var(--pw-weight-bold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--pw-gold-400);
}

.pw-wiz__ai-range {
  margin-top: var(--pw-space-2);
  font-family: var(--pw-font-display);
  font-size: 1.5rem;
  font-weight: var(--pw-weight-bold);
  color: #fff;
}

.pw-wiz__ai-basis {
  font-size: var(--pw-text-xs);
}

.pw-wiz__ai-bar {
  position: relative;
  height: 6px;
  margin: var(--pw-space-4) 0 var(--pw-space-2);
  border-radius: 3px;
  background: linear-gradient(90deg, rgb(255 255 255 / 20%) 0%, var(--pw-gold-500) 20%, var(--pw-gold-500) 80%, rgb(255 255 255 / 20%) 100%);
}

.pw-wiz__ai-bar span {
  position: absolute;
  top: -4px;
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: #fff;
  transform: translateX(-50%);
}

.pw-wiz__ai-verdict {
  font-size: var(--pw-text-xs);
  font-weight: var(--pw-weight-semibold);
  color: #fff;
}

.pw-wiz__fees {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--pw-space-3);
  margin: var(--pw-space-5) 0 0;
  padding-top: var(--pw-space-4);
  border-top: 1px solid var(--pw-border);
  font-size: var(--pw-text-sm);
}

.pw-wiz__fees div {
  display: flex;
  gap: var(--pw-space-3);
}

.pw-wiz__fees dt {
  color: var(--pw-muted);
}

.pw-wiz__fees dd {
  margin: 0;
  font-weight: var(--pw-weight-semibold);
}

.pw-wiz__fees .is-green {
  color: var(--pw-success-600);
}

.pw-wiz__preview {
  margin-top: var(--pw-space-3);
  overflow: hidden;
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-md);
}

.pw-wiz__preview-body {
  padding: var(--pw-space-3);
  font-size: var(--pw-text-sm);
}

.pw-wiz__preview-title {
  margin-bottom: var(--pw-space-2);
  font-weight: var(--pw-weight-medium);
}

.pw-wiz__tips {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-2);
  margin-top: var(--pw-space-3);
  font-size: var(--pw-text-sm);
  color: var(--pw-ink-2);
}

.pw-wiz__tips li {
  display: flex;
  gap: var(--pw-space-2);
}

.pw-wiz__tips svg {
  flex: none;
  color: var(--pw-success-600);
}

.pw-wiz__swapnote,
.pw-wiz__verified {
  display: flex;
  gap: var(--pw-space-2);
  padding: var(--pw-space-4);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-navy-100);
  font-size: var(--pw-text-sm);
  color: var(--pw-navy-700);
}

.pw-wiz__verified {
  background: var(--pw-success-100);
  color: var(--pw-success-700);
}

.pw-wiz__verified.is-warn {
  background: var(--pw-warning-100);
  color: var(--pw-warning-700);
}

.pw-wiz__swapnote svg,
.pw-wiz__verified svg {
  flex: none;
  margin-top: 2px;
}

.pw-wiz__boost-sub {
  margin: var(--pw-space-2) 0 var(--pw-space-4);
  font-size: var(--pw-text-sm);
}

.pw-wiz__review {
  display: grid;
  gap: var(--pw-space-5);
}

.pw-wiz__review-thumbs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--pw-space-2);
  margin-top: var(--pw-space-2);
}

.pw-wiz__review-title {
  font-size: var(--pw-text-lg);
}

.pw-wiz__review-badges {
  margin: var(--pw-space-2) 0;
  flex-wrap: wrap;
}

.pw-wiz__review-price {
  margin-bottom: var(--pw-space-4);
  font-family: var(--pw-font-display);
  font-size: 1.75rem;
  font-weight: var(--pw-weight-bold);
}

.pw-wiz__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--pw-space-3);
  margin-top: var(--pw-space-6);
}

@media (min-width: 768px) {
  .pw-wiz__row3 {
    grid-template-columns: repeat(3, 1fr);
  }
  .pw-wiz__row4 {
    grid-template-columns: repeat(4, 1fr);
  }
  .pw-wiz__pricing {
    grid-template-columns: 1.2fr 1fr;
  }
  .pw-wiz__review {
    grid-template-columns: 260px 1fr;
  }
}

@media (min-width: 1024px) {
  .pw-wiz__grid {
    grid-template-columns: minmax(0, 1fr) 320px;
    align-items: start;
  }
  .pw-wiz__aside {
    position: sticky;
    top: calc(var(--pw-header-h) + var(--pw-space-5));
  }
}
</style>
