<script setup lang="ts">
/**
 * App Store / Google Play download badge (V1 "hangar in your pocket").
 * Logos are inline SVG; the visible text doubles as the accessible name.
 * Replace with the official badge artwork from each store's marketing kit before launch.
 */
const props = defineProps<{ store: 'apple' | 'google'; href: string }>()
const copy = props.store === 'apple' ? { small: 'Download on the', big: 'App Store' } : { small: 'GET IT ON', big: 'Google Play' }
</script>

<template>
  <a :href="href" class="pw-store" rel="noopener noreferrer" target="_blank">
    <svg v-if="store === 'apple'" class="pw-store__logo" viewBox="0 0 17 20" width="22" height="26" aria-hidden="true" focusable="false">
      <path
        fill="#fff"
        d="M14.2 10.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9C3.7 4.8 2.1 5.8 1.2 7.3c-1.8 3.2-.5 7.9 1.3 10.5.9 1.3 1.9 2.7 3.3 2.6 1.3-.1 1.8-.8 3.4-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.2-2.6 1-1.5 1.4-2.9 1.4-3-.1 0-2.8-1.1-2.9-4.2zM11.6 3c.7-.9 1.2-2 1.1-3.2-1 0-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.1 1.1.1 2.3-.6 3-1.5z"
      />
    </svg>
    <svg v-else class="pw-store__logo" viewBox="0 0 22 24" width="22" height="24" aria-hidden="true" focusable="false">
      <path fill="#00d7fe" d="M.6.4C.3.7.2 1.1.2 1.7v20.6c0 .6.1 1 .4 1.3l.1.1L12.3 12v-.2L.7.3z" />
      <path fill="#ffce00" d="M16.1 15.9 12.3 12v-.3l3.8-3.8.1.1 4.6 2.6c1.3.7 1.3 2 0 2.7l-4.6 2.6z" />
      <path fill="#ff3a44" d="M16.2 15.8 12.3 12 .6 23.6c.4.5 1.1.5 1.9.1l13.7-7.9" />
      <path fill="#00f076" d="M16.2 8.1 2.5.3C1.7-.2 1 0 .6.4L12.3 12l3.9-3.9z" />
    </svg>
    <span class="pw-store__text">
      <small>{{ copy.small }}</small>
      <span>{{ copy.big }}</span>
    </span>
  </a>
</template>

<style scoped>
.pw-store {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 50px;
  padding: 0 18px 0 14px;
  border: 1px solid #a6a6a6;
  border-radius: var(--pw-radius-md);
  background: #000;
  color: #fff;
  transition: background var(--pw-duration) var(--pw-ease);
}

.pw-store:hover {
  background: #1a1a1a;
  text-decoration: none;
}

.pw-store__logo {
  flex: none;
}

.pw-store__text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
  text-align: left;
}

.pw-store__text small {
  font-size: 0.625rem;
  letter-spacing: 0.02em;
}

.pw-store__text span {
  font-size: 1.125rem;
  font-weight: var(--pw-weight-medium);
  letter-spacing: -0.01em;
}
</style>
