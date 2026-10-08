export const ticketStatuses = [
  'Idea',
  'Estimate',
  'Develop',
  'Review',
  'Test',
  'Deploy',
  'Done',
] as const

export type TicketStatus = (typeof ticketStatuses)[number]

export const ticketStatusIcons: Record<TicketStatus, string> = {
  Idea: 'lucide:lightbulb',
  Estimate: 'lucide:calculator',
  Develop: 'lucide:code',
  Review: 'lucide:eye',
  Test: 'lucide:flask-conical',
  Deploy: 'lucide:rocket',
  Done: 'lucide:circle-check',
}

export function ticketStatusIcon(status: TicketStatus) {
  return ticketStatusIcons[status]
}

export function nextStatus(status: string) {
  const index = ticketStatuses.findIndex((value) => value === status)
  return index < 0 || index === ticketStatuses.length - 1 ? null : ticketStatuses[index + 1]
}
