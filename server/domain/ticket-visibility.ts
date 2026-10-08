import type { TicketStatus } from '../../shared/ticket-status'

export const doneTicketQuietPeriodMs = 7 * 24 * 60 * 60 * 1000

export function shouldHideQuietDoneTicket(
  input: {
    status: TicketStatus
    targetDate: string | null
    archivedAt: Date | null
    ticketUpdatedAt: Date
    latestTimeEntryUpdatedAt: Date | null
  },
  now = new Date(),
) {
  if (input.archivedAt || input.status !== 'Done' || input.targetDate !== null) return false

  const lastActivityAt = Math.max(
    input.ticketUpdatedAt.getTime(),
    input.latestTimeEntryUpdatedAt?.getTime() ?? Number.NEGATIVE_INFINITY,
  )
  return now.getTime() - lastActivityAt >= doneTicketQuietPeriodMs
}
