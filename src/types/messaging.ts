import type { Id, IsoDateTime, Money } from './api'
import type { MediaAsset } from './media'

export interface ConversationParticipant {
  id: Id
  displayName: string
  initials: string
  username: string
  verified: boolean
  isSupport?: boolean
  responseTime?: string | null
  location?: string | null
  rating?: number | null
  trades?: number | null
  kycVerified?: boolean
  memberSince?: IsoDateTime | null
}

export interface ConversationListingContext {
  id: Id
  slug: string
  title: string
  image?: MediaAsset | null
  price: Money
  conditionLabel: string
  offersCount: number
  reserved: boolean
}

export interface Conversation {
  id: Id
  context: 'buying' | 'selling' | 'support'
  participant: ConversationParticipant
  listing?: ConversationListingContext | null
  lastMessagePreview: string
  lastMessageAt: IsoDateTime
  unreadCount: number
}

export type MessageKind = 'text' | 'offer' | 'system' | 'image'

export interface Message {
  id: Id
  conversationId: Id
  senderId: Id
  mine: boolean
  kind: MessageKind
  body: string
  attachments?: MediaAsset[]
  offer?: { id: Id; amount: Money; listingTitle: string; listedPrice: Money; expiresIn: string; status: string } | null
  sentAt: IsoDateTime
  readAt?: IsoDateTime | null
}

export interface SendMessagePayload {
  body: string
  attachmentIds?: Id[]
}

export interface ReportPayload {
  reason: 'off_platform_payment' | 'spam' | 'abuse' | 'counterfeit' | 'other'
  details?: string
}
