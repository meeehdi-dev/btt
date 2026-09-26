import { expect, test } from '@playwright/test'
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
} from '../../server/db/schema'
import { testAuth } from '../../server/utils/auth-test'

async function cleanup(userId: string) {
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
}

test('ticket context popovers show one or many relations and native external links across views', async ({
  page,
  context,
  browser,
}) => {
  const helpers = (await testAuth.$context).test
  const owner = helpers.createUser({
    name: 'Context popover owner',
    email: `ticket-context-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(owner)
  let mobileContext: Awaited<ReturnType<typeof browser.newContext>> | undefined
  try {
    await context.addCookies(await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }))
    const create = async (path: string, data: unknown) => {
      const response = await page.request.post(path, { data })
      expect(response.ok(), await response.text()).toBeTruthy()
      return response.json()
    }
    const suffix = crypto.randomUUID().slice(0, 8)
    const clientRecord = await create('/api/clients', { name: `Context ${suffix}` })
    const projectRecord = await create('/api/projects', {
      clientId: clientRecord.id,
      name: `Context project ${suffix}`,
      color: '#abcdef',
    })
    const releaseRecord = await create('/api/releases', {
      projectId: projectRecord.id,
      name: `Context release ${suffix}`,
    })
    const oneTitle = `Context one ${suffix}`
    const twoTitle = `Context two ${suffix}`
    const manyTitle = `Context many ${suffix}`
    const one = await create('/api/tickets', {
      releaseId: releaseRecord.id,
      title: oneTitle,
      links: [{ label: 'Single external', url: 'https://example.com/single' }],
    })
    const two = await create('/api/tickets', {
      releaseId: releaseRecord.id,
      title: twoTitle,
      links: [{ label: 'Pull request', url: 'https://example.com/pr' }],
    })
    const many = await create('/api/tickets', {
      releaseId: releaseRecord.id,
      title: manyTitle,
      links: [
        { label: 'Design', url: 'https://example.com/design' },
        { label: 'Pull request', url: 'https://example.com/pr-many' },
      ],
      relatedTicketIds: [one.id, two.id],
    })
    const date = await page.evaluate(() => {
      const now = new Date()
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    })
    for (const [ticketId, startMinute] of [
      [many.id, 540],
      [one.id, 600],
    ] as const) {
      await create('/api/time-entries', {
        ticketId,
        date,
        startMinute,
        durationMinutes: 30,
        description: 'Popover test work',
      })
    }

    const tickets = (await (await page.request.get('/api/tickets')).json()).tickets
    const manyFromApi = tickets.find(
      (item: { ticket: { id: string } }) => item.ticket.id === many.id,
    )
    expect(manyFromApi.relatedTickets.map((item: { id: string }) => item.id).toSorted()).toEqual(
      [one.id, two.id].toSorted(),
    )
    expect(manyFromApi.externalLinks).toHaveLength(2)
    const agenda = await (await page.request.get('/api/agenda', { params: { date } })).json()
    const manyFromAgenda = agenda.entries.find(
      (item: { ticketId: string }) => item.ticketId === many.id,
    )
    expect(manyFromAgenda.relatedTickets).toHaveLength(2)
    expect(manyFromAgenda.externalLinks).toHaveLength(2)

    await page.goto('/tickets')
    await page.waitForLoadState('networkidle')
    const boardCard = page.locator(`[data-board-ticket-id="${many.id}"]`).filter({ visible: true })
    const boardRelations = boardCard.getByRole('button', { name: 'Related tickets' })
    const boardLinks = boardCard.getByRole('button', { name: 'External links' })
    await expect(boardRelations.locator('[data-slot="base"]')).toHaveText('2')
    await expect(boardLinks.locator('[data-slot="base"]')).toHaveText('2')
    const triggerBounds = await boardRelations.boundingBox()
    const badgeBounds = await boardRelations.locator('[data-slot="base"]').boundingBox()
    if (!triggerBounds || !badgeBounds) throw new Error('Count badge must be visible')
    expect(badgeBounds.x).toBeGreaterThanOrEqual(triggerBounds.x)
    expect(badgeBounds.y).toBeGreaterThanOrEqual(triggerBounds.y)
    expect(badgeBounds.x + badgeBounds.width).toBeLessThanOrEqual(
      triggerBounds.x + triggerBounds.width,
    )
    expect(badgeBounds.y + badgeBounds.height).toBeLessThanOrEqual(
      triggerBounds.y + triggerBounds.height,
    )
    await boardRelations.hover()
    await expect(page.locator(`[data-related-ticket-id="${one.id}"]`)).toBeVisible()
    await page.keyboard.press('Escape')
    await boardLinks.hover()
    const boardExternalLink = page.getByRole('link', { name: 'Design', exact: true })
    await expect(boardExternalLink).toBeVisible()
    await expect(boardExternalLink).toHaveAttribute('target', '_blank')
    await expect(boardExternalLink).toHaveAttribute('href', 'https://example.com/design')
    await page.keyboard.press('Escape')
    const singleBoardCard = page
      .locator(`[data-board-ticket-id="${one.id}"]`)
      .filter({ visible: true })
    await expect(
      singleBoardCard
        .getByRole('button', { name: 'Related tickets' })
        .locator('[data-slot="base"]'),
    ).toHaveCount(0)
    await expect(
      singleBoardCard.getByRole('button', { name: 'External links' }).locator('[data-slot="base"]'),
    ).toHaveCount(0)

    await page.goto(`/releases/${releaseRecord.id}`)
    await page.waitForLoadState('networkidle')
    const releaseCard = page.locator(`[data-release-ticket-id="${many.id}"]`)
    const releaseRelations = releaseCard.getByRole('button', { name: 'Related tickets' })
    const releaseLinks = releaseCard.getByRole('button', { name: 'External links' })
    await expect(releaseRelations.locator('[data-slot="base"]')).toHaveText('2')
    await expect(releaseLinks.locator('[data-slot="base"]')).toHaveText('2')
    await releaseRelations.focus()
    await expect(page.locator(`[data-related-ticket-id="${two.id}"]`)).toBeVisible()
    await page.keyboard.press('Escape')
    await releaseLinks.hover()
    const releaseExternalLink = page.getByRole('link', { name: 'Pull request', exact: true })
    await expect(releaseExternalLink).toBeVisible()
    await expect(releaseExternalLink).toHaveAttribute('target', '_blank')
    const singleReleaseCard = page.locator(`[data-release-ticket-id="${one.id}"]`)
    await expect(
      singleReleaseCard
        .getByRole('button', { name: 'Related tickets' })
        .locator('[data-slot="base"]'),
    ).toHaveCount(0)
    await expect(
      singleReleaseCard
        .getByRole('button', { name: 'External links' })
        .locator('[data-slot="base"]'),
    ).toHaveCount(0)

    mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    })
    await mobileContext.addCookies(
      await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }),
    )
    const mobilePage = await mobileContext.newPage()
    await mobilePage.goto('/today')
    await mobilePage.waitForLoadState('networkidle')
    const agendaCard = mobilePage.locator(`[data-agenda-ticket-id="${many.id}"]`)
    const mobileRelations = agendaCard.getByRole('button', { name: 'Related tickets' })
    await mobileRelations.tap()
    await expect(mobilePage.locator(`[data-related-ticket-id="${one.id}"]`)).toBeVisible()
    await mobilePage.keyboard.press('Escape')
    const mobileLinks = agendaCard.getByRole('button', { name: 'External links' })
    await mobileLinks.tap()
    const mobileExternalLink = mobilePage.getByRole('link', { name: 'Design', exact: true })
    await expect(mobileExternalLink).toBeVisible()
    await expect(mobileExternalLink).toHaveAttribute('target', '_blank')
    expect(
      await mobilePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBe(true)
  } finally {
    await mobileContext?.close()
    await cleanup(owner.id)
  }
})
