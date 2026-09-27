import { Effect } from 'effect'
import { db } from '../../../../db'
import { ticketLink } from '../../../../db/schema'
import { decodeBody } from '../../../../domain/decode'
import { TicketLinkCreate } from '../../../../domain/schemas'
import { externalUrl, ownedTicket, ticketId, visibleTicket } from '../../../../domain/tickets'
import { promiseEffect } from '../../../../utils/effect'
import { defineEffectHandler } from '../../../../utils/effect-handler'
import { generateId } from '../../../../utils/id'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const id = yield* ticketId(event)
    yield* visibleTicket(yield* ownedTicket(event, id), true)
    const body = yield* decodeBody(event, TicketLinkCreate)
    const url = yield* externalUrl(body.url)
    const [created] = yield* promiseEffect('create ticket link', () =>
      db
        .insert(ticketLink)
        .values({
          id: generateId(),
          ticketId: id,
          label: body.label ?? null,
          url,
        })
        .returning(),
    )
    return created
  }),
)
