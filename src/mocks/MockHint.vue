<script setup lang="ts">
/**
 * Mock-mode-only helper text (demo accounts / OTP codes). Imported behind a
 * compile-time `VITE_API_MODE` check, so live builds never contain these strings.
 */
defineProps<{ kind: 'login' | 'otp' }>()
</script>

<template>
  <p class="pw-mock-hint">
    <template v-if="kind === 'login'">Demo accounts (mock API): pilot@, aviator@ (2FA 123456), admin@, super@, newbie@example.com · password <code>Password1</code></template>
    <template v-else>Mock API code: <code>1234</code></template>
  </p>
</template>

<style scoped>
.pw-mock-hint {
  margin-top: var(--pw-space-6);
  padding: var(--pw-space-3);
  border-radius: var(--pw-radius-md);
  background: var(--pw-surface-sunken);
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
  text-align: center;
}
</style>
