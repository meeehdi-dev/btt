export type ReleaseDateInfo = {
  readonly relative: string
  readonly full: string
  readonly overdue: boolean
}

function parseDate(value: string) {
  const [year, month, day] = value.split('-')
  return new Date(Number(year), Number(month) - 1, Number(day))
}

function calendarDayDifference(value: string, now = new Date()) {
  const target = parseDate(value)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

export function releaseDateInfo(value: string, now = new Date()): ReleaseDateInfo {
  const date = parseDate(value)
  const days = calendarDayDifference(value, now)
  const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(days, 'day')
  const full = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date)

  return { relative, full, overdue: days < 0 }
}

type SortableRelease = {
  readonly targetDate: string | null
  readonly name: string
  readonly id: string
}

export function compareReleases(a: SortableRelease, b: SortableRelease) {
  if (!a.targetDate && !b.targetDate)
    return a.name.localeCompare(b.name) || a.id.localeCompare(b.id)
  if (!a.targetDate) return -1
  if (!b.targetDate) return 1
  return (
    a.targetDate.localeCompare(b.targetDate) ||
    a.name.localeCompare(b.name) ||
    a.id.localeCompare(b.id)
  )
}
