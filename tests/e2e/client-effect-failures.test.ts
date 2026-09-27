import { expect, test } from '@playwright/test'
import { testAuth } from '../../server/utils/auth-test'

async function createUser() {
  const helpers = (await testAuth.$context).test
  const user = helpers.createUser({
    name: 'Client Effect E2E',
    email: `client-effect-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(user)
  return { helpers, user }
}

test('failed client-list reads are not empty success and can be retried', async ({
  page,
  context,
}) => {
  const { helpers, user } = await createUser()
  let fail = true
  try {
    await context.addCookies(await helpers.getCookies({ userId: user.id, domain: '127.0.0.1' }))
    await page.route('**/api/clients**', async (route) => {
      if (fail && route.request().method() === 'GET') {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ statusCode: 503, statusMessage: 'private database detail' }),
        })
      } else {
        await route.continue()
      }
    })
    await page.goto('/today')
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: 'Clients' }).click()
    await expect(page.getByRole('alert')).toContainText('Could not load clients')
    await expect(page.getByRole('alert')).not.toContainText('private database detail')
    await expect(page.getByText('No active clients yet')).toHaveCount(0)

    fail = false
    await page.getByRole('button', { name: 'Retry' }).click()
    await expect(page.getByText('No active clients yet')).toBeVisible()
  } finally {
    await helpers.deleteUser(user.id)
  }
})

test('a non-404 detail read failure remains retryable instead of becoming not found', async ({
  page,
  context,
}) => {
  const { helpers, user } = await createUser()
  try {
    await context.addCookies(await helpers.getCookies({ userId: user.id, domain: '127.0.0.1' }))
    const response = await page.request.post('/api/clients', { data: { name: 'Retryable client' } })
    const client = await response.json()
    let fail = true
    await page.route(`**/api/clients/${client.id}**`, async (route) => {
      if (fail && route.request().method() === 'GET') {
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ statusCode: 503, statusMessage: 'private detail' }),
        })
      } else {
        await route.continue()
      }
    })
    await page.goto('/clients')
    await page.waitForLoadState('networkidle')
    await page.getByRole('link', { name: 'Open client Retryable client' }).click()
    await expect(page.getByRole('alert')).toContainText('Could not load client')
    await expect(page.getByRole('alert')).not.toContainText('private detail')
    await expect(page.getByRole('heading', { name: 'Client not found' })).toHaveCount(0)

    fail = false
    await page.getByRole('button', { name: 'Retry loading client' }).click()
    await expect(page.getByRole('heading', { name: 'Retryable client' })).toBeVisible()
  } finally {
    await helpers.deleteUser(user.id)
  }
})

test('successful settings save followed by failed refresh is explicit and read-retryable', async ({
  page,
  context,
}) => {
  const { helpers, user } = await createUser()
  let failRefresh = true
  let refreshFailures = 0
  try {
    await context.addCookies(await helpers.getCookies({ userId: user.id, domain: '127.0.0.1' }))
    await page.route('**/api/settings**', async (route) => {
      if (route.request().method() === 'GET' && failRefresh) {
        refreshFailures++
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ statusCode: 503, statusMessage: 'private settings detail' }),
        })
      } else {
        await route.continue()
      }
    })
    await page.goto('/settings')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: 'Save settings' }).click()
    await expect.poll(() => refreshFailures).toBeGreaterThan(0)
    await expect(
      page.getByRole('alert').filter({ hasText: 'Settings saved; refresh failed' }),
    ).toBeVisible()
    await expect(page.getByText('private settings detail')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Save settings' })).toHaveCount(0)

    failRefresh = false
    await page.getByRole('button', { name: 'Retry loading settings' }).click()
    await expect(page.getByRole('status')).toContainText('Settings saved.')
    await expect(page.getByRole('button', { name: 'Save settings' })).toBeVisible()
  } finally {
    await helpers.deleteUser(user.id)
  }
})

test('search failures are distinct from no matches and editing the query retries', async ({
  page,
  context,
}) => {
  const { helpers, user } = await createUser()
  let fail = true
  let searchFailures = 0
  try {
    await context.addCookies(await helpers.getCookies({ userId: user.id, domain: '127.0.0.1' }))
    await page.route('**/api/search**', async (route) => {
      if (fail) {
        searchFailures++
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ statusCode: 503, statusMessage: 'private search detail' }),
        })
      } else {
        await route.continue()
      }
    })
    await page.goto('/today')
    await page.waitForLoadState('networkidle')
    const search = page.getByRole('searchbox', { name: 'Search workspace' })
    await search.fill('retry search')
    await expect.poll(() => searchFailures).toBeGreaterThan(0)
    const listbox = page.getByRole('listbox', { name: 'Search results' })
    await expect(listbox).toContainText('Search failed. Try another query.')
    await expect(listbox).not.toContainText('private search detail')
    await expect(listbox).not.toContainText('No matches.')

    fail = false
    await search.fill('retry search again')
    await expect(listbox).toContainText('No matches.')
  } finally {
    await helpers.deleteUser(user.id)
  }
})

test('rejected GitHub sign-in shows a safe accessible error', async ({ page }) => {
  let intercepted = false
  await page.route('**/api/auth/**', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue()
      return
    }
    intercepted = true
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ status: 503, message: 'private provider detail' }),
    })
  })
  await page.goto('/login')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Continue with GitHub' }).click()
  await expect.poll(() => intercepted).toBe(true)
  await expect(page.getByRole('alert')).toContainText('Sign-in failed')
  await expect(page.getByRole('alert')).not.toContainText('private provider detail')
})
