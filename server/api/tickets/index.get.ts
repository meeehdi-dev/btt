import { Effect } from 'effect'
import { and, asc, desc, eq, inArray, isNull, sql } from 'drizzle-orm'
import { db } from '../../db'
import { client, project, release, ticket, ticketLink, timeEntry } from '../../db/schema'
import { includeArchived, queryOf, requireUserId, validation } from '../../utils/domain'
import { promiseEffect } from '../../utils/effect'
import { defineEffectHandler } from '../../utils/effect-handler'
import { validId } from '../../domain/tickets'
import { shouldHideQuietDoneTicket } from '../../domain/ticket-visibility'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const userId = yield* requireUserId(event)
    const archived = yield* includeArchived(event)
    const query = yield* queryOf(event)
    const boardView = query.board === 'true'
    if (query.board !== undefined && !boardView) return yield* validation('Invalid board view')
    const releaseId = query.releaseId
    if (releaseId !== undefined && typeof releaseId !== 'string')
      return yield* validation('Invalid release')
    const validReleaseId = releaseId ? yield* validId(releaseId) : undefined
    const tickets = yield* promiseEffect('list tickets', () =>
      db
        .select({
          ticket,
          releaseName: release.name,
          releaseTargetDate: release.targetDate,
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
            validReleaseId ? eq(release.id, validReleaseId) : undefined,
          ),
        )
        .orderBy(desc(ticket.createdAt), desc(ticket.id)),
    )
    const quietCandidates = boardView
      ? tickets.filter(
          ({ ticket: record, releaseTargetDate }) =>
            !record.archivedAt && record.status === 'Done' && releaseTargetDate === null,
        )
      : []
    const latestTimeEntryActivity = quietCandidates.length
      ? yield* promiseEffect('load quiet Done ticket activity', () =>
          db
            .select({
              ticketId: timeEntry.ticketId,
              updatedAt: sql<Date | string | null>`max(${timeEntry.updatedAt})`,
            })
            .from(timeEntry)
            .where(
              inArray(
                timeEntry.ticketId,
                quietCandidates.map(({ ticket: record }) => record.id),
              ),
            )
            .groupBy(timeEntry.ticketId),
        )
      : []
    const latestActivityByTicket = new Map<string, Date | null>(
      latestTimeEntryActivity.map(({ ticketId, updatedAt }) => [
        ticketId,
        updatedAt === null ? null : updatedAt instanceof Date ? updatedAt : new Date(updatedAt),
      ]),
    )
    const asOf = new Date()
    const visibleTickets = boardView
      ? tickets.filter(
          ({ ticket: record, releaseTargetDate }) =>
            !shouldHideQuietDoneTicket(
              {
                status: record.status,
                targetDate: releaseTargetDate,
                archivedAt: record.archivedAt,
                ticketUpdatedAt: record.updatedAt,
                latestTimeEntryUpdatedAt: latestActivityByTicket.get(record.id) ?? null,
              },
              asOf,
            ),
        )
      : tickets
    const ids = visibleTickets.map(({ ticket: record }) => record.id)
    if (!ids.length) return { tickets: [] }

    const [usage, links] = yield* promiseEffect('load ticket usage and links', () =>
      Promise.all([
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
      ]),
    )
    const minutesByTicket = new Map(usage.map((row) => [row.ticketId, row.minutes]))
    const linksById = new Map<string, { id: string; label: string | null; url: string }[]>()
    for (const { id, ticketId, label, url } of links)
      linksById.set(ticketId, [...(linksById.get(ticketId) ?? []), { id, label, url }])
    return {
      tickets: visibleTickets.map(({ releaseTargetDate: _releaseTargetDate, ...item }) => ({
        ...item,
        trackedMinutes: minutesByTicket.get(item.ticket.id) ?? 0,
        externalLinks: linksById.get(item.ticket.id) ?? [],
      })),
    }
  }),
)
