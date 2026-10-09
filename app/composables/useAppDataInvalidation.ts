import { clearNuxtData, useNuxtApp } from '#imports'
import type { AsyncData } from 'nuxt/app'
import { onScopeDispose, toValue, watch, type MaybeRefOrGetter } from 'vue'
import {
  appDataKeysToInvalidate,
  appDataMutationResources,
  appDataResourcesOverlap,
  type AppDataMutation,
  type AppDataResource,
} from '~/utils/app-data-resources'
import { refreshEffect, runClientEffect, type ClientEffectResult } from '~/utils/client-effect'

type ActiveReader = {
  refresh: () => Promise<unknown>
  getError: () => unknown
}

type QueryRegistration = {
  resources: Set<AppDataResource>
  readers: Set<ActiveReader>
}

type InvalidationListener = {
  resources: readonly AppDataResource[]
  notify: () => void
}

type Registry = {
  queries: Map<string, QueryRegistration>
  listeners: Set<InvalidationListener>
}

const registries = new WeakMap<object, Registry>()

function registryFor(nuxtApp: object) {
  let registry = registries.get(nuxtApp)
  if (!registry) {
    registry = { queries: new Map(), listeners: new Set() }
    registries.set(nuxtApp, registry)
  }
  return registry
}

function addReader(
  registry: Registry,
  key: string,
  resources: readonly AppDataResource[],
  reader: ActiveReader,
) {
  let registration = registry.queries.get(key)
  if (!registration) {
    registration = { resources: new Set(), readers: new Set() }
    registry.queries.set(key, registration)
  }
  for (const resource of resources) registration.resources.add(resource)
  registration.readers.add(reader)
}

function removeReader(registry: Registry, key: string, reader: ActiveReader) {
  registry.queries.get(key)?.readers.delete(reader)
}

/** Register a useApiFetch result under its explicit Nuxt key and resource dependencies. */
export function trackAppApiFetch<Data, ErrorT>(
  query: AsyncData<Data, ErrorT>,
  options: { key: MaybeRefOrGetter<string>; resources: readonly AppDataResource[] },
): AsyncData<Data, ErrorT> {
  const registry = registryFor(useNuxtApp())
  const reader: ActiveReader = {
    refresh: () => query.refresh(),
    getError: () => query.error.value,
  }
  let activeKey = toValue(options.key)
  addReader(registry, activeKey, options.resources, reader)
  const stopWatchingKey = watch(
    () => toValue(options.key),
    (nextKey, previousKey) => {
      removeReader(registry, previousKey, reader)
      activeKey = nextKey
      addReader(registry, activeKey, options.resources, reader)
    },
    { flush: 'sync' },
  )
  onScopeDispose(() => {
    stopWatchingKey()
    removeReader(registry, activeKey, reader)
  })
  return query
}

/** Capture this Nuxt app's registry in setup for use by later mutation handlers. */
export function useAppDataInvalidation() {
  const nuxtApp = useNuxtApp()
  const registry = registryFor(nuxtApp)

  async function invalidate(
    resources: readonly AppDataResource[],
    options: { refreshActive?: boolean } = {},
  ): Promise<ClientEffectResult<void>> {
    const keys = appDataKeysToInvalidate(
      [...registry.queries].map(([key, registration]) => ({
        key,
        resources: [...registration.resources],
      })),
      resources,
    )
    const activeKeys =
      options.refreshActive === false
        ? []
        : keys.filter((key) => (registry.queries.get(key)?.readers.size ?? 0) > 0)
    const inactiveKeys = keys.filter((key) => !activeKeys.includes(key))
    const readers = activeKeys.flatMap((key) => {
      const registration = registry.queries.get(key)
      const reader = registration?.readers.values().next().value
      return reader ? [reader] : []
    })

    if (inactiveKeys.length) nuxtApp.runWithContext(() => clearNuxtData(inactiveKeys))
    for (const key of inactiveKeys) registry.queries.delete(key)

    const results = await Promise.all(
      readers.map((reader) => runClientEffect(refreshEffect(reader.refresh, reader.getError))),
    )
    const failure = results.find((result) => result._tag === 'Failure')
    for (const listener of registry.listeners) {
      if (appDataResourcesOverlap(listener.resources, resources)) listener.notify()
    }
    return failure ?? { _tag: 'Success', value: undefined }
  }

  function onInvalidated(resources: readonly AppDataResource[], notify: () => void) {
    const listener: InvalidationListener = { resources, notify }
    registry.listeners.add(listener)
    const unsubscribe = () => registry.listeners.delete(listener)
    onScopeDispose(unsubscribe)
    return unsubscribe
  }

  return {
    invalidate,
    invalidateMutation: (mutation: AppDataMutation, options?: { refreshActive?: boolean }) =>
      invalidate(appDataMutationResources[mutation], options),
    onInvalidated,
  }
}
