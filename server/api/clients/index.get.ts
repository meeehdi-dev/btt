import { and, countDistinct, desc, eq, getTableColumns, isNull } from 'drizzle-orm'
import { db } from '../../db'
import { client, project, release, ticket } from '../../db/schema'
import { includeArchived, requireUserId } from '../../utils/domain'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const archived = includeArchived(event)
  const clients = await db
    .select({
      ...getTableColumns(client),
      projectCount: countDistinct(project.id),
      releaseCount: countDistinct(release.id),
      ticketCount: countDistinct(ticket.id),
    })
    .from(client)
    .leftJoin(
      project,
      and(eq(project.clientId, client.id), isNull(client.archivedAt), isNull(project.archivedAt)),
    )
    .leftJoin(release, and(eq(release.projectId, project.id), isNull(release.archivedAt)))
    .leftJoin(ticket, and(eq(ticket.releaseId, release.id), isNull(ticket.archivedAt)))
    .where(
      archived
        ? eq(client.userId, userId)
        : and(eq(client.userId, userId), isNull(client.archivedAt)),
    )
    .groupBy(client.id)
    .orderBy(desc(client.updatedAt))

  return { clients }
})
