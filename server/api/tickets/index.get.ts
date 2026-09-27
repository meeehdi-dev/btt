import { and, asc, desc, eq, inArray, isNull, or, sql } from 'drizzle-orm'
import { db } from '../../db'
import {
  client,
  project,
  release,
  ticket,
  ticketLink,
  ticketRelation,
  timeEntry,
} from '../../db/schema'
import { includeArchived, requireUserId } from '../../utils/domain'
import { validId } from '../../domain/tickets'
import { getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const archived = includeArchived(event)
  const releaseId = getQuery(event).releaseId
  if (releaseId !== undefined && typeof releaseId !== 'string')
    throw createError({ status: 400, statusText: 'Invalid release' })
  const tickets = await db
    .select({
      ticket,
      releaseName: release.name,
      projectId: project.id,
      projectName: project.name,
      clientId: client.id,
      clientName: client.name,
    })
    .from(ticket)
    .innerJoin(release, eq(ticket.releaseId, release.id))
    .innerJoin(project, eq(release.projectId, project.id))
    .innerJoin(client, eq(project.clientId, client.id))
    .where(
      and(
        eq(client.userId, userId),
        isNull(client.archivedAt),
        isNull(project.archivedAt),
        isNull(release.archivedAt),
        archived ? undefined : isNull(ticket.archivedAt),
        releaseId ? eq(release.id, validId(releaseId)) : undefined,
      ),
    )
    .orderBy(desc(ticket.updatedAt))
  const ids = tickets.map(({ ticket: record }) => record.id)
  if (!ids.length) return { tickets: [] }
  const relations = await db
    .select({ fromTicketId: ticketRelation.fromTicketId, toTicketId: ticketRelation.toTicketId })
    .from(ticketRelation)
    .where(or(inArray(ticketRelation.fromTicketId, ids), inArray(ticketRelation.toTicketId, ids)))
  const [usage, links] = await Promise.all([
    db
      .select({
        ticketId: timeEntry.ticketId,
        minutes: sql<number>`coalesce(sum(${timeEntry.durationMinutes}), 0)::double precision`,
      })
      .from(timeEntry)
      .where(inArray(timeEntry.ticketId, ids))
      .groupBy(timeEntry.ticketId),
    db
      .select({
        id: ticketLink.id,
        ticketId: ticketLink.ticketId,
        label: ticketLink.label,
        url: ticketLink.url,
      })
      .from(ticketLink)
      .where(inArray(ticketLink.ticketId, ids))
      .orderBy(asc(ticketLink.label), asc(ticketLink.id)),
  ])
  const minutesByTicket = new Map(usage.map((row) => [row.ticketId, row.minutes]))
  const relatedIds = [
    ...new Set(relations.flatMap(({ fromTicketId, toTicketId }) => [fromTicketId, toTicketId])),
  ]
  const validTargets = relatedIds.length
    ? await db
        .select({ id: ticket.id, title: ticket.title })
        .from(ticket)
        .innerJoin(release, eq(ticket.releaseId, release.id))
        .innerJoin(project, eq(release.projectId, project.id))
        .innerJoin(client, eq(project.clientId, client.id))
        .where(
          and(
            inArray(ticket.id, relatedIds),
            eq(client.userId, userId),
            isNull(ticket.archivedAt),
            isNull(release.archivedAt),
            isNull(project.archivedAt),
            isNull(client.archivedAt),
          ),
        )
    : []
  const targetById = new Map(validTargets.map((target) => [target.id, target]))
  const boardIds = new Set(ids)
  const relatedById = new Map<string, { id: string; title: string }[]>()
  const linksById = new Map<string, { id: string; label: string | null; url: string }[]>()
  for (const { id, ticketId, label, url } of links)
    linksById.set(ticketId, [...(linksById.get(ticketId) ?? []), { id, label, url }])
  for (const { fromTicketId, toTicketId } of relations) {
    for (const [source, targetId] of [
      [fromTicketId, toTicketId],
      [toTicketId, fromTicketId],
    ] as const) {
      if (!boardIds.has(source)) continue
      const target = targetById.get(targetId)
      if (target) relatedById.set(source, [...(relatedById.get(source) ?? []), target])
    }
  }
  return {
    tickets: tickets.map((item) => ({
      ...item,
      trackedMinutes: minutesByTicket.get(item.ticket.id) ?? 0,
      relatedTickets: (relatedById.get(item.ticket.id) ?? []).toSorted(
        (a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id),
      ),
      externalLinks: linksById.get(item.ticket.id) ?? [],
    })),
  }
})
