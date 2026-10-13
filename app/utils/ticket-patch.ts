import type { TicketPriorityValue } from '#shared/ticket-priority'
import type { TicketStatus } from '#shared/ticket-status'
import { runClientRequest } from './client-effect'

type TicketPatch = {
  status?: TicketStatus
  priority?: TicketPriorityValue
}

export function patchTicket(id: string, body: TicketPatch) {
  const endpoint = `/api/tickets/${id}`
  return runClientRequest<unknown>((signal) =>
    $fetch<unknown>(endpoint, { method: 'PATCH', body, signal }),
  )
}
