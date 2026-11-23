import { describe, expect, it } from 'vitest'
import {
  getReportPeriodRange,
  resolveReportTimeZone,
  shiftReportPeriod,
} from '../../shared/report-period'

describe('report time zones', () => {
  it('rejects unsupported zones', () => {
    expect(resolveReportTimeZone('not/a-zone')).toBeNull()
    expect(resolveReportTimeZone('')).toBeNull()
    expect(resolveReportTimeZone('UTC')).toBe('UTC')
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
