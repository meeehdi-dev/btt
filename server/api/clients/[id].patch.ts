import { Effect } from 'effect'
import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { client } from '../../db/schema'
import { decodeBody } from '../../domain/decode'
import { ClientUpdate } from '../../domain/schemas'
import { idParam, now, notFound, requireUserId, validation } from '../../utils/domain'
import { promiseEffect } from '../../utils/effect'
import { defineEffectHandler } from '../../utils/effect-handler'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const userId = yield* requireUserId(event)
    const id = yield* idParam(event, 'id')
    const body = yield* decodeBody(event, ClientUpdate)
    const { name, color, archived } = body
    if (name === undefined && color === undefined && archived === undefined)
      return yield* validation('At least one field is required')

    const [updated] = yield* promiseEffect('update client', () =>
      db
        .update(client)
        .set({
          ...(name === undefined ? {} : { name }),
          ...(color === undefined ? {} : { color }),
          ...(archived === undefined ? {} : { archivedAt: archived ? now() : null }),
          updatedAt: now(),
        })
        .where(and(eq(client.id, id), eq(client.userId, userId)))
        .returning(),
    )
    if (!updated) return yield* notFound('Client not found')
    return updated
  }),
)
