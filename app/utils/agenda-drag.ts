import { overlaps, slotMinutes } from '#shared/time-entry'

export type Interval = { startMinute: number; durationMinutes: number }
export type Window = { start: number; end: number }
export type MovePreview = Interval & { adjusted: boolean; valid: boolean }

const endOf = (entry: Interval) => entry.startMinute + entry.durationMinutes

/** Convert a pointer's Y position relative to the timeline into a 30-minute slot. */
export function pointerSlot(y: number, height: number, window: Window): number {
  const slots = (window.end - window.start) / slotMinutes
  return (
    window.start + Math.max(0, Math.min(slots - 1, Math.floor((y / height) * slots))) * slotMinutes
  )
}

/** Creation is anchored in one slot; dragging past a neighbor cannot jump over it. */
export function creationRange(
  anchor: number,
  hover: number,
  occupied: Interval[],
  window: Window,
): Interval {
  if (hover >= anchor) {
    const stop = Math.min(
      window.end,
      ...occupied.filter((entry) => entry.startMinute > anchor).map((entry) => entry.startMinute),
    )
    return {
      startMinute: anchor,
      durationMinutes: Math.max(slotMinutes, Math.min(hover + slotMinutes, stop) - anchor),
    }
  }
  const stop = Math.max(
    window.start,
    ...occupied.filter((entry) => endOf(entry) <= anchor).map(endOf),
  )
  const start = Math.max(hover, stop)
  return { startMinute: start, durationMinutes: anchor + slotMinutes - start }
}

export function resizeRange(
  entry: Interval,
  edge: 'top' | 'bottom',
  boundary: number,
  occupied: Interval[],
  window: Window,
): Interval {
  const end = endOf(entry)
  if (edge === 'top') {
    const stop = Math.max(
      window.start,
      ...occupied
        .filter((other) => endOf(other) <= end && other.startMinute < entry.startMinute)
        .map(endOf),
    )
    const start = Math.max(stop, Math.min(boundary, end - slotMinutes))
    return { startMinute: start, durationMinutes: end - start }
  }
  const stop = Math.min(
    window.end,
    ...occupied.filter((other) => other.startMinute >= end).map((other) => other.startMinute),
  )
  return {
    startMinute: entry.startMinute,
    durationMinutes: Math.max(slotMinutes, Math.min(boundary, stop) - entry.startMinute),
  }
}

/** Move preserves duration. Only a tiny pointer overshoot may settle at an adjacent free edge. */
export function moveRange(
  rawStart: number,
  durationMinutes: number,
  occupied: Interval[],
  window: Window,
  pixelsPerMinute: number,
  tolerancePx = 12,
): MovePreview {
  const nearest = window.start + Math.round((rawStart - window.start) / slotMinutes) * slotMinutes
  const fits = (start: number) =>
    start >= window.start &&
    start + durationMinutes <= window.end &&
    !occupied.some((other) => overlaps({ startMinute: start, durationMinutes }, other))
  const attempted: MovePreview = {
    startMinute: nearest,
    durationMinutes,
    adjusted: false,
    valid: false,
  }
  if (rawStart < window.start || rawStart + durationMinutes > window.end) return attempted
  const rawOverlaps = occupied.some((other) =>
    overlaps({ startMinute: rawStart, durationMinutes }, other),
  )
  if (fits(nearest) && !rawOverlaps)
    return { startMinute: nearest, durationMinutes, adjusted: false, valid: true }
  const candidates = new Set<number>()
  if (fits(nearest)) candidates.add(nearest)
  for (const other of occupied) {
    candidates.add(other.startMinute - durationMinutes)
    candidates.add(endOf(other))
  }
  const nearby = [...candidates]
    .filter((start) => Math.abs(rawStart - start) * pixelsPerMinute <= tolerancePx && fits(start))
    .toSorted((a, b) => Math.abs(rawStart - a) - Math.abs(rawStart - b))
  const start = nearby[0]
  return start === undefined
    ? attempted
    : { startMinute: start, durationMinutes, adjusted: true, valid: true }
}
