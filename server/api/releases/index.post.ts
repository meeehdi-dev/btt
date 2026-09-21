import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../../db'
import { client, project, release } from '../../db/schema'
import { ReleaseCreate } from '../../domain/schemas'
import { decodeBody } from '../../domain/decode'
import { now, notFound, requireUserId } from '../../utils/domain'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const body = await decodeBody(event, ReleaseCreate)
  const [parent] = await db
    .select({ id: project.id })
    .from(project)
    .innerJoin(client, eq(project.clientId, client.id))
    .where(
      and(
        eq(project.id, body.projectId),
        eq(client.userId, userId),
        isNull(client.archivedAt),
        isNull(project.archivedAt),
      ),
    )
    .limit(1)
  if (!parent) notFound('Project not found')

  const timestamp = now()
  const [created] = await db
    .insert(release)
    .values({
      id: crypto.randomUUID(),
      projectId: body.projectId,
      name: body.name,
      targetDate: body.targetDate ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .returning()
  return created
})
