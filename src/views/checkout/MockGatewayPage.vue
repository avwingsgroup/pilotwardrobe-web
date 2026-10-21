<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { FlaskConical } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import { http } from '@/api/client'
import { isMockApi } from '@/constants/config'

/**
 * Sandbox stand-in for a gateway's hosted checkout (mock API mode only).
 * In live mode the user is on Paystack/Stripe/etc. and this route is never used.
 * Choosing an outcome simulates the gateway webhook, then returns to the callback
 * URL exactly like a real gateway redirect.
 */
const route = useRoute()
const reference = String(route.query.reference ?? '')
const gateway = String(route.query.gateway ?? 'gateway')
const busy = ref(false)
const name = computed(() => gateway.charAt(0).toUpperCase() + gateway.slice(1))

async function finish(outcome: 'success' | 'fail' | 'cancel') {
  busy.value = true
  if (isMockApi) await http.post(`/__mock/gateway/${encodeURIComponent(reference)}`, { outcome }).catch(() => undefined)
  window.location.assign(`/payment/callback?reference=${encodeURIComponent(reference)}&status=${outcome === 'success' ? 'success' : outcome}`)
}
</script>

<template>
  <main id="main" class="pw-gw">
    <div class="pw-gw__card" role="dialog" aria-labelledby="gw-title">
      <p class="pw-gw__tag"><FlaskConical :size="14" aria-hidden="true" /> Sandbox · mock API</p>
      <h1 id="gw-title" class="pw-gw__title">{{ name }} checkout</h1>
      <p class="pw-gw__ref">Reference <span class="pw-mono">{{ reference }}</span></p>
      <p v-if="!isMockApi" class="pw-gw__warn">This simulator is only available in mock mode.</p>
      <div class="pw-gw__actions">
        <AppButton variant="success" block :loading="busy" :disabled="!isMockApi" @click="finish('success')">Approve payment</AppButton>
        <AppButton variant="danger-outline" block :disabled="busy || !isMockApi" @click="finish('fail')">Decline (card error)</AppButton>
        <AppButton variant="ghost" block :disabled="busy" @click="finish('cancel')">Cancel and return</AppButton>
      </div>
    </div>
  </main>
</template>

<style scoped>
.pw-gw {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: var(--pw-space-4);
  background: #e9ecf2;
}

.pw-gw__card {
  width: 100%;
  max-width: 400px;
  padding: var(--pw-space-8);
  border-radius: var(--pw-radius-xl);
  background: #fff;
  box-shadow: var(--pw-shadow-lg);
  text-align: center;
}

.pw-gw__tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--pw-radius-full);
  background: var(--pw-warning-100);
  color: var(--pw-warning-700);
  font-size: var(--pw-text-xs);
  font-weight: var(--pw-weight-semibold);
}

.pw-gw__title {
  margin-top: var(--pw-space-4);
  font-size: var(--pw-text-2xl);
}

.pw-gw__ref {
  margin-top: var(--pw-space-2);
  font-size: var(--pw-text-sm);
  color: var(--pw-muted);
}

.pw-gw__warn {
  margin-top: var(--pw-space-3);
  color: var(--pw-danger-600);
}

.pw-gw__actions {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-3);
  margin-top: var(--pw-space-6);
}
</style>
