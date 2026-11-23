import { describe, expect, it } from 'vitest'
import { formatTicketEstimate } from '../../app/utils/ticket-estimate'

describe('ticket duration display', () => {
  it.each([
    [45, '45m'],
    [60, '1hr'],
    [90, '1hr 30m'],
    [135, '2hr 15m'],
  ])('displays %i as %s', (minutes, label) => {
    expect(formatTicketEstimate(minutes)).toBe(label)
  })
})
