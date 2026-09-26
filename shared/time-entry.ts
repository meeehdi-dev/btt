export const slotMinutes = 30

export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day || year < 1 || year > 9999) return false
  const candidate = new Date(0)
  candidate.setUTCFullYear(year, month - 1, day)
  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() + 1 === month &&
    candidate.getUTCDate() === day
  )
}

export function validSlot(startMinute: number, durationMinutes: number): boolean {
  return (
    Number.isInteger(startMinute) &&
    Number.isInteger(durationMinutes) &&
    startMinute >= 0 &&
    startMinute < 1440 &&
    startMinute % slotMinutes === 0 &&
    durationMinutes >= slotMinutes &&
    durationMinutes % slotMinutes === 0 &&
    startMinute + durationMinutes <= 1440
  )
}

export function overlaps(
  a: { startMinute: number; durationMinutes: number },
  b: { startMinute: number; durationMinutes: number },
): boolean {
  return (
    a.startMinute < b.startMinute + b.durationMinutes &&
    b.startMinute < a.startMinute + a.durationMinutes
  )
}

export function usageColor(tracked: number, estimate: number): 'neutral' | 'warning' | 'error' {
  return tracked >= estimate ? 'error' : tracked * 5 >= estimate * 4 ? 'warning' : 'neutral'
}
