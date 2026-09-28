import { describe, expect, it } from 'vitest'
import { releaseDateInfo } from '../../app/utils/release-date'
import { compareReleases } from '../../shared/release-order'

describe('release date presentation', () => {
  const now = new Date(2030, 0, 1)

  it('formats relative and localized date information', () => {
    expect(releaseDateInfo('2030-01-08', now).relative).toBe('in 7 days')
    expect(releaseDateInfo('2029-12-30', now).overdue).toBe(true)
    expect(releaseDateInfo('2030-01-08', now).full).toContain('2030')
  })

  it('sorts undated releases before dated releases by date', () => {
    const createdAt = new Date('2030-01-01T00:00:00.000Z')
    const sorted = [
      { id: 'late', name: 'Late', targetDate: '2029-12-30', createdAt },
      { id: 'undated', name: 'Undated', targetDate: null, createdAt },
      { id: 'later', name: 'Later', targetDate: '2030-02-01', createdAt },
      { id: 'soon', name: 'Soon', targetDate: '2030-01-02', createdAt },
    ].toSorted(compareReleases)

    expect(sorted.map((release) => release.id)).toEqual(['undated', 'late', 'soon', 'later'])
  })

  it('uses newer creation time after date and name, with ID as an exact-tie fallback', () => {
    const older = {
      id: 'b',
      name: 'Same',
      targetDate: '2030-01-02',
      createdAt: new Date('2029-12-01T00:00:00.000Z'),
    }
    const newer = {
      id: 'z',
      name: 'Same',
      targetDate: '2030-01-02',
      createdAt: new Date('2029-12-02T00:00:00.000Z'),
    }
    const tie = { ...newer, id: 'a' }

    expect([older, newer, tie].toSorted(compareReleases).map((release) => release.id)).toEqual([
      'a',
      'z',
      'b',
    ])
  })
})
