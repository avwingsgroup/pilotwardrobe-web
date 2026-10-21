<script setup lang="ts">
import AppModal from '@/components/common/AppModal.vue'
import SocialButtons from './SocialButtons.vue'
import OrDivider from './OrDivider.vue'
import EmailStartForm from './EmailStartForm.vue'
import { useUiStore } from '@/stores/ui.store'

/**
 * VA14 gated-action modal. Shown when a visitor tries to buy, offer, swap,
 * message, save or sell. Reuses the same auth components inline and preserves
 * the intended destination (`next`) through the whole flow.
 */
const ui = useUiStore()
</script>

<template>
  <AppModal :open="!!ui.authGate" size="sm" @close="ui.closeAuthGate()">
    <template #header>
      <div v-if="ui.authGate" class="pw-gate__context">
        <img v-if="ui.authGate.imageUrl" :src="ui.authGate.imageUrl" alt="" width="40" height="40" />
        <div>
          <p class="pw-gate__intent">{{ ui.authGate.intent }}</p>
          <p v-if="ui.authGate.title" class="pw-gate__item">{{ ui.authGate.title }}<template v-if="ui.authGate.priceLabel"> · {{ ui.authGate.priceLabel }}</template></p>
        </div>
      </div>
    </template>
    <h2 class="pw-gate__title">Log in or sign up</h2>
    <p class="pw-gate__sub">Your basket and this listing are saved — you'll return here after signing in.</p>
    <SocialButtons :providers="['google']" />
    <OrDivider />
    <EmailStartForm :next="ui.authGate?.redirect" :on-navigate="() => ui.closeAuthGate()" />
    <p class="pw-gate__legal">
      By continuing you agree to the Pilotwardrobe <RouterLink to="/terms" @click="ui.closeAuthGate()">Terms of Service</RouterLink> and
      <RouterLink to="/privacy" @click="ui.closeAuthGate()">Privacy Policy</RouterLink>.
    </p>
  </AppModal>
</template>

<style scoped>
.pw-gate__context {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
}

.pw-gate__context img {
  border-radius: var(--pw-radius-sm);
  object-fit: cover;
  background: var(--pw-surface-sunken);
}

.pw-gate__intent {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-gate__item {
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-semibold);
}

.pw-gate__title {
  font-size: var(--pw-text-2xl);
}

.pw-gate__sub {
  margin: var(--pw-space-2) 0 var(--pw-space-5);
  color: var(--pw-muted);
  font-size: var(--pw-text-sm);
}

.pw-gate__legal {
  margin-top: var(--pw-space-4);
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
  text-align: center;
}

.pw-gate__legal a {
  text-decoration: underline;
}
</style>
