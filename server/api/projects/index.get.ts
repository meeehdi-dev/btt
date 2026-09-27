import { and, countDistinct, desc, eq, isNull } from 'drizzle-orm'
import { db } from '../../db'
import { client, project, release, ticket } from '../../db/schema'
import { includeArchived, requireUserId } from '../../utils/domain'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const archived = includeArchived(event)
  const projects = await db
    .select({
      project,
      clientName: client.name,
      clientArchivedAt: client.archivedAt,
      releaseCount: countDistinct(release.id),
      ticketCount: countDistinct(ticket.id),
    })
    .from(project)
    .innerJoin(client, eq(project.clientId, client.id))
    .leftJoin(
      release,
      and(
        eq(release.projectId, project.id),
        isNull(client.archivedAt),
        isNull(project.archivedAt),
        isNull(release.archivedAt),
      ),
    )
    .leftJoin(ticket, and(eq(ticket.releaseId, release.id), isNull(ticket.archivedAt)))
    .where(
      and(
        eq(client.userId, userId),
        isNull(client.archivedAt),
        archived ? undefined : isNull(project.archivedAt),
      ),
    )
    .groupBy(project.id, client.name, client.archivedAt)
    .orderBy(desc(project.updatedAt))

  return { projects }
})
