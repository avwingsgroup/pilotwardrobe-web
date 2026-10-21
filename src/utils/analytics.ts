import type { PaymentGateway } from '@/types/payment'

/**
 * Typed, vendor-neutral analytics events. Business components call `track()`;
 * a sink (GA4, Segment, PostHog…) is registered once at boot. Nothing here
 * imports a vendor SDK. Never include PII (emails, phone numbers, addresses)
 * or payment details in properties.
 */
export interface AnalyticsEvents {
  marketplace_viewed: { category?: string; resultCount: number }
  product_viewed: { listingId: string; category: string; price: number; currency: string }
  search_performed: { query: string; resultCount: number }
  filter_applied: { filter: string; value: string }
  favorite_added: { listingId: string }
  offer_started: { listingId: string }
  offer_submitted: { listingId: string; amount: number; currency: string }
  swap_started: { listingId: string }
  swap_submitted: { listingId: string; itemsOffered: number; cashTopUp: number }
  checkout_started: { listingId?: string; itemCount: number; value: number; currency: string }
  payment_gateway_selected: { gateway: PaymentGateway }
  payment_completed: { orderId: string; gateway: PaymentGateway; value: number; currency: string }
  payment_failed: { orderId: string; gateway: PaymentGateway; status: string }
  listing_created: { listingId: string; category: string; boosted: boolean }
  sign_up_completed: { method: 'email' | 'google' | 'apple' | 'facebook' }
  login_completed: { method: 'email' | 'google' | 'apple' | 'facebook' }
}

export type AnalyticsEventName = keyof AnalyticsEvents

export type AnalyticsSink = <K extends AnalyticsEventName>(name: K, properties: AnalyticsEvents[K]) => void

const sinks: AnalyticsSink[] = []

export function registerAnalyticsSink(sink: AnalyticsSink) {
  sinks.push(sink)
  return () => {
    const i = sinks.indexOf(sink)
    if (i >= 0) sinks.splice(i, 1)
  }
}

export function track<K extends AnalyticsEventName>(name: K, properties: AnalyticsEvents[K]) {
  for (const sink of sinks) {
    try {
      sink(name, properties)
    } catch {
      /* analytics must never break the app */
    }
  }
}
