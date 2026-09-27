import { Effect, Schema } from 'effect'
import type { H3Event } from 'h3'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../db'
import { client, project, release, ticket } from '../db/schema'
import { ValidationError } from './errors'
import { idParam, notFound, requireUserId } from '../utils/domain'
import { promiseEffect } from '../utils/effect'
import { externalUrl as validateUrl } from '../../shared/ticket-url'

const Id = Schema.String.check(
  Schema.isPattern(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
)

export function ticketId(event: H3Event) {
  return Effect.gen(function* () {
    return yield* validId(yield* idParam(event, 'id'))
  })
}

export function validId(id: string) {
  return Schema.decodeUnknownEffect(Id)(id).pipe(
    Effect.mapError(() => new ValidationError({ message: 'Invalid identifier' })),
  )
}

export function ownedRelease(event: H3Event, id: string) {
  return Effect.gen(function* () {
    const userId = yield* requireUserId(event)
    const validReleaseId = yield* validId(id)
    const [parent] = yield* promiseEffect('load owned release', () =>
      db
        .select({ id: release.id })
        .from(release)
        .innerJoin(project, eq(release.projectId, project.id))
        .innerJoin(client, eq(project.clientId, client.id))
        .where(
          and(
            eq(release.id, validReleaseId),
            eq(client.userId, userId),
            isNull(release.archivedAt),
            isNull(project.archivedAt),
            isNull(client.archivedAt),
          ),
        )
        .limit(1),
    )
    if (!parent) return yield* notFound('Release not found')
    return parent
  })
}

export function ownedTicket(event: H3Event, id: string) {
  return Effect.gen(function* () {
    const userId = yield* requireUserId(event)
    const validTicketId = yield* validId(id)
    const [record] = yield* promiseEffect('load owned ticket', () =>
      db
        .select({
          ticket,
          releaseName: release.name,
          projectId: project.id,
          projectName: project.name,
          clientId: client.id,
          clientName: client.name,
          releaseArchivedAt: release.archivedAt,
          projectArchivedAt: project.archivedAt,
          clientArchivedAt: client.archivedAt,
        })
        .from(ticket)
        .innerJoin(release, eq(ticket.releaseId, release.id))
        .innerJoin(project, eq(release.projectId, project.id))
        .innerJoin(client, eq(project.clientId, client.id))
        .where(and(eq(ticket.id, validTicketId), eq(client.userId, userId)))
        .limit(1),
    )
    if (!record) return yield* notFound('Ticket not found')
    return record
  })
}

export function visibleTicket(
  record: Effect.Success<ReturnType<typeof ownedTicket>>,
  archived: boolean,
) {
  if (
    !archived &&
    (record.clientArchivedAt ||
      record.projectArchivedAt ||
      record.releaseArchivedAt ||
      record.ticket.archivedAt)
  )
    return notFound('Ticket not found')
  return Effect.succeed(record)
}

export function externalUrl(input: string) {
  return Effect.try({
    try: () => validateUrl(input),
    catch: () => new ValidationError({ message: 'A valid http(s) URL is required' }),
  })
}
