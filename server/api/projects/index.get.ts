import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '../../db'
import { client, project } from '../../db/schema'
import { includeArchived, requireUserId } from '../../utils/domain'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const archived = includeArchived(event)
  const projects = await db
    .select({ project, clientName: client.name, clientArchivedAt: client.archivedAt })
    .from(project)
    .innerJoin(client, eq(project.clientId, client.id))
    .where(
      and(
        eq(client.userId, userId),
        isNull(client.archivedAt),
        archived ? undefined : isNull(project.archivedAt),
      ),
    )
    .orderBy(desc(project.updatedAt))

  return { projects }
})
