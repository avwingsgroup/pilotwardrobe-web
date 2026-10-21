import type { CurrencyCode, Money } from '@/types/api'

/** Minor-unit exponent per currency (all supported currencies use 2). */
const EXPONENT: Record<CurrencyCode, number> = { USD: 2, NGN: 2, GHS: 2, GBP: 2, EUR: 2 }

const formatters = new Map<string, Intl.NumberFormat>()

function formatter(currency: string, locale: string, compact: boolean, whole: boolean) {
  const key = `${currency}|${locale}|${compact}|${whole}`
  let f = formatters.get(key)
  if (!f) {
    f = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation: compact ? 'compact' : 'standard',
      minimumFractionDigits: whole ? 0 : undefined,
      maximumFractionDigits: whole ? 0 : undefined,
    })
    formatters.set(key, f)
  }
  return f
}

export const toMajor = (amount: number, currency: CurrencyCode = 'USD') => amount / 10 ** EXPONENT[currency]

/** Convert a user-typed major value ("745.5") into integer minor units without float drift. */
export function toMinor(value: string | number, currency: CurrencyCode = 'USD'): number {
  const text = String(value).replace(/[^0-9.\-]/g, '')
  if (!text || text === '-' || text === '.') return 0
  const [whole = '0', fraction = ''] = text.split('.')
  const exp = EXPONENT[currency]
  const frac = (fraction + '0'.repeat(exp)).slice(0, exp)
  const sign = whole.startsWith('-') ? -1 : 1
  return sign * (Math.abs(parseInt(whole || '0', 10)) * 10 ** exp + parseInt(frac || '0', 10))
}

export interface FormatOptions {
  locale?: string
  compact?: boolean
  /** Drop cents ("$745") as in compact card layouts. */
  whole?: boolean
  /** Prefer the server-provided `formatted` string when available. */
  preferServer?: boolean
}

export function formatMoney(money: Money | null | undefined, opts: FormatOptions = {}): string {
  if (!money) return '—'
  if (opts.preferServer && money.formatted) return money.formatted
  const { locale = 'en-US', compact = false, whole = false } = opts
  return formatter(money.currency, locale, compact, whole).format(toMajor(money.amount, money.currency))
}

/** Signed amount for ledgers: +$133.40 / −$1,200.00 */
export function formatSigned(money: Money, direction: 'credit' | 'debit') {
  return `${direction === 'credit' ? '+' : '−'}${formatMoney({ ...money, amount: Math.abs(money.amount) })}`
}

export const money = (amount: number, currency: CurrencyCode = 'USD'): Money => ({ amount, currency })

export const addMoney = (...items: (Money | null | undefined)[]): Money => {
  const valid = items.filter((m): m is Money => !!m)
  const currency = valid[0]?.currency ?? 'USD'
  return { amount: valid.reduce((sum, m) => sum + m.amount, 0), currency }
}

export function percentBelow(price: Money, offer: Money) {
  if (!price.amount) return 0
  return Math.round(((price.amount - offer.amount) / price.amount) * 1000) / 10
}
