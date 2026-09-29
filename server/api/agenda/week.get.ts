import { Effect } from 'effect'
import { getSevenDatesFrom } from '../../../shared/agenda-week'
import { loadAgendaEntries } from '../../domain/agenda'
import { queryOf, requireUserId, validation } from '../../utils/domain'
import { defineEffectHandler } from '../../utils/effect-handler'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const userId = yield* requireUserId(event)
    const startDate = (yield* queryOf(event)).startDate
    const dates = typeof startDate === 'string' ? getSevenDatesFrom(startDate) : null
    if (!dates) return yield* validation('A valid seven-day agenda start date is required')

    const entries = yield* loadAgendaEntries(userId, dates[0]!, dates[6]!)
    const trackedMinutesByDate: Record<string, number> = Object.fromEntries(
      dates.map((date) => [date, 0]),
    )
    for (const { entry } of entries)
      trackedMinutesByDate[entry.date] =
        (trackedMinutesByDate[entry.date] ?? 0) + entry.durationMinutes

    return { dates, entries, trackedMinutesByDate }
  }),
)
