import { describe, expect, it } from 'vitest'
import { mergeReportFilterOptions, reportReadResources } from '../../app/utils/reports'
import {
  appDataKeysToInvalidate,
  appDataMutationResources,
} from '../../app/utils/app-data-resources'

describe('Reports selected filter presentation', () => {
  it('retains only the selected label when the period has no options', () => {
    expect(
      mergeReportFilterOptions('client', 'c1', [], { value: 'c1', label: 'Client (Archived)' }),
    ).toEqual([{ value: 'c1', label: 'Client (Archived)' }])
    expect(
      mergeReportFilterOptions('client', '', [], { value: 'c1', label: 'Old client' }),
    ).toEqual([])
  })

  it('deduplicates IDs and uses the latest selected metadata without changing order', () => {
    const options = [
      { value: 'c2', label: 'Other' },
      { value: 'c1', label: 'Old' },
    ]
    expect(
      mergeReportFilterOptions('client', 'c1', options, { value: 'c1', label: 'Renamed' }),
    ).toEqual([
      { value: 'c2', label: 'Other' },
      { value: 'c1', label: 'Renamed' },
    ])
    expect(options[1]?.label).toBe('Old')
  })

  it('never displays an ID or a previous selection label for an unavailable selection', () => {
    expect(
      mergeReportFilterOptions('release', 'missing', [], { value: 'other', label: 'Private' }),
    ).toEqual([{ value: 'missing', label: 'Unavailable release' }])
  })
})

describe('actual Reports read resources', () => {
  it('declares every required dependency on the actual read registration', () => {
    expect(reportReadResources).toEqual(['time-entries', 'tickets', 'hierarchy', 'settings'])
  })

  it.each(Object.keys(appDataMutationResources) as (keyof typeof appDataMutationResources)[])(
    '%s mutations invalidate the Reports registration',
    (mutation) => {
      expect(
        appDataKeysToInvalidate(
          [{ key: 'reports', resources: reportReadResources }],
          appDataMutationResources[mutation],
        ),
      ).toEqual(['reports'])
    },
  )
})
