# M38 — Same-tab API data invalidation

## Context

Successful in-app mutations could leave mounted views and later SPA visits showing stale Nuxt async data. The primary reproduction was creating a ticket from an existing Agenda session, then returning to the Agenda time-entry picker without a document reload.

## Approved scope

Implement the scope in the Plannotator-approved focused plan [`plans/same-tab-api-data-invalidation.md`](../../plans/same-tab-api-data-invalidation.md): targeted same-tab invalidation after successful app writes, preserving Nuxt/Effect read ownership and existing write-success/read-refresh-failure behavior. This M38 journal records the implementation and closeout.

## Out of scope

- Polling, cross-tab/device synchronization, or external-writer freshness.
- API/server/schema/auth/dependency changes, a parallel client cache, private Nuxt internals, or broad cache-policy changes.
- Unrelated repository work. The pre-existing untracked `m37-project-consolidation-data-migration.md` remains untouched.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- ADR 0024 — `docs/decisions/0024-effect-aware-client-fetch-boundary.md`
- ADR 0050 — `docs/decisions/0050-e2e-verification-and-server-handoff.md`
- ADR 0051 — `docs/decisions/0051-same-tab-api-data-invalidation.md`
- Approved plan — `plans/same-tab-api-data-invalidation.md`

## Approach

- Define typed app-data resources and centralized mutation dependencies.
- Keep Nuxt async data as the read-state owner; tag app API reads with stable keys and resource dependencies, refresh matching active readers, and clear matching inactive cache entries through public Nuxt APIs.
- Invalidate only after successful writes, including dependent hierarchy, ticket, Agenda, settings, and retained-search projections.
- Add unit and browser regression coverage, particularly the Agenda ticket-picker SPA flow and failed-write/refresh-retry behavior.

## Files to modify

- Invalidation core: `app/composables/useAppDataInvalidation.ts`, `app/utils/app-data-resources.ts`.
- App read/mutation integrations: `app/pages/`, `app/components/GlobalSearch.vue`, `app/components/TicketTimeEntries.vue`.
- Tests: `tests/unit/app-data-resources.test.ts`, `tests/e2e/data-invalidation.test.ts`.
- Decision records and evidence: `docs/decisions/0051-same-tab-api-data-invalidation.md`, `docs/decisions/README.md`, `plans/same-tab-api-data-invalidation.md`, and this journal.

## Reuse

- `useApiFetch` and Nuxt `useFetch`/`useAsyncData` remain authoritative for read state.
- Existing `runClientRequest`, Effect error boundaries, page-owned refresh/retry handling, and authenticated Playwright fixtures are reused.

## Decisions and ADR links

- Targeted resource dependencies were chosen over refreshing all Nuxt data after each write.
- Matching active readers refresh; matching inactive cache entries are cleared so later SPA navigation fetches fresh data.
- Global Search refreshes relevant open results and clears stale closed results without background requests.
- ADR 0051 is Accepted after human code review. ADR 0024 remains authoritative for Nuxt/Effect and partial-success semantics.

## Implementation checklist

- [x] Human approved the focused plan before implementation.
- [x] Audit read dependencies and map successful mutations to affected resources.
- [x] Implement public-API-based invalidation while retaining Nuxt/Effect ownership.
- [x] Connect successful mutation paths and retained Global Search results.
- [x] Add resource-mapping unit tests and same-tab E2E regressions.
- [x] Pass all approved local checks and the full Playwright suite with no retries or skips.
- [x] Human code review accepted; no changes requested.
- [x] Human reports manual testing looks good.
- [x] Record the human completion declaration and accept ADR 0051.

## Journal

### 2026-10-09 — Implementation and closeout

- Fact: centralized resource tags and mutation dependencies drive targeted invalidation of app-owned reads after successful in-tab writes. Nuxt remains the read-state owner; no server/API/schema/dependency changes were made.
- Fact: hierarchy deletion and release-completion handlers now capture navigation destinations before invalidation can clear the reactive data used to derive those destinations.
- Fact: the focused invalidation E2E file passed 5/5. Targeted archived-hierarchy and release-completion navigation regressions passed 3/3 after the navigation fix. The ticket/time-entry flow was measured at 46.5s and received a bounded 60s test-specific timeout; no global timeout changed.
- Fact: the final full Playwright run passed 48/48 tests with `--workers=1 --retries=0`; the Agenda picker regression asserts SPA navigation does not reload the document.
- Fact: formatting, lint, unit tests (15 files / 77 tests), both typechecks, workflow/documentation checks, build, and diff checks passed. Exact commands and environment are recorded under Verification.
- Fact: isolated PostgreSQL database `btt_same_tab2` was migrated. The agent-owned Nuxt server stayed available through diagnosis and final tests; after all checks passed it was stopped and port 3000 was verified released. The isolated Docker database container was also stopped; port 55432 was verified released.
- Decision: ADR 0051 is Accepted following human code review.
- Human review and completion: “code review looks good, manual testing looks good. i declare this milestone complete.” Recorded 2026-10-09.
- Decision: recorded this task as M38 because the separate, pre-existing untracked `m37-project-consolidation-data-migration.md` already occupies M37; it was left untouched.

## Verification

- [x] `pnpm format:check` — passed.
- [x] `pnpm lint` — passed.
- [x] `pnpm typecheck` — passed.
- [x] `pnpm typecheck:tsgo` — passed.
- [x] `pnpm test` — 15 files, 77 tests passed.
- [x] `pnpm build` — passed.
- [x] `pnpm check:workflow` and `node scripts/check-workflow-docs.mjs` — passed.
- [x] `git diff --check` — passed.
- [x] Focused invalidation E2E: `CI=true DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/btt_same_tab2 PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 pnpm exec playwright test tests/e2e/data-invalidation.test.ts --workers=1 --retries=0` — 5 passed.
- [x] Full E2E: `CI=true DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/btt_same_tab2 PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 pnpm exec playwright test --workers=1 --retries=0` — 48 passed, 0 failed, 0 retried, 0 skipped (2.9 minutes).
- [x] Manual verification: user reports that manual testing looks good; detailed steps were not supplied.
- [x] Server handoff: agent-owned server stopped after checks passed; `lsof` confirmed port 3000 released.

## Review status

- Plan review: Approved in Plannotator before implementation.
- Code review: Accepted by the human on 2026-10-09; no changes requested.
- Milestone completion declaration: Received from the human on 2026-10-09; M38 Complete.

## Follow-ups

- None.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred.
- [x] Verification evidence recorded.
- [x] Human code review accepted.
- [x] Human completion declaration recorded in the journal and review status.
