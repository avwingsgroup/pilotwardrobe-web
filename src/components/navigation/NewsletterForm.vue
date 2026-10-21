<script setup lang="ts">
import { ref } from 'vue'
import { contentService } from '@/api/messages.api'
import { toApiError } from '@/api/errors'
import { email as emailRule } from '@/utils/validators'

const value = ref('')
const state = ref<'idle' | 'submitting' | 'done' | 'error'>('idle')
const message = ref('')

async function submit() {
  const check = emailRule(value.value)
  if (!value.value || check !== true) {
    state.value = 'error'
    message.value = check === true ? 'Enter your email address.' : check
    return
  }
  state.value = 'submitting'
  try {
    await contentService.subscribe(value.value.trim().toLowerCase())
    state.value = 'done'
    message.value = "You're subscribed — welcome aboard."
    value.value = ''
  } catch (e) {
    state.value = 'error'
    message.value = toApiError(e).field('email') ?? toApiError(e).message
  }
}
</script>

<template>
  <form class="pw-news" novalidate @submit.prevent="submit">
    <label for="pw-news-email" class="sr-only">Email address</label>
    <input
      id="pw-news-email"
      v-model="value"
      type="email"
      autocomplete="email"
      placeholder="Email address"
      class="pw-news__input"
      :aria-invalid="state === 'error' || undefined"
      aria-describedby="pw-news-status"
    />
    <button type="submit" class="pw-news__btn" :disabled="state === 'submitting'">{{ state === 'submitting' ? 'Subscribing…' : 'Subscribe' }}</button>
    <p id="pw-news-status" class="pw-news__status" :class="`is-${state}`" aria-live="polite">{{ message }}</p>
  </form>
</template>

<style scoped>
.pw-news {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pw-space-3);
}

.pw-news__input {
  flex: 1 1 220px;
  min-height: 44px;
  padding: 0 var(--pw-space-4);
  border: 1px solid rgb(255 255 255 / 20%);
  border-radius: var(--pw-radius-md);
  background: rgb(255 255 255 / 8%);
  color: #fff;
}

.pw-news__input::placeholder {
  color: rgb(255 255 255 / 60%);
}

.pw-news__input:focus-visible {
  outline: 2px solid var(--pw-gold-400);
  outline-offset: 1px;
}

.pw-news__btn {
  min-height: 44px;
  padding: 0 var(--pw-space-6);
  border: 0;
  border-radius: var(--pw-radius-md);
  background: var(--pw-gold-500);
  color: var(--pw-navy-900);
  font-weight: var(--pw-weight-semibold);
}

.pw-news__btn:hover {
  background: var(--pw-gold-400);
}

.pw-news__status {
  flex-basis: 100%;
  min-height: 0;
  font-size: var(--pw-text-xs);
}

.pw-news__status.is-error {
  color: #ffb4ad;
}

.pw-news__status.is-done {
  color: #9be2bc;
}
</style>
