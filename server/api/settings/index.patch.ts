import { validAgendaSettings } from '../../../shared/agenda'
import { db } from '../../db'
import { userSettings } from '../../db/schema'
import { decodeBody } from '../../domain/decode'
import { AgendaSettingsUpdate } from '../../domain/schemas'
import { requireUserId } from '../../utils/domain'

export default defineEventHandler(async (event) => {
  const userId = await requireUserId(event)
  const input = await decodeBody(event, AgendaSettingsUpdate)
  if (!validAgendaSettings(input))
    throw createError({ status: 400, statusText: 'Invalid agenda window or workday duration' })
  const [settings] = await db
    .insert(userSettings)
    .values({ userId, ...input })
    .onConflictDoUpdate({ target: userSettings.userId, set: input })
    .returning()
  return settings
})
