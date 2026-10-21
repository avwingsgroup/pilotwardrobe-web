<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ChevronDown, ChevronUp, Eye, FileText, GripVertical } from '@lucide/vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import AppTabs from '@/components/common/AppTabs.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppImage from '@/components/common/AppImage.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import AppInput from '@/components/forms/AppInput.vue'
import AppSelect from '@/components/forms/AppSelect.vue'
import { adminService } from '@/api/admin.api'
import { toApiError } from '@/api/errors'
import { useResource } from '@/composables/useResource'
import { useUiStore } from '@/stores/ui.store'
import type { HeroSlide } from '@/types/admin'

/** AD15 — home hero slider (drives V1 + app home). Links must be in-app paths. */
const ui = useUiStore()
const tab = ref('hero')
const { data: slides, state, error, reload, mutate } = useResource((s) => adminService.heroSlides(s))
const selectedId = ref<string | null>(null)
const form = reactive<Partial<HeroSlide>>({})
const errors = reactive<Record<string, string | undefined>>({})
const saving = ref(false)
const publishing = ref(false)

watch(slides, (list) => {
  if (list?.length && !selectedId.value) select(list[0]!)
})

function select(s: HeroSlide) {
  selectedId.value = s.id
  Object.assign(form, structuredClone(s))
}

const selected = computed(() => slides.value?.find((s) => s.id === selectedId.value) ?? null)

async function move(i: number, delta: number) {
  const list = [...(slides.value ?? [])]
  const j = i + delta
  if (j < 0 || j >= list.length) return
  ;[list[i], list[j]] = [list[j]!, list[i]!]
  mutate(() => list)
  try {
    await adminService.reorderHeroSlides(list.map((s) => s.id))
  } catch (e) {
    ui.error("Couldn't reorder", toApiError(e).message)
    void reload()
  }
}

async function save() {
  saving.value = true
  for (const k of Object.keys(errors)) errors[k] = undefined
  try {
    const saved = await adminService.saveHeroSlide({ ...form })
    mutate((list) => list?.map((s) => (s.id === saved.id ? saved : s)) ?? null)
    ui.success('Slide saved as draft', 'Publish to make it live.')
  } catch (e) {
    const err = toApiError(e)
    for (const [k, v] of Object.entries(err.fieldErrors)) errors[k] = v[0]
    ui.error("Couldn't save slide", err.message)
  } finally {
    saving.value = false
  }
}

async function publish() {
  publishing.value = true
  try {
    await adminService.publishContent()
    ui.success('Changes published', 'The home hero updates within a minute.')
  } catch (e) {
    ui.error("Couldn't publish", toApiError(e).message)
  } finally {
    publishing.value = false
  }
}
</script>

<template>
  <div>
    <AdminPageHeader title="Home hero slider" :subtitle="`Shown on V1 web home and B1 app home · ${slides?.length ?? 0} of 5 slots used`">
      <AppButton variant="secondary" size="sm" to="/" target="_blank"><template #icon><Eye :size="14" /></template>Preview site</AppButton>
      <AppButton size="sm" :loading="publishing" @click="publish">Publish changes</AppButton>
    </AdminPageHeader>
    <AppTabs v-model="tab" :items="[{ value: 'hero', label: 'Home hero' }, { value: 'banners', label: 'Category banners' }, { value: 'help', label: 'Help centre 64' }, { value: 'legal', label: 'Legal pages' }, { value: 'store', label: 'App store copy' }]" label="Content sections" class="pw-ac__tabs" />

    <ErrorState v-if="state === 'error'" :error="error" class="pw-card" @retry="reload" />
    <AppEmptyState v-else-if="tab !== 'hero'" :icon="FileText" tone="neutral" title="Page editor" body="Help articles, legal pages and banners use the same publish workflow (draft → review → publish) via /admin/content/pages." class="pw-card" />
    <div v-else class="pw-ac">
      <ul class="pw-stack" role="list" aria-label="Slides in display order">
        <template v-if="state === 'loading'"><li v-for="n in 3" :key="n"><AppSkeleton height="88px" radius="var(--pw-radius-lg)" /></li></template>
        <li v-for="(s, i) in slides ?? []" v-else :key="s.id">
          <div class="pw-card pw-ac__slide" :class="{ 'is-active': s.id === selectedId }">
            <span class="pw-ac__reorder">
              <GripVertical :size="16" aria-hidden="true" />
              <button type="button" :disabled="i === 0" :aria-label="`Move slide ${i + 1} up`" @click="move(i, -1)"><ChevronUp :size="14" /></button>
              <button type="button" :disabled="i === (slides?.length ?? 0) - 1" :aria-label="`Move slide ${i + 1} down`" @click="move(i, 1)"><ChevronDown :size="14" /></button>
            </span>
            <AppImage :media="s.image" ratio="16 / 9" fit="cover" sizes="120px" class="pw-ac__thumb" />
            <button type="button" class="pw-ac__text" @click="select(s)">
              <strong>Slide {{ i + 1 }} · {{ s.headline }}</strong>
              <small>{{ s.audience }}</small>
            </button>
            <AppBadge :tone="s.status === 'live' ? 'success' : 'warning'">{{ s.status }}</AppBadge>
          </div>
        </li>
      </ul>

      <section v-if="selected" class="pw-card pw-card-pad pw-stack" aria-labelledby="edit-slide">
        <h2 id="edit-slide" class="pw-card-title">Edit slide {{ (slides?.indexOf(selected) ?? 0) + 1 }}</h2>
        <AppImage :media="selected.image" ratio="16 / 9" fit="cover" sizes="320px" rounded />
        <AppInput v-model="form.headline!" label="Headline" :maxlength="60" :hint="`${form.headline?.length ?? 0} / 60`" :error="errors.headline" />
        <AppInput v-model="form.subtext!" label="Subtext" />
        <div class="pw-ac__row">
          <AppInput v-model="form.buttonLabel!" label="Button label" />
          <AppInput v-model="form.link!" label="Link" :error="errors.link" hint="In-app path, e.g. /marketplace" />
        </div>
        <div class="pw-ac__row">
          <AppSelect v-model="form.audience!" label="Audience" :options="[{ value: 'All users · always', label: 'All users' }, { value: 'NG, GH · Aug 4–10', label: 'NG, GH' }, { value: 'Signed-out visitors', label: 'Signed-out visitors' }]" />
          <AppSelect v-model="form.locales!" label="Locale" :options="[{ value: 'EN · FR · HA', label: 'EN · FR · HA' }, { value: 'EN', label: 'EN' }]" />
        </div>
        <AppButton :loading="saving" @click="save">Save slide</AppButton>
      </section>
    </div>
  </div>
</template>

<style scoped>
.pw-ac__tabs {
  margin-bottom: var(--pw-space-4);
}

.pw-ac {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: var(--pw-space-4);
}

.pw-ac__slide {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  padding: var(--pw-space-3);
}

.pw-ac__slide.is-active {
  border: 2px solid var(--pw-navy-700);
}

.pw-ac__reorder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--pw-subtle);
}

.pw-ac__reorder button {
  display: grid;
  place-items: center;
  width: 24px;
  height: 20px;
  border: 0;
  background: none;
  color: var(--pw-muted);
}

.pw-ac__reorder button:disabled {
  opacity: 0.3;
}

.pw-ac__thumb {
  width: 110px;
  flex: none;
  border-radius: var(--pw-radius-sm);
}

.pw-ac__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 0;
  border: 0;
  background: none;
  text-align: left;
  font-size: var(--pw-text-sm);
}

.pw-ac__text small {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-ac__row {
  display: grid;
  gap: var(--pw-space-3);
}

@media (min-width: 640px) {
  .pw-ac__row {
    grid-template-columns: 1fr 1fr;
  }
}

@media (min-width: 1100px) {
  .pw-ac {
    grid-template-columns: minmax(0, 1.6fr) minmax(300px, 1fr);
    align-items: start;
  }
}
</style>
