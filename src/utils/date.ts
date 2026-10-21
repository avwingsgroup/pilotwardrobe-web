/**
 * Dates arrive from the API as ISO-8601 UTC strings and are rendered in the
 * viewer's local time zone via Intl. No date library needed for these formats.
 */
const cache = new Map<string, Intl.DateTimeFormat>()

function fmt(options: Intl.DateTimeFormatOptions, locale = 'en-US') {
  const key = locale + JSON.stringify(options)
  let f = cache.get(key)
  if (!f) {
    f = new Intl.DateTimeFormat(locale, options)
    cache.set(key, f)
  }
  return f
}

const toDate = (value: string | Date) => (value instanceof Date ? value : new Date(value))

/** "Jul 28" */
export const formatShortDate = (value: string | Date) => fmt({ month: 'short', day: 'numeric' }).format(toDate(value))

/** "Fri, Aug 2" */
export const formatDayDate = (value: string | Date) =>
  fmt({ weekday: 'short', month: 'short', day: 'numeric' }).format(toDate(value))

/** "Mar 2025" */
export const formatMonthYear = (value: string | Date) => fmt({ month: 'short', year: 'numeric' }).format(toDate(value))

/** "Jul 28, 14:02" */
export const formatDateTime = (value: string | Date) =>
  fmt({ month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(toDate(value))

/** "09:41" */
export const formatTime = (value: string | Date) =>
  fmt({ hour: '2-digit', minute: '2-digit', hour12: false }).format(toDate(value))

/** "Jul 31 10:42:08" (audit logs) */
export const formatAuditTime = (value: string | Date) =>
  fmt({ month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(
    toDate(value),
  )

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

/** Compact relative label: "2m", "3h", "1d", else "Jul 26". */
export function timeAgoShort(value: string | Date, now = new Date()) {
  const diff = (now.getTime() - toDate(value).getTime()) / 1000
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d`
  return formatShortDate(value)
}

/** "2 hours ago" */
export function timeAgo(value: string | Date, now = new Date()) {
  const seconds = Math.round((toDate(value).getTime() - now.getTime()) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 60) return rtf.format(seconds, 'second')
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour')
  if (abs < 86400 * 30) return rtf.format(Math.round(seconds / 86400), 'day')
  return formatShortDate(value)
}

/** "9h" / "2d" until a future instant; "expired" if passed. */
export function timeUntil(value: string | Date, now = new Date()) {
  const diff = (toDate(value).getTime() - now.getTime()) / 1000
  if (diff <= 0) return 'expired'
  if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export function dateRangeLabel(from: string, to: string) {
  return `${formatDayDate(from)} – ${formatDayDate(to)}`
}

/** "Today" / "Yesterday" / "Earlier" buckets for notifications. */
export function dayBucket(value: string, now = new Date()): 'today' | 'yesterday' | 'earlier' {
  const d = toDate(value)
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  if (d.getTime() >= startToday) return 'today'
  if (d.getTime() >= startToday - 86400_000) return 'yesterday'
  return 'earlier'
}
