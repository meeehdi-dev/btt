# Focused plan — Same-tab API data invalidation

**Status: Complete — implementation, verification, human code review, and completion declaration recorded.**

## Context

A ticket created through the in-app ticket form can be absent from the Agenda's time-entry picker until a browser reload. The source-level cause is that the Agenda reads `/api/tickets` through `useApiFetch`, while the create flow posts a ticket and navigates without invalidating that cached read. Nuxt's async-data state is reused during SPA navigation; the page does not automatically know that a successful write elsewhere changed its data.

The requested behavior is same-tab freshness: after an in-app write succeeds, relevant existing views and subsequent in-app navigation should see the updated server data without reloading the browser. This is not a request for polling or real-time synchronization with other tabs, devices, or external database writers.

### Observed facts

- `app/composables/useApiFetch.ts` wraps Nuxt `createUseFetch`; ADR 0024 keeps Nuxt responsible for SSR, hydration, request keys, refresh, deduplication, and cancellation.
- `app/pages/agenda.vue` loads `/api/tickets` once and derives its add-entry choices from that response. `app/pages/tickets/new.vue` posts a ticket and navigates to its detail page without refreshing or invalidating the Agenda's read.
- Most writes use `runClientRequest` and are spread across entity pages, Agenda, ticket detail, settings, and `TicketTimeEntries.vue`. Several surfaces already perform a page-local refresh and explicitly handle write-success/read-refresh-failure; those semantics must remain intact.
- `app/components/GlobalSearch.vue` fetches search results imperatively and stores them in local component state rather than Nuxt async data.
- The app has reads for clients, projects, releases, tickets, time entries, Agenda, and settings. Several responses include ancestor labels, counts, ticket usage, or other derived data, so a mutation can affect more than the endpoint named in its URL.

## Goal

After any successful in-app mutation of user-managed domain data or settings, invalidate and refresh the relevant same-tab data so affected active views update and later SPA visits do not reuse stale cached results. Keep the current Nuxt/Effect boundaries and all domain/API behavior unchanged.

## Proposed scope

- Add a small, typed, app-level invalidation mechanism for Nuxt API reads, based on explicit resource/dependency tags and a centralized mutation-to-resource map.
- Cover successful client, project, release, ticket, time-entry, and settings writes, including create, field/status changes, archive/restore/delete, release completion, and ticket-link/relation changes.
- Include dependent projections: hierarchy names/options and descendant lists, ticket choices/status/filter data, release ticket collections/counts, Agenda entries/progress/filters, ticket/time-entry history and tracked usage, and active global-search results where applicable.
- Invalidate only after a confirmed successful write. Failed writes must not trigger invalidation. Where a write already has a page-local refresh, integrate it with the shared invalidation path without duplicate requests or weaker partial-success/retry behavior.
- Keep Nuxt's `useFetch`/`useAsyncData` as the source of read state. Use supported Nuxt APIs and preserve SSR/hydration, request cancellation, dedupe, loading/error state, and existing request semantics.
- Add same-tab browser regression coverage, especially: load Agenda, navigate in-app to create an active ticket, return to Agenda without a document reload, and find/select the new ticket in the add-entry picker.
- Draft ADR 0051 for the durable same-tab invalidation policy after plan approval; keep it Proposed until code review.

## Out of scope

- Polling, WebSockets, SSE, database notifications, cross-tab/device synchronization, and updates from external database writers. The guarantee is for successful mutations made by this app in this tab.
- API/server/schema/database/auth/dependency changes, optimistic writes, a replacement global state/data-fetching framework, or broad changes to Nuxt caching policy.
- Changing which tickets are eligible for new time entries, existing archive/status rules, or any persisted data/domain behavior.
- Refactoring unrelated UI or changing search matching/ranking. Search handling is limited to preventing visibly retained results from remaining stale after an in-tab mutation.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- ADR 0024 — `docs/decisions/0024-effect-aware-client-fetch-boundary.md`
- ADR 0037 — `docs/decisions/0037-searchable-data-backed-selectors.md`
- ADR 0050 — `docs/decisions/0050-e2e-verification-and-server-handoff.md`
- `app/composables/useApiFetch.ts`, `app/utils/client-effect.ts`
- `app/pages/agenda.vue`, `app/pages/tickets/new.vue`, `app/pages/tickets/index.vue`, `app/pages/tickets/[id]/index.vue`
- Hierarchy mutation surfaces under `app/pages/clients/`, `app/pages/projects/`, and `app/pages/releases/`
- `app/components/TicketTimeEntries.vue`, `app/components/GlobalSearch.vue`, `app/pages/settings.vue`
- `tests/e2e/agenda-week.test.ts`, `tests/e2e/tickets.test.ts`, `tests/e2e/time-entries.test.ts`, `tests/e2e/hierarchy-breadcrumbs.test.ts`, `tests/e2e/search.test.ts`

## Approach

1. **Inventory dependencies.** Audit every `useApiFetch` read and every successful client mutation. Record which read projections each mutation can change. Use coarse resource tags where several views share the same source; use entity-specific tags only where they materially reduce unrelated refreshes.
2. **Preserve Nuxt ownership.** Add a small app-data fetch/invalidation layer beside `useApiFetch` (which remains the underlying Nuxt/Effect boundary, including for Better Auth). Give each app-owned read an explicit stable Nuxt key plus one or more resource tags; register its key and active refresh/error handle in per-`NuxtApp` state. A shared invalidator refreshes matching active readers and clears matching inactive cache entries with public Nuxt APIs so a later SPA visit fetches again. Do not rely solely on `refreshNuxtData()` (it only reaches currently mounted readers) or on page-local `refresh()` calls: the Agenda failure occurs after its page has been left. If the required behavior would need private Nuxt internals or a broad global cache-policy change, stop and return that design question for approval.
3. **Centralize the dependency map.** Define the resource tags and mutation invalidations in one typed place. At minimum, hierarchy writes must invalidate affected hierarchy/descendant projections; ticket writes must invalidate ticket choices/lists/details and ticket-derived release/Agenda data; time-entry writes must invalidate Agenda and tracked-time/history/board projections; settings writes must invalidate settings and Agenda reads. Account for archive and delete effects, not just renames.
4. **Connect writes.** Update each successful mutation path to invalidate its declared resources exactly once after the server confirms success and before any navigation that could return to stale data. Preserve page-owned pending state and existing typed errors. Reuse or consolidate existing follow-up refreshes where appropriate; retain explicit “write succeeded, refresh failed” feedback and read-retry behavior from ADR 0024.
5. **Handle imperative search.** Review `GlobalSearch.vue`'s retained local results. On a relevant invalidation, refresh an open active query or clear its stale results so it cannot display records/labels that the mutation just changed. Do not add background search requests when the search is closed.
6. **Regression coverage.** Add a focused end-to-end test for the Agenda → ticket creation → Agenda flow using SPA navigation and assert the document did not reload. Add representative coverage for hierarchy rename/archive, ticket updates/status/archive, time-entry changes, settings, failed writes, and write-success/read-refresh-failure. Verify unrelated data is not repeatedly fetched if the selected tags permit asserting that economically.
7. **Review and closeout.** Add/index Proposed ADR 0051 only if implementation confirms the planned durable policy. Run focused and full verification against an isolated test database and an agent-owned app server; record exact commands, outcomes, manual checks, failures, and review evidence here before handoff.

## Files expected to change after approval

- `app/composables/useApiFetch.ts` remains the low-level SSR/Effect boundary; add a focused `app/composables/useAppApiFetch.ts` and/or `app/composables/useAppDataInvalidation.ts` for stable tagged app-data keys, active-reader registration, and targeted invalidation.
- Add explicit resource tags/keys to the current app-data read callsites: `app/pages/agenda.vue`, `app/pages/settings.vue`, `app/pages/clients/index.vue`, `app/pages/clients/[id]/index.vue`, `app/pages/clients/[id]/edit.vue`, `app/pages/projects/new.vue`, `app/pages/projects/[id]/index.vue`, `app/pages/projects/[id]/edit.vue`, `app/pages/releases/new.vue`, `app/pages/releases/[id]/index.vue`, `app/pages/releases/[id]/edit.vue`, `app/pages/tickets/index.vue`, `app/pages/tickets/new.vue`, `app/pages/tickets/[id]/index.vue`, and `app/components/TicketTimeEntries.vue`. Keep Better Auth's `useSession(useApiFetch)` on the existing untagged path.
- Client mutation surfaces: `app/pages/clients/new.vue`, `app/pages/clients/[id]/edit.vue`.
- Project mutation surfaces: `app/pages/projects/new.vue`, `app/pages/projects/[id]/edit.vue`.
- Release mutation surfaces: `app/pages/releases/new.vue`, `app/pages/releases/[id]/edit.vue`, `app/pages/releases/[id]/index.vue`.
- Ticket mutation surfaces: `app/pages/tickets/new.vue`, `app/pages/tickets/index.vue`, `app/pages/tickets/[id]/index.vue`.
- Time/settings mutation surfaces: `app/pages/agenda.vue`, `app/components/TicketTimeEntries.vue`, `app/pages/settings.vue`.
- `app/components/GlobalSearch.vue` — invalidate retained active search results, if the dependency audit confirms they can remain visible across a mutation.
- A focused unit test for the resource dependency/invalidation mapping and `tests/e2e/data-invalidation.test.ts` (or a comparably focused existing E2E file).
- `docs/decisions/0051-same-tab-api-data-invalidation.md` and `docs/decisions/README.md` — Proposed during implementation; accept only after human code review.
- This plan file — record approved feedback, implementation evidence, deviations, and review outcome.

No `PLAN.md`, server/API, schema, migration, dependency, or deployment changes are proposed.

## Reuse

- Reuse Nuxt `useFetch`/`useAsyncData` through the existing `useApiFetch` boundary; do not create a parallel data cache.
- Reuse `runClientRequest`, `runClientEffect`, and `refreshEffect` from `app/utils/client-effect.ts` for successful-write and refresh failure handling.
- Reuse existing page-local refresh/error patterns in Agenda, Tickets, Release detail, Settings, ticket detail, and `TicketTimeEntries.vue`; consolidate only where needed to avoid duplicate requests.
- Reuse authenticated E2E fixtures and API-backed setup/cleanup in the existing Agenda, ticket, hierarchy, search, and time-entry tests.

## Decisions and ADR links

- Approved direction from the conversation: same-tab in-app writes should invalidate all affected data; no page reload should be needed. This does not require cross-tab/device push or polling.
- Proposed implementation decision: use targeted resource/dependency invalidation rather than refetching all application data after every write. Validate the active-reader and unmounted-cache behavior against supported Nuxt APIs before implementation; do not use private internals or broaden global cache policy without renewed approval.
- ADR 0024 remains authoritative for Nuxt SSR/hydration ownership, safe typed failures, and write-success/read-refresh-failure semantics. ADR 0051 will add only the targeted same-tab invalidation policy and will not replace Nuxt's data layer.

## Implementation checklist

- [x] Human reviews and approves this plan in Plannotator before implementation.
- [x] Inventory read dependencies and mutation effects; finalize the resource-tag matrix without changing API/domain behavior.
- [x] Implement the smallest public-API-based mechanism that updates mounted reads and prevents stale inactive reads from being reused.
- [x] Connect all in-scope successful mutations and preserve existing partial-success/retry behavior without duplicate refreshes.
- [x] Cover retained global-search results where applicable.
- [x] Add unit and browser regressions, including the Agenda-to-new-ticket SPA-navigation reproduction and no-document-reload assertion.
- [x] Run focused checks, all approved local quality gates, and the complete Playwright suite; evidence is recorded below.
- [x] Human code review accepted; ADR 0051 accepted after review.

## Verification

- Unit tests for resource tags, mutation-to-resource mapping, and invalidation selection.
- Focused Playwright: reproduce stale Agenda ticket choices after in-app ticket creation; verify updated ticket/hierarchy data after representative writes; verify ticket archive/status and time-entry changes update their dependent views; verify failed writes do not invalidate and refresh failures remain partial successes.
- Assert SPA navigation preserves `performance.timeOrigin` for the primary regression, demonstrating that the fix does not rely on a document reload.
- Full required local checks: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test`, `pnpm build`, `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, `git diff --check`, and `pnpm exec playwright test --workers=1` with no retries or skips. Use the isolated-database and server lifecycle required by `docs/llm-workflow.md` / ADR 0050.
- Manual same-tab checks: create a ticket from a stale Agenda session; rename/archive hierarchy records and confirm dependent lists/selectors update on subsequent SPA navigation; verify status, time-entry, and settings changes are reflected without browser reload.

## Execution evidence

- **Database/server:** Migrated isolated PostgreSQL database `btt_same_tab2` in Docker on `127.0.0.1:55432`. The agent-owned Nuxt dev server ran on `127.0.0.1:3000`; `/api/health` returned 200 before the final full suite. It remained running through test diagnosis and verification, then was stopped after all checks passed; `lsof` confirmed port 3000 was released. The isolated database container was also stopped; port 55432 was released.
- **Focused browser verification:** All 5 tests in `tests/e2e/data-invalidation.test.ts` passed with `--workers=1 --retries=0`. After fixing navigation handlers to capture route destinations before invalidating the data those destinations depended on, the targeted archived-hierarchy deletion and release-completion navigation checks passed (3/3).
- **Full browser verification:** `CI=true DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/btt_same_tab2 PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 pnpm exec playwright test --workers=1 --retries=0` — 48 passed, 0 failed, 0 retried, 2.9 minutes. This includes the Agenda ticket-picker SPA regression and asserts navigation does not reload the document.
- **Quality gates on the implementation:** `pnpm format:check`, `git diff --check`, `pnpm lint`, `pnpm test` (15 files, 77 tests), `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and `pnpm build` all passed.
- **Manual verification:** The user reports manual testing looks good (2026-10-09); no specific manual steps were supplied. The same-tab scenarios and navigation behavior were also exercised by the full Playwright suite.
- **Failures and corrections:** During E2E diagnosis, navigation destinations in archived hierarchy deletion and release completion were found to be derived from reactive records after invalidation could clear them. The handlers now snapshot destinations before invalidation; targeted checks and the full suite pass. No scope deviations or follow-up implementation issues remain.

## Open questions

- None.

## Review status

- Plan review: Approved in Plannotator before implementation.
- Implementation: Complete; verification passed.
- Code review: Accepted by the human on 2026-10-09.
- Manual testing: The user reports it looks good.
- Milestone completion: Declared by the human on 2026-10-09; M38 Complete.
