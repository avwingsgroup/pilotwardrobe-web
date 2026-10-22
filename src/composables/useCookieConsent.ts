import { computed, reactive, ref } from 'vue'
import { readConsent, saveConsent, type ConsentChoice, type ConsentState } from '@/utils/cookieConsent'

/**
 * Shared consent state for the banner (VC14), the preferences dialog (VC15) and
 * the Cookie policy page (VC9). Module-level so every caller sees the same choice;
 * the persisted copy lives in utils/cookieConsent.
 */
const state = reactive<ConsentState>(readConsent())
const preferencesOpen = ref(false)

function apply(choice: ConsentChoice) {
  Object.assign(state, saveConsent(choice))
  preferencesOpen.value = false
}

// Keep tabs in sync: another tab saving a choice updates this one.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'pw.cookie-consent') Object.assign(state, readConsent())
  })
}

export function useCookieConsent() {
  return {
    state,
    decided: computed(() => state.updatedAt !== null),
    preferencesOpen,
    acceptAll: () => apply({ functional: true, analytics: true, marketing: true }),
    rejectAll: () => apply({ functional: false, analytics: false, marketing: false }),
    save: (choice: ConsentChoice) => apply(choice),
    openPreferences: () => (preferencesOpen.value = true),
    closePreferences: () => (preferencesOpen.value = false),
  }
}
