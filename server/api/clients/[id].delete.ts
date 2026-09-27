import { Effect } from 'effect'
import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { client, project } from '../../db/schema'
import { conflict, idParam, notFound, requireUserId } from '../../utils/domain'
import { promiseEffect } from '../../utils/effect'
import { defineEffectHandler } from '../../utils/effect-handler'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const userId = yield* requireUserId(event)
    const id = yield* idParam(event, 'id')
    const [record] = yield* promiseEffect('load client for deletion', () =>
      db
        .select()
        .from(client)
        .where(and(eq(client.id, id), eq(client.userId, userId)))
        .limit(1),
    )
    if (!record) return yield* notFound('Client not found')
    if (!record.archivedAt)
      return yield* conflict('Archive the client before permanently deleting it')

    const [child] = yield* promiseEffect('check client projects before deletion', () =>
      db.select({ id: project.id }).from(project).where(eq(project.clientId, id)).limit(1),
    )
    if (child) return yield* conflict('Permanently delete the client projects first')

    yield* promiseEffect('delete client', () => db.delete(client).where(eq(client.id, id)))
    return { deleted: true }
  }),
)
