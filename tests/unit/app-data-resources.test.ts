import { describe, expect, it } from 'vitest'
import {
  appDataKeysToInvalidate,
  appDataMutationResources,
  appDataResourcesOverlap,
  type AppDataResource,
} from '../../app/utils/app-data-resources'

describe('same-tab API data dependencies', () => {
  it('maps mutations to the dependent projections', () => {
    expect(appDataMutationResources.client).toContain('hierarchy')
    expect(appDataMutationResources.client).toContain('tickets')
    expect(appDataMutationResources.project).toContain('releases')
    expect(appDataMutationResources.release).toContain('tickets')
    expect(appDataMutationResources.ticket).toContain('time-entries')
    expect(appDataMutationResources.ticket).toContain('agenda')
    expect(appDataMutationResources['time-entry']).toContain('tickets')
    expect(appDataMutationResources['time-entry']).toContain('agenda')
    expect(appDataMutationResources.settings).toEqual(['settings', 'agenda'])
  })

  it('selects only keys whose resources overlap the mutation', () => {
    const entries: { key: string; resources: readonly AppDataResource[] }[] = [
      { key: 'agenda-week', resources: ['agenda', 'tickets'] },
      { key: 'ticket-list', resources: ['tickets', 'hierarchy'] },
      { key: 'settings', resources: ['settings'] },
    ]

    expect(appDataKeysToInvalidate(entries, appDataMutationResources['time-entry'])).toEqual([
      'agenda-week',
      'ticket-list',
    ])
    expect(appDataResourcesOverlap(['clients'], ['tickets'])).toBe(false)
  })
})
