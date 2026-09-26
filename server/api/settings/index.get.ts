import { eq } from 'drizzle-orm'
import { defaultAgendaSettings } from '../../../shared/agenda'
import { db } from '../../db'
import { userSettings } from '../../db/schema'
import { requireUserId } from '../../utils/domain'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId))
  return settings ?? { userId, ...defaultAgendaSettings }
})
