import { ref } from 'vue'
import { defineStore } from 'pinia'
import { notificationService } from '@/api/messages.api'

/**
 * Badge counters for the header (bell + messages). Polls lightly while the tab is
 * visible; swap `startPolling` for a Reverb/WebSocket subscription later.
 */
export const useNotificationStore = defineStore('notifications', () => {
  const unread = ref(0)
  const unreadMessages = ref(0)
  let timer: ReturnType<typeof setInterval> | null = null

  async function refresh() {
    try {
      const { count } = await notificationService.unreadCount()
      unread.value = count
    } catch {
      /* non-critical */
    }
  }

  function setCounts(counts: { unreadNotifications?: number; unreadMessages?: number }) {
    if (counts.unreadNotifications !== undefined) unread.value = counts.unreadNotifications
    if (counts.unreadMessages !== undefined) unreadMessages.value = counts.unreadMessages
  }

  function startPolling(intervalMs = 60_000) {
    stopPolling()
    timer = setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, intervalMs)
  }

  function stopPolling() {
    if (timer) clearInterval(timer)
    timer = null
  }

  function reset() {
    stopPolling()
    unread.value = 0
    unreadMessages.value = 0
  }

  return { unread, unreadMessages, refresh, setCounts, startPolling, stopPolling, reset }
})
