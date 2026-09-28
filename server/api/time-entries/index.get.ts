import { Effect } from 'effect'
import { desc, eq } from 'drizzle-orm'
import { db } from '../../db'
import { timeEntry } from '../../db/schema'
import { ownedTicket } from '../../domain/tickets'
import { queryOf, requireUserId, validation } from '../../utils/domain'
import { promiseEffect } from '../../utils/effect'
import { defineEffectHandler } from '../../utils/effect-handler'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    yield* requireUserId(event)
    const ticketId = (yield* queryOf(event)).ticketId
    if (typeof ticketId !== 'string') return yield* validation('Ticket is required')
    yield* ownedTicket(event, ticketId)
    const entries = yield* promiseEffect('list ticket time entries', () =>
      db
        .select()
        .from(timeEntry)
        .where(eq(timeEntry.ticketId, ticketId))
        .orderBy(desc(timeEntry.date), desc(timeEntry.startMinute), desc(timeEntry.id)),
    )
    const trackedMinutes = entries.reduce((total, entry) => total + entry.durationMinutes, 0)
    return { entries, trackedMinutes }
  }),
)
