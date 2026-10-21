<script setup lang="ts">
import { useRoute } from 'vue-router'
import { Check, ChevronRight, Ruler, ShieldCheck } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import { useSeo } from '@/composables/useSeo'
import { safeRedirect } from '@/utils/security'

/** VA13 — success + two optional next steps. */
useSeo({ title: "You're cleared for takeoff", noindex: true })
const route = useRoute()
const next = safeRedirect(route.query.next, '/marketplace')
</script>

<template>
  <div class="pw-ready">
    <span class="pw-ready__check" aria-hidden="true"><Check :size="32" :stroke-width="3" /></span>
    <h1 class="pw-ready__title">You're cleared for takeoff</h1>
    <p class="pw-ready__sub">Your account is ready. Two optional steps unlock the full marketplace:</p>
    <ul class="pw-ready__steps" role="list">
      <li>
        <RouterLink :to="{ name: 'hangar-verification' }" class="pw-ready__step">
          <span class="pw-ready__icon"><ShieldCheck :size="18" /></span>
          <span><strong>Verify your identity</strong><small>Required to sell or swap. About 3 minutes.</small></span>
          <ChevronRight :size="18" aria-hidden="true" />
        </RouterLink>
      </li>
      <li>
        <RouterLink :to="{ name: 'hangar-fit-kit' }" class="pw-ready__step">
          <span class="pw-ready__icon"><Ruler :size="18" /></span>
          <span><strong>Set up your Fit Kit</strong><small>Save sizes once; we filter listings to fit.</small></span>
          <ChevronRight :size="18" aria-hidden="true" />
        </RouterLink>
      </li>
    </ul>
    <AppButton size="lg" block :to="next">Start exploring</AppButton>
    <RouterLink :to="{ name: 'hangar' }" class="pw-ready__hangar">Go to My Hangar</RouterLink>
  </div>
</template>

<style scoped>
.pw-ready__check {
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  margin-bottom: var(--pw-space-6);
  border-radius: 50%;
  background: var(--pw-success-600);
  color: #fff;
  box-shadow: 0 0 0 10px var(--pw-success-100);
}

.pw-ready__title {
  font-size: clamp(1.75rem, 3vw, 2.25rem);
}

.pw-ready__sub {
  margin: var(--pw-space-3) 0 var(--pw-space-6);
  color: var(--pw-muted);
}

.pw-ready__steps {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-3);
  margin-bottom: var(--pw-space-6);
}

.pw-ready__step {
  display: flex;
  align-items: center;
  gap: var(--pw-space-3);
  padding: var(--pw-space-4);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
  color: var(--pw-ink);
}

.pw-ready__step:hover {
  text-decoration: none;
  border-color: var(--pw-navy-300);
}

.pw-ready__step > span:nth-child(2) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.pw-ready__step small {
  color: var(--pw-muted);
  font-size: var(--pw-text-xs);
}

.pw-ready__icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: var(--pw-radius-md);
  background: var(--pw-navy-100);
  color: var(--pw-navy-700);
}

.pw-ready__hangar {
  display: block;
  margin-top: var(--pw-space-4);
  text-align: center;
  color: var(--pw-ink);
  font-weight: var(--pw-weight-medium);
}
</style>
