<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Plus, ShieldCheck } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppConfirmDialog from '@/components/common/AppConfirmDialog.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import AppChoiceChips from '@/components/forms/AppChoiceChips.vue'
import AppNumberStepper from '@/components/forms/AppNumberStepper.vue'
import AppToggle from '@/components/forms/AppToggle.vue'
import AppInput from '@/components/forms/AppInput.vue'
import { fitKitService } from '@/api/account.api'
import { toApiError } from '@/api/errors'
import { useResource } from '@/composables/useResource'
import { useSeo } from '@/composables/useSeo'
import { useUiStore } from '@/stores/ui.store'
import { formatShortDate } from '@/utils/date'
import { initials } from '@/utils/security'
import type { FitKitProfile } from '@/types/user'

/** V6 — Fit Kit manager: saved sizes used by search filters, listing fit badges and checkout. */
useSeo({ title: 'Fit Kit', noindex: true })
const ui = useUiStore()
const { data: profiles, state, error, reload, mutate } = useResource((s) => fitKitService.list(s))
const selectedId = ref<string | null>(null)
const saving = ref(false)
const deleting = ref(false)
const confirmDelete = ref(false)

const blank = (): Omit<FitKitProfile, 'id' | 'updatedAt' | 'ordersUsedOn'> => ({
  name: 'New fit profile',
  forPerson: '',
  initials: '?',
  isDefault: false,
  unit: 'us_in',
  jacket: null,
  collar: null,
  sleeve: null,
  waist: null,
  inseam: null,
  shoe: null,
  bag: null,
  preferences: { filterSearchBySize: false, warnOutsideMeasurements: true, useAtCheckout: false },
})

const form = reactive({ ...blank(), id: '' as string | undefined })

watch(profiles, (list) => {
  if (list?.length && !selectedId.value) select(list.find((p) => p.isDefault) ?? list[0]!)
})

function select(p: FitKitProfile | null) {
  selectedId.value = p?.id ?? 'new'
  Object.assign(form, p ? structuredClone(p) : { ...blank(), id: undefined })
}

const isNew = computed(() => selectedId.value === 'new')
const JACKETS = ['38R', '40R', '42R', '44R', '46R', '42L']
const SHOES = ['9.5', '10', '10.5', '11', '11.5', '12']
const COLLARS = ['14"', '14.5"', '15"', '15.5"', '16"', '16.5"', '17"']
const SLEEVES = ['32–33', '33–34', '34–35', '35–36', '36–37']
const WAISTS = ['28', '30', '32', '34', '36', '38', '40']
const INSEAMS = ['28', '30', '32', '34', '36']

const chips = (p: FitKitProfile) =>
  [p.jacket && `Jacket ${p.jacket}`, p.collar && `Collar ${p.collar}`, p.sleeve && `Sleeve ${p.sleeve}`, p.waist && `Waist ${p.waist}${p.inseam ? ` / ${p.inseam}` : ''}`, p.shoe && `Shoe US ${p.shoe}`, p.bag && `Bag · ${p.bag[0]!.toUpperCase()}${p.bag.slice(1)}`].filter(Boolean) as string[]

async function save() {
  saving.value = true
  try {
    const payload = { ...form, initials: initials(form.forPerson || form.name) }
    const saved = isNew.value ? await fitKitService.create(payload) : await fitKitService.update(form.id!, payload)
    mutate((list) => {
      const others = (list ?? []).filter((p) => p.id !== saved.id).map((p) => (saved.isDefault ? { ...p, isDefault: false } : p))
      return [...others, saved].sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
    })
    select(saved)
    ui.success('Fit profile saved', 'Listings now show whether they fit.')
  } catch (e) {
    ui.error("Couldn't save profile", toApiError(e).message)
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (!form.id) return
  deleting.value = true
  try {
    await fitKitService.remove(form.id)
    mutate((list) => (list ?? []).filter((p) => p.id !== form.id))
    selectedId.value = null
    confirmDelete.value = false
    if (profiles.value?.length) select(profiles.value[0]!)
    ui.success('Profile deleted')
  } catch (e) {
    ui.error("Couldn't delete", toApiError(e).message)
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div>
    <header class="pw-page-head">
      <div>
        <h1 class="pw-page-title">Fit Kit</h1>
        <p class="pw-page-sub">Saved sizes for apparel, footwear and flight bags — applied at checkout and in search filters.</p>
      </div>
      <div class="pw-page-head__actions">
        <AppButton variant="outline" @click="select(null)"><template #icon><Plus :size="18" /></template>New profile</AppButton>
      </div>
    </header>

    <ErrorState v-if="state === 'error'" :error="error" class="pw-card" @retry="reload" />
    <div v-else class="pw-fk">
      <div class="pw-fk__list">
        <template v-if="state === 'loading'"><AppSkeleton v-for="n in 2" :key="n" height="150px" radius="var(--pw-radius-lg)" /></template>
        <button v-for="p in profiles ?? []" v-else :key="p.id" type="button" class="pw-card pw-fk__card" :class="{ 'is-active': p.id === selectedId }" :aria-pressed="p.id === selectedId" @click="select(p)">
          <span class="pw-fk__card-head">
            <AppAvatar :name="p.forPerson || p.name" :initials="p.initials" :size="40" :tone="p.isDefault ? 'navy' : 'soft'" />
            <span class="pw-fk__card-title">
              <strong>{{ p.name }} — {{ p.forPerson }}</strong>
              <small>Updated {{ formatShortDate(p.updatedAt) }} · used on {{ p.ordersUsedOn }} orders</small>
            </span>
            <AppBadge v-if="p.isDefault" tone="navy">Default</AppBadge>
          </span>
          <span class="pw-fk__chips"><span v-for="c in chips(p)" :key="c" class="pw-fk__chip">{{ c }}</span></span>
        </button>
        <button type="button" class="pw-fk__new" @click="select(null)">+ New fit profile</button>
        <p class="pw-fk__privacy"><ShieldCheck :size="14" aria-hidden="true" /> Sellers only ever see the size needed to fulfil your order — never your full measurements.</p>
      </div>

      <section v-if="selectedId" class="pw-card pw-card-pad pw-fk__editor" aria-labelledby="fk-title">
        <div class="pw-fk__editor-head">
          <div>
            <h2 id="fk-title" class="pw-card-title">{{ isNew ? 'New fit profile' : `${form.name} — ${form.forPerson}` }}</h2>
            <p class="pw-muted pw-fk__sub">Set once, reused across every sized listing.</p>
          </div>
          <div class="pw-fk__unit" role="radiogroup" aria-label="Units">
            <button type="button" role="radio" :aria-checked="form.unit === 'us_in'" :class="{ 'is-on': form.unit === 'us_in' }" @click="form.unit = 'us_in'">US · inches</button>
            <button type="button" role="radio" :aria-checked="form.unit === 'eu_cm'" :class="{ 'is-on': form.unit === 'eu_cm' }" @click="form.unit = 'eu_cm'">EU · cm</button>
          </div>
        </div>

        <div v-if="isNew" class="pw-fk__names">
          <AppInput v-model="form.name" label="Profile name" placeholder="Uniform fit" />
          <AppInput v-model="form.forPerson" label="For" placeholder="Name" />
        </div>

        <p class="pw-eyebrow pw-fk__group">Uniform &amp; apparel</p>
        <AppChoiceChips v-model="form.jacket" legend="Jacket / blazer" :options="JACKETS.map((v) => ({ value: v, label: v }))" />
        <div class="pw-fk__steppers">
          <AppNumberStepper v-model="form.collar" label="Shirt collar" :values="COLLARS" />
          <AppNumberStepper v-model="form.sleeve" label="Sleeve" :values="SLEEVES" />
          <AppNumberStepper v-model="form.waist" label="Trouser waist" :values="WAISTS" />
          <AppNumberStepper v-model="form.inseam" label="Inseam" :values="INSEAMS" />
        </div>

        <p class="pw-eyebrow pw-fk__group">Footwear</p>
        <AppChoiceChips v-model="form.shoe" legend="Shoe size (US)" sr-only-legend :options="SHOES.map((v) => ({ value: v, label: v }))" />
        <p class="pw-muted pw-fk__note">{{ form.shoe ? `EU ${Math.round(Number(form.shoe) + 33.5)} · UK ${Number(form.shoe) - 1} — converted automatically` : 'Pick a size to see EU / UK conversions' }}</p>

        <p class="pw-eyebrow pw-fk__group">Flight bags &amp; kit</p>
        <AppChoiceChips v-model="form.bag" legend="Bag class" sr-only-legend :options="[{ value: 'compact', label: 'Compact' }, { value: 'standard', label: 'Standard' }, { value: 'crew', label: 'Crew' }]" />
        <p class="pw-muted pw-fk__note">Flags bags and cases that fit your kit when you browse.</p>

        <p class="pw-eyebrow pw-fk__group">Preferences</p>
        <div class="pw-fk__prefs">
          <AppToggle v-model="form.preferences.filterSearchBySize" label="Filter search to my size by default" reverse />
          <AppToggle v-model="form.preferences.warnOutsideMeasurements" label="Warn me when a listing sits outside my measurements" reverse />
          <AppToggle v-model="form.preferences.useAtCheckout" label="Use this profile at checkout automatically" reverse />
          <AppToggle v-model="form.isDefault" label="Make this my default profile" reverse />
        </div>

        <footer class="pw-fk__footer">
          <button v-if="!isNew" type="button" class="pw-fk__delete" @click="confirmDelete = true">Delete profile</button>
          <span class="pw-fk__spacer" />
          <AppButton variant="ghost" @click="select(profiles?.find((p) => p.id === form.id) ?? profiles?.[0] ?? null)">Cancel</AppButton>
          <AppButton :loading="saving" @click="save">Save profile</AppButton>
        </footer>
      </section>
    </div>

    <AppConfirmDialog :open="confirmDelete" title="Delete this fit profile?" body="Listings will stop showing fit badges for these sizes." confirm-label="Delete" tone="danger" :loading="deleting" @confirm="remove" @cancel="confirmDelete = false" />
  </div>
</template>

<style scoped>
.pw-fk {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-5);
}

.pw-fk__list {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-4);
}

.pw-fk__card {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-3);
  padding: var(--pw-space-5);
  text-align: left;
  cursor: pointer;
}

.pw-fk__card.is-active {
  border: 2px solid var(--pw-navy-700);
  padding: calc(var(--pw-space-5) - 1px);
}

.pw-fk__card-head {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
}

.pw-fk__card-title {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.pw-fk__card-title small {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-fk__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pw-space-2);
}

.pw-fk__chip {
  padding: 4px 10px;
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-sm);
  font-size: var(--pw-text-xs);
}

.pw-fk__new {
  min-height: 52px;
  border: 1.5px dashed var(--pw-border-strong);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-surface);
  color: var(--pw-navy-700);
  font-weight: var(--pw-weight-semibold);
}

.pw-fk__privacy {
  display: flex;
  gap: var(--pw-space-2);
  padding: var(--pw-space-4);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-navy-100);
  color: var(--pw-navy-700);
  font-size: var(--pw-text-sm);
}

.pw-fk__privacy svg {
  flex: none;
  margin-top: 3px;
}

.pw-fk__editor-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--pw-space-3);
}

.pw-fk__sub {
  font-size: var(--pw-text-sm);
}

.pw-fk__unit {
  display: flex;
  padding: 4px;
  border-radius: var(--pw-radius-md);
  background: var(--pw-surface-sunken);
}

.pw-fk__unit button {
  min-height: 36px;
  padding: 0 var(--pw-space-4);
  border: 0;
  border-radius: var(--pw-radius-sm);
  background: none;
  font-size: var(--pw-text-sm);
  color: var(--pw-muted);
}

.pw-fk__unit button.is-on {
  background: var(--pw-surface);
  color: var(--pw-navy-700);
  font-weight: var(--pw-weight-semibold);
  box-shadow: var(--pw-shadow-xs);
}

.pw-fk__names {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--pw-space-3);
  margin-top: var(--pw-space-4);
}

.pw-fk__group {
  margin: var(--pw-space-6) 0 var(--pw-space-3);
}

.pw-fk__steppers {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--pw-space-3);
  margin-top: var(--pw-space-4);
}

.pw-fk__note {
  margin-top: var(--pw-space-2);
  font-size: var(--pw-text-xs);
}

.pw-fk__prefs {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-3);
}

.pw-fk__prefs > * {
  padding: var(--pw-space-4);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-md);
}

.pw-fk__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--pw-space-3);
  margin-top: var(--pw-space-6);
  padding-top: var(--pw-space-5);
  border-top: 1px solid var(--pw-border);
}

.pw-fk__spacer {
  flex: 1;
}

.pw-fk__delete {
  border: 0;
  background: none;
  color: var(--pw-danger-600);
  font-weight: var(--pw-weight-semibold);
}

@media (min-width: 768px) {
  .pw-fk__steppers {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1280px) {
  .pw-fk {
    grid-template-columns: minmax(300px, 380px) minmax(0, 1fr);
    align-items: start;
  }
}
</style>
