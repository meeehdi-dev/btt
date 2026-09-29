import { Effect } from 'effect'
import { validAgendaSettings } from '../../../shared/agenda'
import { db } from '../../db'
import { userSettings } from '../../db/schema'
import { decodeBody } from '../../domain/decode'
import { AgendaSettingsUpdate } from '../../domain/schemas'
import { requireUserId, validation } from '../../utils/domain'
import { promiseEffect } from '../../utils/effect'
import { defineEffectHandler } from '../../utils/effect-handler'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const userId = yield* requireUserId(event)
    const input = yield* decodeBody(event, AgendaSettingsUpdate)
    if (!validAgendaSettings(input))
      return yield* validation('Invalid agenda window, workday duration, or week start day')
    const [settings] = yield* promiseEffect('update user settings', () =>
      db
        .insert(userSettings)
        .values({ userId, ...input })
        .onConflictDoUpdate({ target: userSettings.userId, set: input })
        .returning(),
    )
    return settings
  }),
)
