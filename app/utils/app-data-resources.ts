export const appDataMutationResources = {
  client: ['clients', 'projects', 'releases', 'tickets', 'hierarchy', 'agenda', 'search'],
  project: ['projects', 'releases', 'tickets', 'hierarchy', 'agenda', 'search'],
  release: ['releases', 'tickets', 'hierarchy', 'agenda', 'search'],
  ticket: ['tickets', 'releases', 'time-entries', 'hierarchy', 'agenda', 'search'],
  'time-entry': ['time-entries', 'tickets', 'agenda', 'search'],
  settings: ['settings', 'agenda'],
} as const

export type AppDataMutation = keyof typeof appDataMutationResources
export type AppDataResource = (typeof appDataMutationResources)[AppDataMutation][number]

export function appDataResourcesOverlap(
  left: readonly AppDataResource[],
  right: readonly AppDataResource[],
) {
  return left.some((resource) => right.includes(resource))
}

export function appDataKeysToInvalidate(
  entries: Iterable<{ key: string; resources: readonly AppDataResource[] }>,
  resources: readonly AppDataResource[],
) {
  return [...entries]
    .filter((entry) => appDataResourcesOverlap(entry.resources, resources))
    .map((entry) => entry.key)
}
