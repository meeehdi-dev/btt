import { idParam } from '../../utils/domain'
import { decodeBody } from '../../domain/decode'
import { TimeEntryUpdate } from '../../domain/schemas'
import { ownedEntry, saveEntry, writableTicket } from '../../domain/time-entries'

export default defineEventHandler(async (event) => {
  const id = idParam(event, 'id')
  const record = await ownedEntry(event, id)
  const body = await decodeBody(event, TimeEntryUpdate)
  if (!Object.keys(body).length)
    throw createError({ status: 400, statusText: 'At least one field is required' })
  if (body.ticketId && body.ticketId !== record.entry.ticketId)
    await writableTicket(event, body.ticketId)
  return saveEntry(
    event,
    {
      ticketId: body.ticketId ?? record.entry.ticketId,
      date: body.date ?? record.entry.date,
      startMinute: body.startMinute ?? record.entry.startMinute,
      durationMinutes: body.durationMinutes ?? record.entry.durationMinutes,
      description: body.description ?? record.entry.description,
    },
    id,
  )
})
