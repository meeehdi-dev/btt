import { Effect } from 'effect'
import { eq } from 'drizzle-orm'
import { defaultAgendaSettings } from '../../../shared/agenda'
import { db } from '../../db'
import { userSettings } from '../../db/schema'
import { requireUserId } from '../../utils/domain'
import { promiseEffect } from '../../utils/effect'
import { defineEffectHandler } from '../../utils/effect-handler'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const userId = yield* requireUserId(event)
    const [settings] = yield* promiseEffect('load user settings', () =>
      db.select().from(userSettings).where(eq(userSettings.userId, userId)),
    )
    return settings ?? { userId, ...defaultAgendaSettings }
  }),
)
