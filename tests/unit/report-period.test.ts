import { describe, expect, it } from 'vitest'
import {
  getReportCompletionBounds,
  getReportPeriodRange,
  resolveReportTimeZone,
  shiftReportPeriod,
} from '../../shared/report-period'

describe('report completion instants', () => {
  it.each([
    ['UTC', '2026-10-01T00:00:00.000Z', '2026-11-01T00:00:00.000Z'],
    ['Europe/Paris', '2026-09-30T22:00:00.000Z', '2026-10-31T23:00:00.000Z'],
    ['America/Los_Angeles', '2026-10-01T07:00:00.000Z', '2026-11-01T07:00:00.000Z'],
    ['Asia/Kathmandu', '2026-09-30T18:15:00.000Z', '2026-10-31T18:15:00.000Z'],
  ])('converts both calendar bounds independently in %s', (timeZone, start, end) => {
    expect(
      getReportCompletionBounds({ startDate: '2026-10-01', endDate: '2026-10-31' }, timeZone),
    ).toEqual({ startInstant: start, endInstant: end })
  })

  it.each([
    ['2026-03-23', 167],
    ['2026-10-19', 169],
  ])('does not assume fixed-length days in the week of %s', (date, hours) => {
    const range = getReportPeriodRange('week', date)!
    const bounds = getReportCompletionBounds(range, 'Europe/Paris')!
    expect((Date.parse(bounds.endInstant) - Date.parse(bounds.startInstant)) / 3_600_000).toBe(
      hours,
    )
  })

  it('handles a calendar-year rollover without changing the date-only period', () => {
    const range = getReportPeriodRange('year', '2026-06-15')!
    expect(getReportCompletionBounds(range, 'Europe/Paris')).toEqual({
      startInstant: '2025-12-31T23:00:00.000Z',
      endInstant: '2026-12-31T23:00:00.000Z',
    })
    expect(range.startDate).toBe('2026-01-01')
  })

  it('rejects unsupported zones and unrepresentable or invalid bounds', () => {
    expect(resolveReportTimeZone('not/a-zone')).toBeNull()
    expect(resolveReportTimeZone('')).toBeNull()
    expect(resolveReportTimeZone('UTC')).toBe('UTC')
    const range = { startDate: '2026-10-01', endDate: '2026-10-31' }
    expect(getReportCompletionBounds(range, 'not/a-zone')).toBeNull()
    expect(getReportCompletionBounds({ ...range, startDate: '2026-02-30' }, 'UTC')).toBeNull()
    expect(
      getReportCompletionBounds({ startDate: '2026-10-31', endDate: '2026-10-01' }, 'UTC'),
    ).toBeNull()
    expect(
      getReportCompletionBounds({ startDate: '9999-12-01', endDate: '9999-12-31' }, 'UTC'),
    ).toBeNull()
  })
})

describe('report period boundaries', () => {
  it('builds a configured week and its immediately preceding equivalent week', () => {
    expect(getReportPeriodRange('week', '2024-01-01', 1)).toEqual({
      startDate: '2024-01-01',
      endDate: '2024-01-07',
      previousStartDate: '2023-12-25',
      previousEndDate: '2023-12-31',
    })
    expect(getReportPeriodRange('week', '2024-01-01', 0)).toEqual({
      startDate: '2023-12-31',
      endDate: '2024-01-06',
      previousStartDate: '2023-12-24',
      previousEndDate: '2023-12-30',
    })
  })

  it('uses calendar month boundaries across leap-day and year rollovers', () => {
    expect(getReportPeriodRange('month', '2024-02-29')).toEqual({
      startDate: '2024-02-01',
      endDate: '2024-02-29',
      previousStartDate: '2024-01-01',
      previousEndDate: '2024-01-31',
    })
    expect(getReportPeriodRange('month', '2025-01-15')).toEqual({
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      previousStartDate: '2024-12-01',
      previousEndDate: '2024-12-31',
    })
  })

  it('uses full calendar years including leap years', () => {
    expect(getReportPeriodRange('year', '2024-06-15')).toEqual({
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      previousStartDate: '2023-01-01',
      previousEndDate: '2023-12-31',
    })
  })

  it('shifts by equivalent periods rather than preserving an arbitrary day', () => {
    expect(shiftReportPeriod('week', '2024-03-13', -1, 1)).toBe('2024-03-04')
    expect(shiftReportPeriod('month', '2024-03-31', -1)).toBe('2024-02-01')
    expect(shiftReportPeriod('year', '2024-12-31', 1)).toBe('2025-01-01')
  })

  it('rejects invalid dates, invalid week starts, non-integer shifts, and boundary underflow', () => {
    expect(getReportPeriodRange('month', '2024-02-30')).toBeNull()
    expect(getReportPeriodRange('week', '2024-01-01', 7)).toBeNull()
    expect(getReportPeriodRange('year', '0001-03-10')).toBeNull()
    expect(shiftReportPeriod('month', '2024-03-10', 0.5)).toBeNull()
    expect(shiftReportPeriod('month', '0001-01-01', -1)).toBeNull()
    expect(shiftReportPeriod('year', '2024-01-01', Number.MAX_SAFE_INTEGER)).toBeNull()
  })
})
