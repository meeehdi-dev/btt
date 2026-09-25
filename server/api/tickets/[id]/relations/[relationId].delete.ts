import { and, eq, or } from 'drizzle-orm'
import { db } from '../../../../db'
import { ticketRelation } from '../../../../db/schema'
import { ownedTicket, ticketId, validId } from '../../../../domain/tickets'
import { idParam, notFound } from '../../../../utils/domain'

export default defineEventHandler(async (event) => {
  const id = ticketId(event)
  await ownedTicket(event, id)
  const [deleted] = await db
    .delete(ticketRelation)
    .where(
      and(
        eq(ticketRelation.id, validId(idParam(event, 'relationId'))),
        or(eq(ticketRelation.fromTicketId, id), eq(ticketRelation.toTicketId, id)),
      ),
    )
    .returning()
  if (!deleted) notFound('Relation not found')
  return { deleted: true }
})
