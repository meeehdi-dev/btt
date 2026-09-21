import { db } from '../../db'
import { client } from '../../db/schema'
import { ClientCreate } from '../../domain/schemas'
import { decodeBody } from '../../domain/decode'
import { now, requireUserId } from '../../utils/domain'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const body = await decodeBody(event, ClientCreate)
  const timestamp = now()
  const [created] = await db
    .insert(client)
    .values({
      id: crypto.randomUUID(),
      userId,
      name: body.name,
      color: body.color ?? '#64748b',
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .returning()

  return created
})
