import { Effect } from 'effect'
import { asc, eq } from 'drizzle-orm'
import { db } from '../../db'
import { ticketLink } from '../../db/schema'
import { includeArchived } from '../../utils/domain'
import { promiseEffect } from '../../utils/effect'
import { defineEffectHandler } from '../../utils/effect-handler'
import { ownedTicket, ticketId, visibleTicket } from '../../domain/tickets'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const id = yield* ticketId(event)
    const record = yield* visibleTicket(
      yield* ownedTicket(event, id),
      yield* includeArchived(event),
    )
    const links = yield* promiseEffect('load ticket links', () =>
      db
        .select()
        .from(ticketLink)
        .where(eq(ticketLink.ticketId, id))
        .orderBy(asc(ticketLink.label), asc(ticketLink.id)),
    )
    return {
      ticket: record.ticket,
      hierarchy: {
        releaseName: record.releaseName,
        projectId: record.projectId,
        projectName: record.projectName,
        clientId: record.clientId,
        clientName: record.clientName,
        releaseArchivedAt: record.releaseArchivedAt,
        projectArchivedAt: record.projectArchivedAt,
        clientArchivedAt: record.clientArchivedAt,
      },
      links,
    }
  }),
)
