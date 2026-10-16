export function localCalendarDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(0)
  date.setFullYear(year!, month! - 1, day!)
  date.setHours(12, 0, 0, 0)
  return date
}
