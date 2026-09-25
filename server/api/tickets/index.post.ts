import { db } from '../../db'
import { ticket, ticketLink, ticketRelation } from '../../db/schema'
import { decodeBody } from '../../domain/decode'
import { TicketCreate } from '../../domain/schemas'
import { externalUrl, ownedRelease, ownedTicket, visibleTicket } from '../../domain/tickets'
import { generateId } from '../../utils/id'
import { conflict, now, requireUserId } from '../../utils/domain'

export default defineEventHandler(async (event) => {
  await requireUserId(event)
  const body = await decodeBody(event, TicketCreate)
  await ownedRelease(event, body.releaseId)
  const links = (body.links ?? []).map(({ label, url }) => ({ label, url: externalUrl(url) }))
  const relatedIds = body.relatedTicketIds ?? []
  if (new Set(relatedIds).size !== relatedIds.length) conflict('Tickets are already linked')
  for (const id of relatedIds) visibleTicket(await ownedTicket(event, id), false)

  const timestamp = now()
  const id = generateId()
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(ticket)
      .values({
        id,
        releaseId: body.releaseId,
        title: body.title,
        description: body.description ?? '',
        status: body.status ?? 'Idea',
        estimateMinutes: body.estimateMinutes ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .returning()
    if (links.length)
      await tx
        .insert(ticketLink)
        .values(links.map((link) => ({ ...link, id: generateId(), ticketId: id })))
    if (relatedIds.length)
      await tx.insert(ticketRelation).values(
        relatedIds.map((otherId) => {
          const [fromTicketId, toTicketId] = [id, otherId].toSorted()
          return { id: generateId(), fromTicketId: fromTicketId!, toTicketId: toTicketId! }
        }),
      )
    return created
  })
})
