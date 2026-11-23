import { Effect } from 'effect'
import { and, asc, eq, gte, inArray, lte } from 'drizzle-orm'
import { db } from '../db'
import { client, project, release, ticket, ticketLink, timeEntry } from '../db/schema'
import { promiseEffect } from '../utils/effect'

export function loadAgendaEntries(userId: string, startDate: string, endDate: string) {
  return Effect.gen(function* () {
    const entries = yield* promiseEffect('load agenda entries', () =>
      db
        .select({
          entry: timeEntry,
          ticketId: ticket.id,
          ticketTitle: ticket.title,
          status: ticket.status,
          priority: ticket.priority,
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
        .where(and(eq(client.userId, userId), gteDate(startDate), lteDate(endDate)))
        .orderBy(asc(timeEntry.date), asc(timeEntry.startMinute), asc(timeEntry.id)),
    )
    const ids = [...new Set(entries.map(({ ticketId }) => ticketId))]
    const links = ids.length
      ? yield* promiseEffect('load agenda ticket links', () =>
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
        )
      : []
    const linksById = new Map<string, { id: string; label: string | null; url: string }[]>()
    for (const { id, ticketId, label, url } of links)
      linksById.set(ticketId, [...(linksById.get(ticketId) ?? []), { id, label, url }])
    return entries.map((row) => ({
      ...row,
      externalLinks: linksById.get(row.ticketId) ?? [],
    }))
  })
}

// Small wrappers keep the date-range comparison next to the shared query without
// narrowing Drizzle's date column to a JavaScript Date/time-zone interpretation.
function gteDate(value: string) {
  return gte(timeEntry.date, value)
}

function lteDate(value: string) {
  return lte(timeEntry.date, value)
}
