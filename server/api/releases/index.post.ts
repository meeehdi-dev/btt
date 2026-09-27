import { Effect } from 'effect'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../../db'
import { client, project, release } from '../../db/schema'
import { decodeBody } from '../../domain/decode'
import { ReleaseCreate } from '../../domain/schemas'
import { now, notFound, requireUserId } from '../../utils/domain'
import { promiseEffect } from '../../utils/effect'
import { defineEffectHandler } from '../../utils/effect-handler'
import { generateId } from '../../utils/id'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const userId = yield* requireUserId(event)
    const body = yield* decodeBody(event, ReleaseCreate)
    const [parent] = yield* promiseEffect('load release project', () =>
      db
        .select({ id: project.id })
        .from(project)
        .innerJoin(client, eq(project.clientId, client.id))
        .where(
          and(
            eq(project.id, body.projectId),
            eq(client.userId, userId),
            isNull(client.archivedAt),
            isNull(project.archivedAt),
          ),
        )
        .limit(1),
    )
    if (!parent) return yield* notFound('Project not found')

    const timestamp = now()
    const [created] = yield* promiseEffect('create release', () =>
      db
        .insert(release)
        .values({
          id: generateId(),
          projectId: body.projectId,
          name: body.name,
          targetDate: body.targetDate ?? null,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
        .returning(),
    )
    return created
  }),
)
