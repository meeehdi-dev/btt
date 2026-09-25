import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { ticket } from '../../db/schema'
import { decodeBody } from '../../domain/decode'
import { TicketUpdate } from '../../domain/schemas'
import { ownedRelease, ownedTicket, ticketId } from '../../domain/tickets'
import { now } from '../../utils/domain'

export default defineEventHandler(async (event) => {
  const id = ticketId(event)
  await ownedTicket(event, id)
  const body = await decodeBody(event, TicketUpdate)
  if (!Object.keys(body).length)
    throw createError({ status: 400, statusText: 'At least one field is required' })
  if (body.releaseId !== undefined) await ownedRelease(event, body.releaseId)
  const [updated] = await db
    .update(ticket)
    .set({
      ...(body.releaseId === undefined ? {} : { releaseId: body.releaseId }),
      ...(body.title === undefined ? {} : { title: body.title }),
      ...(body.description === undefined ? {} : { description: body.description }),
      ...(body.status === undefined ? {} : { status: body.status }),
      ...(body.estimateMinutes === undefined ? {} : { estimateMinutes: body.estimateMinutes }),
      ...(body.archived === undefined ? {} : { archivedAt: body.archived ? now() : null }),
      updatedAt: now(),
    })
    .where(eq(ticket.id, id))
    .returning()
  return updated
})
