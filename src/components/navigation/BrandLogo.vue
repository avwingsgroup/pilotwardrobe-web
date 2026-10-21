<script setup lang="ts">
import logoNavy from '@/assets/brand/logo-navy.png'
import logoWhite from '@/assets/brand/logo-white.png'

/**
 * Brand mark. Raster extracted from the design frames at 2x (200×92);
 * replace with the designer's SVG when supplied (see design gaps).
 */
withDefaults(defineProps<{ inverse?: boolean; height?: number; tile?: boolean; to?: string | null }>(), { height: 40, tile: true, to: '/' })
</script>

<template>
  <component :is="to ? 'RouterLink' : 'span'" :to="to ?? undefined" class="pw-logo" :class="{ 'pw-logo--tile': tile, 'pw-logo--inverse': inverse }" aria-label="Pilotwardrobe home">
    <img :src="inverse ? logoWhite : logoNavy" alt="Pilotwardrobe" :height="height" :width="Math.round(height * 2.17)" :style="{ '--pw-logo-h': `${height}px` }" />
  </component>
</template>

<style scoped>
.pw-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  border-radius: var(--pw-radius-sm);
}

.pw-logo--tile {
  padding: 6px 12px;
  background: #f4f6fa;
}

.pw-logo--tile.pw-logo--inverse {
  background: rgb(255 255 255 / 4%);
}

.pw-logo img {
  width: auto;
  /* The global `img { height: auto }` reset would otherwise ignore the height attribute. */
  height: var(--pw-logo-h);
}
</style>
