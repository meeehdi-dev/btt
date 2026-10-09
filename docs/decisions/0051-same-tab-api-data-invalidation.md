# ADR 0051: Same-tab API data invalidation

- Status: Accepted
- Date: 2026-10-09
- Supersedes: None
- Superseded by: None

## Context

Nuxt async data can be reused across SPA navigation after a successful in-app write, leaving views such as the Agenda ticket picker stale. Writes and dependent reads are spread across entity pages and shared components. The guarantee is limited to successful mutations made by this app in the current tab; external writers, other tabs, and devices are not synchronized.

## Decision

- Keep `useApiFetch` and Nuxt async-data as the read-state owner, including its existing Effect boundary, SSR/hydration, request handling, and errors.
- Give app-owned reads stable Nuxt keys and explicit dependency resources. Keep the mutation-to-resource map centralized.
- Register active readers and resource metadata in state scoped to the current `NuxtApp`. After a confirmed successful write, refresh matching active readers and clear matching inactive Nuxt data through public Nuxt APIs so a later SPA visit fetches current data.
- Refresh retained active Global Search results when relevant; when search is closed, clear stale results without starting a background request.
- Preserve failed-write behavior and existing write-success/read-refresh-failure messages and retry paths. Do not invalidate on failed writes.
- Do not add polling, cross-tab synchronization, a parallel client cache, private Nuxt internals, or a global cache-policy change.

## Consequences

- Every app-owned read and successful mutation must declare its data dependencies in the shared resource map.
- Adding a resource dependency requires updating the read tags, mutation map, and relevant tests together.
- Active matching reads can issue requests after a successful write; unrelated reads remain untouched. Inactive matching entries are cleared so SPA navigation does not reuse stale results.
- This policy does not promise synchronization with server-side changes that did not originate in this tab.

## Alternatives considered

- Refresh all Nuxt data after every write: rejected because it causes unrelated requests and obscures dependencies.
- Rely only on `refreshNuxtData()` or page-local refresh: rejected because unmounted async data is not refreshed and can be reused on later SPA navigation.
- Replace Nuxt async data with a separate client cache: rejected because it duplicates Nuxt SSR, hydration, request-key, refresh, and cancellation behavior.
- Poll or synchronize across tabs/devices: rejected as outside the same-tab requirement.
- Use private Nuxt state or change global cache policy: rejected because public targeted APIs and explicit stable keys are sufficient for the planned scope.

## Links

- [Focused plan — Same-tab API data invalidation](../../plans/same-tab-api-data-invalidation.md)
- [ADR 0024 — Effect-aware client fetch boundary](0024-effect-aware-client-fetch-boundary.md)
- `app/composables/useApiFetch.ts`
- `app/utils/client-effect.ts`
