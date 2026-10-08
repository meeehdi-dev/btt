import { expect, test } from '@playwright/test'
import { eq, inArray } from 'drizzle-orm'
import { db } from '../../server/db'
import { client, project, release, ticket, timeEntry } from '../../server/db/schema'
import { testAuth } from '../../server/utils/auth-test'
import { waitForClientMount } from './wait-for-client-mount'

const weekMs = 7 * 24 * 60 * 60 * 1000

test('quiet Done tickets disappear only from the active Ticket Board', async ({
  page,
  context,
}) => {
  const helpers = (await testAuth.$context).test
  const user = helpers.createUser({
    name: 'Quiet Done User',
    email: `quiet-done-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(user)
  try {
    await context.addCookies(await helpers.getCookies({ userId: user.id, domain: '127.0.0.1' }))
    const create = async (path: string, data: unknown) => {
      const response = await page.request.post(path, { data })
      expect(response.ok(), await response.text()).toBe(true)
      return response.json()
    }
    const clientRecord = await create('/api/clients', { name: 'Quiet Done Client' })
    const projectRecord = await create('/api/projects', {
      clientId: clientRecord.id,
      name: 'Quiet Done Project',
      color: '#abcdef',
    })
    const undatedRelease = await create('/api/releases', {
      projectId: projectRecord.id,
      name: 'Undated Quiet Release',
    })
    const datedRelease = await create('/api/releases', {
      projectId: projectRecord.id,
      name: 'Dated Quiet Release',
      targetDate: '2000-01-01',
    })
    const staleDone = await create('/api/tickets', {
      releaseId: undatedRelease.id,
      title: 'Quiet Done old activity',
      status: 'Done',
    })
    const workActiveDone = await create('/api/tickets', {
      releaseId: undatedRelease.id,
      title: 'Quiet Done recent tracked work',
      status: 'Done',
    })
    const datedDone = await create('/api/tickets', {
      releaseId: datedRelease.id,
      title: 'Quiet Done with target date',
      status: 'Done',
    })
    const staleReview = await create('/api/tickets', {
      releaseId: undatedRelease.id,
      title: 'Quiet Review old activity',
      status: 'Review',
    })
    const nearCutoffDone = await create('/api/tickets', {
      releaseId: undatedRelease.id,
      title: 'Quiet Done just inside cutoff',
      status: 'Done',
    })
    const archivedDone = await create('/api/tickets', {
      releaseId: undatedRelease.id,
      title: 'Quiet Done explicitly archived',
      status: 'Done',
    })

    const date = await page.evaluate(() => {
      const now = new Date()
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    })
    const staleEntry = await create('/api/time-entries', {
      ticketId: staleDone.id,
      date,
      startMinute: 540,
      durationMinutes: 30,
      description: 'Old recorded work',
    })
    const recentEntry = await create('/api/time-entries', {
      ticketId: workActiveDone.id,
      date,
      startMinute: 600,
      durationMinutes: 30,
      description: 'Recent recorded work',
    })

    const now = new Date()
    const staleAt = new Date(now.getTime() - weekMs - 60_000)
    const recentAt = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const justInsideCutoff = new Date(now.getTime() - weekMs + 60_000)
    await Promise.all([
      db.update(ticket).set({ updatedAt: staleAt }).where(eq(ticket.id, staleDone.id)),
      db.update(timeEntry).set({ updatedAt: staleAt }).where(eq(timeEntry.id, staleEntry.id)),
      db.update(ticket).set({ updatedAt: staleAt }).where(eq(ticket.id, workActiveDone.id)),
      db.update(timeEntry).set({ updatedAt: recentAt }).where(eq(timeEntry.id, recentEntry.id)),
      db.update(ticket).set({ updatedAt: staleAt }).where(eq(ticket.id, datedDone.id)),
      db.update(ticket).set({ updatedAt: staleAt }).where(eq(ticket.id, staleReview.id)),
      db
        .update(ticket)
        .set({ updatedAt: justInsideCutoff })
        .where(eq(ticket.id, nearCutoffDone.id)),
      db
        .update(ticket)
        .set({ archivedAt: now, updatedAt: staleAt })
        .where(eq(ticket.id, archivedDone.id)),
    ])

    const defaultResponse = await (await page.request.get('/api/tickets')).json()
    const defaultIds = defaultResponse.tickets.map(
      (item: { ticket: { id: string } }) => item.ticket.id,
    )
    expect(defaultIds).toEqual(
      expect.arrayContaining([
        staleDone.id,
        workActiveDone.id,
        datedDone.id,
        staleReview.id,
        nearCutoffDone.id,
      ]),
    )
    const defaultStaleRecord = defaultResponse.tickets.find(
      (item: { ticket: { id: string } }) => item.ticket.id === staleDone.id,
    )
    expect(defaultStaleRecord).not.toHaveProperty('releaseTargetDate')
    const unchangedStaleTicket = await db
      .select({ status: ticket.status, archivedAt: ticket.archivedAt, updatedAt: ticket.updatedAt })
      .from(ticket)
      .where(eq(ticket.id, staleDone.id))
      .then(([record]) => record)
    expect(unchangedStaleTicket).toEqual({
      status: 'Done',
      archivedAt: null,
      updatedAt: staleAt,
    })

    const boardResponseRequest = await page.request.get('/api/tickets?board=true')
    expect(boardResponseRequest.ok(), await boardResponseRequest.text()).toBe(true)
    const boardResponse = await boardResponseRequest.json()
    const boardIds = boardResponse.tickets.map((item: { ticket: { id: string } }) => item.ticket.id)
    expect(boardIds).not.toContain(staleDone.id)
    expect(boardIds).toEqual(
      expect.arrayContaining([workActiveDone.id, datedDone.id, staleReview.id, nearCutoffDone.id]),
    )

    const archivedBoardResponse = await (
      await page.request.get('/api/tickets?board=true&archived=true')
    ).json()
    const archivedBoardIds = archivedBoardResponse.tickets.map(
      (item: { ticket: { id: string } }) => item.ticket.id,
    )
    expect(archivedBoardIds).toContain(archivedDone.id)
    expect(archivedBoardIds).not.toContain(staleDone.id)

    const reviewStatusResponse = await page.request.patch(`/api/tickets/${staleDone.id}`, {
      data: { status: 'Review' },
    })
    expect(reviewStatusResponse.ok(), await reviewStatusResponse.text()).toBe(true)
    const reviewBoard = await (await page.request.get('/api/tickets?board=true')).json()
    expect(reviewBoard.tickets.map((item: { ticket: { id: string } }) => item.ticket.id)).toContain(
      staleDone.id,
    )
    const doneStatusResponse = await page.request.patch(`/api/tickets/${staleDone.id}`, {
      data: { status: 'Done' },
    })
    expect(doneStatusResponse.ok(), await doneStatusResponse.text()).toBe(true)
    await db.update(ticket).set({ updatedAt: staleAt }).where(eq(ticket.id, staleDone.id))
    const quietAgainBoard = await (await page.request.get('/api/tickets?board=true')).json()
    expect(
      quietAgainBoard.tickets.map((item: { ticket: { id: string } }) => item.ticket.id),
    ).not.toContain(staleDone.id)

    await page.goto('/tickets')
    await waitForClientMount(page)
    const board = page.getByRole('region', { name: 'Ticket board' })
    const card = (id: string) => board.locator(`[data-board-ticket-id="${id}"]`)
    await expect(card(staleDone.id)).toHaveCount(0)
    await expect(card(workActiveDone.id)).toBeVisible()
    await expect(card(datedDone.id)).toBeVisible()
    await expect(card(nearCutoffDone.id)).toBeVisible()
    await page.getByRole('button', { name: 'Filter archived tickets' }).click()
    await page.getByRole('option', { name: 'Include archived', exact: true }).click()
    await expect(card(archivedDone.id)).toBeVisible()
    await expect(card(staleDone.id)).toHaveCount(0)

    await page.goto(`/releases/${undatedRelease.id}`)
    await waitForClientMount(page)
    await expect(page.locator(`[data-release-ticket-id="${staleDone.id}"]`)).toBeVisible()
    const searchResponse = await (
      await page.request.get('/api/search', { params: { q: 'Quiet Done old activity' } })
    ).json()
    expect(searchResponse.tickets.map((item: { id: string }) => item.id)).toContain(staleDone.id)
    await page.goto(`/tickets/${staleDone.id}`)
    await waitForClientMount(page)
    await expect(page.getByRole('heading', { name: 'Quiet Done old activity' })).toBeVisible()

    await page.goto(`/agenda?date=${date}`)
    await waitForClientMount(page)
    await expect(
      page.locator(`[data-agenda-ticket-id="${staleDone.id}"]`).filter({ visible: true }),
    ).toBeVisible()
  } finally {
    const clients = await db
      .select({ id: client.id })
      .from(client)
      .where(eq(client.userId, user.id))
    const clientIds = clients.map(({ id }) => id)
    const projects = clientIds.length
      ? await db
          .select({ id: project.id })
          .from(project)
          .where(inArray(project.clientId, clientIds))
      : []
    const projectIds = projects.map(({ id }) => id)
    const releases = projectIds.length
      ? await db
          .select({ id: release.id })
          .from(release)
          .where(inArray(release.projectId, projectIds))
      : []
    const releaseIds = releases.map(({ id }) => id)
    const tickets = releaseIds.length
      ? await db.select({ id: ticket.id }).from(ticket).where(inArray(ticket.releaseId, releaseIds))
      : []
    const ticketIds = tickets.map(({ id }) => id)
    if (ticketIds.length) {
      await db.delete(timeEntry).where(inArray(timeEntry.ticketId, ticketIds))
      await db.delete(ticket).where(inArray(ticket.id, ticketIds))
    }
    if (releaseIds.length) await db.delete(release).where(inArray(release.id, releaseIds))
    if (projectIds.length) await db.delete(project).where(inArray(project.id, projectIds))
    if (clientIds.length) await db.delete(client).where(inArray(client.id, clientIds))
    await helpers.deleteUser(user.id)
  }
})
