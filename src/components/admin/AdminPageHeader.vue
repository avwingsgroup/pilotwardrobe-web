<script setup lang="ts">
defineProps<{ title: string; subtitle?: string | null }>()
</script>

<template>
  <header class="pw-aph">
    <div>
      <h1 class="pw-aph__title">{{ title }}</h1>
      <p v-if="subtitle || $slots.subtitle" class="pw-aph__sub"><slot name="subtitle">{{ subtitle }}</slot></p>
    </div>
    <div v-if="$slots.default" class="pw-aph__actions"><slot /></div>
  </header>
</template>

<style scoped>
.pw-aph {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--pw-space-3);
  margin-bottom: var(--pw-space-5);
}

.pw-aph__title {
  font-size: var(--pw-text-xl);
}

.pw-aph__sub {
  margin-top: 2px;
  font-size: var(--pw-text-sm);
  color: var(--pw-muted);
}

.pw-aph__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--pw-space-2);
}
</style>
