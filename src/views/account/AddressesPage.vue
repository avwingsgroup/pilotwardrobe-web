<script setup lang="ts">
import { ref } from 'vue'
import { MapPin, Plus } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppModal from '@/components/common/AppModal.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppConfirmDialog from '@/components/common/AppConfirmDialog.vue'
import ErrorState from '@/components/common/ErrorState.vue'
import AddressForm from '@/components/transactions/AddressForm.vue'
import { addressService } from '@/api/orders.api'
import { toApiError } from '@/api/errors'
import { useResource } from '@/composables/useResource'
import { useSeo } from '@/composables/useSeo'
import { useUiStore } from '@/stores/ui.store'
import type { Address } from '@/types/user'

useSeo({ title: 'Addresses', noindex: true })
const ui = useUiStore()
const { data, state, error, reload } = useResource((s) => addressService.list(s))
const editing = ref<Address | 'new' | null>(null)
const removing = ref<Address | null>(null)
const busy = ref(false)

async function makeDefault(a: Address) {
  try {
    await addressService.update(a.id, { isDefault: true })
    await reload()
  } catch (e) {
    ui.error("Couldn't update", toApiError(e).message)
  }
}

async function remove() {
  if (!removing.value) return
  busy.value = true
  try {
    await addressService.remove(removing.value.id)
    removing.value = null
    await reload()
  } catch (e) {
    ui.error("Couldn't delete", toApiError(e).message)
  } finally {
    busy.value = false
  }
}

function saved() {
  editing.value = null
  ui.success('Address saved')
  void reload()
}
</script>

<template>
  <div>
    <header class="pw-page-head">
      <div>
        <h1 class="pw-page-title">Addresses</h1>
        <p class="pw-page-sub">Delivery destinations used at checkout.</p>
      </div>
      <div class="pw-page-head__actions"><AppButton @click="editing = 'new'"><template #icon><Plus :size="18" /></template>Add address</AppButton></div>
    </header>
    <ErrorState v-if="state === 'error'" :error="error" class="pw-card" @retry="reload" />
    <div v-else-if="state === 'loading'" class="pw-addr"><AppSkeleton v-for="n in 2" :key="n" height="150px" radius="var(--pw-radius-lg)" /></div>
    <AppEmptyState v-else-if="!data?.length" :icon="MapPin" title="No saved addresses" body="Add a delivery address to speed up checkout." class="pw-card">
      <AppButton @click="editing = 'new'">Add address</AppButton>
    </AppEmptyState>
    <ul v-else class="pw-addr" role="list">
      <li v-for="a in data" :key="a.id" class="pw-card pw-card-pad pw-addr__card">
        <div class="pw-between">
          <strong>{{ a.label ?? 'Address' }}</strong>
          <AppBadge v-if="a.isDefault" tone="navy">Default</AppBadge>
        </div>
        <address>{{ a.fullName }} · {{ a.phone }}<br />{{ a.line1 }}<template v-if="a.line2">, {{ a.line2 }}</template><br />{{ a.city }}, {{ a.state }} {{ a.postalCode }}, {{ a.countryCode }}</address>
        <div class="pw-row">
          <button type="button" class="pw-link-btn" @click="editing = a">Edit</button>
          <button v-if="!a.isDefault" type="button" class="pw-link-btn" @click="makeDefault(a)">Make default</button>
          <button type="button" class="pw-link-btn pw-addr__del" @click="removing = a">Delete</button>
        </div>
      </li>
    </ul>

    <AppModal :open="!!editing" :title="editing === 'new' ? 'Add address' : 'Edit address'" @close="editing = null">
      <AddressForm v-if="editing" :address="editing === 'new' ? null : editing" @saved="saved" @cancel="editing = null" />
    </AppModal>
    <AppConfirmDialog :open="!!removing" title="Delete this address?" confirm-label="Delete" tone="danger" :loading="busy" @confirm="remove" @cancel="removing = null" />
  </div>
</template>

<style scoped>
.pw-addr {
  display: grid;
  gap: var(--pw-space-4);
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.pw-addr__card {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-3);
}

.pw-addr__card address {
  font-style: normal;
  font-size: var(--pw-text-sm);
  line-height: var(--pw-leading-relaxed);
  color: var(--pw-ink-2);
}

.pw-addr__del {
  color: var(--pw-danger-600);
}
</style>
