import { expect, test } from '@playwright/test'
import { eq } from 'drizzle-orm'
import { db } from '../../server/db'
import { client, project, release, ticket, timeEntry, userSettings } from '../../server/db/schema'
import { ticketStatuses } from '../../shared/ticket-status'
import { testAuth } from '../../server/utils/auth-test'

test('Agenda status selector changes active tickets directly and respects archives', async ({
  page,
  context,
}) => {
  const helpers = (await testAuth.$context).test
  const owner = helpers.createUser({
    name: 'Agenda status owner',
    email: `agenda-status-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(owner)
  let clientId = ''
  let projectId = ''
  let releaseId = ''
  let ticketId = ''
  try {
    await context.addCookies(await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }))
    const create = async (path: string, data: unknown) => {
      const response = await page.request.post(path, { data })
      expect(response.ok(), await response.text()).toBeTruthy()
      return response.json()
    }
    const clientRecord = await create('/api/clients', { name: 'Status client' })
    clientId = clientRecord.id
    const projectRecord = await create('/api/projects', {
      clientId,
      name: 'Status project',
      color: '#abcdef',
    })
    projectId = projectRecord.id
    const releaseRecord = await create('/api/releases', {
      projectId,
      name: 'Status release',
    })
    releaseId = releaseRecord.id
    const ticketRecord = await create('/api/tickets', {
      releaseId,
      title: 'Status ticket',
      status: 'Idea',
    })
    ticketId = ticketRecord.id
    const date = await page.evaluate(() => {
      const now = new Date()
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    })
    await create('/api/time-entries', {
      ticketId,
      date,
      startMinute: 540,
      durationMinutes: 30,
      description: 'Status test work',
    })

    await page.goto('/agenda')
    await page.waitForLoadState('networkidle')
    const entry = page.locator(`[data-agenda-ticket-id="${ticketId}"]`).filter({ visible: true })
    const statusTrigger = entry.getByRole('button', {
      name: 'Change status for Status ticket from Idea',
    })
    const titleLink = entry.getByRole('link', { name: 'Status ticket' })
    await expect(page.getByRole('combobox', { name: 'Filter status' })).toHaveCount(0)
    await expect(titleLink).toHaveAttribute('href', `/tickets/${ticketId}`)
    await expect(entry.locator('[data-ticket-status-icon="Idea"]')).toBeVisible()
    await expect(
      entry.getByLabel('Entry hierarchy and ticket links').getByRole('button', {
        name: /Change status/,
      }),
    ).toHaveCount(0)
    await statusTrigger.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/agenda(?:\?|$)/)
    await expect(page.getByRole('menuitem', { name: 'Change', exact: true })).toHaveCount(0)
    await expect(page.getByRole('menuitem', { name: 'Filter by Idea' })).toHaveCount(0)
    for (const status of ticketStatuses) {
      const item = page.getByRole('menuitem', { name: status, exact: true })
      await expect(item).toBeVisible()
      const leadingIcon = item.locator('[data-slot="itemLeadingIcon"]')
      const label = item.locator('[data-slot="itemLabel"]')
      await expect(leadingIcon).toHaveCount(1)
      const [iconBox, labelBox] = await Promise.all([
        leadingIcon.boundingBox(),
        label.boundingBox(),
      ])
      if (!iconBox || !labelBox)
        throw new Error(`Status menu item ${status} must have an icon and label`)
      expect(iconBox.x + iconBox.width).toBeLessThanOrEqual(labelBox.x)
      if (status === 'Idea') {
        await expect(item).toBeDisabled()
        await expect(item.locator('[data-slot="ticketStatusCurrentIcon"]')).toBeVisible()
      } else {
        await expect(item).toBeEnabled()
        await expect(item.locator('[data-slot="ticketStatusCurrentIcon"]')).toHaveCount(0)
      }
      await expect(item.locator('[data-slot="itemLeadingIcon"]')).toHaveCount(1)
    }

    let releasePatch!: () => void
    let signalPatchStarted!: () => void
    const patchGate = new Promise<void>((resolve) => {
      releasePatch = resolve
    })
    const patchStarted = new Promise<void>((resolve) => {
      signalPatchStarted = resolve
    })
    const route = `**/api/tickets/${ticketId}`
    await page.route(route, async (request) => {
      signalPatchStarted()
      await patchGate
      await request.continue()
    })
    await page.getByRole('menuitem', { name: 'Develop', exact: true }).click()
    await patchStarted
    await expect(page.getByRole('status')).toHaveText('Changing Status ticket to Develop.')
    await expect(statusTrigger).toBeDisabled()
    releasePatch()
    await expect(page.getByRole('status')).toHaveText('Changed Status ticket to Develop.')
    await page.unroute(route)
    expect((await (await page.request.get(`/api/tickets/${ticketId}`)).json()).ticket.status).toBe(
      'Develop',
    )
    await expect(
      entry.getByRole('button', { name: 'Change status for Status ticket from Develop' }),
    ).toBeVisible()
    await expect(entry.locator('[data-ticket-status-icon="Develop"]')).toBeVisible()

    await page.route(route, async (request) => {
      await request.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ statusMessage: 'Simulated status update failure' }),
      })
    })
    await entry
      .getByRole('button', {
        name: 'Change status for Status ticket from Develop',
      })
      .click()
    await page.getByRole('menuitem', { name: 'Review', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('Could not change ticket status')
    await expect(page.getByRole('status')).toHaveText('')
    expect((await (await page.request.get(`/api/tickets/${ticketId}`)).json()).ticket.status).toBe(
      'Develop',
    )
    await page.unroute(route)

    const archived = await page.request.patch(`/api/clients/${clientId}`, {
      data: { archived: true },
    })
    expect(archived.ok()).toBe(true)
    await page.reload()
    await page.waitForLoadState('networkidle')
    const historyEntry = page
      .locator(`[data-agenda-ticket-id="${ticketId}"]`)
      .filter({ visible: true })
    await historyEntry
      .getByRole('button', { name: 'Change status for Status ticket from Develop' })
      .click()
    for (const status of ticketStatuses)
      await expect(page.getByRole('menuitem', { name: status, exact: true })).toBeDisabled()
    await page.keyboard.press('Escape')
    await historyEntry.getByRole('link', { name: 'Status ticket' }).click()
    await expect(page).toHaveURL(`/tickets/${ticketId}?archived=true`)
  } finally {
    if (ticketId) {
      await db.delete(timeEntry).where(eq(timeEntry.ticketId, ticketId))
      await db.delete(ticket).where(eq(ticket.id, ticketId))
    }
    if (releaseId) await db.delete(release).where(eq(release.id, releaseId))
    if (projectId) await db.delete(project).where(eq(project.id, projectId))
    if (clientId) await db.delete(client).where(eq(client.id, clientId))
    await db.delete(userSettings).where(eq(userSettings.userId, owner.id))
    await helpers.deleteUser(owner.id)
  }
})
