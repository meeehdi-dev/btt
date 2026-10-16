import { parseDate as parseZonedDate } from '@internationalized/date'
import {
  addCalendarDays as addDays,
  formatCalendarDate as formatDate,
  parseCalendarDate as parseDate,
} from './date-only'
import { validDate } from './time-entry'

export const reportPeriods = ['week', 'month', 'year'] as const
export type ReportPeriod = (typeof reportPeriods)[number]

export type ReportPeriodRange = {
  startDate: string
  endDate: string
  previousStartDate: string
  previousEndDate: string
}

export type ReportCompletionBounds = {
  startInstant: string
  endInstant: string
}

export function resolveReportTimeZone(timeZone: string): string | null {
  try {
    return new Intl.DateTimeFormat('en', { timeZone }).resolvedOptions().timeZone
  } catch {
    return null
  }
}

export function getReportCompletionBounds(
  range: Pick<ReportPeriodRange, 'startDate' | 'endDate'>,
  timeZone: string,
): ReportCompletionBounds | null {
  const zone = resolveReportTimeZone(timeZone)
  const nextDate = addDays(range.endDate, 1)
  if (!zone || !validDate(range.startDate) || !nextDate || range.startDate > range.endDate)
    return null
  const start = parseZonedDate(range.startDate).toDate(zone)
  const end = parseZonedDate(nextDate).toDate(zone)
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start >= end)
    return null
  return { startInstant: start.toISOString(), endInstant: end.toISOString() }
}

function startOfMonth(value: string): string | null {
  const date = parseDate(value)
  if (!date) return null
  date.setUTCDate(1)
  return formatDate(date)
}

function startOfYear(value: string): string | null {
  const date = parseDate(value)
  if (!date) return null
  date.setUTCMonth(0, 1)
  return formatDate(date)
}

function endOfMonth(startDate: string): string | null {
  const date = parseDate(startDate)
  if (!date) return null
  date.setUTCMonth(date.getUTCMonth() + 1, 0)
  return formatDate(date)
}

function endOfYear(startDate: string): string | null {
  const date = parseDate(startDate)
  if (!date) return null
  date.setUTCFullYear(date.getUTCFullYear() + 1, 0, 0)
  return formatDate(date)
}

export function getReportPeriodRange(
  period: ReportPeriod,
  anchorDate: string,
  startOfWeekDay = 1,
): ReportPeriodRange | null {
  if (
    !validDate(anchorDate) ||
    !Number.isInteger(startOfWeekDay) ||
    startOfWeekDay < 0 ||
    startOfWeekDay > 6
  )
    return null

  let startDate: string | null
  let endDate: string | null
  if (period === 'week') {
    const date = parseDate(anchorDate)!
    const daysSinceStart = (date.getUTCDay() - startOfWeekDay + 7) % 7
    startDate = addDays(anchorDate, -daysSinceStart)
    endDate = startDate ? addDays(startDate, 6) : null
  } else if (period === 'month') {
    startDate = startOfMonth(anchorDate)
    endDate = startDate ? endOfMonth(startDate) : null
  } else if (period === 'year') {
    startDate = startOfYear(anchorDate)
    endDate = startDate ? endOfYear(startDate) : null
  } else {
    return null
  }
  if (!startDate || !endDate) return null

  const previousEndDate = addDays(startDate, -1)
  if (!previousEndDate) return null
  let previousStartDate: string | null
  if (period === 'week') previousStartDate = addDays(startDate, -7)
  else if (period === 'month') previousStartDate = startOfMonth(previousEndDate)
  else previousStartDate = startOfYear(previousEndDate)
  if (!previousStartDate) return null

  return { startDate, endDate, previousStartDate, previousEndDate }
}

export function shiftReportPeriod(
  period: ReportPeriod,
  anchorDate: string,
  amount: number,
  startOfWeekDay = 1,
): string | null {
  if (!Number.isInteger(amount)) return null
  const range = getReportPeriodRange(period, anchorDate, startOfWeekDay)
  if (!range) return null
  if (period === 'week') return addDays(range.startDate, amount * 7)

  const date = parseDate(range.startDate)
  if (!date) return null
  if (period === 'month') date.setUTCMonth(date.getUTCMonth() + amount, 1)
  else date.setUTCFullYear(date.getUTCFullYear() + amount, 0, 1)
  return formatDate(date)
}
