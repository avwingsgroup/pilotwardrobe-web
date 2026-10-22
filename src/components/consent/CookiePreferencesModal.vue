<script setup lang="ts">
import { reactive, watch } from 'vue'
import AppModal from '@/components/common/AppModal.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppToggle from '@/components/forms/AppToggle.vue'
import { useCookieConsent } from '@/composables/useCookieConsent'
import { CONSENT_CATEGORIES } from '@/content/info/cookies'
import type { ConsentChoice } from '@/utils/cookieConsent'

/**
 * VC15 preferences dialog. Opened from the banner, the footer "Cookie settings"
 * link or the Cookie policy page. Edits a draft; nothing is stored until the
 * visitor picks Reject all, Save choices or Accept all. Closing keeps the
 * previous choice (and the banner, if no choice was made yet).
 */
const consent = useCookieConsent()
const draft = reactive<ConsentChoice>({ functional: false, analytics: false, marketing: false })

watch(
  consent.preferencesOpen,
  (open) => {
    if (open) Object.assign(draft, { functional: consent.state.functional, analytics: consent.state.analytics, marketing: consent.state.marketing })
  },
  { immediate: true },
)
</script>

<template>
  <AppModal
    :open="consent.preferencesOpen.value"
    title="Cookie preferences"
    description="Choose which cookies Pilotwardrobe can use. Essential cookies are always on because the site cannot work without them."
    size="md"
    @close="consent.closePreferences"
  >
    <ul class="pw-cprefs" role="list">
      <li v-for="c in CONSENT_CATEGORIES" :key="c.key" class="pw-cprefs__row">
        <div>
          <p class="pw-cprefs__name">
            <strong :id="`cp-${c.key}`">{{ c.title }}</strong>
            <span v-if="c.key === 'essential'" class="pw-cprefs__pill">Always on</span>
          </p>
          <p class="pw-cprefs__body">{{ c.body }}</p>
        </div>
        <AppToggle v-if="c.key === 'essential'" :model-value="true" disabled :label="c.title" sr-only-label />
        <AppToggle v-else v-model="draft[c.key]" :label="c.title" sr-only-label />
      </li>
    </ul>

    <template #footer>
      <div class="pw-cprefs__foot">
        <RouterLink :to="{ name: 'cookies' }" class="pw-cprefs__policy" @click="consent.closePreferences">Cookies policy</RouterLink>
        <div class="pw-cprefs__actions">
          <AppButton variant="outline" @click="consent.rejectAll">Reject all</AppButton>
          <AppButton variant="outline" @click="consent.save({ ...draft })">Save choices</AppButton>
          <AppButton @click="consent.acceptAll">Accept all</AppButton>
        </div>
      </div>
    </template>
  </AppModal>
</template>

<style scoped>
.pw-cprefs__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--pw-space-5);
  padding: var(--pw-space-4) 0;
}

.pw-cprefs__row + .pw-cprefs__row {
  border-top: 1px solid var(--pw-border);
}

.pw-cprefs__name {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--pw-space-2);
  font-size: var(--pw-text-base);
}

.pw-cprefs__pill {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--pw-navy-100);
  color: var(--pw-navy-700);
  font-size: var(--pw-text-2xs);
  font-weight: var(--pw-weight-bold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.pw-cprefs__body {
  margin-top: 2px;
  font-size: var(--pw-text-sm);
  color: var(--pw-muted);
}

.pw-cprefs__foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--pw-space-3);
  width: 100%;
}

.pw-cprefs__policy {
  font-weight: var(--pw-weight-semibold);
  text-decoration: underline;
}

.pw-cprefs__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pw-space-2);
}

@media (max-width: 559px) {
  .pw-cprefs__actions {
    width: 100%;
  }
  .pw-cprefs__actions :deep(.pw-btn) {
    flex: 1 1 auto;
  }
  .pw-cprefs__policy {
    order: 2;
  }
}
</style>
