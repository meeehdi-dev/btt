function localDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(0)
  date.setFullYear(year!, month! - 1, day!)
  date.setHours(12, 0, 0, 0)
  return date
}

export function formatAgendaDate(value: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'numeric',
    day: 'numeric',
  }).format(localDate(value))
}

export function formatAgendaWeekRange(start: string, end: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  }).formatRange(localDate(start), localDate(end))
}

export function formatAgendaWeekRangeShort(start: string, end: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'numeric', day: 'numeric' }).formatRange(
    localDate(start),
    localDate(end),
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
