import { Effect } from 'effect'
import { db } from '../../../../db'
import { ticketRelation } from '../../../../db/schema'
import { decodeBody } from '../../../../domain/decode'
import { TicketRelationCreate } from '../../../../domain/schemas'
import { ownedTicket, ticketId, visibleTicket } from '../../../../domain/tickets'
import { conflict } from '../../../../utils/domain'
import { promiseEffect } from '../../../../utils/effect'
import { defineEffectHandler } from '../../../../utils/effect-handler'
import { generateId } from '../../../../utils/id'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const id = yield* ticketId(event)
    yield* visibleTicket(yield* ownedTicket(event, id), true)
    const body = yield* decodeBody(event, TicketRelationCreate)
    if (id === body.ticketId) return yield* conflict('A ticket cannot link to itself')
    yield* visibleTicket(yield* ownedTicket(event, body.ticketId), false)
    const [fromTicketId, toTicketId] = [id, body.ticketId].toSorted()
    const [created] = yield* promiseEffect('create ticket relation', () =>
      db
        .insert(ticketRelation)
        .values({ id: generateId(), fromTicketId: fromTicketId!, toTicketId: toTicketId! })
        .onConflictDoNothing()
        .returning(),
    )
    if (!created) return yield* conflict('Tickets are already linked')
    return created
  }),
)
