import { createError, type H3Event } from 'h3'
import { and, eq, isNull } from 'drizzle-orm'
import { externalUrl as validateUrl } from '../../app/utils/ticket-url'
import { db } from '../db'
import { client, project, release, ticket } from '../db/schema'
import { idParam, notFound, requireUserId } from '../utils/domain'

export function ticketId(event: H3Event) {
  const id = idParam(event, 'id')
  return validId(id)
}
export function validId(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))
    throw createError({ status: 400, statusText: 'Invalid identifier' })
  return id
}
export async function ownedRelease(event: H3Event, id: string) {
  const userId = await requireUserId(event)
  const [parent] = await db
    .select({ id: release.id })
    .from(release)
    .innerJoin(project, eq(release.projectId, project.id))
    .innerJoin(client, eq(project.clientId, client.id))
    .where(
      and(
        eq(release.id, validId(id)),
        eq(client.userId, userId),
        isNull(release.archivedAt),
        isNull(project.archivedAt),
        isNull(client.archivedAt),
      ),
    )
    .limit(1)
  if (!parent) notFound('Release not found')
  return parent
}
export async function ownedTicket(event: H3Event, id: string) {
  const userId = await requireUserId(event)
  const [record] = await db
    .select({
      ticket,
      releaseName: release.name,
      projectId: project.id,
      projectName: project.name,
      clientId: client.id,
      clientName: client.name,
      releaseArchivedAt: release.archivedAt,
      projectArchivedAt: project.archivedAt,
      clientArchivedAt: client.archivedAt,
    })
    .from(ticket)
    .innerJoin(release, eq(ticket.releaseId, release.id))
    .innerJoin(project, eq(release.projectId, project.id))
    .innerJoin(client, eq(project.clientId, client.id))
    .where(and(eq(ticket.id, validId(id)), eq(client.userId, userId)))
    .limit(1)
  if (!record) notFound('Ticket not found')
  return record
}
export function visibleTicket(record: Awaited<ReturnType<typeof ownedTicket>>, archived: boolean) {
  if (
    !archived &&
    (record.clientArchivedAt ||
      record.projectArchivedAt ||
      record.releaseArchivedAt ||
      record.ticket.archivedAt)
  )
    notFound('Ticket not found')
  return record
}
export function externalUrl(input: string) {
  try {
    return validateUrl(input)
  } catch {
    throw createError({ status: 400, statusText: 'A valid http(s) URL is required' })
  }
}
