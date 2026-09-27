import { Effect } from 'effect'
import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { client, project } from '../../db/schema'
import { decodeBody } from '../../domain/decode'
import { ProjectUpdate } from '../../domain/schemas'
import { idParam, now, notFound, requireUserId, validation } from '../../utils/domain'
import { promiseEffect } from '../../utils/effect'
import { defineEffectHandler } from '../../utils/effect-handler'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const userId = yield* requireUserId(event)
    const id = yield* idParam(event, 'id')
    const body = yield* decodeBody(event, ProjectUpdate)
    const { name, color, archived } = body
    if (name === undefined && color === undefined && archived === undefined)
      return yield* validation('At least one field is required')

    const [owned] = yield* promiseEffect('check project ownership', () =>
      db
        .select({ id: project.id })
        .from(project)
        .innerJoin(client, eq(project.clientId, client.id))
        .where(and(eq(project.id, id), eq(client.userId, userId)))
        .limit(1),
    )
    if (!owned) return yield* notFound('Project not found')

    const [updated] = yield* promiseEffect('update project', () =>
      db
        .update(project)
        .set({
          ...(name === undefined ? {} : { name }),
          ...(color === undefined ? {} : { color }),
          ...(archived === undefined ? {} : { archivedAt: archived ? now() : null }),
          updatedAt: now(),
        })
        .where(eq(project.id, id))
        .returning(),
    )
    return updated
  }),
)
