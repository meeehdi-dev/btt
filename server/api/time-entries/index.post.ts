import { Effect } from 'effect'
import { decodeBody } from '../../domain/decode'
import { TimeEntryCreate } from '../../domain/schemas'
import { saveEntry, writableTicket } from '../../domain/time-entries'
import { defineEffectHandler } from '../../utils/effect-handler'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const body = yield* decodeBody(event, TimeEntryCreate)
    yield* writableTicket(event, body.ticketId)
    return yield* saveEntry(event, { ...body, description: body.description ?? '' })
  }),
)
