import DOMPurify from 'dompurify'

/**
 * Only allow same-origin, in-app relative paths as post-login / post-action
 * redirects. Blocks open redirects such as `?next=https://evil.tld`,
 * `//evil.tld`, `/\evil.tld` and `javascript:` URLs.
 */
export function safeRedirect(target: unknown, fallback = '/'): string {
  if (typeof target !== 'string' || target.length === 0 || target.length > 2048) return fallback
  if (!target.startsWith('/')) return fallback
  if (target.startsWith('//') || target.startsWith('/\\')) return fallback
  if (/[\u0000-\u001f]/.test(target)) return fallback
  try {
    const url = new URL(target, 'https://pilotwardrobe.invalid')
    if (url.origin !== 'https://pilotwardrobe.invalid') return fallback
    // Never bounce back into auth screens.
    if (url.pathname.startsWith('/auth')) return fallback
    return url.pathname + url.search + url.hash
  } catch {
    return fallback
  }
}

/** Allow only https URLs on an explicit allow-list of hosts (payment gateways). */
export function isAllowedExternalUrl(raw: string, allowedHosts: readonly string[]): boolean {
  try {
    const url = new URL(raw, window.location.origin)
    if (url.origin === window.location.origin) return true
    if (url.protocol !== 'https:') return false
    return allowedHosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))
  } catch {
    return false
  }
}

/**
 * Sanitise CMS HTML (content pages) before rendering. The server should already
 * sanitise; this is defence in depth. Scripts, inline handlers, iframes, forms
 * and style attributes are removed.
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'iframe', 'form', 'input', 'script', 'object', 'embed'],
    FORBID_ATTR: ['style', 'onerror', 'onclick', 'onload'],
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|\/(?!\/))/i,
  })
}

/** Initials from a display name: "Nehemiah Okoye" → "NO". */
export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || '?'
  )
}
