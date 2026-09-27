import { Effect } from 'effect'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../../db'
import { client, project } from '../../db/schema'
import { idParam, includeArchived, notFound, requireUserId } from '../../utils/domain'
import { promiseEffect } from '../../utils/effect'
import { defineEffectHandler } from '../../utils/effect-handler'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const userId = yield* requireUserId(event)
    const id = yield* idParam(event, 'id')
    const archived = yield* includeArchived(event)
    const [record] = yield* promiseEffect('load project', () =>
      db
        .select({ project, clientName: client.name, clientArchivedAt: client.archivedAt })
        .from(project)
        .innerJoin(client, eq(project.clientId, client.id))
        .where(
          and(
            eq(project.id, id),
            eq(client.userId, userId),
            archived ? undefined : isNull(client.archivedAt),
            archived ? undefined : isNull(project.archivedAt),
          ),
        )
        .limit(1),
    )
    if (!record) return yield* notFound('Project not found')
    return record
  }),
)
