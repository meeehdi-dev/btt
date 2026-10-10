import { computed, reactive, type ComputedRef } from 'vue'

const hierarchyFilterKinds = ['client', 'project', 'release', 'ticket'] as const
export type HierarchyFilterKind = (typeof hierarchyFilterKinds)[number]
export type HierarchyFilterState = Record<HierarchyFilterKind, string>
export type HierarchyFilterSource = {
  clientId: string
  clientName: string
  projectId: string
  projectName: string
  releaseId: string
  releaseName: string
  ticketId: string
  ticketName: string
}
export type FilterSearchInput = {
  placeholder: string
  icon: string
  autofocus: boolean
}

const fields: Record<
  HierarchyFilterKind,
  { id: keyof HierarchyFilterSource; name: keyof HierarchyFilterSource }
> = {
  client: { id: 'clientId', name: 'clientName' },
  project: { id: 'projectId', name: 'projectName' },
  release: { id: 'releaseId', name: 'releaseName' },
  ticket: { id: 'ticketId', name: 'ticketName' },
}

export function useHierarchyFilters<T extends HierarchyFilterState>(
  sources: ComputedRef<readonly HierarchyFilterSource[]>,
  filters: T = reactive({ client: '', project: '', release: '', ticket: '' }) as T,
) {
  const searchInputs = computed<Record<HierarchyFilterKind, FilterSearchInput>>(
    () =>
      Object.fromEntries(
        hierarchyFilterKinds.map((kind) => [
          kind,
          {
            placeholder: `Search ${kind}s…`,
            icon: 'lucide:search',
            autofocus: true,
          },
        ]),
      ) as Record<HierarchyFilterKind, FilterSearchInput>,
  )

  function options(kind: HierarchyFilterKind) {
    const seen = new Map<string, string>()
    for (const row of sources.value) {
      if (kind !== 'client' && filters.client && row.clientId !== filters.client) continue
      if (
        (kind === 'release' || kind === 'ticket') &&
        filters.project &&
        row.projectId !== filters.project
      )
        continue
      if (kind === 'ticket' && filters.release && row.releaseId !== filters.release) continue
      const field = fields[kind]
      const id = row[field.id]
      const label = row[field.name]
      if (typeof id === 'string' && typeof label === 'string') seen.set(id, label)
    }
    return [...seen].map(([value, label]) => ({ value, label }))
  }

  function applyFilter(kind: HierarchyFilterKind, id: string) {
    const row = sources.value.find((source) => source[fields[kind].id] === id)
    if (row && kind !== 'client') filters.client = row.clientId
    if (row && (kind === 'release' || kind === 'ticket')) filters.project = row.projectId
    if (row && kind === 'ticket') filters.release = row.releaseId

    filters[kind] = id
    if (kind === 'client') {
      filters.project = ''
      filters.release = ''
      filters.ticket = ''
    }
    if (kind === 'project') {
      filters.release = ''
      filters.ticket = ''
    }
    if (kind === 'release') filters.ticket = ''
  }

  function clearFilters() {
    for (const kind of hierarchyFilterKinds) filters[kind] = ''
  }

  return { filters, options, applyFilter, clearFilters, searchInputs }
}
