import { addCalendarDays, parseCalendarDate } from './date-only'
import { validDate } from './time-entry'

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
