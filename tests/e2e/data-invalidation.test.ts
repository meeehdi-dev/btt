import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { eq, inArray, or } from 'drizzle-orm'
import { db } from '../../server/db'
import {
  client,
  project,
  release,
  ticket,
  ticketLink,
  ticketRelation,
  timeEntry,
  userSettings,
} from '../../server/db/schema'
import { testAuth } from '../../server/utils/auth-test'
import { waitForClientMount } from './wait-for-client-mount'

async function createOwner(context: BrowserContext, label: string) {
  const helpers = (await testAuth.$context).test
  const user = helpers.createUser({
    name: label,
    email: `same-tab-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(user)
  await context.addCookies(await helpers.getCookies({ userId: user.id, domain: '127.0.0.1' }))
  return { helpers, user }
}

async function cleanupOwner(userId: string, deleteUser: () => Promise<unknown>) {
  const clients = await db.select({ id: client.id }).from(client).where(eq(client.userId, userId))
  const clientIds = clients.map((row) => row.id)
  const projects = clientIds.length
    ? await db.select({ id: project.id }).from(project).where(inArray(project.clientId, clientIds))
    : []
  const projectIds = projects.map((row) => row.id)
  const releases = projectIds.length
    ? await db
        .select({ id: release.id })
        .from(release)
        .where(inArray(release.projectId, projectIds))
    : []
  const releaseIds = releases.map((row) => row.id)
  const tickets = releaseIds.length
    ? await db.select({ id: ticket.id }).from(ticket).where(inArray(ticket.releaseId, releaseIds))
    : []
  const ticketIds = tickets.map((row) => row.id)
  if (ticketIds.length) {
    await db.delete(timeEntry).where(inArray(timeEntry.ticketId, ticketIds))
    await db.delete(ticketLink).where(inArray(ticketLink.ticketId, ticketIds))
    await db
      .delete(ticketRelation)
      .where(
        or(
          inArray(ticketRelation.fromTicketId, ticketIds),
          inArray(ticketRelation.toTicketId, ticketIds),
        ),
      )
    await db.delete(ticket).where(inArray(ticket.id, ticketIds))
  }
  if (releaseIds.length) await db.delete(release).where(inArray(release.id, releaseIds))
  if (projectIds.length) await db.delete(project).where(inArray(project.id, projectIds))
  if (clientIds.length) await db.delete(client).where(inArray(client.id, clientIds))
  await db.delete(userSettings).where(eq(userSettings.userId, userId))
  await deleteUser()
}

async function createRecord<Data>(page: Page, path: string, data: unknown): Promise<Data> {
  const response = await page.request.post(path, { data })
  expect(response.ok(), `POST ${path} should succeed: ${await response.text()}`).toBe(true)
  return response.json() as Promise<Data>
}

async function createHierarchy(page: Page, label: string) {
  const clientRecord = await createRecord<{ id: string }>(page, '/api/clients', {
    name: `${label} client`,
  })
  const projectRecord = await createRecord<{ id: string }>(page, '/api/projects', {
    clientId: clientRecord.id,
    name: `${label} project`,
    color: '#abcdef',
  })
  const releaseRecord = await createRecord<{ id: string }>(page, '/api/releases', {
    projectId: projectRecord.id,
    name: `${label} release`,
  })
  return {
    clientId: clientRecord.id,
    clientName: `${label} client`,
    projectId: projectRecord.id,
    projectName: `${label} project`,
    releaseId: releaseRecord.id,
    releaseName: `${label} release`,
  }
}

async function navigateMain(page: Page, label: string) {
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', {
      name: label,
      exact: true,
    })
    .click()
}

async function currentDate(page: Page) {
  return page.evaluate(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })
}

async function documentTimeOrigin(page: Page) {
  return page.evaluate(() => performance.timeOrigin)
}

async function openAgendaAddDialog(page: Page, date: string) {
  const timeline = page.getByRole('region', { name: 'Week timeline' })
  const column = timeline.locator(`[data-week-date="${date}"]`)
  const [timelineBox, columnBox] = await Promise.all([timeline.boundingBox(), column.boundingBox()])
  if (!timelineBox || !columnBox)
    throw new Error('Agenda timeline and current-day column must be visible')
  const start = {
    x: columnBox.x + columnBox.width / 2,
    y: timelineBox.y + (540 - 480) * 1.8 + 5,
  }
  await page.mouse.move(start.x, start.y)
  await page.mouse.down()
  await page.mouse.move(start.x, start.y + 10, { steps: 5 })
  await page.mouse.up()
  const dialog = page.getByRole('dialog', { name: 'Add completed work' })
  await expect(dialog).toBeVisible()
  return dialog
}

test('ticket and time-entry writes update the Agenda picker and inactive board without reload', async ({
  page,
  context,
}) => {
  // Measured 46.5s locally; 60s leaves bounded headroom for this multi-route flow.
  test.setTimeout(60_000)
  const { helpers, user } = await createOwner(context, 'Same-tab ticket owner')
  try {
    const hierarchy = await createHierarchy(page, 'Same-tab')
    await page.setViewportSize({ width: 1600, height: 1200 })
    const date = await currentDate(page)
    await page.goto(`/agenda?date=${date}`)
    await waitForClientMount(page)
    await page.waitForLoadState('networkidle')
    const initialTimeOrigin = await documentTimeOrigin(page)

    await navigateMain(page, 'Tickets')
    await page.getByRole('link', { name: 'New ticket' }).click()
    await page.getByRole('button', { name: 'Release' }).click()
    await page.getByPlaceholder('Search releases…').fill(hierarchy.releaseName)
    await page
      .getByRole('option', {
        name: `${hierarchy.projectName} · ${hierarchy.releaseName}`,
      })
      .click()
    await page.getByRole('textbox', { name: 'Title' }).fill('Same-tab new ticket')
    await page.getByRole('button', { name: 'Create ticket' }).click()
    await expect(page).toHaveURL(/\/tickets\/[0-9a-f-]+$/)
    await expect(page.getByRole('heading', { name: 'Same-tab new ticket' })).toBeVisible()
    const ticketId = new URL(page.url()).pathname.split('/').at(-1)!

    await navigateMain(page, 'Tickets')
    const boardCard = page.locator(`[data-board-ticket-id="${ticketId}"]`).filter({ visible: true })
    await expect(boardCard).toBeVisible()
    await navigateMain(page, 'Agenda')
    const addDialog = await openAgendaAddDialog(page, date)
    await addDialog.getByRole('button', { name: 'Ticket' }).click()
    await expect(page.getByRole('option', { name: /Same-tab new ticket/ })).toBeVisible()
    await page.getByRole('option', { name: /Same-tab new ticket/ }).click()
    await addDialog
      .getByRole('textbox', { name: 'Work description' })
      .fill('Same-tab completed work')
    await addDialog.getByRole('button', { name: 'Save time entry' }).click()
    await expect(addDialog).toHaveCount(0)
    await expect(
      page
        .locator(`[data-week-date="${date}"]`)
        .locator('[data-agenda-entry]')
        .filter({ hasText: 'Same-tab completed work' }),
    ).toContainText('Same-tab new ticket')

    await navigateMain(page, 'Tickets')
    await expect(boardCard.getByLabel('Tracked: 30m')).toBeVisible()
    expect(await documentTimeOrigin(page)).toBe(initialTimeOrigin)
  } finally {
    await cleanupOwner(user.id, () => helpers.deleteUser(user.id))
  }
})

test('hierarchy rename/archive refreshes inactive lists and clears retained search results', async ({
  page,
  context,
}) => {
  const { helpers, user } = await createOwner(context, 'Same-tab hierarchy owner')
  try {
    const hierarchy = await createHierarchy(page, 'Searchable')
    await page.setViewportSize({ width: 1600, height: 1000 })
    await page.goto('/agenda')
    await waitForClientMount(page)
    await page.waitForLoadState('networkidle')
    const initialTimeOrigin = await documentTimeOrigin(page)

    const search = page.getByRole('searchbox', { name: 'Search workspace' })
    await search.fill(hierarchy.clientName)
    const searchResults = page.getByRole('listbox', { name: 'Search results' })
    await expect(searchResults.getByRole('option', { name: hierarchy.clientName })).toBeVisible()
    await search.press('Escape')
    await navigateMain(page, 'Clients')
    await page.getByRole('link', { name: `Open client ${hierarchy.clientName}` }).click()
    await page.getByRole('link', { name: 'Edit client' }).click()
    const newName = 'Renamed same-tab client'
    await page.getByRole('textbox', { name: 'Name' }).fill(newName)
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page.getByRole('heading', { name: newName })).toBeVisible()

    await navigateMain(page, 'Clients')
    await expect(page.getByRole('link', { name: `Open client ${newName}` })).toBeVisible()
    await search.click()
    await expect(searchResults).toContainText('No matches.')
    await search.fill(newName)
    await expect(searchResults.getByRole('option', { name: newName })).toBeVisible()
    await search.press('Escape')

    await page.getByRole('link', { name: `Open client ${newName}` }).click()
    await page.getByRole('link', { name: 'Edit client' }).click()
    await page.getByRole('checkbox', { name: 'Archived' }).check()
    await page.getByRole('button', { name: 'Save changes' }).click()
    await expect(page).toHaveURL(new RegExp(`/clients/${hierarchy.clientId}\\?archived=true$`))
    await navigateMain(page, 'Clients')
    await expect(page.getByRole('link', { name: `Open client ${newName}` })).toHaveCount(0)
    await page.getByRole('button', { name: 'Show archived' }).click()
    await expect(page.getByRole('link', { name: `Open client ${newName}` })).toBeVisible()
    expect(await documentTimeOrigin(page)).toBe(initialTimeOrigin)
  } finally {
    await cleanupOwner(user.id, () => helpers.deleteUser(user.id))
  }
})

test('ticket status and archive writes invalidate the same-tab board cache', async ({
  page,
  context,
}) => {
  const { helpers, user } = await createOwner(context, 'Same-tab ticket status owner')
  try {
    const hierarchy = await createHierarchy(page, 'Board invalidation')
    const ticketRecord = await createRecord<{ id: string }>(page, '/api/tickets', {
      releaseId: hierarchy.releaseId,
      title: 'Board invalidation ticket',
    })
    await page.setViewportSize({ width: 1600, height: 1000 })
    await page.goto('/tickets')
    await waitForClientMount(page)
    await page.waitForLoadState('networkidle')
    const initialTimeOrigin = await documentTimeOrigin(page)
    const boardCard = page
      .locator(`[data-board-ticket-id="${ticketRecord.id}"]`)
      .filter({ visible: true })
    await expect(boardCard).toBeVisible()
    await boardCard.getByRole('link', { name: 'Board invalidation ticket' }).click()

    const status = page.getByRole('combobox', {
      name: 'Ticket status for Board invalidation ticket',
    })
    await status.click()
    await page.getByRole('option', { name: 'Develop', exact: true }).click()
    await expect(status).toContainText('Develop')
    await navigateMain(page, 'Tickets')
    await expect(
      page.getByRole('region', { name: 'Develop tickets' }).getByText('Board invalidation ticket'),
    ).toBeVisible()
    await expect(
      page.getByRole('region', { name: 'Idea tickets' }).getByText('Board invalidation ticket'),
    ).toHaveCount(0)

    await page
      .locator(`[data-board-ticket-id="${ticketRecord.id}"]`)
      .filter({ visible: true })
      .getByRole('link', { name: 'Board invalidation ticket' })
      .click()
    await page.getByRole('button', { name: 'Archive ticket' }).click()
    await expect(page).toHaveURL(`/tickets/${ticketRecord.id}?archived=true`)
    await navigateMain(page, 'Tickets')
    await expect(
      page.locator(`[data-board-ticket-id="${ticketRecord.id}"]`).filter({ visible: true }),
    ).toHaveCount(0)
    await page.getByRole('button', { name: 'Filter archived tickets' }).click()
    await page.getByRole('option', { name: 'Include archived' }).click()
    await expect(
      page.locator(`[data-board-ticket-id="${ticketRecord.id}"]`).filter({ visible: true }),
    ).toBeVisible()
    expect(await documentTimeOrigin(page)).toBe(initialTimeOrigin)
  } finally {
    await cleanupOwner(user.id, () => helpers.deleteUser(user.id))
  }
})

test('settings writes refresh cached Agenda preferences through SPA navigation', async ({
  page,
  context,
}) => {
  const { helpers, user } = await createOwner(context, 'Same-tab settings owner')
  try {
    await page.setViewportSize({ width: 1600, height: 1000 })
    await page.goto('/agenda')
    await waitForClientMount(page)
    await page.waitForLoadState('networkidle')
    const initialTimeOrigin = await documentTimeOrigin(page)
    const progress = page.getByRole('progressbar', { name: /workday progress/ }).first()
    await expect(progress).toHaveAttribute('aria-valuemax', '480')

    await page.getByRole('link', { name: 'Settings' }).click()
    await page.getByRole('combobox', { name: 'Workday target' }).click()
    await page.getByRole('option', { name: '09:00' }).click()
    await page.getByRole('button', { name: 'Save settings' }).click()
    await expect(page.getByRole('status')).toContainText('Settings saved.')
    await navigateMain(page, 'Agenda')
    await expect(
      page.getByRole('progressbar', { name: /workday progress/ }).first(),
    ).toHaveAttribute('aria-valuemax', '540')
    expect(await documentTimeOrigin(page)).toBe(initialTimeOrigin)
  } finally {
    await cleanupOwner(user.id, () => helpers.deleteUser(user.id))
  }
})

test('failed writes do not invalidate; successful writes report and retry a failed refresh', async ({
  page,
  context,
}) => {
  const { helpers, user } = await createOwner(context, 'Same-tab failure owner')
  try {
    const hierarchy = await createHierarchy(page, 'Failure handling')
    const ticketRecord = await createRecord<{ id: string }>(page, '/api/tickets', {
      releaseId: hierarchy.releaseId,
      title: 'Failure handling ticket',
    })
    let failPatch = true
    let failRead = false
    let ticketReads = 0
    await page.route(`**/api/tickets/${ticketRecord.id}`, async (route) => {
      const request = route.request()
      if (request.method() === 'GET') {
        ticketReads++
        if (failRead) {
          await route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({ statusCode: 503, statusMessage: 'private read failure' }),
          })
          return
        }
      }
      if (request.method() === 'PATCH' && failPatch) {
        failPatch = false
        await route.fulfill({ status: 503, body: 'private write failure' })
        return
      }
      await route.continue()
    })
    await page.goto(`/tickets/${ticketRecord.id}`)
    await waitForClientMount(page)
    await page.waitForLoadState('networkidle')
    const readsBeforeFailedWrite = ticketReads
    await page.getByRole('button', { name: 'Edit ticket title' }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit ticket title' })
    await dialog.getByRole('textbox', { name: 'Title' }).fill('Should not save')
    await dialog.getByRole('button', { name: 'Save title' }).click()
    await expect(dialog).toContainText('The request could not be completed. Please try again.')
    expect(ticketReads).toBe(readsBeforeFailedWrite)

    failRead = true
    await dialog.getByRole('textbox', { name: 'Title' }).fill('Successfully updated title')
    await dialog.getByRole('button', { name: 'Save title' }).click()
    await expect(
      page.getByRole('alert').filter({ hasText: 'Ticket updated; refresh failed' }),
    ).toBeVisible()
    await expect(page.getByText('private read failure')).toHaveCount(0)
    failRead = false
    await page.getByRole('button', { name: 'Retry loading ticket details' }).click()
    await expect(page.getByRole('heading', { name: 'Successfully updated title' })).toBeVisible()
    await expect(page.getByRole('status')).toContainText('Ticket details refreshed.')
  } finally {
    await cleanupOwner(user.id, () => helpers.deleteUser(user.id))
  }
})
