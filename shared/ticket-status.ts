export const ticketStatuses = [
  'Idea',
  'Estimate',
  'Develop',
  'Review',
  'Test',
  'Deploy',
  'Done',
] as const

export function nextStatus(status: string) {
  const index = ticketStatuses.findIndex((value) => value === status)
  return index < 0 || index === ticketStatuses.length - 1 ? null : ticketStatuses[index + 1]
}
