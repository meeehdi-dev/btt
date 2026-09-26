import { describe, expect, it } from 'vitest'
import {
  defaultAgendaSettings,
  validAgendaSettings,
  type AgendaSettings,
} from '../../shared/agenda'

const valid = (overrides: Partial<AgendaSettings> = {}) =>
  validAgendaSettings({ ...defaultAgendaSettings, ...overrides })

describe('agenda settings', () => {
  it('accepts the default window and boundary hours', () => {
    expect(valid()).toBe(true)
    expect(
      valid({ visibleStartMinute: 0, visibleEndMinute: 1440, workDayDurationMinutes: 1440 }),
    ).toBe(true)
  })
  it('rejects non-30-minute grids, inverted windows, and invalid workday targets', () => {
    expect(valid({ visibleStartMinute: 500 })).toBe(false)
    expect(valid({ visibleEndMinute: 480 })).toBe(false)
    expect(valid({ visibleEndMinute: 1470 })).toBe(false)
    expect(valid({ workDayDurationMinutes: 0 })).toBe(false)
    expect(valid({ workDayDurationMinutes: 1450 })).toBe(false)
    expect(valid({ workDayDurationMinutes: Number.NaN })).toBe(false)
  })
})
