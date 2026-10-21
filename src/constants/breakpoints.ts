/** Mirrors the media queries used in component styles. */
export const BREAKPOINTS = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1440,
} as const

/** Allow-listed payment gateway hosts for `authorization_url` redirects. */
export const PAYMENT_GATEWAY_HOSTS = [
  'checkout.stripe.com',
  'paypal.com',
  'checkout.paystack.com',
  'paystack.com',
  'checkout.flutterwave.com',
  'flutterwave.com',
  'sandbox.monnify.com',
  'monnify.com',
] as const
