import { validDate } from './time-entry'

function parseCalendarDate(value: string): Date | null {
  if (!validDate(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(0)
  date.setUTCHours(0, 0, 0, 0)
  date.setUTCFullYear(year!, month! - 1, day!)
  return date
}

function formatCalendarDate(date: Date): string | null {
  const year = date.getUTCFullYear()
  if (year < 1 || year > 9999) return null
  return `${String(year).padStart(4, '0')}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

export function addCalendarDays(value: string, offset: number): string | null {
  if (!Number.isInteger(offset)) return null
  const date = parseCalendarDate(value)
  if (!date) return null
  date.setUTCDate(date.getUTCDate() + offset)
  return formatCalendarDate(date)
}

export function getWeekDates(anchor: string, startOfWeekDay: number): string[] | null {
  if (!Number.isInteger(startOfWeekDay) || startOfWeekDay < 0 || startOfWeekDay > 6) return null
  const date = parseCalendarDate(anchor)
  if (!date) return null
  const daysSinceStart = (date.getUTCDay() - startOfWeekDay + 7) % 7
  const first = addCalendarDays(anchor, -daysSinceStart)
  if (!first) return null
  const dates: string[] = []
  for (let offset = 0; offset < 7; offset++) {
    const current = addCalendarDays(first, offset)
    if (!current) return null
    dates.push(current)
  }
  return dates
}

export function getSevenDatesFrom(startDate: string): string[] | null {
  if (!validDate(startDate)) return null
  const dates: string[] = []
  for (let offset = 0; offset < 7; offset++) {
    const date = addCalendarDays(startDate, offset)
    if (!date) return null
    dates.push(date)
  }
  return dates
}
