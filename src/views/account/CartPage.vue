<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { ShieldCheck, ShoppingCart, Trash2 } from '@lucide/vue'
import AppButton from '@/components/common/AppButton.vue'
import AppImage from '@/components/common/AppImage.vue'
import AppBadge from '@/components/common/AppBadge.vue'
import AppSkeleton from '@/components/common/AppSkeleton.vue'
import AppEmptyState from '@/components/common/AppEmptyState.vue'
import { useCartStore } from '@/stores/cart.store'
import { useUiStore } from '@/stores/ui.store'
import { useSeo } from '@/composables/useSeo'
import { toApiError } from '@/api/errors'
import { CONDITION_LABELS } from '@/constants/labels'
import { formatMoney } from '@/utils/money'

useSeo({ title: 'Cart', noindex: true })
const cart = useCartStore()
const ui = useUiStore()
onMounted(() => void cart.load().catch((e) => ui.error("Couldn't load cart", toApiError(e).message)))

const unavailable = computed(() => cart.cart?.items.some((i) => !i.available) ?? false)

async function remove(id: string) {
  try {
    await cart.remove(id)
  } catch (e) {
    ui.error("Couldn't remove item", toApiError(e).message)
  }
}
</script>

<template>
  <div class="pw-container pw-cart">
    <h1 class="pw-page-title">Cart</h1>
    <div v-if="cart.loading && !cart.cart" class="pw-stack pw-cart__body"><AppSkeleton v-for="n in 2" :key="n" height="96px" radius="var(--pw-radius-lg)" /></div>
    <AppEmptyState v-else-if="!cart.cart?.items.length" :icon="ShoppingCart" title="Your cart is empty" body="Items you add stay reserved for you only at checkout." class="pw-card pw-cart__body">
      <AppButton :to="{ name: 'marketplace' }">Browse the marketplace</AppButton>
    </AppEmptyState>
    <div v-else class="pw-cart__grid pw-cart__body">
      <ul class="pw-stack" role="list">
        <li v-for="i in cart.cart.items" :key="i.id" class="pw-card pw-card-pad pw-cart__item" :class="{ 'is-unavailable': !i.available }">
          <AppImage :media="i.image" ratio="1" sizes="80px" class="pw-cart__img" />
          <div class="pw-cart__text">
            <RouterLink :to="{ name: 'listing', params: { slug: i.listingSlug } }" class="pw-cart__title">{{ i.title }}</RouterLink>
            <p class="pw-cart__meta">
              <AppBadge v-if="i.condition" tone="success">{{ CONDITION_LABELS[i.condition].label }}</AppBadge>
              <AppBadge v-if="i.size" tone="info">Size {{ i.size }}</AppBadge>
              <span>Sold by {{ i.seller.displayName }}</span>
            </p>
            <p v-if="!i.available" class="pw-cart__warn">No longer available — remove to continue.</p>
          </div>
          <div class="pw-cart__right">
            <strong>{{ formatMoney(i.price) }}</strong>
            <button type="button" class="pw-cart__remove" :aria-label="`Remove ${i.title}`" @click="remove(i.id)"><Trash2 :size="16" /></button>
          </div>
        </li>
      </ul>
      <aside class="pw-card pw-card-pad pw-cart__sum">
        <h2 class="pw-card-title">Summary</h2>
        <dl class="pw-dl">
          <dt>Items ({{ cart.count }})</dt>
          <dd>{{ formatMoney(cart.cart.subtotal) }}</dd>
        </dl>
        <p class="pw-cart__note">Freight, buyer protection and duties are calculated at checkout.</p>
        <AppButton block size="lg" :disabled="unavailable" :to="{ name: 'checkout', query: { cart: cart.cart.id } }">Checkout</AppButton>
        <p class="pw-cart__escrow"><ShieldCheck :size="14" aria-hidden="true" /> Held in escrow until your gear lands.</p>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.pw-cart {
  padding-top: var(--pw-space-8);
  padding-bottom: var(--pw-space-16);
}

.pw-cart__body {
  margin-top: var(--pw-space-5);
}

.pw-cart__grid {
  display: grid;
  gap: var(--pw-space-5);
}

.pw-cart__item {
  display: flex;
  gap: var(--pw-space-4);
  align-items: center;
}

.pw-cart__item.is-unavailable {
  opacity: 0.7;
}

.pw-cart__img {
  width: 80px;
  flex: none;
  border-radius: var(--pw-radius-md);
}

.pw-cart__text {
  flex: 1;
  min-width: 0;
}

.pw-cart__title {
  color: var(--pw-ink);
  font-weight: var(--pw-weight-semibold);
}

.pw-cart__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--pw-space-2);
  margin-top: var(--pw-space-2);
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-cart__warn {
  margin-top: var(--pw-space-2);
  font-size: var(--pw-text-xs);
  color: var(--pw-danger-600);
}

.pw-cart__right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--pw-space-2);
}

.pw-cart__remove {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: none;
  color: var(--pw-muted);
}

.pw-cart__remove:hover {
  background: var(--pw-danger-100);
  color: var(--pw-danger-600);
}

.pw-cart__sum {
  display: flex;
  flex-direction: column;
  gap: var(--pw-space-4);
  align-self: start;
}

.pw-cart__note,
.pw-cart__escrow {
  font-size: var(--pw-text-xs);
  color: var(--pw-muted);
}

.pw-cart__escrow {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--pw-success-600);
}

@media (min-width: 1024px) {
  .pw-cart__grid {
    grid-template-columns: minmax(0, 1fr) 340px;
  }
}
</style>
