import { decodeBody } from '../../domain/decode'
import { TimeEntryCreate } from '../../domain/schemas'
import { saveEntry, writableTicket } from '../../domain/time-entries'

export default defineEventHandler(async (event) => {
  const body = await decodeBody(event, TimeEntryCreate)
  await writableTicket(event, body.ticketId)
  return saveEntry(event, { ...body, description: body.description ?? '' })
})
