import { and, eq, isNull, or } from 'drizzle-orm'
import { db } from '../../db'
import { client, project, release, ticket, ticketLink, ticketRelation } from '../../db/schema'
import { includeArchived } from '../../utils/domain'
import { ownedTicket, ticketId, visibleTicket } from '../../domain/tickets'

export default defineEventHandler(async (event) => {
  const id = ticketId(event)
  const record = visibleTicket(await ownedTicket(event, id), includeArchived(event))
  const links = await db.select().from(ticketLink).where(eq(ticketLink.ticketId, id))
  const relations = await db
    .select()
    .from(ticketRelation)
    .where(or(eq(ticketRelation.fromTicketId, id), eq(ticketRelation.toTicketId, id)))
  const related = await Promise.all(
    relations.map(async (relation) => {
      const otherId = relation.fromTicketId === id ? relation.toTicketId : relation.fromTicketId
      const [other] = await db
        .select({ id: ticket.id, title: ticket.title, archivedAt: ticket.archivedAt })
        .from(ticket)
        .innerJoin(release, eq(ticket.releaseId, release.id))
        .innerJoin(project, eq(release.projectId, project.id))
        .innerJoin(client, eq(project.clientId, client.id))
        .where(
          and(
            eq(ticket.id, otherId),
            isNull(ticket.archivedAt),
            isNull(release.archivedAt),
            isNull(project.archivedAt),
            isNull(client.archivedAt),
          ),
        )
        .limit(1)
      return other ? { ...other, relationId: relation.id } : null
    }),
  )
  return {
    ticket: record.ticket,
    hierarchy: {
      releaseName: record.releaseName,
      projectId: record.projectId,
      projectName: record.projectName,
      clientId: record.clientId,
      clientName: record.clientName,
      releaseArchivedAt: record.releaseArchivedAt,
      projectArchivedAt: record.projectArchivedAt,
      clientArchivedAt: record.clientArchivedAt,
    },
    links,
    related: related.filter((item) => item !== null),
  }
})
