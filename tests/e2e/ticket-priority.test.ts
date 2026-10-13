import { expect, test, type Locator, type Page } from '@playwright/test'
import { eq, inArray } from 'drizzle-orm'
import { db } from '../../server/db'
import { client, project, release, ticket, timeEntry } from '../../server/db/schema'
import { testAuth } from '../../server/utils/auth-test'
import type { TicketPriorityValue } from '../../shared/ticket-priority'
import { ticketPrioritySortRank } from '../../shared/ticket-priority'

async function expectPriority(page: Page, ticketId: string, priority: TicketPriorityValue) {
  await expect
    .poll(async () => {
      const response = await page.request.get(`/api/tickets/${ticketId}`)
      return (await response.json()).ticket.priority
    })
    .toBe(priority)
}

async function expectPriorityTriggerStyle(trigger: Locator, expectedIcon: string) {
  await expect(trigger).toHaveText('')
  await expect(trigger).not.toHaveClass(/rounded-full/)
  await expect(trigger).not.toHaveClass(/ring/)
  await expect(trigger).toHaveCSS('border-width', '0px')
  await expect(trigger).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')

  const icon = trigger.locator('[data-ticket-priority-icon]')
  await expect(icon).toHaveAttribute('data-ticket-priority-icon-name', expectedIcon)
  await expect(icon).toHaveCSS('transform', 'none')
}

test('ticket priorities persist, sort, and edit across ticket and Agenda surfaces', async ({
  page,
  context,
}) => {
  const helpers = (await testAuth.$context).test
  const owner = helpers.createUser({
    email: `ticket-priority-${crypto.randomUUID()}@example.com`,
    name: 'Ticket priority owner',
  })
  await helpers.saveUser(owner)
  const ticketIds: string[] = []
  let clientId = ''
  let projectId = ''
  let releaseId = ''
  try {
    const cookies = await helpers.getCookies({ domain: '127.0.0.1', userId: owner.id })
    await context.addCookies(cookies)
    await page.setViewportSize({ width: 1280, height: 900 })
    const create = async (path: string, data: unknown) => {
      const response = await page.request.post(path, { data })
      if (!response.ok()) throw new Error(`Could not create ${path}: ${await response.text()}`)
      return response.json()
    }
    const clientRecord = await create('/api/clients', { name: 'Priority client' })
    clientId = clientRecord.id
    const projectRecord = await create('/api/projects', {
      clientId,
      name: 'Priority project',
      color: '#abcdef',
    })
    projectId = projectRecord.id
    const releaseRecord = await create('/api/releases', {
      projectId,
      name: 'Priority release',
    })
    releaseId = releaseRecord.id
    const createTicket = async (title: string, data: Record<string, unknown> = {}) => {
      const result = await create('/api/tickets', {
        releaseId,
        title,
        ...data,
      })
      ticketIds.push(result.id)
      return result as { id: string }
    }

    const none = await createTicket('No priority ticket')
    expect((await (await page.request.get(`/api/tickets/${none.id}`)).json()).ticket.priority).toBe(
      null,
    )
    const low = await createTicket('Low priority ticket')
    const mid = await createTicket('Mid priority ticket')
    const highEstimated = await createTicket('High estimated ticket', { estimateMinutes: 60 })
    const highRecent = await createTicket('High recent ticket')
    for (const [record, priority] of [
      [low, 'low'],
      [mid, 'mid'],
      [highEstimated, 'high'],
      [highRecent, 'high'],
    ] as const) {
      const response = await page.request.patch(`/api/tickets/${record.id}`, {
        data: { priority },
      })
      expect(response.ok(), await response.text()).toBeTruthy()
    }
    expect(
      (
        await page.request.patch(`/api/tickets/${none.id}`, { data: { priority: 'on-hold' } })
      ).status(),
    ).toBe(400)
    expect((await (await page.request.get(`/api/tickets/${none.id}`)).json()).ticket.priority).toBe(
      null,
    )

    await page.goto(`/tickets?release=${releaseId}`)
    await page.waitForLoadState('networkidle')
    const noneCard = page.locator(`[data-board-ticket-id="${none.id}"]`)
    const nonePriority = noneCard.getByRole('button', {
      name: 'Change priority for No priority ticket from No priority',
    })
    await expect(nonePriority.locator('[data-ticket-priority-icon="none"]')).toBeVisible()
    await expectPriorityTriggerStyle(nonePriority, 'lucide:minus')
    await expect(noneCard.getByText('No priority', { exact: true })).toHaveCount(0)
    const boardPriorityBox = await nonePriority.boundingBox()
    const boardHierarchyBox = await noneCard.getByLabel('Ticket hierarchy').boundingBox()
    if (!boardPriorityBox || !boardHierarchyBox)
      throw new Error('Board context controls must be visible')
    expect(boardPriorityBox.x + boardPriorityBox.width).toBeLessThanOrEqual(boardHierarchyBox.x)

    await nonePriority.focus()
    await page.keyboard.press('Enter')
    for (const label of ['No priority', 'Low', 'Mid', 'High']) {
      const item = page.getByRole('menuitem', { name: label, exact: true })
      await expect(item).toBeVisible()
      const leadingIcon = item.locator('[data-slot="itemLeadingIcon"]')
      const labelText = item.locator('[data-slot="itemLabel"]')
      await expect(leadingIcon).toHaveCount(1)
      const [iconBox, labelBox] = await Promise.all([
        leadingIcon.boundingBox(),
        labelText.boundingBox(),
      ])
      if (!iconBox || !labelBox) throw new Error(`${label} needs a visible icon and label`)
      expect(iconBox.x + iconBox.width).toBeLessThanOrEqual(labelBox.x)
    }
    const noneOption = page.getByRole('menuitem', { name: 'No priority', exact: true })
    await expect(noneOption).toBeDisabled()
    await expect(noneOption.locator('[data-slot="ticketPriorityCurrentIcon"]')).toBeVisible()
    await page.getByRole('menuitem', { name: 'Low', exact: true }).click()
    await expectPriority(page, none.id, 'low')
    const lowTrigger = noneCard.getByRole('button', {
      name: 'Change priority for No priority ticket from Low',
    })
    await expect(lowTrigger.locator('[data-ticket-priority-icon="low"]')).toBeVisible()
    await expectPriorityTriggerStyle(lowTrigger, 'lucide:chevron-down')

    await lowTrigger.click()
    await page.getByRole('menuitem', { name: 'No priority', exact: true }).click()
    await expectPriority(page, none.id, null)

    const priorityRoute = `**/api/tickets/${none.id}`
    await page.route(priorityRoute, async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ statusMessage: 'Simulated priority update failure' }),
      })
    })
    await nonePriority.click()
    await page.getByRole('menuitem', { name: 'High', exact: true }).click()
    await expect(page.getByRole('alert')).toContainText('Could not change ticket priority')
    await expect(page.getByRole('button', { name: 'Retry priority change' })).toBeVisible()
    expect((await (await page.request.get(`/api/tickets/${none.id}`)).json()).ticket.priority).toBe(
      null,
    )
    await page.unroute(priorityRoute)
    await page.getByRole('button', { name: 'Retry priority change' }).click()
    await expectPriority(page, none.id, 'high')
    const highTrigger = noneCard.getByRole('button', {
      name: 'Change priority for No priority ticket from High',
    })
    await expectPriorityTriggerStyle(highTrigger, 'lucide:chevron-up')

    const apiBoard = await (
      await page.request.get(`/api/tickets?board=true&releaseId=${releaseId}`)
    ).json()
    const expectedBoardIds = apiBoard.tickets
      .filter((item: { ticket: { status: string } }) => item.ticket.status === 'Idea')
      .toSorted(
        (
          left: { ticket: { priority: 'low' | 'mid' | 'high' | null } },
          right: { ticket: { priority: 'low' | 'mid' | 'high' | null } },
        ) =>
          ticketPrioritySortRank(left.ticket.priority) -
          ticketPrioritySortRank(right.ticket.priority),
      )
      .map((item: { ticket: { id: string } }) => item.ticket.id)
    const boardIds = await page
      .getByRole('region', { name: 'Idea tickets' })
      .locator('[data-board-ticket-id]')
      .evaluateAll((cards) => cards.map((card) => (card as HTMLElement).dataset.boardTicketId))
    expect(boardIds).toEqual(expectedBoardIds)
    const highGroupApiOrder = apiBoard.tickets
      .filter(
        (item: { ticket: { status: string; priority: string | null } }) =>
          item.ticket.status === 'Idea' && item.ticket.priority === 'high',
      )
      .map((item: { ticket: { id: string } }) => item.ticket.id)
    expect(boardIds.filter((id) => highGroupApiOrder.includes(id))).toEqual(highGroupApiOrder)

    await page.goto(`/tickets/new?release=${releaseId}`)
    await page.waitForLoadState('networkidle')
    const createPriority = page.getByRole('combobox', { name: 'Ticket priority' })
    await createPriority.focus()
    await page.keyboard.press('Enter')
    const highOption = page.getByRole('option', { name: 'High', exact: true })
    await expect(highOption.locator('[data-slot="itemLeadingIcon"]')).toHaveCount(1)
    await highOption.click()
    await page.getByRole('textbox', { name: 'Title' }).fill('Created high priority ticket')
    await page.getByRole('button', { name: 'Create ticket' }).click()
    await expect(page).toHaveURL(/\/tickets\/[0-9a-f-]+$/)
    const createdId = page.url().split('/').at(-1)!
    ticketIds.push(createdId)
    await expectPriority(page, createdId, 'high')

    const detailPriority = page.getByRole('combobox', {
      name: 'Ticket priority for Created high priority ticket',
    })
    await detailPriority.focus()
    await page.keyboard.press('Enter')
    await page.getByRole('option', { name: 'Low', exact: true }).click()
    await expectPriority(page, createdId, 'low')
    await detailPriority.focus()
    await page.keyboard.press('Enter')
    await page.getByRole('option', { name: 'No priority', exact: true }).click()
    await expectPriority(page, createdId, null)
    await expect(detailPriority.locator('[data-ticket-priority-icon="none"]')).toBeVisible()

    const agendaTicket = await createTicket('Agenda priority ticket')
    const date = await page.evaluate(() => {
      const now = new Date()
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    })
    await create('/api/time-entries', {
      ticketId: agendaTicket.id,
      date,
      startMinute: 540,
      durationMinutes: 30,
      description: 'Priority agenda work',
    })
    await page.goto('/agenda')
    await page.waitForLoadState('networkidle')
    const agendaEntry = page
      .locator(`[data-agenda-ticket-id="${agendaTicket.id}"]`)
      .filter({ visible: true })
    const agendaPriority = agendaEntry.getByRole('button', {
      name: 'Change priority for Agenda priority ticket from No priority',
    })
    await expect(agendaPriority.locator('[data-ticket-priority-icon="none"]')).toBeVisible()
    await expectPriorityTriggerStyle(agendaPriority, 'lucide:minus')
    const priorityBox = await agendaPriority.boundingBox()
    const hierarchyBox = await agendaEntry
      .getByLabel('Entry hierarchy and ticket links')
      .boundingBox()
    if (!priorityBox || !hierarchyBox) throw new Error('Agenda context controls must be visible')
    expect(priorityBox.x + priorityBox.width).toBeLessThanOrEqual(hierarchyBox.x)
    await agendaPriority.focus()
    await page.keyboard.press('Enter')
    await page.getByRole('menuitem', { name: 'Mid', exact: true }).click()
    await expectPriority(page, agendaTicket.id, 'mid')
    await expect(
      agendaEntry.getByRole('button', {
        name: 'Change priority for Agenda priority ticket from Mid',
      }),
    ).toBeVisible()
    await expect(agendaEntry.locator('[data-ticket-priority-icon="mid"]')).toBeVisible()
    await expectPriorityTriggerStyle(
      agendaEntry.getByRole('button', {
        name: 'Change priority for Agenda priority ticket from Mid',
      }),
      'lucide:chevron-right',
    )
  } finally {
    if (ticketIds.length) {
      await db.delete(timeEntry).where(inArray(timeEntry.ticketId, ticketIds))
      await db.delete(ticket).where(inArray(ticket.id, ticketIds))
    }
    if (releaseId) await db.delete(release).where(eq(release.id, releaseId))
    if (projectId) await db.delete(project).where(eq(project.id, projectId))
    if (clientId) await db.delete(client).where(eq(client.id, clientId))
  }
})
