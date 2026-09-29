import { Effect } from 'effect'
import { validDate } from '../../../shared/time-entry'
import { loadAgendaEntries } from '../../domain/agenda'
import { queryOf, requireUserId, validation } from '../../utils/domain'
import { defineEffectHandler } from '../../utils/effect-handler'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const userId = yield* requireUserId(event)
    const date = (yield* queryOf(event)).date
    if (typeof date !== 'string' || !validDate(date))
      return yield* validation('A valid calendar date is required')

    const entries = yield* loadAgendaEntries(userId, date, date)
    return {
      entries,
      trackedMinutes: entries.reduce((sum, { entry }) => sum + entry.durationMinutes, 0),
    }
  }),
)
