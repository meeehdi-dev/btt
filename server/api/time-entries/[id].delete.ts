import { Effect } from 'effect'
import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { timeEntry } from '../../db/schema'
import { ownedEntry } from '../../domain/time-entries'
import { idParam } from '../../utils/domain'
import { promiseEffect } from '../../utils/effect'
import { defineEffectHandler } from '../../utils/effect-handler'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const id = yield* idParam(event, 'id')
    yield* ownedEntry(event, id)
    yield* promiseEffect('delete time entry', () =>
      db.delete(timeEntry).where(eq(timeEntry.id, id)),
    )
    return { deleted: true }
  }),
)
