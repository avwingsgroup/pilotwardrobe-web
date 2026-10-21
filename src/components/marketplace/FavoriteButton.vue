<script setup lang="ts">
import { computed } from 'vue'
import { Heart } from '@lucide/vue'
import { useMarketplaceStore } from '@/stores/marketplace.store'
import { useGatedAction } from '@/composables/useGatedAction'
import { useUiStore } from '@/stores/ui.store'
import { toApiError } from '@/api/errors'

const props = withDefaults(defineProps<{ listingId: string; title: string; size?: 'sm' | 'md' }>(), { size: 'sm' })
const store = useMarketplaceStore()
const ui = useUiStore()
const gate = useGatedAction()
const active = computed(() => store.isFavorite(props.listingId))

function toggle() {
  gate(
    async () => {
      try {
        await store.toggleFavorite(props.listingId)
      } catch (e) {
        ui.error("Couldn't update saved items", toApiError(e).message)
      }
    },
    { intent: 'To save this item', title: props.title },
  )
}
</script>

<template>
  <button
    type="button"
    class="pw-fav"
    :class="[`pw-fav--${size}`, { 'is-active': active }]"
    :aria-pressed="active"
    :aria-label="active ? `Remove ${title} from saved items` : `Save ${title}`"
    @click.prevent.stop="toggle"
  >
    <Heart :size="size === 'sm' ? 14 : 18" :fill="active ? 'currentColor' : 'none'" :stroke-width="2" />
  </button>
</template>

<style scoped>
.pw-fav {
  display: grid;
  place-items: center;
  border: 1px solid var(--pw-border);
  border-radius: 50%;
  background: rgb(255 255 255 / 94%);
  color: var(--pw-ink-2);
  box-shadow: var(--pw-shadow-xs);
  transition: transform var(--pw-duration-fast) var(--pw-ease);
}

.pw-fav--sm {
  width: 32px;
  height: 32px;
}

.pw-fav--md {
  width: var(--pw-touch);
  height: var(--pw-touch);
  border-radius: var(--pw-radius-md);
}

.pw-fav:hover {
  transform: scale(1.06);
}

.pw-fav.is-active {
  color: var(--pw-danger-600);
}

/* Enlarge the touch target without changing the visual size. */
.pw-fav--sm::after {
  content: '';
  position: absolute;
  inset: -6px;
}
.pw-fav--sm {
  position: relative;
}
</style>
