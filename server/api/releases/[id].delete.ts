import { Effect } from 'effect'
import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { client, project, release } from '../../db/schema'
import { conflict, idParam, notFound, requireUserId } from '../../utils/domain'
import { promiseEffect } from '../../utils/effect'
import { defineEffectHandler } from '../../utils/effect-handler'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const userId = yield* requireUserId(event)
    const id = yield* idParam(event, 'id')
    const [record] = yield* promiseEffect('load release for deletion', () =>
      db
        .select({ release })
        .from(release)
        .innerJoin(project, eq(release.projectId, project.id))
        .innerJoin(client, eq(project.clientId, client.id))
        .where(and(eq(release.id, id), eq(client.userId, userId)))
        .limit(1),
    )
    if (!record) return yield* notFound('Release not found')
    if (!record.release.archivedAt)
      return yield* conflict('Archive the release before permanently deleting it')

    yield* promiseEffect('delete release', () => db.delete(release).where(eq(release.id, id)))
    return { deleted: true }
  }),
)
