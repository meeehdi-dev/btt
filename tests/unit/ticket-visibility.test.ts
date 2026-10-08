import { describe, expect, it } from 'vitest'
import {
  doneTicketQuietPeriodMs,
  shouldHideQuietDoneTicket,
} from '../../server/domain/ticket-visibility'

const now = new Date('2026-10-08T12:00:00.000Z')
const oneWeekAgo = new Date(now.getTime() - doneTicketQuietPeriodMs)

function candidate(overrides: Partial<Parameters<typeof shouldHideQuietDoneTicket>[0]> = {}) {
  return {
    status: 'Done' as const,
    targetDate: null,
    archivedAt: null,
    ticketUpdatedAt: oneWeekAgo,
    latestTimeEntryUpdatedAt: null,
    ...overrides,
  }
}

describe('quiet Done ticket visibility', () => {
  it('hides a Done ticket at the seven-day inactivity boundary', () => {
    expect(shouldHideQuietDoneTicket(candidate(), now)).toBe(true)
    expect(
      shouldHideQuietDoneTicket(
        candidate({ ticketUpdatedAt: new Date(oneWeekAgo.getTime() + 1) }),
        now,
      ),
    ).toBe(false)
    expect(
      shouldHideQuietDoneTicket(
        candidate({ ticketUpdatedAt: new Date(oneWeekAgo.getTime() - 1) }),
        now,
      ),
    ).toBe(true)
  })

  it('counts the latest ticket or tracked-time update as activity', () => {
    const recentActivity = new Date(now.getTime() - 1)
    expect(
      shouldHideQuietDoneTicket(candidate({ latestTimeEntryUpdatedAt: recentActivity }), now),
    ).toBe(false)
    expect(
      shouldHideQuietDoneTicket(
        candidate({
          ticketUpdatedAt: recentActivity,
          latestTimeEntryUpdatedAt: oneWeekAgo,
        }),
        now,
      ),
    ).toBe(false)
  })

  it('keeps non-Done, targeted-release, and archived tickets visible', () => {
    expect(shouldHideQuietDoneTicket(candidate({ status: 'Review' }), now)).toBe(false)
    expect(shouldHideQuietDoneTicket(candidate({ targetDate: '2026-10-01' }), now)).toBe(false)
    expect(shouldHideQuietDoneTicket(candidate({ archivedAt: now }), now)).toBe(false)
  })
})
