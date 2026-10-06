import { expect, test, type Locator, type Page } from '@playwright/test'
import { waitForClientMount } from './wait-for-client-mount'
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

async function expectLoginCardCentered(page: Page) {
  const centerOffset = await page
    .getByRole('heading', { name: 'Welcome back' })
    .evaluate((heading) => {
      const main = heading.closest('main')
      if (!main) throw new Error('Login card must be inside main')
      let card: Element = heading
      while (card.parentElement && card.parentElement !== main) card = card.parentElement
      const bounds = card.getBoundingClientRect()
      return Math.abs((bounds.left + bounds.right) / 2 - window.innerWidth / 2)
    })
  expect(centerOffset).toBeLessThanOrEqual(1)
}

async function expectLeftAlignedProjectSummary(card: Locator) {
  const clientButton = card.getByRole('link', { name: 'M2 Client' })
  const countsList = card.getByRole('list', { name: 'Active project contents' })
  const countPill = countsList.locator('li').first()
  await expect(clientButton).toHaveClass(/bg-default/)
  await expect(clientButton).toHaveClass(/px-2/)
  await expect(clientButton).toHaveClass(/text-muted/)
  await expect(countsList).toHaveClass(/text-muted/)
  await expect(countPill).toHaveClass(/bg-default/)
  await expect(countPill).toHaveClass(/px-1/)
  await expect(clientButton.locator('[aria-hidden="true"]')).toBeVisible()
  const [cardSurface, linkSurface, countSurface] = await Promise.all([
    card.evaluate((element) => getComputedStyle(element).backgroundColor),
    clientButton.evaluate((element) => getComputedStyle(element).backgroundColor),
    countPill.evaluate((element) => getComputedStyle(element).backgroundColor),
  ])
  expect(linkSurface).not.toBe(cardSurface)
  expect(countSurface).not.toBe(cardSurface)
  const title = await card.locator('[data-project-card-title]').boundingBox()
  const summary = await card.locator('[data-project-card-summary]').boundingBox()
  const clientLink = await clientButton.boundingBox()
  const counts = await countsList.boundingBox()
  if (!title || !summary || !clientLink || !counts) throw new Error('Project card must be visible')
  expect(summary.y).toBeGreaterThan(title.y)
  expect(summary.height).toBeLessThanOrEqual(24)
  expect(Math.abs(summary.x - title.x)).toBeLessThan(2)
  expect(Math.abs(clientLink.x - summary.x)).toBeLessThan(2)
  expect(counts.x).toBeGreaterThanOrEqual(clientLink.x + clientLink.width - 1)
  expect(counts.x - (clientLink.x + clientLink.width)).toBeLessThanOrEqual(16)
}

async function expectEditBeforeNew(page: Page, editLabel: string, newLabel: string) {
  const edit = page.getByRole('link', { name: editLabel, exact: true })
  const create = page.getByRole('link', { name: newLabel, exact: true })
  await expect(edit).toBeVisible()
  await expect(create).toBeVisible()
  const [editBox, newBox] = await Promise.all([edit.boundingBox(), create.boundingBox()])
  if (!editBox || !newBox) throw new Error('Header actions must be visible')
  expect(Math.abs(editBox.y - newBox.y)).toBeLessThan(4)
  expect(editBox.x + editBox.width).toBeLessThanOrEqual(newBox.x)
}

test('redirects unauthenticated users and supports an authenticated shell session', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/today')
  await expect(page).toHaveURL(/\/login\?redirect=\/today$/)
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  await expectLoginCardCentered(page)

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
    const header = page.getByRole('banner')
    const account = header.getByRole('group', { name: 'Signed in as E2E Nxmr User' })
    await expect(account).toBeVisible()
    await expect(account.getByText('E2E Nxmr User')).toBeVisible()
    await expect(account.locator('img')).toHaveAttribute(
      'src',
      'https://avatars.githubusercontent.com/u/12345?v=4',
    )
    await expect(page.getByRole('complementary', { name: 'Sidebar' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Open menu' })).toHaveCount(0)
    const mainNavigation = header.getByRole('navigation', { name: 'Main navigation' })
    expect(
      (await mainNavigation.getByRole('link').allTextContents()).map((label) => label.trim()),
    ).toEqual(['Today', 'Tickets', 'Clients'])

    const headerSearch = header.getByRole('searchbox', { name: 'Search workspace' })
    expect(
      await headerSearch.evaluate((input) => {
        const headerBounds = input.closest('header')!.getBoundingClientRect()
        const searchBounds = input.closest('[data-header-block="search"]')!.getBoundingClientRect()
        return Math.abs(
          (headerBounds.left + headerBounds.right) / 2 -
            (searchBounds.left + searchBounds.right) / 2,
        )
      }),
    ).toBeLessThan(2)

    const navigationHeight = await mainNavigation
      .getByRole('link', { name: 'Today' })
      .evaluate((element) => element.getBoundingClientRect().height)
    for (const control of [
      header.getByRole('link', { name: 'Settings' }),
      header.getByRole('button', { name: 'Sign out' }),
    ]) {
      const initialStyle = await control.evaluate((element) => ({
        height: element.getBoundingClientRect().height,
        cursor: getComputedStyle(element).cursor,
        background: getComputedStyle(element).backgroundColor,
      }))
      expect(Math.abs(initialStyle.height - navigationHeight)).toBeLessThan(2)
      expect(initialStyle.cursor).toBe('pointer')
      await control.hover()
      const hoverBackground = await control.evaluate(
        (element) => getComputedStyle(element).backgroundColor,
      )
      expect(hoverBackground).not.toBe(initialStyle.background)
    }
    await page.mouse.move(0, 0)

    await mainNavigation.getByRole('link', { name: 'Clients' }).click()
    await expect(page).toHaveURL(/\/clients$/)
    await mainNavigation.getByRole('link', { name: 'Tickets' }).click()
    await expect(page).toHaveURL(/\/tickets$/)
    await header.getByRole('link', { name: 'Settings' }).click()
    await expect(page).toHaveURL(/\/settings$/)

    const projectCollectionResponse = await page.goto('/projects')
    expect(projectCollectionResponse?.status()).toBe(404)
    await expect(page).toHaveURL(/\/projects$/)

    await page.goto('/today')
    await page.reload()
    await waitForClientMount(page)
    await expect(account.locator('img')).toHaveAttribute(
      'src',
      'https://avatars.githubusercontent.com/u/12345?v=4',
    )
    await page.setViewportSize({ width: 1280, height: 900 })
    await header.getByRole('button', { name: 'Sign out' }).click({ noWaitAfter: true })
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
    await page.goto('/releases/new')
    await expect(page.getByRole('heading', { name: 'Create a project first' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Go to clients' })).toHaveAttribute(
      'href',
      '/clients',
    )
    const clientResponse = await page.request.post('/api/clients', {
      data: { name: 'M2 Client', color: '#ABC123' },
    })
    expect(clientResponse.ok()).toBeTruthy()
    const client = await clientResponse.json()
    expect(client.id).toMatch(uuidv7Pattern)
    expect(client.userId).toBe(user.id)
    await page.goto('/projects/new')
    await waitForClientMount(page)
    await page.getByRole('link', { name: 'Cancel' }).click()
    await expect(page).toHaveURL('/clients')
    await page.goto(`/clients/${client.id}`)
    await page.getByRole('link', { name: 'New project' }).click()
    await expect(page).toHaveURL(`/projects/new?client=${client.id}`)
    await waitForClientMount(page)
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('M2 Client')
    await expect(page.getByRole('button', { name: 'Client' })).toContainText('M2 Client')
    await page.getByRole('link', { name: 'Cancel' }).click()
    await expect(page).toHaveURL(`/clients/${client.id}`)
    await page.goto(`/clients/${client.id}`)
    await page.getByRole('link', { name: 'New project' }).click()
    await expect(page).toHaveURL(`/projects/new?client=${client.id}`)
    await waitForClientMount(page)
    await expect(page.getByRole('button', { name: 'Client' })).toContainText('M2 Client')
    await expect(page.getByRole('button', { name: 'Create project' })).toBeEnabled()
    await page.getByRole('textbox', { name: 'Name' }).fill('M2 Project')
    await page.getByRole('button', { name: 'Create project' }).click()
    await expect(page).toHaveURL(/\/projects\/[0-9a-f-]+$/)
    const project = {
      id: new URL(page.url()).pathname.split('/').at(-1)!,
      clientId: client.id,
    }
    expect(project.id).toMatch(uuidv7Pattern)
    await page.goto('/releases/new')
    await page.getByRole('link', { name: 'Cancel' }).click()
    await expect(page).toHaveURL('/clients')
    await page.goto(`/releases/new?project=${project.id}`)
    await waitForClientMount(page)
    await page.getByRole('link', { name: 'Cancel' }).click()
    await expect(page).toHaveURL(`/projects/${project.id}`)
    const releaseResponse = await page.request.post('/api/releases', {
      data: { projectId: project.id, name: 'M2 Release', targetDate: '2030-02-01' },
    })
    expect(releaseResponse.ok()).toBeTruthy()
    const release = await releaseResponse.json()
    expect(release.id).toMatch(uuidv7Pattern)
    expect(release.projectId).toBe(project.id)

    await page.goto('/clients')
    const clientsTitle = page.getByRole('heading', { name: 'Clients', exact: true })
    await expect(clientsTitle).toBeVisible()
    expect((await clientsTitle.boundingBox())?.height).toBeGreaterThan(20)
    const archiveToggle = page.getByRole('button', { name: 'Show archived' })
    await expect(archiveToggle).toBeVisible()
    await expect(page.getByText('View projects and releases', { exact: true })).toHaveCount(0)
    await expect(archiveToggle).not.toHaveAttribute('title')
    await waitForClientMount(page)
    await archiveToggle.hover()
    await expectTooltip(page, 'Show archived')
    await page.goto(`/clients/${client.id}`)
    const clientHeading = page.getByRole('heading', { name: 'M2 Client' })
    await expect(clientHeading).toBeVisible()
    await expect(
      page.getByText('Projects and releases for this client.', { exact: true }),
    ).toHaveCount(0)
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveCount(0)
    await expect(
      page.getByRole('main').getByRole('link', { name: 'Clients', exact: true }),
    ).toHaveCount(0)
    await expectEditBeforeNew(page, 'Edit client', 'New project')
    const clientProjectCard = page.locator(`[data-project-card-id="${project.id}"]`)
    await expect(clientProjectCard.getByText('M2 Project')).toBeVisible()
    await expect(clientProjectCard.getByRole('link', { name: 'M2 Client' })).toBeVisible()
    await expect(clientProjectCard.getByText('1 release')).toBeVisible()
    await expect(clientProjectCard.getByText('0 tickets')).toBeVisible()
    await expect(page.getByText('View releases', { exact: true })).toHaveCount(0)
    await expectLeftAlignedProjectSummary(clientProjectCard)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await clientProjectCard.getByRole('link', { name: 'Open project M2 Project' }).click()
    await expect(page).toHaveURL(`/projects/${project.id}`)
    await expectEditBeforeNew(page, 'Edit project', 'New release')
    await expect(page.getByText('M2 Release')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Show archived' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mark release as done' })).toHaveCount(0)
    await page.goto(`/releases/${release.id}`)
    await waitForClientMount(page)
    await expectEditBeforeNew(page, 'Edit release', 'New ticket')
    await page.getByRole('button', { name: 'Mark release as done' }).click()
    const emptyReleaseWarning = page.getByRole('dialog', { name: 'Mark release as done?' })
    await expect(
      emptyReleaseWarning.getByText('This release has no tickets', { exact: true }),
    ).toBeVisible()
    await expect(
      emptyReleaseWarning.getByText('Marking this release as done will archive it.', {
        exact: true,
      }),
    ).toBeVisible()
    await emptyReleaseWarning.getByRole('button', { name: 'Cancel' }).click()
    await page.goto(`/projects/${project.id}`)
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
    expect(
      (await page.request.patch(`/api/projects/${project.id}`, { data: { archived: true } })).ok(),
    ).toBeTruthy()
    expect(
      (await page.request.patch(`/api/clients/${client.id}`, { data: { archived: true } })).ok(),
    ).toBeTruthy()
    await page.goto(`/releases/${release.id}/edit?archived=true`)
    await waitForClientMount(page)
    page.once('dialog', (dialog) => dialog.accept())
    const [releaseDeleteResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/releases/${release.id}`) &&
          response.request().method() === 'DELETE',
      ),
      page.getByRole('button', { name: 'Permanently delete' }).click(),
    ])
    expect(releaseDeleteResponse.ok()).toBeTruthy()
    await expect(page).toHaveURL(`/projects/${project.id}?archived=true`)
    await page.goto(`/projects/${project.id}/edit?archived=true`)
    await waitForClientMount(page)
    page.once('dialog', (dialog) => dialog.accept())
    const [projectDeleteResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes(`/api/projects/${project.id}`) &&
          response.request().method() === 'DELETE',
      ),
      page.getByRole('button', { name: 'Permanently delete' }).click(),
    ])
    expect(projectDeleteResponse.ok()).toBeTruthy()
    await expect(page).toHaveURL(`/clients/${client.id}?archived=true`)
    await page.goto('/projects/new')
    await expect(page.getByRole('heading', { name: 'Create a client first' })).toBeVisible()
    await page.goto('/clients/new')
    const createButton = page.getByRole('button', { name: 'Create client' })
    const cancelButton = page.getByRole('link', { name: 'Cancel' })
    const [createBounds, cancelBounds] = await Promise.all([
      createButton.boundingBox(),
      cancelButton.boundingBox(),
    ])
    if (!createBounds || !cancelBounds) throw new Error('Desktop form actions must be visible')
    expect(Math.abs(createBounds.y - cancelBounds.y)).toBeLessThan(4)
    expect(cancelBounds.x + cancelBounds.width).toBeLessThanOrEqual(createBounds.x)
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
