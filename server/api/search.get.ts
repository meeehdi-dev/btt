import { Effect } from 'effect'
import { and, desc, eq, ilike, isNull, or } from 'drizzle-orm'
import { db } from '../db'
import { client, project, release, ticket, timeEntry } from '../db/schema'
import { queryOf, requireUserId, validation } from '../utils/domain'
import { promiseEffect } from '../utils/effect'
import { defineEffectHandler } from '../utils/effect-handler'

const limit = 8

export default defineEffectHandler((event) =>
  Effect.gen(function* () {
    const userId = yield* requireUserId(event)
    const raw = (yield* queryOf(event)).q
    if (raw !== undefined && typeof raw !== 'string')
      return yield* validation('Invalid search query')
    const query = (raw ?? '').trim()
    if (query.length > 100) return yield* validation('Search query is too long')
    if (query.length < 2)
      return { clients: [], projects: [], releases: [], tickets: [], timeEntries: [] }

    const pattern = `%${query.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')}%`
    const owned = eq(client.userId, userId)
    const activeClient = isNull(client.archivedAt)
    const activeProject = isNull(project.archivedAt)
    const activeRelease = isNull(release.archivedAt)
    const activeTicket = isNull(ticket.archivedAt)
    const [clients, projects, releases, tickets, timeEntries] = yield* promiseEffect(
      'search work records',
      () =>
        Promise.all([
          db
            .select({ id: client.id, label: client.name })
            .from(client)
            .where(and(owned, activeClient, ilike(client.name, pattern)))
            .orderBy(desc(client.updatedAt), desc(client.id))
            .limit(limit),
          db
            .select({ id: project.id, label: project.name, clientName: client.name })
            .from(project)
            .innerJoin(client, eq(project.clientId, client.id))
            .where(and(owned, activeClient, activeProject, ilike(project.name, pattern)))
            .orderBy(desc(project.updatedAt), desc(project.id))
            .limit(limit),
          db
            .select({ id: release.id, label: release.name, projectName: project.name })
            .from(release)
            .innerJoin(project, eq(release.projectId, project.id))
            .innerJoin(client, eq(project.clientId, client.id))
            .where(
              and(owned, activeClient, activeProject, activeRelease, ilike(release.name, pattern)),
            )
            .orderBy(desc(release.updatedAt), desc(release.id))
            .limit(limit),
          db
            .select({
              id: ticket.id,
              label: ticket.title,
              status: ticket.status,
              releaseName: release.name,
            })
            .from(ticket)
            .innerJoin(release, eq(ticket.releaseId, release.id))
            .innerJoin(project, eq(release.projectId, project.id))
            .innerJoin(client, eq(project.clientId, client.id))
            .where(
              and(
                owned,
                activeClient,
                activeProject,
                activeRelease,
                activeTicket,
                ilike(ticket.title, pattern),
              ),
            )
            .orderBy(desc(ticket.updatedAt), desc(ticket.id))
            .limit(limit),
          db
            .select({
              id: timeEntry.id,
              label: timeEntry.description,
              date: timeEntry.date,
              startMinute: timeEntry.startMinute,
              ticketTitle: ticket.title,
            })
            .from(timeEntry)
            .innerJoin(ticket, eq(timeEntry.ticketId, ticket.id))
            .innerJoin(release, eq(ticket.releaseId, release.id))
            .innerJoin(project, eq(release.projectId, project.id))
            .innerJoin(client, eq(project.clientId, client.id))
            .where(
              and(
                owned,
                activeClient,
                activeProject,
                activeRelease,
                activeTicket,
                or(ilike(timeEntry.description, pattern), ilike(ticket.title, pattern)),
              ),
            )
            .orderBy(desc(timeEntry.date), desc(timeEntry.startMinute), desc(timeEntry.id))
            .limit(limit),
        ]),
    )
    return { clients, projects, releases, tickets, timeEntries }
  }),
)
