import type { Id, IsoDateTime } from './api'

export type NotificationCategory = 'orders' | 'offers_swaps' | 'messages' | 'account' | 'disputes' | 'payouts' | 'reviews'

export type NotificationIcon = 'offer' | 'order' | 'landed' | 'dispute' | 'review' | 'payout' | 'verified' | 'message'

export interface NotificationAction {
  label: string
  /** In-app route path. Never an external URL (prevents open redirects). */
  to: string
  variant: 'primary' | 'success' | 'secondary'
}

export interface AppNotification {
  id: Id
  category: NotificationCategory
  icon: NotificationIcon
  title: string
  body: string
  readAt: IsoDateTime | null
  createdAt: IsoDateTime
  actions?: NotificationAction[]
  link?: string | null
}

export interface NotificationQuery {
  category?: NotificationCategory | 'all'
  page?: number
}
