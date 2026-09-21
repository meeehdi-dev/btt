import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../../db'
import { client } from '../../db/schema'
import { idParam, includeArchived, notFound, requireUserId } from '../../utils/domain'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const id = idParam(event, 'id')
  const archived = includeArchived(event)
  const [record] = await db
    .select()
    .from(client)
    .where(
      and(
        eq(client.id, id),
        eq(client.userId, userId),
        archived ? undefined : isNull(client.archivedAt),
      ),
    )
    .limit(1)

  if (!record) notFound('Client not found')
  return record
})
