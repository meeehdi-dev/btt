import { Effect } from 'effect'
import { and, eq, or } from 'drizzle-orm'
import { db } from '../../../../db'
import { ticketRelation } from '../../../../db/schema'
import { ownedTicket, ticketId, validId } from '../../../../domain/tickets'
import { idParam, notFound } from '../../../../utils/domain'
import { promiseEffect } from '../../../../utils/effect'
import { defineEffectHandler } from '../../../../utils/effect-handler'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const id = yield* ticketId(event)
    yield* ownedTicket(event, id)
    const relationId = yield* validId(yield* idParam(event, 'relationId'))
    const [deleted] = yield* promiseEffect('delete ticket relation', () =>
      db
        .delete(ticketRelation)
        .where(
          and(
            eq(ticketRelation.id, relationId),
            or(eq(ticketRelation.fromTicketId, id), eq(ticketRelation.toTicketId, id)),
          ),
        )
        .returning(),
    )
    if (!deleted) return yield* notFound('Relation not found')
    return { deleted: true }
  }),
)
