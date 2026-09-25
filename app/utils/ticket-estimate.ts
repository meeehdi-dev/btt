import parseDuration from 'parse-duration-ms'

const maxDatabaseMinutes = 2_147_483_647

export function parseTicketEstimate(input: string): number | null {
  const value = input.trim()
  if (!value) return null
  const minutes = /^\d+$/.test(value)
    ? Number(value)
    : (parseDuration(value) ?? Number.NaN) / 60_000
  if (!Number.isSafeInteger(minutes) || minutes <= 0 || minutes > maxDatabaseMinutes)
    throw new Error('Enter a positive whole-minute estimate (e.g. 1hr 30m or 90).')
  return minutes
}

export function formatTicketEstimate(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (!hours) return `${remainingMinutes}m`
  return `${hours}hr${remainingMinutes ? ` ${remainingMinutes}m` : ''}`
}
