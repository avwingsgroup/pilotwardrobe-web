<script setup lang="ts">
import { computed } from 'vue'
import { Check } from '@lucide/vue'
import { passwordStrength } from '@/utils/validators'

/** Live 4-segment strength meter + rule checklist (VA4 / VA11). */
const props = defineProps<{ password: string; id?: string }>()
const strength = computed(() => passwordStrength(props.password))
const tone = computed(() => (strength.value.score >= 4 ? 'strong' : strength.value.score >= 3 ? 'fair' : 'weak'))
</script>

<template>
  <div :id="id" class="pw-strength" :class="`is-${tone}`" aria-live="polite">
    <div class="pw-strength__bars" aria-hidden="true">
      <span v-for="n in 4" :key="n" :class="{ 'is-on': n <= strength.score }" />
    </div>
    <div class="pw-strength__row">
      <span>Min 8 characters · upper &amp; lower case · one number</span>
      <span v-if="password" class="pw-strength__label">{{ tone === 'strong' ? 'Strong' : tone === 'fair' ? 'Fair' : 'Weak' }}</span>
    </div>
    <ul class="pw-strength__rules" role="list">
      <li v-for="c in strength.checks" :key="c.key" :class="{ 'is-ok': c.ok }">
        <Check v-if="c.ok" :size="14" :stroke-width="2.5" aria-hidden="true" />
        <span v-else class="pw-strength__dot" aria-hidden="true" />
        {{ c.label }}<span class="sr-only">{{ c.ok ? ' — met' : ' — not met' }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.pw-strength {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-2);
  margin-top: var(--pw-space-2);
}

.pw-strength__bars {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.pw-strength__bars span {
  height: 4px;
  border-radius: 2px;
  background: var(--pw-border);
}

.is-weak .pw-strength__bars .is-on {
  background: var(--pw-danger-600);
}
.is-fair .pw-strength__bars .is-on {
  background: var(--pw-gold-500);
}
.is-strong .pw-strength__bars .is-on {
  background: var(--pw-success-600);
}

.pw-strength__row {
  display: flex;
  justify-content: space-between;
  gap: var(--pw-space-2);
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-strength__label {
  font-weight: var(--pw-weight-semibold);
}
.is-weak .pw-strength__label {
  color: var(--pw-danger-600);
}
.is-fair .pw-strength__label {
  color: var(--pw-warning-600);
}
.is-strong .pw-strength__label {
  color: var(--pw-success-600);
}

.pw-strength__rules {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px var(--pw-space-4);
  font-size: var(--pw-text-sm);
  color: var(--pw-muted);
}

.pw-strength__rules li {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pw-strength__rules li.is-ok {
  color: var(--pw-success-600);
}

.pw-strength__dot {
  width: 5px;
  height: 5px;
  margin: 0 4px;
  border-radius: 50%;
  background: var(--pw-subtle);
}
</style>
