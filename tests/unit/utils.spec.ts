import { describe, expect, it } from 'vitest'
import { formatMoney, toMajor, toMinor, percentBelow } from '@/utils/money'
import { safeRedirect, sanitizeHtml, initials } from '@/utils/security'
import { passwordStrength, email, username } from '@/utils/validators'
import { camelToSnake, snakeToCamel, toCamel, toSnake } from '@/api/case'

describe('money (minor units)', () => {
  it('converts user input to integer minor units without float drift', () => {
    expect(toMinor('950.00', 'USD')).toBe(95000)
    expect(toMinor('0.1', 'USD') + toMinor('0.2', 'USD')).toBe(30)
    expect(toMinor('150,000.00', 'NGN')).toBe(15000000)
    expect(toMinor('745.5', 'USD')).toBe(74550)
    expect(toMinor('', 'USD')).toBe(0)
  })

  it('formats money for display', () => {
    expect(formatMoney({ amount: 95000, currency: 'USD' })).toBe('$950.00')
    expect(formatMoney({ amount: 74500, currency: 'USD' }, { whole: true })).toBe('$745')
    expect(formatMoney(null)).toBe('—')
    expect(toMajor(15000000, 'NGN')).toBe(150000)
  })

  it('prefers the server-formatted string when asked', () => {
    expect(formatMoney({ amount: 1, currency: 'NGN', formatted: '₦0.01' }, { preferServer: true })).toBe('₦0.01')
  })

  it('computes percent below asking', () => {
    expect(percentBelow({ amount: 74500, currency: 'USD' }, { amount: 71200, currency: 'USD' })).toBe(4.4)
  })
})

describe('safeRedirect (open-redirect protection)', () => {
  it.each([
    ['https://evil.tld', '/'],
    ['//evil.tld/path', '/'],
    ['/\\evil.tld', '/'],
    ['javascript:alert(1)', '/'],
    ['hangar', '/'],
    ['/auth/login', '/'],
    [123, '/'],
  ])('rejects %s', (input, expected) => {
    expect(safeRedirect(input)).toBe(expected)
  })

  it('keeps same-origin paths with query and hash', () => {
    expect(safeRedirect('/marketplace?search=bose#top')).toBe('/marketplace?search=bose#top')
    expect(safeRedirect('/checkout?listing=lst_001&size=M')).toBe('/checkout?listing=lst_001&size=M')
  })
})

describe('sanitizeHtml', () => {
  it('strips scripts, handlers and javascript: URLs from CMS content', () => {
    const dirty = '<p onclick="steal()">Hi</p><script>alert(1)</script><a href="javascript:alert(1)">x</a><img src=x onerror=alert(1)>'
    const clean = sanitizeHtml(dirty)
    expect(clean).not.toMatch(/script|onclick|onerror|javascript:/i)
    expect(clean).toContain('<p>Hi</p>')
  })
})

describe('validators', () => {
  it('scores password strength per VA4 rules', () => {
    expect(passwordStrength('Delta•Echo7').valid).toBe(true)
    expect(passwordStrength('Flaps15').score).toBe(3)
    expect(passwordStrength('flaps').valid).toBe(false)
  })

  it('validates email and username', () => {
    expect(email('pilot@example.com')).toBe(true)
    expect(email('pilot@')).not.toBe(true)
    expect(username('airboy_ng')).toBe(true)
    expect(username('Air Boy')).not.toBe(true)
  })

  it('builds initials', () => {
    expect(initials('Nehemiah Okoye')).toBe('NO')
  })
})

describe('case conversion', () => {
  it('converts keys only, never values', () => {
    expect(snakeToCamel('first_name')).toBe('firstName')
    expect(camelToSnake('passwordConfirmation')).toBe('password_confirmation')
    const wire = { first_name: 'A', items: [{ unit_price: { amount: 1, currency: 'USD' } }], condition: 'like_new' }
    const domain = toCamel<Record<string, unknown>>(wire)
    expect(domain).toEqual({ firstName: 'A', items: [{ unitPrice: { amount: 1, currency: 'USD' } }], condition: 'like_new' })
    expect(toSnake(domain)).toEqual(wire)
  })
})
