import { Effect } from 'effect'
import { and, eq, ne, sql } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { overlaps, validDate, validSlot } from '../../shared/time-entry'
import { db } from '../db'
import { client, project, release, ticket, timeEntry, user } from '../db/schema'
import { generateId } from '../utils/id'
import { conflict, notFound, requireUserId, validation } from '../utils/domain'
import { promiseEffect } from '../utils/effect'
import { ownedTicket, validId } from './tickets'

export function validateEntry(date: string, startMinute: number, durationMinutes: number) {
  if (!validDate(date) || !validSlot(startMinute, durationMinutes))
    return validation('Enter a valid date and 30-minute slots ending by midnight')
  return Effect.void
}

export function writableTicket(event: H3Event, id: string) {
  return Effect.gen(function* () {
    const record = yield* ownedTicket(event, id)
    if (
      record.ticket.archivedAt ||
      record.releaseArchivedAt ||
      record.projectArchivedAt ||
      record.clientArchivedAt
    )
      return yield* conflict('Cannot log new work against archived tickets or parents')
    return record
  })
}

export function ownedEntry(event: H3Event, id: string) {
  return Effect.gen(function* () {
    const userId = yield* requireUserId(event)
    const validEntryId = yield* validId(id)
    const [record] = yield* promiseEffect('load owned time entry', () =>
      db
        .select({
          entry: timeEntry,
          ticketTitle: ticket.title,
          ticketArchivedAt: ticket.archivedAt,
          releaseArchivedAt: release.archivedAt,
          projectArchivedAt: project.archivedAt,
          clientArchivedAt: client.archivedAt,
        })
        .from(timeEntry)
        .innerJoin(ticket, eq(timeEntry.ticketId, ticket.id))
        .innerJoin(release, eq(ticket.releaseId, release.id))
        .innerJoin(project, eq(release.projectId, project.id))
        .innerJoin(client, eq(project.clientId, client.id))
        .where(and(eq(timeEntry.id, validEntryId), eq(client.userId, userId)))
        .limit(1),
    )
    if (!record) return yield* notFound('Time entry not found')
    return record
  })
}

// Locking the owner's row serializes every competing entry write, even across different tickets.
// Under READ COMMITTED, the overlap read after acquiring the lock observes the prior commit.
export function saveEntry(
  event: H3Event,
  input: {
    ticketId: string
    date: string
    startMinute: number
    durationMinutes: number
    description: string
  },
  existingId?: string,
) {
  return Effect.gen(function* () {
    const userId = yield* requireUserId(event)
    yield* validateEntry(input.date, input.startMinute, input.durationMinutes)
    const outcome = yield* promiseEffect('save time entry', () =>
      db.transaction(async (tx) => {
        await tx.select({ id: user.id }).from(user).where(eq(user.id, userId)).for('update')
        const others = await tx
          .select({
            id: timeEntry.id,
            startMinute: timeEntry.startMinute,
            durationMinutes: timeEntry.durationMinutes,
          })
          .from(timeEntry)
          .innerJoin(ticket, eq(timeEntry.ticketId, ticket.id))
          .innerJoin(release, eq(ticket.releaseId, release.id))
          .innerJoin(project, eq(release.projectId, project.id))
          .innerJoin(client, eq(project.clientId, client.id))
          .where(
            and(
              eq(client.userId, userId),
              eq(timeEntry.date, input.date),
              existingId ? ne(timeEntry.id, existingId) : undefined,
              sql`${timeEntry.startMinute} < ${input.startMinute + input.durationMinutes}`,
              sql`${timeEntry.startMinute} + ${timeEntry.durationMinutes} > ${input.startMinute}`,
            ),
          )
        if (others.some((other) => overlaps(other, input))) return { conflict: true as const }

        const timestamp = new Date()
        if (existingId) {
          const [updated] = await tx
            .update(timeEntry)
            .set({ ...input, updatedAt: timestamp })
            .where(eq(timeEntry.id, existingId))
            .returning()
          return { entry: updated }
        }
        const [created] = await tx
          .insert(timeEntry)
          .values({ ...input, id: generateId(), createdAt: timestamp, updatedAt: timestamp })
          .returning()
        return { entry: created }
      }),
    )
    if ('conflict' in outcome) return yield* conflict('Time entries cannot overlap')
    return outcome.entry
  })
}
