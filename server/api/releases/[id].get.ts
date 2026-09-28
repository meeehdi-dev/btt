import { Effect } from 'effect'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../../db'
import { client, project, release } from '../../db/schema'
import { idParam, includeArchived, notFound, requireUserId } from '../../utils/domain'
import { promiseEffect } from '../../utils/effect'
import { defineEffectHandler } from '../../utils/effect-handler'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const userId = yield* requireUserId(event)
    const id = yield* idParam(event, 'id')
    const archived = yield* includeArchived(event)
    const [record] = yield* promiseEffect('load release', () =>
      db
        .select({
          release,
          clientId: client.id,
          clientName: client.name,
          projectName: project.name,
          projectColor: project.color,
          projectArchivedAt: project.archivedAt,
          clientArchivedAt: client.archivedAt,
        })
        .from(release)
        .innerJoin(project, eq(release.projectId, project.id))
        .innerJoin(client, eq(project.clientId, client.id))
        .where(
          and(
            eq(release.id, id),
            eq(client.userId, userId),
            archived ? undefined : isNull(client.archivedAt),
            archived ? undefined : isNull(project.archivedAt),
            archived ? undefined : isNull(release.archivedAt),
          ),
        )
        .limit(1),
    )
    if (!record) return yield* notFound('Release not found')
    return record
  }),
)
