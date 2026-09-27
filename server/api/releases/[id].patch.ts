import { Effect } from 'effect'
import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { client, project, release } from '../../db/schema'
import { decodeBody } from '../../domain/decode'
import { ReleaseUpdate } from '../../domain/schemas'
import { idParam, now, notFound, requireUserId, validation } from '../../utils/domain'
import { promiseEffect } from '../../utils/effect'
import { defineEffectHandler } from '../../utils/effect-handler'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const userId = yield* requireUserId(event)
    const id = yield* idParam(event, 'id')
    const body = yield* decodeBody(event, ReleaseUpdate)
    const { name, targetDate, archived } = body
    if (name === undefined && targetDate === undefined && archived === undefined)
      return yield* validation('At least one field is required')

    const [owned] = yield* promiseEffect('check release ownership', () =>
      db
        .select({ id: release.id })
        .from(release)
        .innerJoin(project, eq(release.projectId, project.id))
        .innerJoin(client, eq(project.clientId, client.id))
        .where(and(eq(release.id, id), eq(client.userId, userId)))
        .limit(1),
    )
    if (!owned) return yield* notFound('Release not found')

    const [updated] = yield* promiseEffect('update release', () =>
      db
        .update(release)
        .set({
          ...(name === undefined ? {} : { name }),
          ...(targetDate === undefined ? {} : { targetDate }),
          ...(archived === undefined ? {} : { archivedAt: archived ? now() : null }),
          updatedAt: now(),
        })
        .where(eq(release.id, id))
        .returning(),
    )
    return updated
  }),
)
