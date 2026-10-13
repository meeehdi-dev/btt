import { describe, expect, it } from 'vitest'
import {
  ticketPriorities,
  ticketPriorityFromOption,
  ticketPriorityIcon,
  ticketPriorityLabel,
  ticketPriorityOptionValue,
  ticketPrioritySortRank,
} from '../../shared/ticket-priority'

describe('ticket priority', () => {
  it('defines the three fixed priorities and neutral centered icons', () => {
    expect(ticketPriorities).toEqual(['low', 'mid', 'high'])
    expect(ticketPriorityIcon(null)).toBe('lucide:minus')
    expect(ticketPriorityIcon('low')).toBe('lucide:chevron-down')
    expect(ticketPriorityIcon('mid')).toBe('lucide:chevron-right')
    expect(ticketPriorityIcon('high')).toBe('lucide:chevron-up')
  })

  it('maps form options to nullable priorities and sorts by the approved rank', () => {
    expect(ticketPriorityFromOption('none')).toBeNull()
    expect(ticketPriorityFromOption('low')).toBe('low')
    expect(ticketPriorityFromOption('mid')).toBe('mid')
    expect(ticketPriorityFromOption('high')).toBe('high')
    expect(ticketPriorityFromOption('on-hold')).toBeUndefined()
    expect(ticketPriorityOptionValue(null)).toBe('none')
    expect(ticketPriorityOptionValue('mid')).toBe('mid')
    expect(ticketPriorityLabel(null)).toBe('No priority')
    expect(ticketPriorityLabel('low')).toBe('Low')
    expect(ticketPriorityLabel('mid')).toBe('Mid')
    expect(ticketPriorityLabel('high')).toBe('High')
    expect(ticketPrioritySortRank('high')).toBeLessThan(ticketPrioritySortRank('mid'))
    expect(ticketPrioritySortRank('mid')).toBeLessThan(ticketPrioritySortRank('low'))
    expect(ticketPrioritySortRank('low')).toBeLessThan(ticketPrioritySortRank(null))
  })
})
