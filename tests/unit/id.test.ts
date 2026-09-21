import { describe, expect, it } from 'vitest'
import { generateId } from '../../server/utils/id'

const uuidv7Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

describe('UUIDv7 identifiers', () => {
  it('generates RFC 9562 UUIDv7 values with time-ordered prefixes', () => {
    const before = Date.now()
    const first = generateId()
    const second = generateId()
    const after = Date.now()

    expect(first).toMatch(uuidv7Pattern)
    expect(second).toMatch(uuidv7Pattern)

    const timestamp = Number.parseInt(first.replaceAll('-', '').slice(0, 12), 16)
    expect(timestamp).toBeGreaterThanOrEqual(before)
    expect(timestamp).toBeLessThanOrEqual(after)
  })
})
