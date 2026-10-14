import { expect, test, type Locator, type Page } from '@playwright/test'
import { waitForClientMount } from './wait-for-client-mount'
import { testAuth } from '../../server/utils/auth-test'
import { appToast, openToastAction } from './helpers/toasts'
import { db } from '../../server/db'
import {
  client as clientTable,
  project as projectTable,
  release as releaseTable,
  ticket as ticketTable,
} from '../../server/db/schema'
import { eq, inArray } from 'drizzle-orm'

const uuidv7Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

async function cleanupOwnedHierarchy(userId: string) {
  const ownedClients = await db
    .select({ id: clientTable.id })
    .from(clientTable)
    .where(eq(clientTable.userId, userId))
  const ownedClientIds = ownedClients.map(({ id }) => id)
  const ownedProjects = ownedClientIds.length
    ? await db
        .select({ id: projectTable.id })
        .from(projectTable)
        .where(inArray(projectTable.clientId, ownedClientIds))
    : []
  const ownedProjectIds = ownedProjects.map(({ id }) => id)
  const ownedReleases = ownedProjectIds.length
    ? await db
        .select({ id: releaseTable.id })
        .from(releaseTable)
        .where(inArray(releaseTable.projectId, ownedProjectIds))
    : []
  const ownedReleaseIds = ownedReleases.map(({ id }) => id)
  if (ownedReleaseIds.length)
    await db.delete(ticketTable).where(inArray(ticketTable.releaseId, ownedReleaseIds))
  if (ownedProjectIds.length)
    await db.delete(releaseTable).where(inArray(releaseTable.projectId, ownedProjectIds))
  if (ownedClientIds.length)
    await db.delete(projectTable).where(inArray(projectTable.clientId, ownedClientIds))
  if (ownedClientIds.length)
    await db.delete(clientTable).where(inArray(clientTable.id, ownedClientIds))
}

const hierarchyTest = test.extend<{ hierarchyUser: { id: string } }>({
  hierarchyUser: async ({ context }, use) => {
    const helpers = (await testAuth.$context).test
    const user = helpers.createUser({
      name: 'Hierarchy E2E User',
      email: `nxmr-hierarchy-${crypto.randomUUID()}@example.com`,
    })
    try {
      await helpers.saveUser(user)
      await context.addCookies(await helpers.getCookies({ userId: user.id, domain: '127.0.0.1' }))
      await use({ id: user.id })
    } finally {
      await cleanupOwnedHierarchy(user.id)
      await helpers.deleteUser(user.id)
    }
  },
})

async function createHierarchy(page: Page, userId: string, prefix: string) {
  const create = async (path: string, data: unknown) => {
    const response = await page.request.post(path, { data })
    if (!response.ok()) throw new Error(`Could not seed ${path}: ${response.status()}`)
    return response.json()
  }
  const client = await create('/api/clients', { name: `${prefix} Client`, color: '#ABC123' })
  expect(client.userId).toBe(userId)
  const project = await create('/api/projects', {
    clientId: client.id,
    name: `${prefix} Project`,
    color: '#abcdef',
  })
  const release = await create('/api/releases', {
    projectId: project.id,
    name: `${prefix} Release`,
    targetDate: '2030-02-01',
  })
  return { client, project, release }
}

async function expectHierarchyDetailSections(page: Page) {
  const sections = page.locator('[data-hierarchy-detail-sections]')
  await expect(sections).toHaveCount(1)
  await expect(sections).toHaveClass(/space-y-4/)
  await expect(sections.locator('.grid.max-w-2xl.grid-cols-2.gap-2')).toHaveCount(1)
  await expect(sections.locator('hr')).toHaveCount(1)
}

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

async function expectLeftAlignedProjectSummary(card: Locator, clientName: string) {
  const clientButton = card.getByRole('link', { name: clientName })
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

async function expectArchiveBeforeNew(page: Page, archiveLabel: string, newLabel: string) {
  const archive = page.getByRole('button', { name: archiveLabel, exact: true })
  const create = page.getByRole('button', { name: newLabel, exact: true })
  await expect(archive).toBeVisible()
  await expect(create).toBeVisible()
  const [archiveBox, newBox] = await Promise.all([archive.boundingBox(), create.boundingBox()])
  if (!archiveBox || !newBox) throw new Error('Header actions must be visible')
  expect(Math.abs(archiveBox.y - newBox.y)).toBeLessThan(4)
  expect(archiveBox.x + archiveBox.width).toBeLessThanOrEqual(newBox.x)
}

async function expectSameSize(first: Locator, second: Locator) {
  const [firstBox, secondBox] = await Promise.all([first.boundingBox(), second.boundingBox()])
  if (!firstBox || !secondBox) throw new Error('Form fields must be visible')
  expect(Math.abs(firstBox.width - secondBox.width)).toBeLessThanOrEqual(1)
  expect(Math.abs(firstBox.height - secondBox.height)).toBeLessThanOrEqual(1)
}

test('redirects unauthenticated users and supports an authenticated shell session', async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/')
  await expect(page).toHaveURL(/\/login\?redirect=\/agenda$/)
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
  await expect(page.getByText('btt', { exact: true })).toBeVisible()
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
    await page.goto('/agenda')
    await expect(page).toHaveURL(/\/agenda$/)
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
    const leftHeaderBlock = header.locator('[data-header-block="left"]')
    await expect(header.getByText('nxmr', { exact: true })).toHaveCount(0)
    await expect(leftHeaderBlock.locator(':scope > *')).toHaveCount(1)
    await expect(leftHeaderBlock.locator(':scope > nav[aria-label="Main navigation"]')).toHaveCount(
      1,
    )
    expect(
      (await mainNavigation.getByRole('link').allTextContents()).map((label) => label.trim()),
    ).toEqual(['Agenda', 'Tickets', 'Clients'])

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
      .getByRole('link', { name: 'Agenda' })
      .evaluate((element) => element.getBoundingClientRect().height)
    const settingsButton = header.getByRole('button', { name: 'Settings' })
    for (const control of [settingsButton, header.getByRole('button', { name: 'Sign out' })]) {
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
    const archiveToggle = page.locator(
      'button[aria-label="Show archived"], button[aria-label="Hide archived"]',
    )
    await expect(archiveToggle).toBeVisible()
    await page.waitForFunction(() => {
      const button = document.querySelector('button[aria-label="Show archived"]')
      return button !== null && '__vueParentComponent' in button
    })
    await archiveToggle.hover()
    await expectTooltip(page, 'Show archived')
    await mainNavigation.getByRole('link', { name: 'Tickets' }).click()
    await expect(page).toHaveURL(/\/tickets$/)
    await settingsButton.click()
    await expect(page).toHaveURL(/\/tickets$/)
    const settingsDialog = page.getByRole('dialog', { name: 'Workspace settings' })
    await expect(settingsDialog).toBeVisible()
    await expect(settingsDialog.getByRole('combobox', { name: 'Visible start' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(settingsDialog).not.toBeVisible()
    await expect(settingsButton).toBeFocused()

    const settingsResponse = await page.goto('/settings')
    expect(settingsResponse?.status()).toBe(404)
    await expect(page).toHaveURL(/\/settings$/)

    const projectCollectionResponse = await page.goto('/projects')
    expect(projectCollectionResponse?.status()).toBe(404)
    await expect(page).toHaveURL(/\/projects$/)

    await page.goto('/agenda')
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

hierarchyTest(
  'creation modals preserve hierarchy context and stay on the originating page',
  async ({ page, hierarchyUser }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/clients')
    await waitForClientMount(page)
    await page.getByRole('button', { name: 'New client' }).click()
    const firstClientDialog = page.getByRole('dialog', { name: 'New client' })
    await firstClientDialog.getByRole('textbox', { name: 'Name' }).fill('M2 Client')
    await firstClientDialog.getByRole('button', { name: 'Create client' }).click()
    await expect(page).toHaveURL('/clients')
    await expect(appToast(page, 'Client created.')).toBeVisible()
    await openToastAction(page, 'Client created.', 'Open client')
    const clientId = new URL(page.url()).pathname.split('/').at(-1)!
    expect(clientId).toMatch(uuidv7Pattern)
    expect((await (await page.request.get(`/api/clients/${clientId}`)).json()).userId).toBe(
      hierarchyUser.id,
    )

    await page.getByRole('link', { name: 'Clients', exact: true }).first().click()
    await page.getByRole('button', { name: 'New client' }).click()
    const alternateClientDialog = page.getByRole('dialog', { name: 'New client' })
    await alternateClientDialog.getByRole('textbox', { name: 'Name' }).fill('M2 Alternate Client')
    await alternateClientDialog.getByRole('button', { name: 'Create client' }).click()
    await openToastAction(page, 'Client created.', 'Open client', true)
    const alternateClientId = new URL(page.url()).pathname.split('/').at(-1)!

    await page.goto(`/clients/${clientId}`)
    await waitForClientMount(page)
    await page.getByRole('button', { name: 'New project' }).click()
    const projectDialog = page.getByRole('dialog', { name: 'New project' })
    await expect(projectDialog.getByRole('button', { name: 'Client' })).toContainText('M2 Client')
    await projectDialog.getByRole('button', { name: 'Client' }).click()
    await page.getByPlaceholder('Search clients…').fill('M2 Alternate Client')
    await page.getByRole('option', { name: 'M2 Alternate Client', exact: true }).click()
    await projectDialog.getByRole('textbox', { name: 'Name' }).fill('M2 Project')
    await projectDialog.getByRole('button', { name: 'Create project' }).click()
    await expect(page).toHaveURL(`/clients/${clientId}`)
    await openToastAction(page, 'Project created.', 'Open project')
    const projectId = new URL(page.url()).pathname.split('/').at(-1)!
    expect(projectId).toMatch(uuidv7Pattern)
    const projectData = await (await page.request.get(`/api/projects/${projectId}`)).json()
    expect(projectData.project.clientId).toBe(alternateClientId)

    await page.getByRole('button', { name: 'New release' }).click()
    const releaseDialog = page.getByRole('dialog', { name: 'New release' })
    await expect(releaseDialog.getByRole('button', { name: 'Project' })).toContainText('M2 Project')
    await releaseDialog.getByRole('textbox', { name: 'Name' }).fill('M2 Release')
    await releaseDialog.getByRole('textbox', { name: 'Target date' }).fill('2030-02-01')
    await releaseDialog.getByRole('button', { name: 'Create release' }).click()
    await expect(page).toHaveURL(`/projects/${projectId}`)
    await openToastAction(page, 'Release created.', 'Open release')
    const releaseId = new URL(page.url()).pathname.split('/').at(-1)!
    expect(releaseId).toMatch(uuidv7Pattern)

    const releaseNameField = page.getByRole('textbox', { name: 'Release name' })
    await releaseNameField.fill('M2 Updated Release')
    await releaseNameField.press('Tab')
    await expect(appToast(page, 'Release name saved.')).toBeVisible()
    const targetDateField = page.getByRole('textbox', { name: 'Target date' })
    await targetDateField.fill('2031-06-07')
    await targetDateField.press('Tab')
    await expect(appToast(page, 'Release target date saved.')).toBeVisible()

    await page.goto(`/projects/${projectId}`)
    await waitForClientMount(page)
    const projectNameField = page.getByRole('textbox', { name: 'Project name' })
    await projectNameField.fill('M2 Updated Project')
    await projectNameField.press('Tab')
    await expect(appToast(page, 'Project name saved.')).toBeVisible()
    await page.getByRole('button', { name: 'Choose color' }).click()
    await page.getByRole('button', { name: 'Select #ef4444' }).click()
    await expect(appToast(page, 'Project color saved.')).toBeVisible()
    await page.getByRole('button', { name: 'Archive project' }).click()
    await expect(page).toHaveURL(`/projects/${projectId}?archived=true`)
    await page.getByRole('button', { name: 'Restore project' }).click()
    await expect(page).toHaveURL(`/projects/${projectId}`)

    await page.goto(`/releases/${releaseId}`)
    await waitForClientMount(page)
    await page.getByRole('button', { name: 'Archive release' }).click()
    await expect(page).toHaveURL(`/releases/${releaseId}?archived=true`)
    await page.getByRole('button', { name: 'Restore release' }).click()
    await expect(page).toHaveURL(`/releases/${releaseId}`)

    await page.getByRole('button', { name: 'New ticket' }).click()
    const ticketDialog = page.getByRole('dialog', { name: 'New ticket' })
    await expect(ticketDialog.getByRole('button', { name: 'Release' })).toContainText(
      'M2 Updated Release',
    )
    await ticketDialog.getByRole('textbox', { name: 'Title' }).fill('M2 Ticket')
    await ticketDialog.getByRole('button', { name: 'Create ticket' }).click()
    await expect(page).toHaveURL(`/releases/${releaseId}`)
    await openToastAction(page, 'Ticket created.', 'Open ticket')
    await expect(page.getByRole('heading', { name: 'M2 Ticket' })).toBeVisible()
  },
)

hierarchyTest(
  'client, project, and release details show their hierarchy actions',
  async ({ page, hierarchyUser }) => {
    const { client, project, release } = await createHierarchy(page, hierarchyUser.id, 'Detail')

    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/clients')
    const clientsTitle = page.getByRole('heading', { name: 'Clients', exact: true })
    await expect(clientsTitle).toBeVisible()
    expect((await clientsTitle.boundingBox())?.height).toBeGreaterThan(20)
    const archiveToggle = page.getByRole('button', { name: 'Show archived' })
    await expect(archiveToggle).toBeVisible()
    await expect(page.getByText('View projects and releases', { exact: true })).toHaveCount(0)
    await expect(archiveToggle).not.toHaveAttribute('title')

    await page.goto(`/clients/${client.id}`)
    await expect(page.getByRole('heading', { name: client.name })).toBeVisible()
    await expectHierarchyDetailSections(page)
    await expect(
      page.getByText('Projects and releases for this client.', { exact: true }),
    ).toHaveCount(0)
    await expectSameSize(
      page.getByRole('textbox', { name: 'Client name' }),
      page.getByRole('button', { name: 'Choose color' }),
    )
    await expect(page.locator('hr')).toBeVisible()
    await expectArchiveBeforeNew(page, 'Archive client', 'New project')
    const clientProjectCard = page.locator(`[data-project-card-id="${project.id}"]`)
    await expect(clientProjectCard.getByText(project.name)).toBeVisible()
    expect(await clientProjectCard.evaluate((card) => getComputedStyle(card).padding)).toBe('8px')
    await expect(clientProjectCard.getByRole('link', { name: client.name })).toBeVisible()
    await expect(clientProjectCard.getByText('1 release')).toBeVisible()
    await expect(clientProjectCard.getByText('0 tickets')).toBeVisible()
    await expect(page.getByText('View releases', { exact: true })).toHaveCount(0)
    await expectLeftAlignedProjectSummary(clientProjectCard, client.name)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await clientProjectCard.getByRole('link', { name: `Open project ${project.name}` }).click()
    await expect(page).toHaveURL(`/projects/${project.id}`)
    await expectHierarchyDetailSections(page)
    await expectSameSize(
      page.getByRole('textbox', { name: 'Project name' }),
      page.getByRole('button', { name: 'Choose color' }),
    )
    await expect(page.locator('hr')).toBeVisible()
    await expectArchiveBeforeNew(page, 'Archive project', 'New release')
    await expect(page.getByText(release.name)).toBeVisible()
    const projectReleaseCard = page.locator(`[data-release-card-id="${release.id}"]`)
    await expect(projectReleaseCard).toBeVisible()
    expect(await projectReleaseCard.evaluate((card) => getComputedStyle(card).padding)).toBe('8px')
    await expect(page.getByRole('button', { name: 'Show archived' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Mark release as done' })).toHaveCount(0)

    await page.goto(`/releases/${release.id}`)
    await waitForClientMount(page)
    await expectHierarchyDetailSections(page)
    await expectSameSize(
      page.getByRole('textbox', { name: 'Release name' }),
      page.getByRole('textbox', { name: 'Target date' }),
    )
    await expect(page.locator('hr')).toBeVisible()
    await expectArchiveBeforeNew(page, 'Archive release', 'New ticket')
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
    const cancelButton = emptyReleaseWarning.getByRole('button', { name: 'Cancel' })
    const doneButton = emptyReleaseWarning.getByRole('button', { name: 'Mark release as done' })
    const actionRow = emptyReleaseWarning.locator('div.flex.justify-end.gap-2')
    const [cancelBox, doneBox, actionRowBox] = await Promise.all([
      cancelButton.boundingBox(),
      doneButton.boundingBox(),
      actionRow.boundingBox(),
    ])
    if (!cancelBox || !doneBox || !actionRowBox) {
      throw new Error('Release confirmation actions must be visible')
    }
    expect(cancelBox.x + cancelBox.width).toBeLessThan(doneBox.x)
    expect(
      Math.abs(doneBox.x + doneBox.width - actionRowBox.x - actionRowBox.width),
    ).toBeLessThanOrEqual(1)
    const markDoneButton = emptyReleaseWarning.getByRole('button', { name: 'Mark release as done' })
    await markDoneButton.focus()
    await expect(markDoneButton).toBeFocused()
    await page.keyboard.press('Meta+Enter')
    await expect(emptyReleaseWarning).toBeVisible()
    await emptyReleaseWarning.getByRole('button', { name: 'Cancel' }).click()

    const ticketResponse = await page.request.post('/api/tickets', {
      data: { releaseId: release.id, title: `${release.name} Ticket` },
    })
    expect(ticketResponse.ok(), await ticketResponse.text()).toBeTruthy()
    const ticket = await ticketResponse.json()
    await page.reload()
    await waitForClientMount(page)
    const releaseTicketCard = page.locator(`[data-release-ticket-id="${ticket.id}"]`)
    await expect(releaseTicketCard).toBeVisible()
    expect(await releaseTicketCard.evaluate((card) => getComputedStyle(card).padding)).toBe('8px')
  },
)

hierarchyTest(
  'archived hierarchy can be restored and permanently deleted',
  async ({ page, hierarchyUser }) => {
    const { client, project, release } = await createHierarchy(page, hierarchyUser.id, 'Archive')

    await page.goto(`/projects/${project.id}`)
    await expect(page.getByRole('button', { name: 'Show archived' })).toBeVisible()
    expect(
      (await page.request.patch(`/api/releases/${release.id}`, { data: { archived: true } })).ok(),
    ).toBeTruthy()
    await page.reload()
    await expect(page.getByText(release.name)).toBeHidden()
    await page.goto(`/projects/${project.id}?archived=true`)
    await expect(page.getByRole('button', { name: 'Hide archived' })).toBeVisible()
    await expect(page.getByText(release.name)).toBeVisible()

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

    await page.goto(`/releases/${release.id}?archived=true`)
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

    await page.goto(`/projects/${project.id}?archived=true`)
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
  },
)
