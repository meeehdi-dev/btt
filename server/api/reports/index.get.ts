import { Effect, Schema } from 'effect'
import { eq } from 'drizzle-orm'
import { defaultAgendaSettings } from '../../../shared/agenda'
import { reportGroupings } from '../../../shared/reports'
import {
  reportPeriods,
  getReportPeriodRange,
  getReportCompletionBounds,
  resolveReportTimeZone,
} from '../../../shared/report-period'
import { validDate } from '../../../shared/time-entry'
import { loadReports } from '../../domain/reports'
import { ValidationError } from '../../domain/errors'
import { userSettings } from '../../db/schema'
import { db } from '../../db'
import { validId } from '../../domain/tickets'
import { queryOf, requireUserId, validation } from '../../utils/domain'
import { promiseEffect } from '../../utils/effect'
import { defineEffectHandler } from '../../utils/effect-handler'

const ReportQuery = Schema.Struct({
  period: Schema.Literals(reportPeriods),
  date: Schema.String,
  grouping: Schema.Literals(reportGroupings),
  timeZone: Schema.String,
  clientId: Schema.optional(Schema.String),
  projectId: Schema.optional(Schema.String),
  releaseId: Schema.optional(Schema.String),
})

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const userId = yield* requireUserId(event)
    const query = yield* queryOf(event)
    const request = yield* Schema.decodeUnknownEffect(ReportQuery)(query).pipe(
      Effect.mapError(() => new ValidationError({ message: 'Invalid report parameters' })),
    )
    if (!validDate(request.date)) return yield* validation('A valid report date is required')
    const timeZone = resolveReportTimeZone(request.timeZone)
    if (!timeZone) return yield* validation('A valid report time zone is required')
    for (const id of [request.clientId, request.projectId, request.releaseId])
      if (id !== undefined) yield* validId(id)

    const [settings] = yield* promiseEffect('load report week-start setting', () =>
      db
        .select({ startOfWeekDay: userSettings.startOfWeekDay })
        .from(userSettings)
        .where(eqUserSettings(userId))
        .limit(1),
    )
    const range = getReportPeriodRange(
      request.period,
      request.date,
      settings?.startOfWeekDay ?? defaultAgendaSettings.startOfWeekDay,
    )
    const completionBounds = range ? getReportCompletionBounds(range, timeZone) : null
    if (!range || !completionBounds)
      return yield* validation('The selected report period is out of range')

    return yield* loadReports(userId, { ...request, timeZone, range, completionBounds })
  }),
)

function eqUserSettings(userId: string) {
  return eq(userSettings.userId, userId)
}
