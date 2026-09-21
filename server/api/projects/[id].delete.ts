import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { client, project, release } from '../../db/schema'
import { conflict, idParam, notFound, requireUserId } from '../../utils/domain'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = idParam(event, 'id')
  const [record] = await db
    .select({ project })
    .from(project)
    .innerJoin(client, eq(project.clientId, client.id))
    .where(and(eq(project.id, id), eq(client.userId, userId)))
    .limit(1)
  if (!record) notFound('Project not found')
  if (!record.project.archivedAt) conflict('Archive the project before permanently deleting it')

  const [child] = await db
    .select({ id: release.id })
    .from(release)
    .where(eq(release.projectId, id))
    .limit(1)
  if (child) conflict('Permanently delete the project releases first')

  await db.delete(project).where(eq(project.id, id))
  return { deleted: true }
})
