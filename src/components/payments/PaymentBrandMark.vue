<script setup lang="ts">
/**
 * Accepted-payment marks for the footer (V1). Inline SVG so they render with
 * no extra requests and stay crisp at any density. Purely decorative inside a
 * labelled list item — the brand name is exposed via `aria-label`.
 */
export type PaymentBrand = 'visa' | 'mastercard' | 'paypal' | 'gpay' | 'applepay'

defineProps<{ brand: PaymentBrand }>()
</script>

<template>
  <svg v-if="brand === 'visa'" viewBox="0 0 48 16" width="34" height="12" aria-hidden="true" focusable="false">
    <text x="24" y="13.5" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="900" font-style="italic" letter-spacing="-0.5" fill="#1a1f71">VISA</text>
  </svg>

  <svg v-else-if="brand === 'mastercard'" viewBox="0 0 38 24" width="30" height="19" aria-hidden="true" focusable="false">
    <circle cx="13" cy="12" r="10" fill="#eb001b" />
    <circle cx="25" cy="12" r="10" fill="#f79e1b" />
    <path d="M19 4a10 10 0 0 1 0 16a10 10 0 0 1 0-16z" fill="#ff5f00" />
  </svg>

  <svg v-else-if="brand === 'paypal'" viewBox="0 0 56 16" width="40" height="12" aria-hidden="true" focusable="false">
    <text x="0" y="13" font-family="Verdana, Arial, sans-serif" font-size="14" font-weight="700" font-style="italic" letter-spacing="-0.6">
      <tspan fill="#003087">Pay</tspan><tspan fill="#009cde">Pal</tspan>
    </text>
  </svg>

  <svg v-else-if="brand === 'gpay'" viewBox="0 0 44 18" width="34" height="14" aria-hidden="true" focusable="false">
    <g transform="translate(1 1)">
      <path d="M15.4 8.2c0-.6-.1-1.1-.2-1.6H8v3h4.2a3.6 3.6 0 0 1-1.6 2.4v2h2.6c1.4-1.4 2.2-3.4 2.2-5.8z" fill="#4285f4" />
      <path d="M8 16c2.2 0 4-.7 5.2-2l-2.6-2c-.7.5-1.6.8-2.6.8a4.6 4.6 0 0 1-4.3-3.1H1v2.1A8 8 0 0 0 8 16z" fill="#34a853" />
      <path d="M3.7 9.7a4.7 4.7 0 0 1 0-3V4.6H1a8 8 0 0 0 0 7.2l2.7-2.1z" fill="#fbbc04" />
      <path d="M8 3.2c1.2 0 2.3.4 3.1 1.2l2.3-2.3A8 8 0 0 0 1 4.6l2.7 2.1A4.6 4.6 0 0 1 8 3.2z" fill="#ea4335" />
    </g>
    <text x="19" y="13.5" font-family="Arial, Helvetica, sans-serif" font-size="12" font-weight="500" fill="#3c4043">Pay</text>
  </svg>

  <svg v-else viewBox="0 0 40 16" width="34" height="14" aria-hidden="true" focusable="false">
    <path
      d="M8.6 3.1c.5-.6.8-1.4.7-2.1-.7 0-1.5.5-2 1.1-.4.5-.8 1.3-.7 2.1.8 0 1.5-.4 2-1.1zm.7 1.2c-1.1-.1-2 .6-2.5.6s-1.3-.6-2.2-.6A3.2 3.2 0 0 0 1.9 6c-1.2 2-.3 5 .8 6.6.6.8 1.2 1.7 2.1 1.6.8 0 1.2-.5 2.2-.5s1.3.5 2.2.5c.9 0 1.5-.8 2-1.6.6-.9.9-1.8.9-1.9 0 0-1.7-.7-1.8-2.7 0-1.7 1.4-2.5 1.5-2.6-.8-1.2-2.1-1.3-2.5-1.3z"
      fill="#fff"
    />
    <text x="15" y="12.5" font-family="-apple-system, 'Helvetica Neue', Arial, sans-serif" font-size="11.5" font-weight="600" fill="#fff">Pay</text>
  </svg>
</template>
