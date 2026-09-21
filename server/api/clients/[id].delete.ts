import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { client, project } from '../../db/schema'
import { conflict, idParam, notFound, requireUserId } from '../../utils/domain'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = idParam(event, 'id')
  const [record] = await db
    .select()
    .from(client)
    .where(and(eq(client.id, id), eq(client.userId, userId)))
    .limit(1)
  if (!record) notFound('Client not found')
  if (!record.archivedAt) conflict('Archive the client before permanently deleting it')

  const [child] = await db
    .select({ id: project.id })
    .from(project)
    .where(eq(project.clientId, id))
    .limit(1)
  if (child) conflict('Permanently delete the client projects first')

  await db.delete(client).where(eq(client.id, id))
  return { deleted: true }
})
