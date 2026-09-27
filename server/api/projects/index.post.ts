import { Effect } from 'effect'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../../db'
import { client, project } from '../../db/schema'
import { decodeBody } from '../../domain/decode'
import { ProjectCreate } from '../../domain/schemas'
import { now, notFound, requireUserId } from '../../utils/domain'
import { promiseEffect } from '../../utils/effect'
import { defineEffectHandler } from '../../utils/effect-handler'
import { generateId } from '../../utils/id'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const userId = yield* requireUserId(event)
    const body = yield* decodeBody(event, ProjectCreate)
    const [parent] = yield* promiseEffect('load project client', () =>
      db
        .select({ id: client.id })
        .from(client)
        .where(
          and(eq(client.id, body.clientId), eq(client.userId, userId), isNull(client.archivedAt)),
        )
        .limit(1),
    )
    if (!parent) return yield* notFound('Client not found')

    const timestamp = now()
    const [created] = yield* promiseEffect('create project', () =>
      db
        .insert(project)
        .values({
          id: generateId(),
          clientId: body.clientId,
          name: body.name,
          color: body.color,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
        .returning(),
    )
    return created
  }),
)
