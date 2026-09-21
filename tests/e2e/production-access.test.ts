import { expect, test } from '@playwright/test'

// Run this file against `pnpm preview` with PLAYWRIGHT_BASE_URL and
// PLAYWRIGHT_SKIP_DEV_SERVER=1 after a production build.
test.skip(!process.env.PLAYWRIGHT_BASE_URL, 'production smoke test requires PLAYWRIGHT_BASE_URL')

test('production fails closed even with a forged demo cookie', async ({ page, context }) => {
  await context.addCookies([
    {
      name: 'nxmr-demo-session',
      value: 'true',
      url: process.env.PLAYWRIGHT_BASE_URL,
      secure: true,
      sameSite: 'Lax',
    },
  ])
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByText('Authentication is being prepared for M1.')).toBeVisible()
})
