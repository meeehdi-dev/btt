export const defaultAgendaSettings = {
  visibleStartMinute: 480,
  visibleEndMinute: 1200,
  workDayDurationMinutes: 480,
} as const

export type AgendaSettings = {
  visibleStartMinute: number
  visibleEndMinute: number
  workDayDurationMinutes: number
}

export function validAgendaSettings(value: AgendaSettings): boolean {
  const { visibleStartMinute: start, visibleEndMinute: end, workDayDurationMinutes: target } = value
  return (
    [start, end, target].every((minute) => Number.isInteger(minute) && minute % 30 === 0) &&
    start >= 0 &&
    start < end &&
    end <= 1440 &&
    target >= 30 &&
    target <= 1440
  )
}
