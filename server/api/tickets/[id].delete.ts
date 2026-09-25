import { eq, or } from 'drizzle-orm'
import { db } from '../../db'
import { ticket, ticketLink, ticketRelation } from '../../db/schema'
import { ownedTicket, ticketId } from '../../domain/tickets'
import { conflict } from '../../utils/domain'

export default defineEventHandler(async (event) => {
  const id = ticketId(event)
  const record = await ownedTicket(event, id)
  if (!record.ticket.archivedAt) conflict('Archive the ticket before permanently deleting it')
  await db.transaction(async (tx) => {
    await tx.delete(ticketLink).where(eq(ticketLink.ticketId, id))
    await tx
      .delete(ticketRelation)
      .where(or(eq(ticketRelation.fromTicketId, id), eq(ticketRelation.toTicketId, id)))
    await tx.delete(ticket).where(eq(ticket.id, id))
  })
  return { deleted: true }
})
