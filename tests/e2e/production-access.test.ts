import { expect, test } from '@playwright/test'

test('a forged M0 demo cookie cannot authenticate', async ({ page, context }) => {
  await context.addCookies([
    {
      name: 'nxmr-demo-session',
      value: 'true',
      url: process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3000',
      sameSite: 'Lax',
    },
  ])
  await page.goto('/agenda')
  await expect(page).toHaveURL(/\/login\?redirect=\/agenda$/)
  await expect(page.getByRole('button', { name: 'Continue with GitHub' })).toBeVisible()
})
