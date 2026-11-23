export function formatTicketEstimate(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (!hours) return `${remainingMinutes}m`
  return `${hours}hr${remainingMinutes ? ` ${remainingMinutes}m` : ''}`
}
