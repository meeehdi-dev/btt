import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '../../db'
import { client } from '../../db/schema'
import { includeArchived, requireUserId } from '../../utils/domain'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const archived = includeArchived(event)
  const clients = await db
    .select()
    .from(client)
    .where(
      archived
        ? eq(client.userId, userId)
        : and(eq(client.userId, userId), isNull(client.archivedAt)),
    )
    .orderBy(desc(client.updatedAt))

  return { clients }
})
