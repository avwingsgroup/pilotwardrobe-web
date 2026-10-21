<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import AppModal from '@/components/common/AppModal.vue'
import { authService } from '@/api/auth.api'
import { toApiError } from '@/api/errors'
import { useUiStore } from '@/stores/ui.store'
import { safeRedirect } from '@/utils/security'
import type { SocialProvider } from '@/types/auth'

/**
 * Google / Apple / Facebook. Laravel Socialite owns OAuth 2.0 + PKCE and returns a
 * provider URL. We try a popup first (VA2 "Waiting for Google…") and fall back to a
 * full-page redirect when the popup is blocked. The `next` param is preserved.
 */
const props = withDefaults(defineProps<{ mode?: 'continue' | 'login'; providers?: SocialProvider[] }>(), {
  mode: 'continue',
  providers: () => ['google', 'apple', 'facebook'],
})

const route = useRoute()
const ui = useUiStore()
const waiting = ref<SocialProvider | null>(null)
const pendingUrl = ref<string | null>(null)
let popup: Window | null = null

async function start(provider: SocialProvider) {
  waiting.value = provider
  const next = safeRedirect(route.query.next, '/')
  try {
    sessionStorage.setItem('pw.auth.next', next)
  } catch {
    /* ignore */
  }
  try {
    const { url } = await authService.socialRedirectUrl(provider, `${window.location.origin}/auth/google/callback`)
    pendingUrl.value = url
    popup = window.open(url, 'pw-oauth', 'width=480,height=640')
    if (!popup) {
      window.location.assign(url)
      return
    }
    // Same-origin mock callback: poll for completion then hand off to this tab.
    const timer = setInterval(() => {
      try {
        if (!popup || popup.closed) {
          clearInterval(timer)
          waiting.value = null
          return
        }
        if (popup.location.origin === window.location.origin && popup.location.pathname.startsWith('/auth/google/callback')) {
          const target = popup.location.pathname + popup.location.search
          popup.close()
          clearInterval(timer)
          waiting.value = null
          window.location.assign(target)
        }
      } catch {
        /* cross-origin while on the provider — keep waiting */
      }
    }, 400)
  } catch (e) {
    waiting.value = null
    ui.error(`Couldn't start ${provider} sign-in`, toApiError(e).message)
  }
}

function continueInTab() {
  popup?.close()
  if (pendingUrl.value) window.location.assign(pendingUrl.value)
}

function cancel() {
  popup?.close()
  waiting.value = null
}

const label = (p: SocialProvider) => (p === 'google' ? `${props.mode === 'login' ? 'Log in' : 'Continue'} with Google` : p === 'apple' ? 'Apple' : 'Facebook')
</script>

<template>
  <div class="pw-social">
    <AppButton v-if="providers.includes('google')" variant="secondary" size="lg" block class="pw-social__btn" @click="start('google')">
      <template #icon>
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.3-.4-3.5z" />
        </svg>
      </template>
      {{ label('google') }}
    </AppButton>
    <div v-if="providers.length > 1" class="pw-social__row">
      <AppButton v-if="providers.includes('apple')" variant="secondary" size="lg" block class="pw-social__btn" @click="start('apple')">
        <template #icon>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.8 1.2 1.8 2.6 3.1 2.5 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.5-1-2.5-4.2zM13.9 5c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1 .1 2.1-.6 2.8-1.4z" /></svg>
        </template>
        Apple
      </AppButton>
      <AppButton v-if="providers.includes('facebook')" variant="secondary" size="lg" block class="pw-social__btn" @click="start('facebook')">
        <template #icon>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#1877F2" /><path fill="#fff" d="M13.3 19.5v-6h2l.3-2.4h-2.3V9.6c0-.7.2-1.1 1.2-1.1h1.2V6.3c-.2 0-1-.1-1.8-.1-1.8 0-3 1.1-3 3.1v1.8H9v2.4h2v6h2.3z" /></svg>
        </template>
        Facebook
      </AppButton>
    </div>

    <AppModal :open="!!waiting" size="sm" :dismissible="false" hide-close>
      <div class="pw-social__wait" role="status">
        <div class="pw-social__wait-icons" aria-hidden="true">
          <span class="pw-social__wait-g">G</span><span class="pw-social__dots">•••</span><span class="pw-social__wait-pw">PW</span>
        </div>
        <h2 class="pw-social__wait-title">Waiting for {{ waiting === 'google' ? 'Google' : waiting === 'apple' ? 'Apple' : 'Facebook' }}…</h2>
        <p class="pw-social__wait-body">Finish signing in in the {{ waiting }} window. This page updates automatically once you're done.</p>
        <div class="pw-social__progress" aria-hidden="true"><span /></div>
        <p class="pw-social__wait-alt">Window didn't open? <button type="button" class="pw-link-btn" @click="continueInTab">Continue in this tab</button></p>
        <button type="button" class="pw-link-btn pw-social__cancel" @click="cancel">Cancel</button>
      </div>
    </AppModal>
  </div>
</template>

<style scoped>
.pw-social {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-3);
}

.pw-social__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--pw-space-3);
}

.pw-social__btn {
  font-weight: var(--pw-weight-semibold);
}

.pw-social__wait {
  text-align: center;
}

.pw-social__wait-icons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--pw-space-3);
  margin-bottom: var(--pw-space-4);
}

.pw-social__wait-g,
.pw-social__wait-pw {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: var(--pw-radius-md);
  font-weight: var(--pw-weight-bold);
}

.pw-social__wait-g {
  border: 1px solid var(--pw-border);
  color: #4285f4;
}

.pw-social__wait-pw {
  background: var(--pw-navy-700);
  color: #fff;
  font-size: var(--pw-text-xs);
}

.pw-social__dots {
  color: var(--pw-subtle);
  letter-spacing: 2px;
}

.pw-social__wait-title {
  font-size: var(--pw-text-lg);
}

.pw-social__wait-body {
  margin-top: var(--pw-space-2);
  color: var(--pw-muted);
  font-size: var(--pw-text-sm);
}

.pw-social__progress {
  height: 4px;
  margin: var(--pw-space-5) 0 var(--pw-space-4);
  border-radius: 2px;
  background: var(--pw-border);
  overflow: hidden;
}

.pw-social__progress span {
  display: block;
  width: 40%;
  height: 100%;
  background: var(--pw-navy-700);
  animation: pw-progress 1.6s ease-in-out infinite;
}

@keyframes pw-progress {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(260%);
  }
}

.pw-social__wait-alt {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-social__cancel {
  margin-top: var(--pw-space-3);
  color: var(--pw-ink);
}
</style>
