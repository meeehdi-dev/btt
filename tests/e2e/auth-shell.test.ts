import { expect, test } from '@playwright/test'
import { testAuth } from '../../server/utils/auth-test'

test('redirects unauthenticated users and supports an authenticated shell session', async ({
  page,
  context,
}) => {
  await page.goto('/today')
  await expect(page).toHaveURL(/\/login\?redirect=\/today$/)
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()

  const helpers = (await testAuth.$context).test
  const user = helpers.createUser({
    name: 'E2E Nxmr User',
    email: `nxmr-e2e-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(user)

  try {
    await context.addCookies(await helpers.getCookies({ userId: user.id, domain: '127.0.0.1' }))
    await page.goto('/today')
    await expect(page).toHaveURL(/\/today$/)
    await expect(page.getByText('E2E Nxmr User')).toBeVisible()

    for (const [label, path] of [
      ['Projects', '/projects'],
      ['Tickets', '/tickets'],
      ['Settings', '/settings'],
    ] as const) {
      await page.getByRole('link', { name: label }).click()
      await expect(page).toHaveURL(new RegExp(`${path}$`))
    }

    await page.reload()
    await expect(page.getByText('E2E Nxmr User')).toBeVisible()
    await page.getByRole('button', { name: 'Sign out' }).click({ noWaitAfter: true })
    await page.waitForURL(/\/login$/)
  } finally {
    await helpers.deleteUser(user.id)
  }
})
