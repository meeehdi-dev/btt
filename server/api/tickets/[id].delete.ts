import { Effect } from 'effect'
import { eq, or } from 'drizzle-orm'
import { db } from '../../db'
import { ticket, ticketLink, ticketRelation, timeEntry } from '../../db/schema'
import { ownedTicket, ticketId } from '../../domain/tickets'
import { conflict } from '../../utils/domain'
import { promiseEffect } from '../../utils/effect'
import { defineEffectHandler } from '../../utils/effect-handler'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const id = yield* ticketId(event)
    const record = yield* ownedTicket(event, id)
    if (!record.ticket.archivedAt)
      return yield* conflict('Archive the ticket before permanently deleting it')
    const [historical] = yield* promiseEffect('check ticket time history before deletion', () =>
      db.select({ id: timeEntry.id }).from(timeEntry).where(eq(timeEntry.ticketId, id)).limit(1),
    )
    if (historical) return yield* conflict('Cannot permanently delete a ticket with tracked time')

    yield* promiseEffect('delete ticket and related records', () =>
      db.transaction(async (tx) => {
        await tx.delete(ticketLink).where(eq(ticketLink.ticketId, id))
        await tx
          .delete(ticketRelation)
          .where(or(eq(ticketRelation.fromTicketId, id), eq(ticketRelation.toTicketId, id)))
        await tx.delete(ticket).where(eq(ticket.id, id))
      }),
    )
    return { deleted: true }
  }),
)
