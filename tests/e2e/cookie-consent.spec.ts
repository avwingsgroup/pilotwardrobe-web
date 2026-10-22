import { expect, test } from '@playwright/test'

/** VC14 banner and VC15 preferences dialog. */
const banner = (page: import('@playwright/test').Page) => page.getByRole('region', { name: 'We use cookies' })

test('first visit shows the banner; Accept all stores the choice and hides it', async ({ page }) => {
  await page.goto('/')
  await expect(banner(page)).toBeVisible()
  await banner(page).getByRole('button', { name: 'Accept all' }).click()
  await expect(banner(page)).toBeHidden()
  await page.reload()
  await expect(banner(page)).toBeHidden()
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('pw.cookie-consent') ?? '{}'))
  expect(stored).toMatchObject({ functional: true, analytics: true, marketing: true, version: 1 })
})

test('Reject all keeps only essential cookies', async ({ page }) => {
  await page.goto('/marketplace')
  await banner(page).getByRole('button', { name: 'Reject all' }).click()
  await expect(banner(page)).toBeHidden()
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('pw.cookie-consent') ?? '{}'))
  expect(stored).toMatchObject({ functional: false, analytics: false, marketing: false })
})

test('Manage preferences: save a custom choice, reopen from the footer, and the policy page agrees', async ({ page }) => {
  await page.goto('/')
  await banner(page).getByRole('button', { name: 'Manage preferences' }).click()
  const dialog = page.getByRole('dialog', { name: 'Cookie preferences' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('switch', { name: 'Essential' })).toBeDisabled()
  await dialog.getByRole('switch', { name: 'Analytics' }).click()
  await dialog.getByRole('button', { name: 'Save choices' }).click()
  await expect(dialog).toBeHidden()
  await expect(banner(page)).toBeHidden()

  await page.getByRole('button', { name: 'Cookie settings' }).click()
  await expect(page.getByRole('dialog', { name: 'Cookie preferences' }).getByRole('switch', { name: 'Analytics' })).toHaveAttribute('aria-checked', 'true')
  await page.keyboard.press('Escape')

  await page.goto('/cookies')
  await expect(page.locator('#preferences').getByRole('switch', { name: 'Analytics' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.locator('#preferences').getByRole('switch', { name: 'Marketing' })).toHaveAttribute('aria-checked', 'false')
})

test('closing the dialog without choosing brings the banner back', async ({ page }) => {
  await page.goto('/')
  await banner(page).getByRole('button', { name: 'Manage preferences' }).click()
  await page.getByRole('dialog', { name: 'Cookie preferences' }).getByRole('button', { name: 'Close dialog' }).click()
  await expect(banner(page)).toBeVisible()
})

test('a choice from an older policy version asks again', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pw.cookie-consent', JSON.stringify({ functional: true, analytics: true, marketing: true, updatedAt: '2025-01-01T00:00:00Z', version: 0 })))
  await page.goto('/')
  await expect(banner(page)).toBeVisible()
})
