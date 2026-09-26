import { desc, eq } from 'drizzle-orm'
import { getQuery } from 'h3'
import { db } from '../../db'
import { timeEntry } from '../../db/schema'
import { ownedTicket } from '../../domain/tickets'
import { requireUserId } from '../../utils/domain'

export default defineEventHandler(async (event) => {
  await requireUserId(event)
  const ticketId = getQuery(event).ticketId
  if (typeof ticketId !== 'string')
    throw createError({ status: 400, statusText: 'Ticket is required' })
  await ownedTicket(event, ticketId)
  const entries = await db
    .select()
    .from(timeEntry)
    .where(eq(timeEntry.ticketId, ticketId))
    .orderBy(desc(timeEntry.date), desc(timeEntry.startMinute))
  const trackedMinutes = entries.reduce((total, entry) => total + entry.durationMinutes, 0)
  return { entries, trackedMinutes }
})
