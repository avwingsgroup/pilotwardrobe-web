import { onBeforeUnmount, toValue, watchEffect, type MaybeRefOrGetter } from 'vue'
import { appConfig } from '@/constants/config'

export interface SeoInput {
  title: string
  description?: string
  image?: string | null
  /** Path for canonical URL; defaults to current location without query. */
  canonicalPath?: string
  type?: 'website' | 'product' | 'profile' | 'article'
  noindex?: boolean
  /** schema.org JSON-LD object (e.g. Product). */
  jsonLd?: Record<string, unknown> | null
}

const DEFAULT_DESCRIPTION =
  'Buy, sell or swap premium aviation gear with KYC-verified pilots, crew and engineers. Every payment held in escrow until your gear lands.'

function setMeta(attr: 'name' | 'property', key: string, content: string | undefined) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!content) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

const JSON_LD_ID = 'pw-jsonld'

/**
 * Client-side head management for the SPA. Crawlers that execute JS (Googlebot)
 * pick these up; for social unfurlers prerendering/SSR is recommended — see
 * README §SEO.
 */
export function useSeo(input: MaybeRefOrGetter<SeoInput>) {
  watchEffect(() => {
    const seo = toValue(input)
    const title = seo.title ? `${seo.title} · ${appConfig.name}` : appConfig.name
    const description = seo.description ?? DEFAULT_DESCRIPTION
    const canonical = `${appConfig.appUrl}${seo.canonicalPath ?? window.location.pathname}`
    document.title = title
    setMeta('name', 'description', description)
    setMeta('name', 'robots', seo.noindex ? 'noindex, nofollow' : 'index, follow')
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:type', seo.type ?? 'website')
    setMeta('property', 'og:url', canonical)
    setMeta('property', 'og:image', seo.image ?? `${appConfig.appUrl}/icon-512.png`)
    setMeta('name', 'twitter:card', seo.image ? 'summary_large_image' : 'summary')
    setLink('canonical', canonical)

    document.getElementById(JSON_LD_ID)?.remove()
    if (seo.jsonLd) {
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.id = JSON_LD_ID
      // JSON.stringify output; `<` escaped so it can't close the script tag.
      script.textContent = JSON.stringify(seo.jsonLd).replace(/</g, '\\u003c')
      document.head.appendChild(script)
    }
  })

  onBeforeUnmount(() => document.getElementById(JSON_LD_ID)?.remove())
}
