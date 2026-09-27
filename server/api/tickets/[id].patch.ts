import { Effect } from 'effect'
import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { ticket } from '../../db/schema'
import { decodeBody } from '../../domain/decode'
import { TicketUpdate } from '../../domain/schemas'
import { ownedRelease, ownedTicket, ticketId } from '../../domain/tickets'
import { now, validation } from '../../utils/domain'
import { promiseEffect } from '../../utils/effect'
import { defineEffectHandler } from '../../utils/effect-handler'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const id = yield* ticketId(event)
    yield* ownedTicket(event, id)
    const body = yield* decodeBody(event, TicketUpdate)
    if (!Object.keys(body).length) return yield* validation('At least one field is required')
    if (body.releaseId !== undefined) yield* ownedRelease(event, body.releaseId)

    const [updated] = yield* promiseEffect('update ticket', () =>
      db
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
        .returning(),
    )
    return updated
  }),
)
