import { describe, expect, it } from 'vitest'
import { compareReleases, releaseDateInfo } from '../../app/utils/release-date'

describe('release date presentation', () => {
  const now = new Date(2030, 0, 1)

  it('formats relative and localized date information', () => {
    expect(releaseDateInfo('2030-01-08', now).relative).toBe('in 7 days')
    expect(releaseDateInfo('2029-12-30', now).overdue).toBe(true)
    expect(releaseDateInfo('2030-01-08', now).full).toContain('2030')
  })

  it('sorts undated releases before dated releases by date', () => {
    const sorted = [
      { id: 'late', name: 'Late', targetDate: '2029-12-30' },
      { id: 'undated', name: 'Undated', targetDate: null },
      { id: 'later', name: 'Later', targetDate: '2030-02-01' },
      { id: 'soon', name: 'Soon', targetDate: '2030-01-02' },
    ].toSorted(compareReleases)

    expect(sorted.map((release) => release.id)).toEqual(['undated', 'late', 'soon', 'later'])
  })
})
