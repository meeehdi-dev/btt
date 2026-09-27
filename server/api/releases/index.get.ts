import { and, count, desc, eq, isNull, sql } from 'drizzle-orm'
import { db } from '../../db'
import { client, project, release, ticket } from '../../db/schema'
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
      ticketCount: count(ticket.id),
      doneTicketCount: count(sql`case when ${ticket.status} = 'Done' then ${ticket.id} end`),
    })
    .from(release)
    .innerJoin(project, eq(release.projectId, project.id))
    .innerJoin(client, eq(project.clientId, client.id))
    .leftJoin(
      ticket,
      and(
        eq(ticket.releaseId, release.id),
        isNull(client.archivedAt),
        isNull(project.archivedAt),
        isNull(release.archivedAt),
        isNull(ticket.archivedAt),
      ),
    )
    .where(
      and(
        eq(client.userId, userId),
        isNull(client.archivedAt),
        isNull(project.archivedAt),
        archived ? undefined : isNull(release.archivedAt),
      ),
    )
    .groupBy(release.id, project.name, project.color, project.archivedAt)
    .orderBy(desc(release.updatedAt))

  return { releases }
})
