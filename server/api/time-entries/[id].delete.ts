import { eq } from 'drizzle-orm'
import { db } from '../../db'
import { timeEntry } from '../../db/schema'
import { ownedEntry } from '../../domain/time-entries'
import { idParam } from '../../utils/domain'

export default defineEventHandler(async (event) => {
  const id = idParam(event, 'id')
  await ownedEntry(event, id)
  await db.delete(timeEntry).where(eq(timeEntry.id, id))
  return { deleted: true }
})
