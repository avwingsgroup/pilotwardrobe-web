<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from '@lucide/vue'
import AdminPageHeader from '@/components/admin/AdminPageHeader.vue'
import AppTabs from '@/components/common/AppTabs.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppImage from '@/components/common/AppImage.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import DataTable from '@/components/common/DataTable.vue'
import AppInput from '@/components/forms/AppInput.vue'
import { adminService } from '@/api/admin.api'
import { toApiError } from '@/api/errors'
import { useForm } from '@/composables/useForm'
import { useResource } from '@/composables/useResource'
import { useUiStore } from '@/stores/ui.store'
import { required } from '@/utils/validators'
import type { PromoCode } from '@/types/admin'
import type { Column } from '@/types/ui'

/** AD13 — promotions: campaigns, promo codes, featured slots, boosted listings. */
const ui = useUiStore()
const tab = ref('campaigns')
const { data: campaigns, state, error, reload } = useResource((s) => adminService.campaigns(s))
const { data: codes, mutate: mutateCodes } = useResource((s) => adminService.promoCodes(s))
const codeOpen = ref(false)
const form = useForm({ code: '', discount: '', expires: '' }, { code: [required('Enter a code.'), (v: string) => (/^[A-Z0-9]{4,16}$/.test(v) ? true : 'Use 4–16 uppercase letters or digits.')], discount: [required('Describe the discount.')] })

const columns: Column<PromoCode>[] = [
  { key: 'code', label: 'Code' },
  { key: 'discount', label: 'Discount' },
  { key: 'uses', label: 'Uses', hideOnMobile: true },
  { key: 'expires', label: 'Expires' },
  { key: 'status', label: 'Status' },
]

async function duplicate(id: string) {
  try {
    await adminService.duplicateCampaign(id)
    ui.success('Campaign duplicated as a scheduled draft')
    void reload()
  } catch (e) {
    ui.error("Couldn't duplicate", toApiError(e).message)
  }
}

async function createCode() {
  const created = await form.submit((v) => adminService.savePromoCode(v))
  if (created) {
    mutateCodes((list) => [created, ...(list ?? [])])
    codeOpen.value = false
    form.reset()
    ui.success('Promo code created')
  }
}
</script>

<template>
  <div>
    <AdminPageHeader title="Promotions" :subtitle="`${campaigns?.length ?? 0} campaigns · ${codes?.length ?? 0} promo codes · 318 boosted listings`">
      <AppButton variant="secondary" size="sm" @click="codeOpen = true"><template #icon><Plus :size="14" /></template>New promo code</AppButton>
    </AdminPageHeader>
    <AppTabs v-model="tab" :items="[{ value: 'campaigns', label: `Campaigns ${campaigns?.length ?? ''}` }, { value: 'codes', label: `Promo codes ${codes?.length ?? ''}` }]" label="Promotion types" class="pw-apr__tabs" />

    <ErrorState v-if="state === 'error'" :error="error" class="pw-card" @retry="reload" />
    <template v-else-if="tab === 'campaigns'">
      <div class="pw-apr__grid">
        <template v-if="state === 'loading'"><AppSkeleton v-for="n in 4" :key="n" height="180px" radius="var(--pw-radius-lg)" /></template>
        <article v-for="c in campaigns ?? []" v-else :key="c.id" class="pw-card pw-apr__card">
          <AppImage :media="c.image" ratio="auto" fit="cover" sizes="200px" class="pw-apr__img" />
          <div class="pw-apr__body">
            <div class="pw-between"><h2 class="pw-card-title">{{ c.name }}</h2><AppBadge :tone="c.status === 'live' ? 'success' : c.status === 'scheduled' ? 'warning' : 'neutral'">{{ c.status }}</AppBadge></div>
            <p class="pw-muted pw-apr__small">{{ c.detail }}</p>
            <dl class="pw-dl pw-apr__dl"><dt>Dates</dt><dd>{{ c.dates }}</dd><dt>Performance</dt><dd>{{ c.performance }}</dd></dl>
            <div class="pw-row"><AppButton variant="secondary" size="sm" @click="duplicate(c.id)">Duplicate</AppButton></div>
          </div>
        </article>
      </div>
    </template>
    <DataTable v-if="state !== 'error'" :columns="columns" :rows="codes ?? []" :loading="!codes" dense caption="Promo codes" class="pw-apr__codes">
      <template #cell-code="{ row }"><span class="pw-mono">{{ row.code }}</span></template>
      <template #cell-status="{ row }"><AppBadge :tone="row.status === 'live' ? 'success' : 'neutral'">{{ row.status }}</AppBadge></template>
    </DataTable>

    <AppModal :open="codeOpen" title="New promo code" size="sm" @close="codeOpen = false">
      <form id="code-form" class="pw-stack" novalidate @submit.prevent="createCode">
        <AppInput v-model="form.values.code" label="Code" placeholder="HEADSET10" :error="form.fieldError('code')" @update:model-value="form.values.code = $event.toUpperCase()" />
        <AppInput v-model="form.values.discount" label="Discount" placeholder="10% off headsets, max $25" :error="form.fieldError('discount')" />
        <AppInput v-model="form.values.expires" label="Expires" type="date" />
      </form>
      <template #footer>
        <AppButton variant="secondary" @click="codeOpen = false">Cancel</AppButton>
        <AppButton type="submit" form="code-form" :loading="form.submitting.value">Create code</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<style scoped>
.pw-apr__tabs {
  margin-bottom: var(--pw-space-4);
}

.pw-apr__grid {
  display: grid;
  gap: var(--pw-space-4);
}

.pw-apr__card {
  display: flex;
  overflow: hidden;
}

.pw-apr__img {
  width: 34%;
  min-height: 160px;
  flex: none;
}

.pw-apr__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-2);
  padding: var(--pw-space-4);
}

.pw-apr__small {
  font-size: var(--pw-text-xs);
}

.pw-apr__dl {
  margin: var(--pw-space-2) 0;
}

.pw-apr__codes {
  margin-top: var(--pw-space-5);
}

@media (min-width: 1100px) {
  .pw-apr__grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
