import { expect, test, type Page } from '@playwright/test'
import { testAuth } from '../../server/utils/auth-test'
import { db } from '../../server/db'
import {
  client as clientTable,
  project as projectTable,
  release as releaseTable,
} from '../../server/db/schema'
import { eq, inArray } from 'drizzle-orm'

const uuidv7Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function expectTooltip(page: Page, text: string) {
  await expect(page.locator('[data-slot="content"]').filter({ hasText: text })).toBeVisible()
}

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
    image: 'https://avatars.githubusercontent.com/u/12345?v=4',
    email: `nxmr-e2e-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(user)

  try {
    await context.addCookies(await helpers.getCookies({ userId: user.id, domain: '127.0.0.1' }))
    await page.goto('/today')
    await expect(page).toHaveURL(/\/today$/)
    await expect(page.getByRole('button', { name: 'Account: E2E Nxmr User' })).toBeVisible()
    const sidebar = page.getByRole('complementary', { name: 'Sidebar' })
    const sidebarToggle = sidebar.getByRole('button', { name: /sidebar/ })
    const sidebarTooltip = await sidebarToggle.getAttribute('aria-label')
    await expect(sidebarToggle).not.toHaveAttribute('title')
    await page.waitForLoadState('networkidle')
    await sidebarToggle.hover()
    await expectTooltip(page, sidebarTooltip!)
    const todayLink = sidebar.getByRole('link', { name: 'Today' })
    expect(
      await todayLink.evaluate((link) => {
        const icon = link.querySelector('[aria-hidden="true"]')
        const left = link.getBoundingClientRect()
        const right = icon?.getBoundingClientRect()
        return right ? Math.abs((left.left + left.right) / 2 - (right.left + right.right) / 2) : 100
      }),
    ).toBeLessThan(2)
    const headerSearch = page.getByRole('searchbox', { name: 'Search workspace' })
    expect(
      await headerSearch.evaluate((input) => {
        const header = input.closest('header')!.getBoundingClientRect()
        const search = input.closest('.relative')!.getBoundingClientRect()
        return Math.abs((header.left + header.right) / 2 - (search.left + search.right) / 2)
      }),
    ).toBeLessThan(2)

    for (const [label, path] of [
      ['Projects', '/projects'],
      ['Tickets', '/tickets'],
      ['Settings', '/settings'],
    ] as const) {
      if (label === 'Settings') {
        await page.waitForLoadState('networkidle')
        await page.getByRole('button', { name: 'Account: E2E Nxmr User' }).click()
      }
      await page.getByRole('link', { name: label }).click()
      await expect(page).toHaveURL(new RegExp(`${path}$`))
    }

    await page.reload()
    const account = page.getByRole('button', { name: 'Account: E2E Nxmr User' })
    await expect(account).toBeVisible()
    await expect(account.locator('img')).toHaveAttribute(
      'src',
      'https://avatars.githubusercontent.com/u/12345?v=4',
    )
    await page.waitForLoadState('networkidle')
    await account.click()
    await page.getByRole('button', { name: 'Sign out' }).click({ noWaitAfter: true })
    await page.waitForURL(/\/login$/)
  } finally {
    await helpers.deleteUser(user.id)
  }
})

test('creates and archives the client hierarchy', async ({ page, context }) => {
  const helpers = (await testAuth.$context).test
  const user = helpers.createUser({
    name: 'E2E M2 User',
    email: `nxmr-m2-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(user)

  try {
    await context.addCookies(await helpers.getCookies({ userId: user.id, domain: '127.0.0.1' }))
    await page.goto('/projects/new')
    await expect(page.getByRole('heading', { name: 'Create a client first' })).toBeVisible()
    await page.goto('/releases/new')
    await expect(page.getByRole('heading', { name: 'Create a project first' })).toBeVisible()
    const clientResponse = await page.request.post('/api/clients', {
      data: { name: 'M2 Client', color: '#ABC123' },
    })
    expect(clientResponse.ok()).toBeTruthy()
    const client = await clientResponse.json()
    expect(client.id).toMatch(uuidv7Pattern)
    expect(client.userId).toBe(user.id)
    const projectResponse = await page.request.post('/api/projects', {
      data: { clientId: client.id, name: 'M2 Project', color: '#ABC123' },
    })
    expect(projectResponse.ok()).toBeTruthy()
    const project = await projectResponse.json()
    expect(project.id).toMatch(uuidv7Pattern)
    expect(project.clientId).toBe(client.id)
    const releaseResponse = await page.request.post('/api/releases', {
      data: { projectId: project.id, name: 'M2 Release', targetDate: '2030-02-01' },
    })
    expect(releaseResponse.ok()).toBeTruthy()
    const release = await releaseResponse.json()
    expect(release.id).toMatch(uuidv7Pattern)
    expect(release.projectId).toBe(project.id)

    await page.goto('/clients')
    const archiveToggle = page.getByRole('button', { name: 'Show archived' })
    await expect(archiveToggle).toBeVisible()
    await expect(archiveToggle).not.toHaveAttribute('title')
    await page.waitForLoadState('networkidle')
    await archiveToggle.hover()
    await expectTooltip(page, 'Show archived')
    await page.goto(`/clients/${client.id}`)
    const clientHeading = page.getByRole('heading', { name: 'M2 Client' })
    await expect(clientHeading).toBeVisible()
    const clientsCrumb = page.getByRole('main').getByRole('link', { name: 'Clients' })
    expect(
      await clientsCrumb.evaluate((link) => {
        const crumb = link.getBoundingClientRect()
        const title = document.querySelector('h1')!.getBoundingClientRect()
        return (
          Math.abs((crumb.top + crumb.bottom) / 2 - (title.top + title.bottom) / 2) < 5 &&
          crumb.right <= title.left
        )
      }),
    ).toBe(true)
    await expect(page.getByText('M2 Project')).toBeVisible()
    await page.goto(`/projects/${project.id}`)
    await expect(page.getByText('M2 Release')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Show archived' })).toBeVisible()
    const markDone = page.getByRole('button', { name: 'Mark release as done' })
    await expect(markDone).toBeVisible()
    await expect(markDone).not.toHaveAttribute('title')
    await page.waitForLoadState('networkidle')
    await markDone.hover()
    await expectTooltip(page, 'Mark done')
    expect(
      (await page.request.patch(`/api/releases/${release.id}`, { data: { archived: true } })).ok(),
    ).toBeTruthy()
    await page.reload()
    await expect(page.getByText('M2 Release')).toBeHidden()
    await page.goto(`/projects/${project.id}?archived=true`)
    await expect(page.getByRole('button', { name: 'Hide archived' })).toBeVisible()
    await expect(page.getByText('M2 Release')).toBeVisible()

    expect(
      (await page.request.patch(`/api/clients/${client.id}`, { data: { archived: true } })).ok(),
    ).toBeTruthy()
    expect((await (await page.request.get('/api/projects')).json()).projects).toHaveLength(0)
    expect(
      (
        await page.request.patch(`/api/clients/${client.id}`, {
          data: { archived: false, name: 'Edited Client' },
        })
      ).ok(),
    ).toBeTruthy()
    expect(
      (await page.request.patch(`/api/releases/${release.id}`, { data: { archived: true } })).ok(),
    ).toBeTruthy()
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/clients/new')
    const createButton = page.getByRole('button', { name: 'Create client' })
    const cancelButton = page.getByRole('link', { name: 'Cancel' })
    const [createBounds, cancelBounds] = await Promise.all([
      createButton.boundingBox(),
      cancelButton.boundingBox(),
    ])
    if (!createBounds || !cancelBounds) throw new Error('Mobile form actions must be visible')
    expect(createBounds.y).toBeLessThan(cancelBounds.y)
    expect(Math.abs(createBounds.x - cancelBounds.x)).toBeLessThan(1)
    expect(createBounds.width).toBe(cancelBounds.width)
  } finally {
    const ownedClients = await db
      .select({ id: clientTable.id })
      .from(clientTable)
      .where(eq(clientTable.userId, user.id))
    const ownedClientIds = ownedClients.map(({ id }) => id)
    const ownedProjects = ownedClientIds.length
      ? await db
          .select({ id: projectTable.id })
          .from(projectTable)
          .where(inArray(projectTable.clientId, ownedClientIds))
      : []
    const ownedProjectIds = ownedProjects.map(({ id }) => id)
    if (ownedProjectIds.length)
      await db.delete(releaseTable).where(inArray(releaseTable.projectId, ownedProjectIds))
    if (ownedClientIds.length)
      await db.delete(projectTable).where(inArray(projectTable.clientId, ownedClientIds))
    if (ownedClientIds.length)
      await db.delete(clientTable).where(inArray(clientTable.id, ownedClientIds))
    await helpers.deleteUser(user.id)
  }
})
