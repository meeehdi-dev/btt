import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../../db'
import { client, project } from '../../db/schema'
import { ProjectCreate } from '../../domain/schemas'
import { decodeBody } from '../../domain/decode'
import { now, notFound, requireUserId } from '../../utils/domain'
import { generateId } from '../../utils/id'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const body = await decodeBody(event, ProjectCreate)
  const [parent] = await db
    .select({ id: client.id })
    .from(client)
    .where(and(eq(client.id, body.clientId), eq(client.userId, userId), isNull(client.archivedAt)))
    .limit(1)
  if (!parent) notFound('Client not found')

  const timestamp = now()
  const [created] = await db
    .insert(project)
    .values({
      id: generateId(),
      clientId: body.clientId,
      name: body.name,
      color: body.color,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .returning()
  return created
})
