import { createError } from 'h3'
import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { client } from '../../db/schema'
import { ClientUpdate } from '../../domain/schemas'
import { decodeBody } from '../../domain/decode'
import { idParam, now, notFound, requireUserId } from '../../utils/domain'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = idParam(event, 'id')
  const body = await decodeBody(event, ClientUpdate)
  const name = body.name
  const color = body.color
  const archived = body.archived
  if (name === undefined && color === undefined && archived === undefined) {
    throw createError({ status: 400, statusText: 'At least one field is required' })
  }
  const [updated] = await db
    .update(client)
    .set({
      ...(name === undefined ? {} : { name }),
      ...(color === undefined ? {} : { color }),
      ...(archived === undefined ? {} : { archivedAt: archived ? now() : null }),
      updatedAt: now(),
    })
    .where(and(eq(client.id, id), eq(client.userId, userId)))
    .returning()

  if (!updated) notFound('Client not found')
  return updated
})
