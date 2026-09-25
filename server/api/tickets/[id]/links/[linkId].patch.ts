import { and, eq } from 'drizzle-orm'
import { db } from '../../../../db'
import { ticketLink } from '../../../../db/schema'
import { decodeBody } from '../../../../domain/decode'
import { TicketLinkCreate } from '../../../../domain/schemas'
import { externalUrl, ownedTicket, ticketId, validId } from '../../../../domain/tickets'
import { idParam, notFound } from '../../../../utils/domain'

export default defineEventHandler(async (event) => {
  const id = ticketId(event)
  await ownedTicket(event, id)
  const body = await decodeBody(event, TicketLinkCreate)
  const [updated] = await db
    .update(ticketLink)
    .set({ label: body.label, url: externalUrl(body.url) })
    .where(and(eq(ticketLink.id, validId(idParam(event, 'linkId'))), eq(ticketLink.ticketId, id)))
    .returning()
  if (!updated) notFound('Link not found')
  return updated
})
