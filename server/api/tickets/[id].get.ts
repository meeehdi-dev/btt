import { Effect } from 'effect'
import { and, asc, eq, isNull, or } from 'drizzle-orm'
import { db } from '../../db'
import { client, project, release, ticket, ticketLink, ticketRelation } from '../../db/schema'
import { includeArchived } from '../../utils/domain'
import { promiseEffect } from '../../utils/effect'
import { defineEffectHandler } from '../../utils/effect-handler'
import { ownedTicket, ticketId, visibleTicket } from '../../domain/tickets'

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const id = yield* ticketId(event)
    const record = yield* visibleTicket(
      yield* ownedTicket(event, id),
      yield* includeArchived(event),
    )
    const links = yield* promiseEffect('load ticket links', () =>
      db
        .select()
        .from(ticketLink)
        .where(eq(ticketLink.ticketId, id))
        .orderBy(asc(ticketLink.label), asc(ticketLink.id)),
    )
    const relations = yield* promiseEffect('load ticket relations', () =>
      db
        .select()
        .from(ticketRelation)
        .where(or(eq(ticketRelation.fromTicketId, id), eq(ticketRelation.toTicketId, id))),
    )
    const related = yield* promiseEffect('load related ticket details', () =>
      Promise.all(
        relations.map(async (relation) => {
          const otherId = relation.fromTicketId === id ? relation.toTicketId : relation.fromTicketId
          const [other] = await db
            .select({
              id: ticket.id,
              title: ticket.title,
              status: ticket.status,
              archivedAt: ticket.archivedAt,
            })
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
      ),
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
      related: related
        .filter((item) => item !== null)
        .toSorted((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id)),
    }
  }),
)
