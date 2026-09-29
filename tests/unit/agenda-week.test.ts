import { describe, expect, it } from 'vitest'
import { getSevenDatesFrom, getWeekDates } from '../../shared/agenda-week'
import {
  formatAgendaDate,
  formatAgendaWeekRange,
  formatAgendaWeekRangeShort,
} from '../../app/utils/agenda-week'

describe('agenda week dates', () => {
  it('builds Monday- and Sunday-start weeks around month and year boundaries', () => {
    expect(getWeekDates('2024-01-01', 1)).toEqual([
      '2024-01-01',
      '2024-01-02',
      '2024-01-03',
      '2024-01-04',
      '2024-01-05',
      '2024-01-06',
      '2024-01-07',
    ])
    expect(getWeekDates('2024-01-01', 0)).toEqual([
      '2023-12-31',
      '2024-01-01',
      '2024-01-02',
      '2024-01-03',
      '2024-01-04',
      '2024-01-05',
      '2024-01-06',
    ])
  })

  it('handles leap days and rejects invalid or overflowing ranges', () => {
    expect(getWeekDates('2024-02-29', 1)).toEqual([
      '2024-02-26',
      '2024-02-27',
      '2024-02-28',
      '2024-02-29',
      '2024-03-01',
      '2024-03-02',
      '2024-03-03',
    ])
    expect(getSevenDatesFrom('2024-12-29')).toEqual([
      '2024-12-29',
      '2024-12-30',
      '2024-12-31',
      '2025-01-01',
      '2025-01-02',
      '2025-01-03',
      '2025-01-04',
    ])
    expect(getWeekDates('2024-02-30', 1)).toBeNull()
    expect(getWeekDates('2024-01-01', 7)).toBeNull()
    expect(getSevenDatesFrom('9999-12-31')).toBeNull()
  })

  it('formats weekday and numeric date in the requested locale order', () => {
    const date = '2024-09-16'
    const localNoon = new Date(0)
    localNoon.setFullYear(2024, 8, 16)
    localNoon.setHours(12, 0, 0, 0)
    expect(formatAgendaDate(date, 'en-GB')).toBe(
      new Intl.DateTimeFormat('en-GB', {
        weekday: 'long',
        month: 'numeric',
        day: 'numeric',
      }).format(localNoon),
    )
    expect(formatAgendaDate(date, 'en-US')).toBe(
      new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'numeric',
        day: 'numeric',
      }).format(localNoon),
    )
    expect(formatAgendaDate(date, 'de-DE')).toMatch(/Montag/)
    expect(formatAgendaWeekRange('2024-09-16', '2024-09-22', 'en-GB')).toContain('2024')
    expect(formatAgendaWeekRangeShort('2024-09-16', '2024-09-22', 'de-DE')).toBe(
      new Intl.DateTimeFormat('de-DE', { month: 'numeric', day: 'numeric' }).formatRange(
        localNoon,
        new Date(2024, 8, 22, 12),
      ),
    )
  })
})
