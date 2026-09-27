import { Effect } from 'effect'
import { and, eq } from 'drizzle-orm'
import { db } from '../../../../db'
import { ticketLink } from '../../../../db/schema'
import { ownedTicket, ticketId, validId } from '../../../../domain/tickets'
import { idParam, notFound } from '../../../../utils/domain'
import { promiseEffect } from '../../../../utils/effect'
import { defineEffectHandler } from '../../../../utils/effect-handler'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const id = yield* ticketId(event)
    yield* ownedTicket(event, id)
    const linkId = yield* validId(yield* idParam(event, 'linkId'))
    const [deleted] = yield* promiseEffect('delete ticket link', () =>
      db
        .delete(ticketLink)
        .where(and(eq(ticketLink.id, linkId), eq(ticketLink.ticketId, id)))
        .returning(),
    )
    if (!deleted) return yield* notFound('Link not found')
    return { deleted: true }
  }),
)
