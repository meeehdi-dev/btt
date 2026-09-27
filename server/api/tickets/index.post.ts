import { Effect } from 'effect'
import { db } from '../../db'
import { ticket, ticketLink, ticketRelation } from '../../db/schema'
import { decodeBody } from '../../domain/decode'
import { TicketCreate } from '../../domain/schemas'
import { externalUrl, ownedRelease, ownedTicket, visibleTicket } from '../../domain/tickets'
import { conflict, now, requireUserId } from '../../utils/domain'
import { promiseEffect } from '../../utils/effect'
import { defineEffectHandler } from '../../utils/effect-handler'
import { generateId } from '../../utils/id'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    yield* requireUserId(event)
    const body = yield* decodeBody(event, TicketCreate)
    yield* ownedRelease(event, body.releaseId)
    const links: { label: string | null; url: string }[] = []
    for (const { label, url } of body.links ?? [])
      links.push({ label: label ?? null, url: yield* externalUrl(url) })

    const relatedIds = body.relatedTicketIds ?? []
    if (new Set(relatedIds).size !== relatedIds.length)
      return yield* conflict('Tickets are already linked')
    for (const id of relatedIds) yield* visibleTicket(yield* ownedTicket(event, id), false)

    const timestamp = now()
    const id = generateId()
    return yield* promiseEffect('create ticket and related records', () =>
      db.transaction(async (tx) => {
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
      }),
    )
  }),
)
