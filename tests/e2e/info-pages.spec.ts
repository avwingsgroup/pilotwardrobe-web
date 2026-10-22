import { expect, test } from '@playwright/test'

/**
 * Information centre (VC1–VC13): navigation, search/filter, deep links,
 * consent persistence and the contact form. Runs in mock API mode.
 */
// These flows aren't about consent: start with a choice made so the banner stays out of the way.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('pw.cookie-consent')) localStorage.setItem('pw.cookie-consent', JSON.stringify({ functional: false, analytics: false, marketing: false, updatedAt: '2026-10-01T00:00:00Z', version: 1 }))
  })
})

const PAGES: [string, RegExp][] = [
  ['/how-to-swap', /Trade gear pilot to pilot/],
  ['/how-to-sell', /Turn idle kit into cash/],
  ['/freight-guide', /Pack it right/],
  ['/seller-fees', /No listing fees/],
  ['/terms', /Terms of service/],
  ['/privacy', /Privacy policy/],
  ['/returns', /Returns & refunds/],
  ['/escrow-disputes', /Escrow & disputes/],
  ['/cookies', /Cookie policy/],
  ['/help', /How can we help/],
  ['/contact', /Talk to the ground crew/],
  ['/faq', /Frequently asked questions/],
  ['/about', /Built by pilots/],
]

test('every info page renders its heading and marks its sub-nav link current', async ({ page }) => {
  for (const [path, heading] of PAGES) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading)
    await expect(page.getByRole('navigation', { name: 'Guides, policies and support' }).locator('[aria-current="page"]')).toHaveCount(1)
  }
})

test('earlier URLs redirect to the designed pages', async ({ page }) => {
  await page.goto('/how-it-works')
  await expect(page).toHaveURL(/\/how-to-swap$/)
  await page.goto('/help/returns-refunds')
  await expect(page).toHaveURL(/\/returns$/)
})

test('FAQ: topic filter, search and deep link', async ({ page }) => {
  await page.goto('/faq')
  await page.getByRole('button', { name: 'Swaps', exact: true }).click()
  await expect(page).toHaveURL(/topic=swaps/)
  await expect(page.getByRole('button', { name: 'How does a swap work?' })).toHaveAttribute('aria-expanded', 'true')

  await page.getByRole('searchbox', { name: 'Search questions' }).fill('payout pending')
  await page.locator('#main').getByRole('search').getByRole('button', { name: 'Search' }).click()
  await expect(page.getByRole('heading', { name: /Results for/ })).toContainText('1 question')

  await page.goto('/faq#holding-pattern')
  await expect(page.getByRole('button', { name: 'What does “Holding pattern” mean?' })).toHaveAttribute('aria-expanded', 'true')
})

test('policy index opens collapsed sections', async ({ page }) => {
  await page.goto('/terms')
  const toc = page.locator('.pw-policy__toc')
  if ((await toc.getAttribute('open')) === null) await toc.locator('summary').click()
  await toc.getByRole('link', { name: /Liability/ }).click()
  await expect(page.getByRole('button', { name: /Liability/ })).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByText(/limited to the fees you paid us/)).toBeVisible()
})

test('cookie preferences persist on this device', async ({ page }) => {
  await page.goto('/cookies')
  const analytics = page.getByRole('switch', { name: 'Analytics' })
  await expect(analytics).toHaveAttribute('aria-checked', 'false')
  await analytics.click()
  await page.getByRole('button', { name: 'Save preferences' }).click()
  await page.reload()
  await expect(page.getByRole('switch', { name: 'Analytics' })).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByRole('switch', { name: 'Strictly necessary' })).toBeDisabled()
})

test('contact form validates, then sends', async ({ page }) => {
  await page.goto('/contact')
  await page.getByRole('button', { name: 'Request a call' }).click()
  await page.getByLabel('Your name').fill('Ada Obi')
  await page.getByLabel('Email').fill('ada@example.com')
  await page.getByRole('button', { name: 'Send message' }).click()
  await expect(page.getByText('Enter a phone number we can call.')).toBeVisible()
  await expect(page.getByText('Add a short subject.')).toBeVisible()

  await page.getByLabel('Phone number').fill('+234 803 000 0000')
  await page.getByLabel('Subject').fill('Headset never arrived')
  await page.getByRole('textbox', { name: 'Message' }).fill('Tracking has not moved in three days, please call me.')
  await page.getByRole('button', { name: 'Send message' }).click()
  await expect(page.getByRole('heading', { name: 'Message received' })).toBeVisible()
})

test('help search hands off to FAQs', async ({ page }) => {
  await page.goto('/help')
  await page.getByRole('searchbox', { name: 'Search help' }).fill('escrow')
  await page.locator('#main').getByRole('search').getByRole('button', { name: 'Search' }).click()
  await expect(page).toHaveURL(/\/faq\?q=escrow/)
  await expect(page.getByRole('heading', { name: /Results for “escrow”/ })).toBeVisible()
})
