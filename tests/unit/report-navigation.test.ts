import { describe, expect, it } from 'vitest'
import { getAdjacentReportDate } from '../../app/utils/reports'

describe('response-boundary report navigation', () => {
  it.each([
    ['2026-10-11', '2026-10-17', '2026-10-04', '2026-10-18'],
    ['2026-10-12', '2026-10-18', '2026-10-05', '2026-10-19'],
    ['2026-10-14', '2026-10-20', '2026-10-07', '2026-10-21'],
  ])('keeps weekly alignment from %s', (startDate, endDate, previous, next) => {
    const range = { startDate, endDate }
    expect(getAdjacentReportDate('week', range, -1)).toBe(previous)
    expect(getAdjacentReportDate('week', range, 1)).toBe(next)
    expect(getAdjacentReportDate('week', range, 0)).toBe(startDate)
  })
  it('uses calendar month and year boundaries through leap years and rollovers', () => {
    const february = { startDate: '2024-02-01', endDate: '2024-02-29' }
    expect(getAdjacentReportDate('month', february, -1)).toBe('2024-01-01')
    expect(getAdjacentReportDate('month', february, 1)).toBe('2024-03-01')
    expect(getAdjacentReportDate('month', february, -2)).toBe('2023-12-01')
    const year = { startDate: '2024-01-01', endDate: '2024-12-31' }
    expect(getAdjacentReportDate('year', year, -1)).toBe('2023-01-01')
    expect(getAdjacentReportDate('year', year, 1)).toBe('2025-01-01')
  })
  it('rejects invalid dates, reversed ranges, non-integer shifts and overflow', () => {
    const range = { startDate: '2026-10-11', endDate: '2026-10-17' }
    for (const amount of [NaN, Infinity, -Infinity, 0.5, Number.MAX_VALUE])
      expect(getAdjacentReportDate('week', range, amount)).toBeNull()
    for (const period of ['week', 'month', 'year'] as const) {
      expect(getAdjacentReportDate(period, { ...range, startDate: '2026-02-30' }, 1)).toBeNull()
      expect(getAdjacentReportDate(period, { ...range, endDate: 'bad' }, 1)).toBeNull()
      expect(
        getAdjacentReportDate(period, { startDate: range.endDate, endDate: range.startDate }, 1),
      ).toBeNull()
      expect(getAdjacentReportDate(period, range, Number.MAX_SAFE_INTEGER)).toBeNull()
      expect(
        getAdjacentReportDate(period, { startDate: '9999-12-01', endDate: '9999-12-31' }, 100),
      ).toBeNull()
      expect(
        getAdjacentReportDate(period, { startDate: '0001-01-01', endDate: '0001-01-07' }, -1),
      ).toBeNull()
    }
  })
})
