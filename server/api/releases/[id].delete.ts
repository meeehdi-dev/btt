import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { client, project, release } from '../../db/schema'
import { conflict, idParam, notFound, requireUserId } from '../../utils/domain'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = idParam(event, 'id')
  const [record] = await db
    .select({ release })
    .from(release)
    .innerJoin(project, eq(release.projectId, project.id))
    .innerJoin(client, eq(project.clientId, client.id))
    .where(and(eq(release.id, id), eq(client.userId, userId)))
    .limit(1)
  if (!record) notFound('Release not found')
  if (!record.release.archivedAt) conflict('Archive the release before permanently deleting it')

  await db.delete(release).where(eq(release.id, id))
  return { deleted: true }
})
