import { localCalendarDate } from './calendar-date'

export function formatAgendaDate(value: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'numeric',
    day: 'numeric',
  }).format(localCalendarDate(value))
}

export function formatAgendaWeekRange(start: string, end: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  }).formatRange(localCalendarDate(start), localCalendarDate(end))
}

export function formatAgendaWeekRangeShort(start: string, end: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'numeric', day: 'numeric' }).formatRange(
    localCalendarDate(start),
    localCalendarDate(end),
  )
}

export function localizedWeekdays(locale?: string): { label: string; value: number }[] {
  return Array.from({ length: 7 }, (_, value) => ({
    label: new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(
      new Date(2023, 0, value + 1, 12),
    ),
    value,
  }))
}
