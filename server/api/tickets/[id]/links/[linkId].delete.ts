import { and, eq } from 'drizzle-orm'
import { db } from '../../../../db'
import { ticketLink } from '../../../../db/schema'
import { ownedTicket, ticketId, validId } from '../../../../domain/tickets'
import { idParam, notFound } from '../../../../utils/domain'

export default defineEventHandler(async (event) => {
  const id = ticketId(event)
  await ownedTicket(event, id)
  const [deleted] = await db
    .delete(ticketLink)
    .where(and(eq(ticketLink.id, validId(idParam(event, 'linkId'))), eq(ticketLink.ticketId, id)))
    .returning()
  if (!deleted) notFound('Link not found')
  return { deleted: true }
})
