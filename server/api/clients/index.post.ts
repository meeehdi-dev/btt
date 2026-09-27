import { Effect } from 'effect'
import { db } from '../../db'
import { client } from '../../db/schema'
import { decodeBody } from '../../domain/decode'
import { ClientCreate } from '../../domain/schemas'
import { now, requireUserId } from '../../utils/domain'
import { promiseEffect } from '../../utils/effect'
import { defineEffectHandler } from '../../utils/effect-handler'
import { generateId } from '../../utils/id'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const userId = yield* requireUserId(event)
    const body = yield* decodeBody(event, ClientCreate)
    const timestamp = now()
    const [created] = yield* promiseEffect('create client', () =>
      db
        .insert(client)
        .values({
          id: generateId(),
          userId,
          name: body.name,
          color: body.color ?? '#64748b',
          createdAt: timestamp,
          updatedAt: timestamp,
        })
        .returning(),
    )
    return created
  }),
)
