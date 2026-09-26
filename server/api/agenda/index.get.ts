import { and, asc, eq } from 'drizzle-orm'
import { getQuery } from 'h3'
import { validDate } from '../../../shared/time-entry'
import { db } from '../../db'
import { client, project, release, ticket, timeEntry } from '../../db/schema'
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
  return {
    entries,
    trackedMinutes: entries.reduce((sum, { entry }) => sum + entry.durationMinutes, 0),
  }
})
