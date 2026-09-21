import { expect, test } from '@playwright/test'

test('redirects to login and supports development demo access', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/login(?:\?|$)/)
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  await page.getByRole('button', { name: 'Continue to demo dashboard' }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('heading', { name: 'Your workday starts here' })).toBeVisible()
  await page.getByRole('link', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/login(?:\?|$)/)
})
