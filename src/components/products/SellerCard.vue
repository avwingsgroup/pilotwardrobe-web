<script setup lang="ts">
import { ShieldCheck, Star } from '@lucide/vue'
import type { PublicSeller } from '@/types/user'
import AppAvatar from '@/components/common/AppAvatar.vue'
import AppBadge from '@/components/common/AppBadge.vue'

defineProps<{ seller: PublicSeller }>()
const emit = defineEmits<{ message: [] }>()
</script>

<template>
  <div class="pw-seller">
    <AppAvatar :name="seller.displayName" :initials="seller.isOfficialStore ? 'PW' : undefined" :src="seller.avatar?.url" :size="48" tone="navy" />
    <div class="pw-seller__text">
      <p class="pw-seller__name">
        <RouterLink :to="seller.isPhotographer ? { name: 'photographer', params: { username: seller.username } } : { name: 'seller', params: { username: seller.username } }">{{ seller.displayName }}</RouterLink>
        <ShieldCheck v-if="seller.verified" :size="16" class="pw-seller__verified" aria-label="Verified seller" />
        <AppBadge v-if="seller.isAviator" tone="gold">Aviator</AppBadge>
      </p>
      <p class="pw-seller__meta">
        <Star :size="12" fill="currentColor" class="pw-seller__star" aria-hidden="true" />
        {{ seller.rating.toFixed(1) }} · {{ (seller.totalSales ?? seller.totalReviews).toLocaleString() }} sales<template v-if="seller.dispatchTime"> · {{ seller.dispatchTime }}</template>
      </p>
    </div>
    <button type="button" class="pw-seller__msg" @click="emit('message')">Message seller</button>
  </div>
</template>

<style scoped>
.pw-seller {
  display: flex;
  align-items: center;
  gap: var(--pw-space-4);
  padding: var(--pw-space-4);
  border: 1px solid var(--pw-border);
  border-radius: var(--pw-radius-lg);
  background: var(--pw-surface);
}

.pw-seller__text {
  flex: 1;
  min-width: 0;
}

.pw-seller__name {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-weight: var(--pw-weight-semibold);
}

.pw-seller__name a {
  color: var(--pw-ink);
}

.pw-seller__verified {
  color: var(--pw-gold-500);
}

.pw-seller__meta {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-seller__star {
  color: var(--pw-gold-500);
}

.pw-seller__msg {
  min-height: 40px;
  padding: 0 var(--pw-space-4);
  border: 1px solid var(--pw-border-strong);
  border-radius: var(--pw-radius-md);
  background: var(--pw-surface);
  font-size: var(--pw-text-sm);
  font-weight: var(--pw-weight-semibold);
  color: var(--pw-navy-700);
  white-space: nowrap;
}

.pw-seller__msg:hover {
  background: var(--pw-navy-50);
}

@media (max-width: 479px) {
  .pw-seller {
    flex-wrap: wrap;
  }
  .pw-seller__msg {
    width: 100%;
  }
}
</style>
