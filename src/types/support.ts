import type { Id } from './api'

/** GET /help/summary — Help Center (VC10) live panels. */
export interface HelpSummary {
  popular: PopularQuestion[]
  status: SystemStatus
}

export interface PopularQuestion {
  /** FAQ id the question links to (/faq#id). */
  faqId: string
  question: string
  tag: string
  views: number
}

export type ComponentHealth = 'up' | 'degraded' | 'down'

export interface SystemStatus {
  overall: 'operational' | 'degraded' | 'outage'
  windowDays: number
  uptimePercent: number
  components: { name: string; days: ComponentHealth[] }[]
}

/** GET /support/contact-info — Contact page (VC11) live panels. */
export interface SupportContactInfo {
  /** Chats per hour (WAT), index 0 = 00:00. */
  chatLoad: number[]
  avgChatReplyMinutes: number
  offices: { name: string; address: string }[]
}

export type ContactTopic = 'order' | 'escrow' | 'dispute' | 'selling' | 'account' | 'trust_safety' | 'callback' | 'other'

/** POST /contact */
export interface ContactPayload {
  name: string
  email: string
  topic: ContactTopic
  subject: string
  message: string
  orderId?: Id | null
  /** For `callback` requests. */
  phone?: string | null
  attachmentIds?: Id[]
}
