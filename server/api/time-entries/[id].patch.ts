import { Effect } from 'effect'
import { idParam, validation } from '../../utils/domain'
import { decodeBody } from '../../domain/decode'
import { TimeEntryUpdate } from '../../domain/schemas'
import { ownedEntry, saveEntry, writableTicket } from '../../domain/time-entries'
import { defineEffectHandler } from '../../utils/effect-handler'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const id = yield* idParam(event, 'id')
    const record = yield* ownedEntry(event, id)
    const body = yield* decodeBody(event, TimeEntryUpdate)
    if (!Object.keys(body).length) return yield* validation('At least one field is required')
    if (body.ticketId && body.ticketId !== record.entry.ticketId)
      yield* writableTicket(event, body.ticketId)
    return yield* saveEntry(
      event,
      {
        ticketId: body.ticketId ?? record.entry.ticketId,
        date: body.date ?? record.entry.date,
        startMinute: body.startMinute ?? record.entry.startMinute,
        durationMinutes: body.durationMinutes ?? record.entry.durationMinutes,
        description: body.description ?? record.entry.description,
      },
      id,
    )
  }),
)
