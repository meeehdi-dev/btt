export const ticketPriorities = ['low', 'mid', 'high'] as const

type TicketPriority = (typeof ticketPriorities)[number]
export type TicketPriorityOptionValue = TicketPriority | 'none'
export type TicketPriorityValue = TicketPriority | null

export const ticketPriorityOptions: {
  label: string
  value: TicketPriorityOptionValue
  icon: string
}[] = [
  { label: 'No priority', value: 'none', icon: 'lucide:minus' },
  { label: 'Low', value: 'low', icon: 'lucide:chevron-down' },
  { label: 'Mid', value: 'mid', icon: 'lucide:chevron-right' },
  { label: 'High', value: 'high', icon: 'lucide:chevron-up' },
]

const ticketPriorityIcons: Record<TicketPriorityOptionValue, string> = {
  none: 'lucide:minus',
  low: 'lucide:chevron-down',
  mid: 'lucide:chevron-right',
  high: 'lucide:chevron-up',
}

const ticketPriorityLabels: Record<TicketPriorityOptionValue, string> = {
  none: 'No priority',
  low: 'Low',
  mid: 'Mid',
  high: 'High',
}

const ticketPriorityRanks: Record<TicketPriorityOptionValue, number> = {
  high: 0,
  mid: 1,
  low: 2,
  none: 3,
}

export function ticketPriorityOptionValue(
  priority: TicketPriorityValue,
): TicketPriorityOptionValue {
  return priority ?? 'none'
}

export function ticketPriorityFromOption(value: unknown): TicketPriorityValue | undefined {
  if (value === 'none') return null
  return ticketPriorities.find((priority) => priority === value)
}

export function ticketPriorityIcon(priority: TicketPriorityValue): string {
  return ticketPriorityIcons[ticketPriorityOptionValue(priority)]
}

export function ticketPriorityLabel(priority: TicketPriorityValue): string {
  return ticketPriorityLabels[ticketPriorityOptionValue(priority)]
}

export function ticketPrioritySortRank(priority: TicketPriorityValue): number {
  return ticketPriorityRanks[ticketPriorityOptionValue(priority)]
}
