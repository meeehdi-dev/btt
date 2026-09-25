import { describe, expect, it } from 'vitest'
import { formatTicketEstimate, parseTicketEstimate } from '../../app/utils/ticket-estimate'

describe('ticket estimate input and display', () => {
  it.each([
    ['1hr', 60],
    ['1 hr', 60],
    ['45m', 45],
    ['1h 30m', 90],
    ['1.5h', 90],
    ['90', 90],
    ['  90  ', 90],
    ['1hr 15m', 75],
  ])('parses %s as %i minutes', (value, minutes) => {
    expect(parseTicketEstimate(value)).toBe(minutes)
  })

  it('treats empty input as no estimate', () => {
    expect(parseTicketEstimate('  ')).toBeNull()
  })

  it.each([
    '0',
    '-1h',
    '0m',
    '1s',
    '0.5m',
    '1.51h',
    '1h nonsense',
    '2,147,483,648',
    '2147483648',
    '1e5',
  ])('rejects %s', (value) => {
    expect(() => parseTicketEstimate(value)).toThrow('positive whole-minute')
  })

  it.each([
    [45, '45m'],
    [60, '1hr'],
    [90, '1hr 30m'],
    [135, '2hr 15m'],
  ])('displays %i as %s', (minutes, label) => {
    expect(formatTicketEstimate(minutes)).toBe(label)
  })
})
