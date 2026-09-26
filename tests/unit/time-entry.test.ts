import { describe, expect, it } from 'vitest'
import { Effect, Schema } from 'effect'
import { overlaps, usageColor, validDate, validSlot } from '../../shared/time-entry'
import { TimeEntryCreate } from '../../server/domain/schemas'

describe('time entry rules', () => {
  it('accepts real calendar dates and 30-minute slots ending at midnight', () => {
    expect(validDate('2024-02-29')).toBe(true)
    for (const date of ['2025-02-29', '2025-13-01', '2025-04-31', '2025-1-01'])
      expect(validDate(date)).toBe(false)
    expect(validSlot(1410, 30)).toBe(true)
    for (const slot of [
      [0, 15],
      [10, 30],
      [1410, 60],
      [-30, 30],
      [1440, 30],
      [0, 31],
    ])
      expect(validSlot(slot[0]!, slot[1]!)).toBe(false)
  })
  it('treats touching endpoints as adjacent and checks both directions', () => {
    const a = { startMinute: 60, durationMinutes: 60 }
    expect(overlaps(a, { startMinute: 120, durationMinutes: 30 })).toBe(false)
    expect(overlaps(a, { startMinute: 90, durationMinutes: 30 })).toBe(true)
    expect(overlaps({ startMinute: 90, durationMinutes: 30 }, a)).toBe(true)
  })
  it('colors estimate usage across the requested percentage bands', () => {
    expect(usageColor(79, 100)).toBe('info')
    expect(usageColor(80, 100)).toBe('success')
    expect(usageColor(99, 100)).toBe('success')
    expect(usageColor(100, 100)).toBe('warning')
    expect(usageColor(120, 100)).toBe('warning')
    expect(usageColor(121, 100)).toBe('error')
  })
  it('decodes owned request fields through Effect schema', async () => {
    await expect(
      Effect.runPromise(
        Schema.decodeUnknownEffect(TimeEntryCreate)({
          ticketId: 'ticket',
          date: '2025-01-01',
          startMinute: 0,
          durationMinutes: 30,
        }),
      ),
    ).resolves.toBeDefined()
    await expect(
      Effect.runPromise(
        Schema.decodeUnknownEffect(TimeEntryCreate)({
          ticketId: 'ticket',
          date: '2025-01-01',
          startMinute: '0',
          durationMinutes: 30,
        }),
      ),
    ).rejects.toThrow()
  })
})
