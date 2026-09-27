import { and, eq } from 'drizzle-orm'
import { db } from '../../../../db'
import { ticketLink } from '../../../../db/schema'
import { decodeBody } from '../../../../domain/decode'
import { TicketLinkUpdate } from '../../../../domain/schemas'
import { externalUrl, ownedTicket, ticketId, validId } from '../../../../domain/tickets'
import { idParam, notFound } from '../../../../utils/domain'

export default defineEventHandler(async (event) => {
  const id = ticketId(event)
  await ownedTicket(event, id)
  const body = await decodeBody(event, TicketLinkUpdate)
  if (!Object.keys(body).length)
    throw createError({ status: 400, statusText: 'At least one field is required' })
  const [updated] = await db
    .update(ticketLink)
    .set({
      ...(body.label === undefined ? {} : { label: body.label }),
      ...(body.url === undefined ? {} : { url: externalUrl(body.url) }),
    })
    .where(and(eq(ticketLink.id, validId(idParam(event, 'linkId'))), eq(ticketLink.ticketId, id)))
    .returning()
  if (!updated) notFound('Link not found')
  return updated
})
