# M11 — Effect for client-side fallible workflows

> **Status:** Complete (2026-09-27); approved scope implemented, verification recorded, code review accepted, and human completion declared.

## Context

M10 is complete. The approved umbrella plan, `plans/wide-app-composability-effect-pass.md`, names M11 as the client-side phase and deliberately defers its concrete Nuxt/Effect adapter and migration list to a separate reviewed milestone plan. ADR 0021 requires meaningful fallible client work to have typed errors and an explicit UI boundary; ADR 0023 established the matching safe-error policy for server requests.

Planning research facts:

- A read-only search (`rg -n 'useFetch|useAsyncData|\\$fetch|useSession|signIn\\.social|signOut|authClient\\.' app --glob '*.{ts,vue}'`) found Nuxt `useFetch` reads in Today, Settings, hierarchy list/detail/edit/create pages, ticket detail/time entries, login, dashboard layout, and auth middleware; `$fetch` mutations cover CRUD, status changes, time entries, links/relations, Settings, release completion, and search. `GlobalSearch.vue` has a debounced direct `$fetch` request.
- No application code under `app/` currently composes operations with Effect. Mutations mostly use local `try/catch`; some reads expose `useFetch.error`, while other failures are silently treated as empty/missing data or converted to 404. Several `refresh()` calls do not check Nuxt's `error` ref, so a failed refresh may look successful after a mutation.
- Specific gaps observed: primary detail read failures in client/project/release/ticket views can all become “not found”; some secondary reads (for example projects on client detail and ticket choices on ticket detail) lack a visible error state; list and detail pages do not consistently distinguish failed reads from empty results; Settings and some entry/ticket mutations can report success or close an editor after a failed refresh; Today and Tickets status moves already contain partial-success checks that must be retained.
- `login.vue` handles Better Auth's returned `result.error`, but a rejected `signIn.social` promise is not caught. Session reads use `authClient.useSession(useFetch)` in the login page, dashboard layout, and route middleware. The AccountMenu logout remains a native POST form to the existing server redirect endpoint.
- Installed versions are Nuxt 4.5.2, Effect 4.0.0-rc.117, and Better Auth 1.7.5. Installed Better Auth Vue declarations define a minimal Nuxt-compatible `SessionFetch` contract that accepts a fetch function and returns `data`/`error` refs (`node_modules/better-auth/dist/client/vue/index.d.mts`).
- Official Nuxt 4 docs specify that `useFetch` wraps `useAsyncData` and `$fetch`, transfers SSR results through the payload, and provides request deduplication, reactive watches, pending/error refs, refresh, and cancellation via `AbortSignal`. Official Effect v4 docs and the installed RC declarations cover `Effect.tryPromise`, typed failures, `Effect.runPromiseExit`, and `Exit`. Better Auth's Nuxt integration explicitly recommends `useSession(useFetch)` for cookie-forwarding SSR and hydration; its client docs describe both returned `{ data, error }` results and reactive session errors.
- There is no official Effect/Nuxt-specific integration recipe. The narrow local adapter below is therefore a proposed integration, not an upstream-prescribed Nuxt package or API.
- Planning checks: `pnpm check:workflow` passed. The worktree was clean before this milestone file was created. M10 records the previously passing full application checks; no application source was changed during M11 planning.

## Approved scope

**Approved by Plannotator on 2026-09-27:**

- Model all meaningful client-side application API reads, writes, refreshes, search requests, and the GitHub sign-in action with Effect v4 and typed failure values.
- Keep Nuxt's `useFetch` as the SSR/hydration and async-data lifecycle owner. Add a small Effect-aware fetch adapter which runs the API request through Effect while preserving current request keys, reactive URL/query behavior, payload hydration, deduplication, loading/error state, refresh, and cancellation signals.
- Add an explicit client-operation boundary for mutations and other imperative requests. It must handle typed API failures and defects without unhandled promise rejections, map expected API statuses to user-facing messages, and avoid exposing raw infrastructure/runtime causes.
- Make read failures visibly distinct from successful empty data across lists, details, forms, Today, Settings, ticket time entries, search, and auth UI. Preserve retry affordances where useful. A 404 remains a not-found outcome; non-404 infrastructure/network errors must not be presented as a missing record or empty success.
- Treat a successful write followed by a failed refresh as a partial success: say the write succeeded but the view could not refresh, offer a read retry, and do not invite repeating the write. Preserve existing status-move retry semantics and all existing pending/accessible feedback.
- Adapt `authClient.useSession(useFetch)` through the Effect-aware Nuxt fetch integration without removing Better Auth's cookie forwarding, SSR behavior, or hydration. Session verification failures must fail closed and must not be misclassified as an unauthenticated session redirect. Adapt GitHub social sign-in's returned `error` and rejected Promise into a typed, accessible failure while preserving the callback redirect.
- Keep pure, total view transformations and local state as ordinary Vue/TypeScript values. Preserve endpoint paths, methods, payloads, server error statuses/messages where intentional, successful navigation, domain rules, ownership, and archive behavior.
- Add focused unit and browser regression coverage for typed mapping, cause-safe user messages, SSR/session behavior, empty-vs-failed reads, action failures, partial-success refresh failures, search failures, and representative desktop/mobile accessible feedback.
- Propose a concise client Effect/Nuxt boundary ADR (next number: ADR 0024), have it reviewed/accepted before milestone closeout, and record the implementation evidence here.

## Out of scope

- Server/API/domain/database/schema/migration changes; changes to auth providers, auth configuration, authorization/session policy, cookies, or logout endpoint behavior.
- Replacing Nuxt `useFetch`/`useAsyncData` wholesale, adding an Effect/Nuxt dependency, introducing a generic state-management layer, or changing SSR/hydration semantics.
- Automatic retries, new caching policy, global telemetry, or broad visual redesign. Retry remains a user-controlled action where provided by the page.
- Replacing the native AccountMenu POST logout form with a client-side request. Its redirect and session invalidation remain owned by the existing server endpoint.
- Changes to data payloads, route paths, product/domain rules, or the M10 server Effect boundary.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- Approved umbrella plan: `plans/wide-app-composability-effect-pass.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`, completed `docs/milestones/m10-server-effect-reliability.md`
- ADR 0021 (Effect for meaningful fallible operations), ADR 0023 (safe server Effect/HTTP boundary)
- `.agents/skills/effect-development/SKILL.md`
- Effect v4 official docs: [Creating Effects](https://effect.website/docs/v4/getting-started/creating-effects), [Running Effects](https://effect.website/docs/v4/getting-started/running-effects), [Expected Errors](https://effect.website/docs/v4/error-management/expected-errors)
- Nuxt 4 official docs: [useFetch](https://nuxt.com/docs/4.x/api/composables/use-fetch), [createUseFetch](https://nuxt.com/docs/4.x/api/composables/create-use-fetch), [useAsyncData](https://nuxt.com/docs/4.x/api/composables/use-async-data)
- Better Auth official docs: [Nuxt integration](https://better-auth.com/docs/integrations/nuxt), [Client and error handling](https://better-auth.com/docs/concepts/client)
- Existing app implementations: `app/utils/`, `app/composables/`, `app/pages/`, `app/components/GlobalSearch.vue`, `app/components/TicketTimeEntries.vue`, `app/layouts/dashboard.vue`, `app/middleware/auth.ts`, `app/lib/auth-client.ts`
- Existing regression coverage: `tests/e2e/auth-shell.test.ts`, `tests/e2e/agenda.test.ts`, `tests/e2e/search.test.ts`, `tests/e2e/tickets.test.ts`, `tests/e2e/time-entries.test.ts`, `tests/unit/server-effect-handler.test.ts`, and `tests/nuxt/app.test.ts`

## Approach

1. **Effect request and failure types:** add a focused app-side helper (proposed `app/utils/client-effect.ts`) defining typed API/auth failures and an Effect request constructor around rejecting `$fetch` calls. Classify the server's intentional 400/401/404/409 responses separately from 5xx, network, and unexpected failures. Preserve an underlying cause only inside the failure for programmatic handling; public UI projection must use known safe server messages or a generic retryable message, never raw causes.
2. **Nuxt read adapter:** add a focused composable (proposed `app/composables/useApiFetch.ts`) using Nuxt's documented `createUseFetch` factory with an Effect-backed `$fetch` implementation. Forward all existing fetch options and abort signals. Keep `useFetch`'s payload, reactive query, key, dedupe, pending/error, and refresh contracts intact. Use this adapter for application-owned API reads and as the fetch function supplied to Better Auth's `useSession`; validate the adapter against the installed Nuxt and Better Auth types before migration.
3. **Imperative operation boundary:** run mutations, search, and sign-in Effects at their UI boundary using `Effect.runPromiseExit` (or an equivalently explicit runner) and translate failure/defect outcomes into a shared safe presentation type. Keep each page/component responsible for its own busy state, local validation, navigation, and accessible alert/status message. Compose dependent write-and-refresh workflows so refresh errors are handled distinctly from write errors.
4. **Failure-state consistency:** update list/detail/edit/new pages and reusable data components to show failed reads separately from successful empty results. Preserve valid primary data if only a secondary read fails, but show that secondary failure and provide a retry. Keep true API 404s as not-found; do not turn 5xx/network/session-provider failures into 404 or redirect them to login as if no session existed. For failed session verification, do not render protected content; surface a safe retryable service failure.
5. **Auth boundary:** retain Better Auth's official Nuxt session path and test that cookies/session state survive SSR and hydration. Convert both a returned social sign-in error and a rejected sign-in Promise into the same accessible login error path; preserve the current safe redirect. Keep native form logout unchanged.
6. **Incremental migration and tests:** migrate reads and actions by surface (hierarchy CRUD; tickets/relations/time; Today/board/Settings; search/auth), retaining existing component/page interaction ownership. Add Effect unit tests and Playwright network interception for expected/unexpected failures and partial refreshes; do not add test-only server/API hooks or alter production contracts.
7. **Durable record and closeout:** draft ADR 0024 if the final implementation confirms a durable adapter/error-projection rule; keep it Proposed until human review/acceptance. Update the approved umbrella plan's M11 completion status at closeout. No product roadmap or schema update is expected.

## Files to modify

- This milestone file and, at closeout, `plans/wide-app-composability-effect-pass.md`.
- New `app/utils/client-effect.ts` (typed request failures, API Effect constructors, safe UI projection).
- New `app/composables/useApiFetch.ts` (Effect-aware wrapper over Nuxt `useFetch`, preserving framework behavior).
- Application API read/action surfaces:
  - `app/pages/clients/index.vue`, `app/pages/clients/new.vue`, `app/pages/clients/[id]/index.vue`, `app/pages/clients/[id]/edit.vue`
  - `app/pages/projects/index.vue`, `app/pages/projects/new.vue`, `app/pages/projects/[id]/index.vue`, `app/pages/projects/[id]/edit.vue`
  - `app/pages/releases/new.vue`, `app/pages/releases/[id]/index.vue`, `app/pages/releases/[id]/edit.vue`
  - `app/pages/tickets/index.vue`, `app/pages/tickets/new.vue`, `app/pages/tickets/[id]/index.vue`, `app/pages/tickets/[id]/edit.vue`
  - `app/pages/today.vue`, `app/pages/settings.vue`, `app/components/TicketTimeEntries.vue`, `app/components/GlobalSearch.vue`
- Auth session/sign-in integration: `app/pages/login.vue`, `app/layouts/dashboard.vue`, `app/middleware/auth.ts`. `app/lib/auth-client.ts` only if the adapter needs a small typed wrapper; no auth configuration changes.
- Focused tests: new `tests/unit/client-effect.test.ts` and new `tests/e2e/client-effect-failures.test.ts` (or a similarly bounded suite); adjust existing auth, search, agenda, ticket, or time-entry tests only where needed to assert preserved behavior.
- Accepted ADR 0024 and its `docs/decisions/README.md` index entry.
- `.oxlintrc.json`, allowing Effect's `_tag` discriminant for the existing no-underscore rule.

No changes are planned to `server/`, `shared/`, `drizzle/`, dependencies/lockfiles, `AccountMenu.vue` logout form, or persisted data.

## Reuse

- Use the installed Effect v4 `Effect.tryPromise`, typed/tagged failures, `Effect.runPromiseExit`, and `Exit` patterns already used by `server/utils/effect-handler.ts` and `tests/unit/server-effect-handler.test.ts`; confirm every material API against the pinned RC declarations and the cited v4 docs.
- Wrap, rather than replace, Nuxt `useFetch` so SSR payload reuse, reactive options, deduplication, `pending`/`error`, refresh, and cancellation remain framework-owned. Forward Nuxt's signal through the Effect promise constructor to `$fetch`.
- Use Better Auth's official `useSession(useFetch)` Nuxt integration and typed Vue `SessionFetch` contract. Keep sign-in redirect handling in `login.vue` and native logout's existing server redirect.
- Reuse current page-level busy/error/status patterns and the established `UAlert`/`role="alert"`/`role="status"` accessibility approach. Preserve Today and board status-move behavior and existing form payloads.
- Extend the existing auth fixture and API-backed Playwright tests. Prefer `page.route` interception for deterministic client failures rather than adding server failure switches or dependencies.

## Decisions and ADR links

- ADR 0021 is authoritative: meaningful fallible client operations use Effect; pure values and local state do not.
- ADR 0023's safety principle applies in the UI: expected API outcomes stay distinguishable; network, server, defects, and unknown failures never masquerade as empty data or success, and raw infrastructure causes are not shown to the user.
- Decision (approved in the M11 plan): retain Nuxt `useFetch` as the SSR/hydration lifecycle boundary, inject the Effect adapter at its `$fetch` seam, and keep explicit UI runner boundaries for imperative actions.
- Decision (approved in the M11 plan): session-provider errors fail closed without redirecting to login as though the user were unauthenticated; mutation 401s show a safe sign-in/session message without silently retrying or changing auth policy.
- Decision (approved in the M11 plan): after a write succeeds, a later refresh failure is reported as a refresh problem and must not imply that the write failed or encourage duplicating it.
- Accepted ADR 0024, `docs/decisions/0024-effect-aware-client-fetch-boundary.md`, records the durable Nuxt/Effect client boundary and safe UI failure projection.

## Implementation checklist

- [x] Human approves this M11 plan via Plannotator before implementation.
- [x] Verify adapter compatibility with installed Nuxt `useFetch` and Better Auth's `SessionFetch`; add no dependency and retain SSR, hydration, pending/error, dedupe, reactive queries, refresh, and abort behavior.
- [x] Implement/test typed request failures and a safe Effect runner; expected HTTP errors remain distinguishable while unexpected errors/defects receive generic UI text.
- [x] Migrate all application API reads and imperative writes listed above, including direct search and GitHub sign-in; preserve local validation, request payloads, successful navigation, logout, and product/domain behavior.
- [x] Add visible failed-read/retry states so errors are never presented as successful empty data or false 404s; retain usable valid primary data when only secondary data fails.
- [x] Make post-write refresh failures explicit partial successes; preserve status-move retry semantics and prevent accidental duplicate writes.
- [x] Implement fail-closed session error decisions without an unauthenticated redirect, and render accessible feedback for GitHub sign-in result errors/rejections. Direct browser interception of the SSR session-failure path remains unverified; see the open test limitation below.
- [x] Add unit and browser failure-path regressions. Unit coverage maps 400/401/404/409, 5xx/network/defect, and cancellation; Playwright covers intercepted 503 list/detail/search/auth/action/refresh failures and authenticated SSR behavior. Direct session-provider outage and client network-abort browser tests are explicitly deferred and accepted by the human completion declaration (2026-09-27).
- [x] Run the verification commands below and record outcomes, manual checks, deviations, and follow-ups.
- [x] Human review/accept ADR 0024 and update its status to Accepted in the decision index.
- [x] Submit the complete diff for human code review; no changes were requested, and the human completion declaration is recorded below.

## Journal

### 2026-09-27 — M11 planning research

- Fact: M10 is marked complete and explicitly identifies client-side Effect integration as its separate follow-up; the approved umbrella plan authorizes planning only, not implementation.
- Fact: audited current API call sites with `rg -n 'useFetch|useAsyncData|\\$fetch|useSession|signIn\\.social|signOut|authClient\\.' app --glob '*.{ts,vue}'` and inspected Today, Tickets, GlobalSearch, auth, hierarchy CRUD, release/ticket details, Settings, and `TicketTimeEntries.vue`. Paths and observed gaps are recorded above.
- Fact: Nuxt 4's documented `useFetch` wraps `$fetch`/`useAsyncData` and owns SSR payload transfer, reactive request options, dedupe, loading/error refs, refresh, and abort behavior. Nuxt exposes a custom `$fetch` seam; the proposal keeps the surrounding framework composable unchanged.
- Fact: Nuxt 4.5.2 includes the documented `createUseFetch` factory (`node_modules/nuxt/dist/app/composables/fetch.d.ts`, introduced in 4.2) for custom `$fetch` defaults; use that typed factory rather than hand-reimplementing `useFetch` overloads.
- Fact: Better Auth's Nuxt docs require `useSession(useFetch)` to retain SSR cookie forwarding/payload hydration. Installed Vue declarations confirm the fetch-function contract can be checked at compile time. Better Auth client docs say actions return `{ data, error }`; the sign-in adapter must handle both that typed result and rejected promises.
- Fact: Effect's v4 creating/running/expected-error docs and installed `effect@4.0.0-rc.117` declarations support `Effect.tryPromise`, tagged typed failures, `Effect.runPromiseExit`, and `Exit`; there is no official Effect/Nuxt integration guide.
- Decision (proposed): use a small client adapter around Nuxt's `$fetch` seam, not a replacement data/state framework. Keep logout as the existing native form POST.
- Hypothesis/open question: a `useApiFetch` wrapper passed to Better Auth's `useSession` will satisfy its narrow contract while preserving Nuxt's call-context constraints; confirm with the Nuxt/tsgo typechecks and SSR/auth E2E before broad migration.
- Evidence: `pnpm check:workflow` passed. Initial git status was clean (`## main...origin/main`); no application source or plan files outside this M11 artifact were changed during research.

### 2026-09-27 — M11 plan approval

- Fact: the human approved `docs/milestones/m11-client-effect-workflows.md` via Plannotator (`decision: approved`).
- Decision: proceed within the approved client-side Effect scope. Preserve the specified Nuxt SSR/session behavior, fail-closed session-read handling, safe accessible error presentation, and write-success/read-refresh-failure distinction. No server, schema, dependency, or logout changes are authorized.
- Evidence: Plannotator returned `{"decision":"approved"}`.

### 2026-09-27 — M11 implementation and validation

- Fact: `app/utils/client-effect.ts` now defines tagged, safe client API failures, safe status projection, Effect-backed request/refresh execution, and a session decision helper. `app/composables/useApiFetch.ts` wraps Nuxt's documented `createUseFetch` seam rather than replacing Nuxt async-data behavior.
- Fact: the initial adapter called `createUseFetch` from a runtime function and triggered Nuxt's compiler-macro error. Calling the factory directly in the composable resolved it. A first SSR attempt also failed to forward Better Auth cookies; the adapter now uses `useRequestFetch()` server-side, and the authenticated-shell Playwright regression confirms the shell/session request works.
- Fact: API reads, imperative writes, settings/Today/ticket refreshes, search, and GitHub sign-in now use Effect-aware boundaries. User feedback distinguishes 404 from infrastructure failures, avoids false empty/not-found states, and keeps infrastructure causes private. Successful writes with failed refreshes are represented as partial success with read-retry paths.
- Fact: native logout remains unchanged. No server/API/domain/schema/dependency changes were made.
- Decision: keep `useFetch`/Better Auth session lifecycle and cancellation owned by Nuxt; the Effect-aware fetch is injected at the `$fetch` seam. A minimal `.oxlintrc.json` exception allows the standard Effect `_tag` discriminant without disabling the lint rule generally.
- Fact: the new failure E2E tests initially failed because a first intercepted 503 was followed by ofetch's configured GET retry, which then succeeded. The tests now hold the failure response until the explicit user retry; the settings scenario confirms the write succeeded and prevents repeating it. An existing status-move assertion was updated to expect generic safe feedback rather than the raw 503 response.
- Evidence: `pnpm format`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (12 files / 67 tests), `pnpm build`, `pnpm check:workflow`, and `git diff --check` passed. Full `pnpm exec playwright test --workers=1` passed all 20 tests.
- Open limitation: the protected route's Better Auth session read occurs during SSR, before `page.route` can intercept it. A browser test using Nuxt's client instance could not trigger the request because the app does not expose that instance. Middleware fail-closed branching is covered through `clientSessionDecision` unit tests, and successful authenticated SSR/cookie forwarding is covered by `auth-shell.test.ts`; direct session-outage browser coverage and client network-abort browser coverage are not yet present.
- Open question for review: accept those two browser-test gaps with the current unit/SSR coverage, or approve a bounded test seam/client-side trigger to exercise them. No test-only server hook was introduced.
- Manual: automated responsive/accessibility regressions passed; no separate manual desktop/mobile visual review or console/unhandled-rejection inspection was performed, and this limitation was accepted at closeout.

### 2026-09-27 — Human code review

- Fact: the human completed code review and requested no changes.
- Decision: code review is accepted for the current diff; no revisions were requested.
- Open: milestone closeout still requires explicit human completion declaration, ADR 0024 acceptance, and a decision on whether the documented session-outage/network-abort browser-test gaps are accepted or need more work.

### 2026-09-27 — Human completion declaration

- Fact: the human declared, “i hereby declare this milestone complete”.
- Decision: M11 is complete. The declaration accepts the documented direct session-provider-outage and browser network-abort E2E gaps as deferred follow-ups; current unit/SSR coverage and verification evidence remain as recorded above.
- Decision: ADR 0024 is accepted as part of M11 closeout and is now indexed as Accepted.

## Verification evidence

- `pnpm format` and `pnpm format:check`: passed; all matched source and documentation files are formatted.
- `pnpm lint`: passed with no diagnostics. `.oxlintrc.json` allows Effect's `_tag` discriminant for `no-underscore-dangle`; no other lint rule was changed.
- `pnpm typecheck` and `pnpm typecheck:tsgo`: passed.
- `pnpm test`: passed, 12 files / 67 tests.
- `pnpm build`: passed. Nuxt emitted only its informational plugin-timings warning.
- `pnpm check:workflow` and `git diff --check`: passed.
- `pnpm exec playwright test --workers=1`: passed, all 20 Chromium E2E tests. Includes 5 new intercepted failure-path tests plus authenticated SSR/session forwarding, status-move retry, Today, search, hierarchy, and time-entry regressions.
- Focused Effect unit coverage verifies 400/401/404/409 classification, safe 5xx/network/defect messages, cause privacy, cancellation-signal forwarding, refresh failure mapping, and fail-closed session decisions.
- Focused failure-path E2E coverage verifies list/detail read errors and retry, settings write-success/read-refresh-failure, search failure vs. no matches and retry, rejected GitHub sign-in, safe status-move feedback, and preservation of authenticated SSR behavior.
- Automated responsive behavior regressions passed as part of the Playwright suite. No separate manual visual/accessibility review was performed; this limitation was accepted at closeout.
- Deferred limitation, accepted by the human completion declaration: direct browser interception of a session-provider outage is not covered because `page.route` cannot intercept the protected route's SSR `useSession` request, and the app does not expose Nuxt's client instance to the test. The `clientSessionDecision` helper used by middleware has unit coverage for failed reads (including stale session data), while existing auth-shell E2E covers authenticated SSR/cookie forwarding. Browser network-abort coverage is also deferred; no test-only server hook or production change was added.

## Review status

- Umbrella plan review: Approved (2026-09-27); M11's separate plan and approval gate were satisfied.
- M11 plan review: Approved via Plannotator (2026-09-27).
- Code review: Accepted (2026-09-27); the human requested no changes.
- ADR 0024: Accepted (2026-09-27) and indexed.
- Milestone completion declaration: Recorded (2026-09-27).
- Implementation: Complete within the approved scope; the documented session-outage and network-abort browser tests were deferred by the human completion declaration.

## Follow-ups

- Any Nuxt/Effect integration limitation that cannot preserve SSR, hydration, request cancellation, or auth behavior must be recorded with evidence and returned to the human for approval before adopting an exception.
- Any auth/security, server API, schema, dependency, or workflow change discovered during implementation is outside this plan and requires a separate approved scope.
- Deferred validation follow-up accepted at M11 closeout (2026-09-27): direct session-provider-outage and browser network-abort E2E tests are not included. Existing unit and authenticated SSR coverage is recorded above. Revisit only in separately approved work; do not add a production/server test hook without approval.
- The approved umbrella plan's M11 status was updated at closeout (2026-09-27).

## Closeout checklist

- [x] Approved implementation checklist complete or explicitly deferred with human approval.
- [x] Verification evidence recorded.
- [x] Human code review accepted.
- [x] Human completion declaration recorded in the journal and review status.
