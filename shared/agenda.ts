import type { TicketPriorityValue } from './ticket-priority'
import type { TicketStatus } from './ticket-status'

export type AgendaTicketFields = {
  ticketId: string
  ticketTitle: string
  ticketArchivedAt: string | null
  releaseId: string
  releaseName: string
  releaseArchivedAt: string | null
  projectId: string
  projectName: string
  projectArchivedAt: string | null
  clientId: string
  clientName: string
  clientArchivedAt: string | null
  status: TicketStatus
  priority: TicketPriorityValue
  relatedTickets: { id: string; title: string; archived: boolean }[]
  externalLinks: { id: string; label: string | null; url: string }[]
}

export const defaultAgendaSettings = {
  visibleStartMinute: 480,
  visibleEndMinute: 1200,
  workDayDurationMinutes: 480,
  startOfWeekDay: 1,
} as const

export type AgendaSettings = {
  visibleStartMinute: number
  visibleEndMinute: number
  workDayDurationMinutes: number
  startOfWeekDay: number
}

export function validAgendaSettings(value: AgendaSettings): boolean {
  const {
    visibleStartMinute: start,
    visibleEndMinute: end,
    workDayDurationMinutes: target,
    startOfWeekDay,
  } = value
  return (
    [start, end, target].every((minute) => Number.isInteger(minute) && minute % 30 === 0) &&
    Number.isInteger(startOfWeekDay) &&
    startOfWeekDay >= 0 &&
    startOfWeekDay <= 6 &&
    start >= 0 &&
    start < end &&
    end <= 1440 &&
    target >= 30 &&
    target <= 1440
  )
}
