import { validDate } from './time-entry'

export function parseCalendarDate(value: string): Date | null {
  if (!validDate(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(0)
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCFullYear(year!, month! - 1, day!)
  return date
}

export function formatCalendarDate(date: Date): string | null {
  const year = date.getUTCFullYear()
  if (!Number.isInteger(year) || year < 1 || year > 9999) return null
  return `${String(year).padStart(4, '0')}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

export function addCalendarDays(value: string, offset: number): string | null {
  if (!Number.isInteger(offset)) return null
  const date = parseCalendarDate(value)
  if (!date) return null
  date.setUTCDate(date.getUTCDate() + offset)
  return formatCalendarDate(date)
}
