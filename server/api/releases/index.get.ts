import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '../../db'
import { client, project, release } from '../../db/schema'
import { includeArchived, requireUserId } from '../../utils/domain'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const archived = includeArchived(event)
  const releases = await db
    .select({
      release,
      projectName: project.name,
      projectColor: project.color,
      projectArchivedAt: project.archivedAt,
    })
    .from(release)
    .innerJoin(project, eq(release.projectId, project.id))
    .innerJoin(client, eq(project.clientId, client.id))
    .where(
      and(
        eq(client.userId, userId),
        isNull(client.archivedAt),
        isNull(project.archivedAt),
        archived ? undefined : isNull(release.archivedAt),
      ),
    )
    .orderBy(desc(release.updatedAt))

  return { releases }
})
