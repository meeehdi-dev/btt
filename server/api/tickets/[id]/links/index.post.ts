import { db } from '../../../../db'
import { ticketLink } from '../../../../db/schema'
import { decodeBody } from '../../../../domain/decode'
import { TicketLinkCreate } from '../../../../domain/schemas'
import { externalUrl, ownedTicket, ticketId, visibleTicket } from '../../../../domain/tickets'
import { generateId } from '../../../../utils/id'

export default defineEventHandler(async (event) => {
  const id = ticketId(event)
  visibleTicket(await ownedTicket(event, id), true)
  const body = await decodeBody(event, TicketLinkCreate)
  const [created] = await db
    .insert(ticketLink)
    .values({ id: generateId(), ticketId: id, label: body.label, url: externalUrl(body.url) })
    .returning()
  return created
})
