import { createError } from 'h3'
import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { client, project, release } from '../../db/schema'
import { ReleaseUpdate } from '../../domain/schemas'
import { decodeBody } from '../../domain/decode'
import { idParam, now, notFound, requireUserId } from '../../utils/domain'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = idParam(event, 'id')
  const body = await decodeBody(event, ReleaseUpdate)
  const name = body.name
  const targetDate = body.targetDate
  const archived = body.archived
  if (name === undefined && targetDate === undefined && archived === undefined) {
    throw createError({ status: 400, statusText: 'At least one field is required' })
  }
  const [owned] = await db
    .select({ id: release.id })
    .from(release)
    .innerJoin(project, eq(release.projectId, project.id))
    .innerJoin(client, eq(project.clientId, client.id))
    .where(and(eq(release.id, id), eq(client.userId, userId)))
    .limit(1)
  if (!owned) notFound('Release not found')

  const [updated] = await db
    .update(release)
    .set({
      ...(name === undefined ? {} : { name }),
      ...(targetDate === undefined ? {} : { targetDate }),
      ...(archived === undefined ? {} : { archivedAt: archived ? now() : null }),
      updatedAt: now(),
    })
    .where(eq(release.id, id))
    .returning()
  return updated
})
