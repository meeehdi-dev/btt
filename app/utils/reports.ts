import { shiftReportPeriod, type ReportPeriod, type ReportPeriodRange } from '#shared/report-period'
import { addCalendarDays } from '#shared/date-only'
import { validDate } from '#shared/time-entry'
import { localCalendarDate } from './calendar-date'
import { formatTicketEstimate } from './ticket-estimate'
import type { ReportGrouping } from '#shared/reports'
import type { AppDataResource } from './app-data-resources'

export const reportReadResources = [
  'time-entries',
  'tickets',
  'hierarchy',
  'settings',
] as const satisfies readonly AppDataResource[]

export function getAdjacentReportDate(
  period: ReportPeriod,
  range: Pick<ReportPeriodRange, 'startDate' | 'endDate'>,
  amount: number,
): string | null {
  if (
    !Number.isInteger(amount) ||
    !validDate(range.startDate) ||
    !validDate(range.endDate) ||
    range.startDate > range.endDate
  )
    return null
  return period === 'week'
    ? addCalendarDays(range.startDate, amount * 7)
    : shiftReportPeriod(period, range.startDate, amount)
}

type ReportFilterOption = { value: string; label: string }

export function mergeReportFilterOptions(
  kind: ReportGrouping,
  id: string,
  options: readonly ReportFilterOption[],
  selected: ReportFilterOption | null,
): ReportFilterOption[] {
  if (!id) return [...options]
  const option =
    selected?.value === id
      ? selected
      : (options.find((item) => item.value === id) ?? { value: id, label: `Unavailable ${kind}` })
  return options.some((item) => item.value === id)
    ? options.map((item) => (item.value === id ? option : item))
    : [...options, option]
}

export function formatReportPeriodLabel(
  period: ReportPeriod,
  startDate: string,
  endDate: string,
  locale?: string,
) {
  if (period === 'week') {
    const range = new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).formatRange(localCalendarDate(startDate), localCalendarDate(endDate))
    return `Week of ${range}`
  }
  if (period === 'month')
    return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
      localCalendarDate(startDate),
    )
  return new Intl.DateTimeFormat(locale, { year: 'numeric' }).format(localCalendarDate(startDate))
}

export function formatReportDuration(minutes: number) {
  return formatTicketEstimate(Math.abs(minutes))
}

export function formatSignedReportDuration(minutes: number) {
  if (minutes === 0) return '0m'
  return `${minutes > 0 ? '+' : '−'}${formatReportDuration(minutes)}`
}

function formatReportPercent(value: number, locale?: string, signed = false) {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: 1,
    signDisplay: signed ? 'always' : 'auto',
  }).format(value)
}

export function formatReportChange(
  currentMinutes: number,
  previousMinutes: number,
  locale?: string,
) {
  if (previousMinutes === 0)
    return currentMinutes === 0
      ? { duration: '0m', percentage: 'No prior-period time', isNew: false }
      : {
          duration: formatSignedReportDuration(currentMinutes),
          percentage: 'New this period',
          isNew: true,
        }
  const difference = currentMinutes - previousMinutes
  return {
    duration: formatSignedReportDuration(difference),
    percentage: formatReportPercent(difference / previousMinutes, locale, true),
    isNew: false,
  }
}

export function formatReportShare(minutes: number, totalMinutes: number, locale?: string) {
  return formatReportPercent(totalMinutes > 0 ? minutes / totalMinutes : 0, locale)
}
