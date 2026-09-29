import { describe, expect, it } from 'vitest'
import { creationRange, moveRange, pointerSlot, resizeRange } from '../../app/utils/agenda-drag'

const window = { start: 480, end: 1200 }
const occupied = [
  { startMinute: 600, durationMinutes: 60 },
  { startMinute: 750, durationMinutes: 30 },
]

describe('agenda gesture geometry', () => {
  it('snaps pointer coordinates to 30-minute slots and clamps bounds', () => {
    expect(pointerSlot(-10, 1440, window)).toBe(480)
    expect(pointerSlot(240, 1440, window)).toBe(600)
    expect(pointerSlot(1500, 1440, window)).toBe(1170)
  })
  it('keeps a creation anchored in either direction, even after dragging past blockers', () => {
    expect(creationRange(540, 960, occupied, window)).toEqual({
      startMinute: 540,
      durationMinutes: 60,
    })
    expect(creationRange(690, 480, occupied, window)).toEqual({
      startMinute: 660,
      durationMinutes: 60,
    })
    expect(creationRange(690, 690, occupied, window)).toEqual({
      startMinute: 690,
      durationMinutes: 30,
    })
    expect(creationRange(480, 480, occupied, window)).toEqual({
      startMinute: 480,
      durationMinutes: 30,
    })
    expect(creationRange(1140, 1170, occupied, window)).toEqual({
      startMinute: 1140,
      durationMinutes: 60,
    })
  })
  it('clamps both resize edges at neighbors/window and keeps one slot minimum', () => {
    const entry = { startMinute: 690, durationMinutes: 60 }
    expect(resizeRange(entry, 'top', 480, occupied, window)).toEqual({
      startMinute: 660,
      durationMinutes: 90,
    })
    expect(resizeRange(entry, 'top', 750, occupied, window)).toEqual({
      startMinute: 720,
      durationMinutes: 30,
    })
    expect(resizeRange(entry, 'bottom', 900, occupied, window)).toEqual({
      startMinute: 690,
      durationMinutes: 60,
    })
    expect(
      resizeRange({ startMinute: 1170, durationMinutes: 30 }, 'bottom', 1440, occupied, window),
    ).toEqual({ startMinute: 1170, durationMinutes: 30 })
  })
  it('moves to free slots, nudges a few pixels at an edge, rejects major collisions', () => {
    const blocker = [{ startMinute: 600, durationMinutes: 60 }]
    expect(moveRange(570, 30, blocker, window, 2.25)).toEqual({
      startMinute: 570,
      durationMinutes: 30,
      adjusted: false,
      valid: true,
    })
    expect(moveRange(574, 30, blocker, window, 2.25)).toEqual({
      startMinute: 570,
      durationMinutes: 30,
      adjusted: true,
      valid: true,
    })
    expect(moveRange(630, 30, blocker, window, 2.25)).toEqual({
      startMinute: 630,
      durationMinutes: 30,
      adjusted: false,
      valid: false,
    })
    expect(moveRange(655, 30, blocker, window, 2.25)).toEqual({
      startMinute: 660,
      durationMinutes: 30,
      adjusted: true,
      valid: true,
    })
    expect(moveRange(1175, 30, blocker, window, 2.25)).toEqual({
      startMinute: 1170,
      durationMinutes: 30,
      adjusted: false,
      valid: false,
    })
  })
})
