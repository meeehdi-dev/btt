import { describe, expect, it } from 'vitest'
import {
  formatReportChange,
  formatReportPeriodLabel,
  formatReportShare,
  formatSignedReportDuration,
} from '../../app/utils/reports'

describe('report formatting', () => {
  it('formats duration changes and handles a zero previous period without infinity', () => {
    expect(formatSignedReportDuration(90)).toBe('+1hr 30m')
    expect(formatSignedReportDuration(-30)).toBe('−30m')
    expect(formatReportChange(90, 60)).toEqual({
      duration: '+30m',
      percentage: '+50%',
      isNew: false,
    })
    expect(formatReportChange(30, 0)).toEqual({
      duration: '+30m',
      percentage: 'New this period',
      isNew: true,
    })
    expect(formatReportChange(0, 0)).toEqual({
      duration: '0m',
      percentage: 'No prior-period time',
      isNew: false,
    })
  })

  it('formats share with a safe zero-total result and period labels', () => {
    expect(formatReportShare(30, 120)).toBe('25%')
    expect(formatReportShare(30, 0)).toBe('0%')
    expect(formatReportPeriodLabel('month', '2024-02-01', '2024-02-29', 'en-US')).toBe(
      'February 2024',
    )
    expect(formatReportPeriodLabel('year', '2024-01-01', '2024-12-31', 'en-US')).toBe('2024')
    expect(formatReportPeriodLabel('week', '2024-09-16', '2024-09-22', 'en-US')).toContain(
      'Week of',
    )
  })
})
