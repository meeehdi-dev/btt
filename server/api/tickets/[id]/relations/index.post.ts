import { db } from '../../../../db'
import { ticketRelation } from '../../../../db/schema'
import { decodeBody } from '../../../../domain/decode'
import { TicketRelationCreate } from '../../../../domain/schemas'
import { ownedTicket, ticketId, visibleTicket } from '../../../../domain/tickets'
import { conflict } from '../../../../utils/domain'
import { generateId } from '../../../../utils/id'

export default defineEventHandler(async (event) => {
  const id = ticketId(event)
  visibleTicket(await ownedTicket(event, id), true)
  const body = await decodeBody(event, TicketRelationCreate)
  if (id === body.ticketId) conflict('A ticket cannot link to itself')
  visibleTicket(await ownedTicket(event, body.ticketId), false)
  const [fromTicketId, toTicketId] = [id, body.ticketId].toSorted()
  const [created] = await db
    .insert(ticketRelation)
    .values({ id: generateId(), fromTicketId: fromTicketId!, toTicketId: toTicketId! })
    .onConflictDoNothing()
    .returning()
  if (!created) conflict('Tickets are already linked')
  return created
})
