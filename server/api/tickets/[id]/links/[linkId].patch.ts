import { Effect } from 'effect'
import { and, eq } from 'drizzle-orm'
import { db } from '../../../../db'
import { ticketLink } from '../../../../db/schema'
import { decodeBody } from '../../../../domain/decode'
import { TicketLinkUpdate } from '../../../../domain/schemas'
import { externalUrl, ownedTicket, ticketId, validId } from '../../../../domain/tickets'
import { idParam, notFound, validation } from '../../../../utils/domain'
import { promiseEffect } from '../../../../utils/effect'
import { defineEffectHandler } from '../../../../utils/effect-handler'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const id = yield* ticketId(event)
    yield* ownedTicket(event, id)
    const body = yield* decodeBody(event, TicketLinkUpdate)
    if (!Object.keys(body).length) return yield* validation('At least one field is required')
    const linkId = yield* validId(yield* idParam(event, 'linkId'))
    const url = body.url === undefined ? undefined : yield* externalUrl(body.url)
    const [updated] = yield* promiseEffect('update ticket link', () =>
      db
        .update(ticketLink)
        .set({
          ...(body.label === undefined ? {} : { label: body.label }),
          ...(url === undefined ? {} : { url }),
        })
        .where(and(eq(ticketLink.id, linkId), eq(ticketLink.ticketId, id)))
        .returning(),
    )
    if (!updated) return yield* notFound('Link not found')
    return updated
  }),
)
