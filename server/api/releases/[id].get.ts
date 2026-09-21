import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../../db'
import { client, project, release } from '../../db/schema'
import { idParam, includeArchived, notFound, requireUserId } from '../../utils/domain'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = idParam(event, 'id')
  const archived = includeArchived(event)
  const [record] = await db
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
        eq(release.id, id),
        eq(client.userId, userId),
        isNull(client.archivedAt),
        isNull(project.archivedAt),
        archived ? undefined : isNull(release.archivedAt),
      ),
    )
    .limit(1)
  if (!record) notFound('Release not found')
  return record
})
