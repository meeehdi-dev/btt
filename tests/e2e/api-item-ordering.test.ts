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

const createdAt = (day: number) => new Date(`2025-01-${String(day).padStart(2, '0')}T00:00:00.000Z`)

async function cleanup(userId: string) {
  const clients = await db.select({ id: client.id }).from(client).where(eq(client.userId, userId))
  const clientIds = clients.map(({ id }) => id)
  const projects = clientIds.length
    ? await db.select({ id: project.id }).from(project).where(inArray(project.clientId, clientIds))
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
    await db
      .delete(ticketRelation)
      .where(
        or(
          inArray(ticketRelation.fromTicketId, ticketIds),
          inArray(ticketRelation.toTicketId, ticketIds),
        ),
      )
    await db.delete(ticketLink).where(inArray(ticketLink.ticketId, ticketIds))
    await db.delete(ticket).where(inArray(ticket.id, ticketIds))
  }
  if (releaseIds.length) await db.delete(release).where(inArray(release.id, releaseIds))
  if (projectIds.length) await db.delete(project).where(inArray(project.id, projectIds))
  if (clientIds.length) await db.delete(client).where(inArray(client.id, clientIds))
}

test('collection APIs keep their approved order when records are edited', async ({
  page,
  context,
}) => {
  const helpers = (await testAuth.$context).test
  const owner = helpers.createUser({
    name: 'Ordering owner',
    email: `ordering-${crypto.randomUUID()}@example.com`,
  })
  await helpers.saveUser(owner)

  try {
    await context.addCookies(await helpers.getCookies({ userId: owner.id, domain: '127.0.0.1' }))
    const create = async (path: string, data: unknown) => {
      const response = await page.request.post(path, { data })
      expect(response.ok(), await response.text()).toBeTruthy()
      return response.json()
    }
    const oldUpdate = new Date('2025-02-01T00:00:00.000Z')
    const recentUpdate = new Date('2025-02-02T00:00:00.000Z')

    const olderClient = await create('/api/clients', { name: 'Ordering older client' })
    const newerClient = await create('/api/clients', { name: 'Ordering newer client' })
    await db
      .update(client)
      .set({ createdAt: createdAt(1), updatedAt: recentUpdate })
      .where(eq(client.id, olderClient.id))
    await db
      .update(client)
      .set({ createdAt: createdAt(2), updatedAt: oldUpdate })
      .where(eq(client.id, newerClient.id))

    const clientIds = async () =>
      (await (await page.request.get('/api/clients')).json()).clients.map(
        (record: { id: string }) => record.id,
      )
    expect(await clientIds()).toEqual([newerClient.id, olderClient.id])
    expect(
      (
        await page.request.patch(`/api/clients/${olderClient.id}`, {
          data: { color: '#123456' },
        })
      ).ok(),
    ).toBe(true)
    expect(await clientIds()).toEqual([newerClient.id, olderClient.id])

    const olderProject = await create('/api/projects', {
      clientId: newerClient.id,
      name: 'Ordering older project',
      color: '#abcdef',
    })
    const newerProject = await create('/api/projects', {
      clientId: newerClient.id,
      name: 'Ordering newer project',
      color: '#abcdef',
    })
    await db
      .update(project)
      .set({ createdAt: createdAt(1), updatedAt: recentUpdate })
      .where(eq(project.id, olderProject.id))
    await db
      .update(project)
      .set({ createdAt: createdAt(2), updatedAt: oldUpdate })
      .where(eq(project.id, newerProject.id))

    const projectIds = async () =>
      (await (await page.request.get('/api/projects')).json()).projects.map(
        (record: { project: { id: string } }) => record.project.id,
      )
    expect(await projectIds()).toEqual([newerProject.id, olderProject.id])
    expect(
      (
        await page.request.patch(`/api/projects/${olderProject.id}`, {
          data: { color: '#654321' },
        })
      ).ok(),
    ).toBe(true)
    expect(await projectIds()).toEqual([newerProject.id, olderProject.id])

    const releasesToCreate = [
      { key: 'undatedZeta', name: 'Zeta', targetDate: null },
      { key: 'undatedAlpha', name: 'Alpha', targetDate: null },
      { key: 'soon', name: 'Soon', targetDate: '2025-01-01' },
      { key: 'later', name: 'Later', targetDate: '2025-02-01' },
      { key: 'tieOld', name: 'Tie', targetDate: '2025-03-01' },
      { key: 'tieNew', name: 'Tie', targetDate: '2025-03-01' },
      { key: 'context', name: 'Context', targetDate: '2025-04-01' },
    ]
    const releases = Object.fromEntries(
      await Promise.all(
        releasesToCreate.map(async ({ key, name, targetDate }) => [
          key,
          await create('/api/releases', {
            projectId: newerProject.id,
            name,
            targetDate,
          }),
        ]),
      ),
    ) as Record<string, { id: string }>
    const releaseCreationDays: Record<string, number> = {
      undatedZeta: 1,
      undatedAlpha: 1,
      soon: 1,
      later: 1,
      tieOld: 1,
      tieNew: 2,
      context: 1,
    }
    for (const { key } of releasesToCreate)
      await db
        .update(release)
        .set({ createdAt: createdAt(releaseCreationDays[key]!), updatedAt: oldUpdate })
        .where(eq(release.id, releases[key]!.id))

    const expectedReleaseIds = [
      releases.undatedAlpha!.id,
      releases.undatedZeta!.id,
      releases.soon!.id,
      releases.later!.id,
      releases.tieNew!.id,
      releases.tieOld!.id,
      releases.context!.id,
    ]
    const releaseIds = async () =>
      (await (await page.request.get('/api/releases')).json()).releases.map(
        (record: { release: { id: string } }) => record.release.id,
      )
    expect(await releaseIds()).toEqual(expectedReleaseIds)
    expect(
      (
        await page.request.patch(`/api/releases/${releases.soon!.id}`, {
          data: { name: 'Soon' },
        })
      ).ok(),
    ).toBe(true)
    expect(await releaseIds()).toEqual(expectedReleaseIds)

    await page.goto(`/projects/${newerProject.id}`)
    await expect(page.locator('[data-release-card-id]')).toHaveCount(expectedReleaseIds.length)
    expect(
      await page
        .locator('[data-release-card-id]')
        .evaluateAll((cards) => cards.map((card) => card.getAttribute('data-release-card-id'))),
    ).toEqual(expectedReleaseIds)

    const ticketsToCreate = [
      { key: 'estimateNew', title: 'Ordering ticket estimated new', estimateMinutes: 60 },
      { key: 'estimateOld', title: 'Ordering ticket estimated old', estimateMinutes: 30 },
      { key: 'estimateTieA', title: 'Ordering ticket estimate tie A', estimateMinutes: 15 },
      { key: 'estimateTieB', title: 'Ordering ticket estimate tie B', estimateMinutes: 15 },
      { key: 'plainNew', title: 'Ordering ticket unestimated new' },
      { key: 'plainOld', title: 'Ordering ticket unestimated old' },
    ]
    const tickets = Object.fromEntries(
      await Promise.all(
        ticketsToCreate.map(async ({ key, title, estimateMinutes }) => [
          key,
          await create('/api/tickets', {
            releaseId: releases.soon!.id,
            title,
            ...(estimateMinutes === undefined ? {} : { estimateMinutes }),
          }),
        ]),
      ),
    ) as Record<string, { id: string }>
    const ticketCreationDays: Record<string, number> = {
      estimateNew: 6,
      estimateOld: 5,
      estimateTieA: 4,
      estimateTieB: 4,
      plainNew: 7,
      plainOld: 2,
    }
    for (const { key } of ticketsToCreate)
      await db
        .update(ticket)
        .set({ createdAt: createdAt(ticketCreationDays[key]!), updatedAt: oldUpdate })
        .where(eq(ticket.id, tickets[key]!.id))

    const expectedTicketIds = [
      tickets.estimateNew!.id,
      tickets.estimateOld!.id,
      ...[tickets.estimateTieA!.id, tickets.estimateTieB!.id].toSorted((a, b) =>
        b.localeCompare(a),
      ),
      tickets.plainNew!.id,
      tickets.plainOld!.id,
    ]
    const orderedTickets = async () =>
      (
        await (
          await page.request.get('/api/tickets', { params: { releaseId: releases.soon!.id } })
        ).json()
      ).tickets.map((record: { ticket: { id: string } }) => record.ticket.id)
    expect(await orderedTickets()).toEqual(expectedTicketIds)

    expect(
      (
        await page.request.patch(`/api/tickets/${tickets.estimateOld!.id}`, {
          data: { status: 'Review' },
        })
      ).ok(),
    ).toBe(true)
    expect(await orderedTickets()).toEqual(expectedTicketIds)
    const search = await (
      await page.request.get('/api/search', { params: { q: 'Ordering ticket' } })
    ).json()
    expect(search.tickets[0]?.id).toBe(tickets.estimateOld!.id)

    await page.goto(`/releases/${releases.soon!.id}`)
    await expect(page.locator('[data-release-ticket-id]')).toHaveCount(expectedTicketIds.length)
    expect(
      await page
        .locator('[data-release-ticket-id]')
        .evaluateAll((cards) => cards.map((card) => card.getAttribute('data-release-ticket-id'))),
    ).toEqual(expectedTicketIds)

    await page.goto(`/tickets?release=${releases.soon!.id}`)
    const ideaLane = page.getByRole('region', { name: 'Idea tickets' })
    const ideaIds = await ideaLane
      .locator('[data-board-ticket-id]')
      .evaluateAll((cards) => cards.map((card) => card.getAttribute('data-board-ticket-id')))
    expect(ideaIds).toEqual([
      tickets.estimateNew!.id,
      ...[tickets.estimateTieA!.id, tickets.estimateTieB!.id].toSorted((a, b) =>
        b.localeCompare(a),
      ),
      tickets.plainNew!.id,
      tickets.plainOld!.id,
    ])

    await page.goto(`/projects/${newerProject.id}`)
    expect(
      await page
        .locator('[data-release-card-id]')
        .evaluateAll((cards) => cards.map((card) => card.getAttribute('data-release-card-id'))),
    ).toEqual(expectedReleaseIds)
    await page.goto(`/releases/${releases.soon!.id}`)
    expect(
      await page
        .locator('[data-release-ticket-id]')
        .evaluateAll((cards) => cards.map((card) => card.getAttribute('data-release-ticket-id'))),
    ).toEqual(expectedTicketIds)

    const movedToEstimated = await page.request.patch(`/api/tickets/${tickets.plainNew!.id}`, {
      data: { estimateMinutes: 45 },
    })
    expect(movedToEstimated.ok()).toBe(true)
    const expectedAfterEstimate = [
      tickets.plainNew!.id,
      tickets.estimateNew!.id,
      tickets.estimateOld!.id,
      ...[tickets.estimateTieA!.id, tickets.estimateTieB!.id].toSorted((a, b) =>
        b.localeCompare(a),
      ),
      tickets.plainOld!.id,
    ]
    expect(await orderedTickets()).toEqual(expectedAfterEstimate)
    const searchAfterEstimate = await (
      await page.request.get('/api/search', { params: { q: 'Ordering ticket' } })
    ).json()
    expect(searchAfterEstimate.tickets[0]?.id).toBe(tickets.plainNew!.id)

    const relatedAlpha = await create('/api/tickets', {
      releaseId: releases.context!.id,
      title: 'Related Alpha',
    })
    const relatedZulu = await create('/api/tickets', {
      releaseId: releases.context!.id,
      title: 'Related Zulu',
    })
    const source = await create('/api/tickets', {
      releaseId: releases.context!.id,
      title: 'Context source',
      links: [
        { label: 'Zulu', url: 'https://example.com/z' },
        { label: 'Alpha', url: 'https://example.com/a' },
      ],
      relatedTicketIds: [relatedZulu.id, relatedAlpha.id],
    })
    const sourceDetail = await (await page.request.get(`/api/tickets/${source.id}`)).json()
    expect(sourceDetail.links.map((link: { label: string }) => link.label)).toEqual([
      'Alpha',
      'Zulu',
    ])
    expect(sourceDetail.related.map((record: { title: string }) => record.title)).toEqual([
      'Related Alpha',
      'Related Zulu',
    ])

    const entries = [
      { date: '2025-03-01', startMinute: 540, durationMinutes: 30, description: 'Earlier slot' },
      { date: '2025-03-01', startMinute: 600, durationMinutes: 30, description: 'Later slot' },
      { date: '2025-03-02', startMinute: 540, durationMinutes: 30, description: 'Next day' },
    ]
    const entryIds = [] as string[]
    for (const entry of entries) {
      const result = await create('/api/time-entries', {
        ticketId: tickets.estimateNew!.id,
        ...entry,
      })
      entryIds.push(result.id as string)
    }
    const history = await (
      await page.request.get('/api/time-entries', { params: { ticketId: tickets.estimateNew!.id } })
    ).json()
    expect(history.entries.map((entry: { id: string }) => entry.id)).toEqual([
      entryIds[2],
      entryIds[1],
      entryIds[0],
    ])
  } finally {
    await cleanup(owner.id)
    await helpers.deleteUser(owner.id)
  }
})
