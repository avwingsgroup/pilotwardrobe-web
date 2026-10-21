import type {
  AppNotification,
  Conversation,
  Message,
  NotificationQuery,
  ReportPayload,
  SendMessagePayload,
} from '@/types'
import type { ContentPage } from '@/types/admin'
import { api } from './client'

/**
 * Messaging is REST today. The store is shaped so a Laravel Reverb / WebSocket
 * channel (private-conversation.{id}) can push `Message` objects into it later
 * without component changes.
 */
export const messageService = {
  conversations(query: { context?: 'buying' | 'selling' | 'unread' | 'all'; search?: string }, signal?: AbortSignal) {
    return api.get<Conversation[]>('/conversations', { params: query, signal })
  },
  conversation(id: string, signal?: AbortSignal) {
    return api.get<Conversation>(`/conversations/${id}`, { signal })
  },
  messages(id: string, signal?: AbortSignal) {
    return api.list<Message>(`/conversations/${id}/messages`, { signal })
  },
  send(id: string, payload: SendMessagePayload) {
    return api.post<Message>(`/conversations/${id}/messages`, payload)
  },
  start(listingId: string, body: string) {
    return api.post<Conversation>('/conversations', { listingId, body })
  },
  startWithSeller(username: string, body: string) {
    return api.post<Conversation>('/conversations', { sellerUsername: username, body })
  },
  markRead(id: string) {
    return api.post<void>(`/conversations/${id}/read`)
  },
  report(id: string, payload: ReportPayload) {
    return api.post<void>(`/conversations/${id}/report`, payload)
  },
  reserveListing(listingId: string) {
    return api.post<void>(`/listings/${listingId}/reserve`)
  },
}

export const notificationService = {
  list(query: NotificationQuery, signal?: AbortSignal) {
    return api.list<AppNotification>('/notifications', { params: query, signal })
  },
  unreadCount(signal?: AbortSignal) {
    return api.get<{ count: number }>('/notifications/unread-count', { signal })
  },
  markRead(id: string) {
    return api.patch<AppNotification>(`/notifications/${id}/read`)
  },
  markAllRead() {
    return api.post<void>('/notifications/read-all')
  },
}

export const contentService = {
  page(slug: string, signal?: AbortSignal) {
    return api.get<ContentPage>(`/pages/${encodeURIComponent(slug)}`, { signal })
  },
  contact(payload: { name: string; email: string; topic: string; message: string; orderNumber?: string }) {
    return api.post<{ ticket: string }>('/contact', payload)
  },
  subscribe(email: string) {
    return api.post<void>('/newsletter', { email })
  },
}
