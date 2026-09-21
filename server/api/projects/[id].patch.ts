import { createError } from 'h3'
import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { client, project } from '../../db/schema'
import { ProjectUpdate } from '../../domain/schemas'
import { decodeBody } from '../../domain/decode'
import { idParam, now, notFound, requireUserId } from '../../utils/domain'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = idParam(event, 'id')
  const body = await decodeBody(event, ProjectUpdate)
  const name = body.name
  const color = body.color
  const archived = body.archived
  if (name === undefined && color === undefined && archived === undefined) {
    throw createError({ status: 400, statusText: 'At least one field is required' })
  }
  const [owned] = await db
    .select({ id: project.id })
    .from(project)
    .innerJoin(client, eq(project.clientId, client.id))
    .where(and(eq(project.id, id), eq(client.userId, userId)))
    .limit(1)
  if (!owned) notFound('Project not found')

  const [updated] = await db
    .update(project)
    .set({
      ...(name === undefined ? {} : { name }),
      ...(color === undefined ? {} : { color }),
      ...(archived === undefined ? {} : { archivedAt: archived ? now() : null }),
      updatedAt: now(),
    })
    .where(eq(project.id, id))
    .returning()
  return updated
})
