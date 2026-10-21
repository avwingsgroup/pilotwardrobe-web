<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import AppSpinner from './AppSpinner.vue'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'danger-outline' | 'success' | 'gold' | 'inverse' | 'inverse-outline' | 'link'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: 'sm' | 'md' | 'lg'
    to?: RouteLocationRaw
    href?: string
    type?: 'button' | 'submit' | 'reset'
    loading?: boolean
    disabled?: boolean
    block?: boolean
    /** Accessible label for icon-only buttons. */
    label?: string
    iconOnly?: boolean
  }>(),
  { variant: 'primary', size: 'md', type: 'button' },
)

const tag = computed(() => (props.to ? RouterLink : props.href ? 'a' : 'button'))
const isDisabled = computed(() => props.disabled || props.loading)
const attrs = computed(() => {
  if (props.to) return { to: props.to, 'aria-disabled': isDisabled.value || undefined }
  if (props.href) return { href: props.href, rel: 'noopener noreferrer' }
  return { type: props.type, disabled: isDisabled.value }
})
</script>

<template>
  <component
    :is="tag"
    v-bind="attrs"
    class="pw-btn"
    :class="[`pw-btn--${variant}`, `pw-btn--${size}`, { 'pw-btn--block': block, 'pw-btn--icon': iconOnly, 'is-loading': loading }]"
    :aria-label="label"
    :aria-busy="loading || undefined"
  >
    <AppSpinner v-if="loading" class="pw-btn__spinner" :size="size === 'sm' ? 14 : 16" />
    <span class="pw-btn__content" :class="{ 'is-hidden': loading }">
      <slot name="icon" />
      <slot />
      <slot name="trailing" />
    </span>
  </component>
</template>

<style scoped>
.pw-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--pw-space-2);
  min-height: var(--pw-touch);
  padding: 0 var(--pw-space-5);
  border: 1px solid transparent;
  border-radius: var(--pw-radius-md);
  font-family: var(--pw-font-body);
  font-size: var(--pw-text-base);
  font-weight: var(--pw-weight-semibold);
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background-color var(--pw-duration) var(--pw-ease),
    border-color var(--pw-duration) var(--pw-ease),
    color var(--pw-duration) var(--pw-ease),
    box-shadow var(--pw-duration) var(--pw-ease);
  user-select: none;
}

.pw-btn:hover {
  text-decoration: none;
}

.pw-btn__content {
  display: inline-flex;
  align-items: center;
  gap: var(--pw-space-2);
}

.pw-btn__content.is-hidden {
  visibility: hidden;
}

.pw-btn__spinner {
  position: absolute;
}

.pw-btn--sm {
  min-height: 36px;
  padding: 0 var(--pw-space-3);
  font-size: var(--pw-text-sm);
}

.pw-btn--lg {
  min-height: 52px;
  padding: 0 var(--pw-space-8);
  font-size: var(--pw-text-md);
}

.pw-btn--block {
  display: flex;
  width: 100%;
}

.pw-btn--icon {
  padding: 0;
  width: var(--pw-touch);
}

.pw-btn--icon.pw-btn--sm {
  width: 36px;
}

.pw-btn--primary {
  background: var(--pw-navy-700);
  color: #fff;
}
.pw-btn--primary:hover {
  background: var(--pw-navy-800);
}

.pw-btn--secondary {
  background: var(--pw-surface);
  border-color: var(--pw-border-strong);
  color: var(--pw-ink);
}
.pw-btn--secondary:hover {
  border-color: var(--pw-navy-300);
  background: var(--pw-navy-50);
}

.pw-btn--outline {
  background: var(--pw-surface);
  border-color: var(--pw-navy-700);
  color: var(--pw-navy-700);
}
.pw-btn--outline:hover {
  background: var(--pw-navy-50);
}

.pw-btn--ghost {
  background: transparent;
  color: var(--pw-navy-700);
}
.pw-btn--ghost:hover {
  background: var(--pw-navy-50);
}

.pw-btn--danger {
  background: var(--pw-danger-600);
  color: #fff;
}
.pw-btn--danger:hover {
  background: var(--pw-danger-700);
}

.pw-btn--danger-outline {
  background: var(--pw-surface);
  border-color: color-mix(in srgb, var(--pw-danger-600) 45%, white);
  color: var(--pw-danger-600);
}
.pw-btn--danger-outline:hover {
  background: var(--pw-danger-100);
}

.pw-btn--success {
  background: var(--pw-success-600);
  color: #fff;
}
.pw-btn--success:hover {
  background: var(--pw-success-700);
}

.pw-btn--gold {
  background: var(--pw-gold-500);
  color: var(--pw-navy-900);
}
.pw-btn--gold:hover {
  background: var(--pw-gold-600);
  color: #fff;
}

.pw-btn--inverse {
  background: #fff;
  color: var(--pw-navy-900);
}
.pw-btn--inverse:hover {
  background: var(--pw-navy-50);
}

.pw-btn--inverse-outline {
  background: transparent;
  border-color: rgb(255 255 255 / 55%);
  color: #fff;
}
.pw-btn--inverse-outline:hover {
  background: rgb(255 255 255 / 10%);
}

.pw-btn--link {
  min-height: auto;
  padding: 0;
  background: none;
  color: var(--pw-navy-700);
}
.pw-btn--link:hover {
  text-decoration: underline;
}

.pw-btn:disabled,
.pw-btn[aria-disabled='true'] {
  cursor: not-allowed;
}

.pw-btn--primary:disabled,
.pw-btn--success:disabled,
.pw-btn--danger:disabled {
  background: var(--pw-disabled);
  color: #fff;
}

.pw-btn--secondary:disabled,
.pw-btn--outline:disabled,
.pw-btn--ghost:disabled {
  color: var(--pw-subtle);
  border-color: var(--pw-border);
  background: var(--pw-surface);
}

.pw-btn.is-loading:disabled {
  opacity: 0.85;
}
.pw-btn--primary.is-loading:disabled {
  background: var(--pw-navy-700);
}
</style>
