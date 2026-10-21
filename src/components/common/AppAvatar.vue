<script setup lang="ts">
import { computed, ref } from 'vue'
import { initials as toInitials } from '@/utils/security'

const props = withDefaults(
  defineProps<{
    name: string
    initials?: string
    src?: string | null
    size?: number
    tone?: 'navy' | 'soft' | 'gold' | 'cream' | 'mint'
  }>(),
  { size: 40, tone: 'soft' },
)

const failed = ref(false)
const label = computed(() => props.initials ?? toInitials(props.name))
</script>

<template>
  <span
    class="pw-avatar"
    :class="`pw-avatar--${tone}`"
    :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.max(10, size * 0.36)}px` }"
  >
    <img v-if="src && !failed" :src="src" :alt="name" :width="size" :height="size" loading="lazy" @error="failed = true" />
    <span v-else aria-hidden="true">{{ label }}</span>
    <span v-if="!src || failed" class="sr-only">{{ name }}</span>
  </span>
</template>

<style scoped>
.pw-avatar {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 50%;
  font-family: var(--pw-font-display);
  font-weight: var(--pw-weight-semibold);
  letter-spacing: 0.02em;
}

.pw-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pw-avatar--soft {
  background: var(--pw-navy-100);
  color: var(--pw-navy-700);
}
.pw-avatar--navy {
  background: var(--pw-navy-700);
  color: #fff;
}
.pw-avatar--gold {
  background: var(--pw-gold-500);
  color: #fff;
}
.pw-avatar--cream {
  background: var(--pw-gold-100);
  color: var(--pw-navy-700);
}
.pw-avatar--mint {
  background: #e3efe8;
  color: var(--pw-navy-700);
}
</style>
