import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../../db'
import { client, project } from '../../db/schema'
import { idParam, includeArchived, notFound, requireUserId } from '../../utils/domain'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = idParam(event, 'id')
  const archived = includeArchived(event)
  const [record] = await db
    .select({ project, clientName: client.name, clientArchivedAt: client.archivedAt })
    .from(project)
    .innerJoin(client, eq(project.clientId, client.id))
    .where(
      and(
        eq(project.id, id),
        eq(client.userId, userId),
        isNull(client.archivedAt),
        archived ? undefined : isNull(project.archivedAt),
      ),
    )
    .limit(1)
  if (!record) notFound('Project not found')
  return record
})
