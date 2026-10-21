import { afterEach, beforeEach } from 'vitest'

// jsdom lacks these browser APIs used by components.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({ matches: false, media: query, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false }) as unknown as MediaQueryList
}
window.scrollTo = () => undefined
Element.prototype.scrollIntoView = () => undefined
if (!('structuredClone' in globalThis)) {
  ;(globalThis as { structuredClone?: unknown }).structuredClone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T
}

beforeEach(() => {
  sessionStorage.clear()
  localStorage.clear()
})

afterEach(() => {
  document.body.innerHTML = ''
})
