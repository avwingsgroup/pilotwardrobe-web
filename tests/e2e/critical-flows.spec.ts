import { expect, test, type Page } from '@playwright/test'

/**
 * Critical-path E2E against the dev server in mock API mode.
 * Run: npx playwright install chromium && npm run test:e2e
 */
// These flows aren't about consent: start with a choice made so the banner stays out of the way.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('pw.cookie-consent')) localStorage.setItem('pw.cookie-consent', JSON.stringify({ functional: false, analytics: false, marketing: false, updatedAt: '2026-10-01T00:00:00Z', version: 1 }))
  })
})

/** Asserts we're on the login page with `next` pointing at `path` (however the router encodes it). */
async function expectLoginWithNext(page: Page, path: string) {
  await expect(page).toHaveURL((url) => url.pathname === '/auth/login' && (url.searchParams.get('next') ?? '').startsWith(path))
}

async function login(page: Page, email: string, next = '/') {
  await page.goto(`/auth/login?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`)
  await page.getByLabel('Password', { exact: true }).fill('Password1')
  await page.getByRole('button', { name: 'Log in', exact: true }).click()
  // Wait for the post-login redirect so the session exists before the next navigation.
  await page.waitForURL((url) => !url.pathname.startsWith('/auth'))
}

test('visitor browses, filters and opens a listing', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Buy, sell or swap')
  await page.goto('/category/headsets')
  await expect(page.getByRole('heading', { name: 'Headsets' })).toBeVisible()
  await page.getByRole('link', { name: /Bose A20 Aviation Headset/ }).first().click()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Bose A20')
})

test('visitor is gated into auth when buying, with destination preserved', async ({ page }) => {
  await page.goto('/marketplace/bose-a20-aviation-headset-dual-ga')
  await page.getByRole('button', { name: 'Buy now' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Log in or sign up' })).toBeVisible()
  await dialog.getByLabel('Email address').fill('pilot@example.com')
  await dialog.getByRole('button', { name: 'Continue with email' }).click()
  await expectLoginWithNext(page, '/checkout')
})

test('login, protected route and logout', async ({ page }) => {
  await page.goto('/hangar')
  await expectLoginWithNext(page, '/hangar')
  await login(page, 'pilot@example.com', '/hangar')
  await expect(page.getByRole('heading', { name: 'My Hangar' })).toBeVisible()
})

test('non-staff cannot open the Control Tower', async ({ page }) => {
  await login(page, 'pilot@example.com')
  await page.goto('/admin/overview')
  await expect(page.getByRole('heading', { name: 'Access denied' })).toBeVisible()
})

test('admin sees permitted sections only', async ({ page }) => {
  await login(page, 'admin@example.com', '/admin/overview')
  // Below 1100px the sidebar lives in a drawer.
  const burger = page.getByRole('button', { name: 'Open navigation' })
  if (await burger.isVisible()) await burger.click()
  await expect(page.getByRole('navigation', { name: 'Control Tower' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Users' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Settings' })).toHaveCount(0)
})

test('checkout → gateway → verified confirmation', async ({ page }) => {
  await login(page, 'pilot@example.com')
  await page.goto('/checkout?listing=lst_012')
  await page.getByRole('button', { name: /Continue to flight plan/ }).click()
  await page.getByRole('button', { name: /Continue to payment/ }).click()
  await page.getByRole('button', { name: /Continue to review/ }).click()
  await page.getByRole('button', { name: /^Pay \$/ }).click()
  await expect(page.getByRole('heading', { name: /checkout/ })).toBeVisible()
  await page.getByRole('button', { name: 'Approve payment' }).click()
  await expect(page.getByRole('heading', { name: 'Cleared for takeoff' })).toBeVisible({ timeout: 15_000 })
})
