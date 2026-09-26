import { and, asc, eq, inArray, or } from 'drizzle-orm'
import { getQuery } from 'h3'
import { validDate } from '../../../shared/time-entry'
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
import { requireUserId } from '../../utils/domain'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const date = getQuery(event).date
  if (typeof date !== 'string' || !validDate(date))
    throw createError({ status: 400, statusText: 'A valid calendar date is required' })
  const entries = await db
    .select({
      entry: timeEntry,
      ticketId: ticket.id,
      ticketTitle: ticket.title,
      status: ticket.status,
      ticketArchivedAt: ticket.archivedAt,
      releaseId: release.id,
      releaseName: release.name,
      releaseArchivedAt: release.archivedAt,
      projectId: project.id,
      projectName: project.name,
      projectColor: project.color,
      projectArchivedAt: project.archivedAt,
      clientId: client.id,
      clientName: client.name,
      clientArchivedAt: client.archivedAt,
    })
    .from(timeEntry)
    .innerJoin(ticket, eq(timeEntry.ticketId, ticket.id))
    .innerJoin(release, eq(ticket.releaseId, release.id))
    .innerJoin(project, eq(release.projectId, project.id))
    .innerJoin(client, eq(project.clientId, client.id))
    .where(and(eq(timeEntry.date, date), eq(client.userId, userId)))
    .orderBy(asc(timeEntry.startMinute), asc(timeEntry.id))
  const ids = [...new Set(entries.map(({ ticketId }) => ticketId))]
  const [relations, links] = ids.length
    ? await Promise.all([
        db
          .select({
            fromTicketId: ticketRelation.fromTicketId,
            toTicketId: ticketRelation.toTicketId,
          })
          .from(ticketRelation)
          .where(
            or(inArray(ticketRelation.fromTicketId, ids), inArray(ticketRelation.toTicketId, ids)),
          ),
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
    : [[], []]
  const relatedIds = [
    ...new Set(relations.flatMap(({ fromTicketId, toTicketId }) => [fromTicketId, toTicketId])),
  ]
  const targets = relatedIds.length
    ? await db
        .select({
          id: ticket.id,
          title: ticket.title,
          ticketArchivedAt: ticket.archivedAt,
          releaseArchivedAt: release.archivedAt,
          projectArchivedAt: project.archivedAt,
          clientArchivedAt: client.archivedAt,
        })
        .from(ticket)
        .innerJoin(release, eq(ticket.releaseId, release.id))
        .innerJoin(project, eq(release.projectId, project.id))
        .innerJoin(client, eq(project.clientId, client.id))
        .where(and(inArray(ticket.id, relatedIds), eq(client.userId, userId)))
    : []
  const targetById = new Map(
    targets.map((target) => [
      target.id,
      {
        id: target.id,
        title: target.title,
        archived: Boolean(
          target.ticketArchivedAt ||
          target.releaseArchivedAt ||
          target.projectArchivedAt ||
          target.clientArchivedAt,
        ),
      },
    ]),
  )
  const relatedById = new Map<string, { id: string; title: string; archived: boolean }[]>()
  for (const { fromTicketId, toTicketId } of relations) {
    for (const [sourceId, targetId] of [
      [fromTicketId, toTicketId],
      [toTicketId, fromTicketId],
    ] as const) {
      if (!ids.includes(sourceId)) continue
      const target = targetById.get(targetId)
      if (target) relatedById.set(sourceId, [...(relatedById.get(sourceId) ?? []), target])
    }
  }
  const linksById = new Map<string, { id: string; label: string; url: string }[]>()
  for (const { id, ticketId, label, url } of links)
    linksById.set(ticketId, [...(linksById.get(ticketId) ?? []), { id, label, url }])
  const enrichedEntries = entries.map((row) => ({
    ...row,
    relatedTickets: (relatedById.get(row.ticketId) ?? []).toSorted(
      (a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id),
    ),
    externalLinks: linksById.get(row.ticketId) ?? [],
  }))
  return {
    entries: enrichedEntries,
    trackedMinutes: entries.reduce((sum, { entry }) => sum + entry.durationMinutes, 0),
  }
})
