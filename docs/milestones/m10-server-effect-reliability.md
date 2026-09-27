# M10 — Effect for server-side fallible operations

> **Status:** Complete — human plan and code reviews accepted, ADR 0023 accepted, verification passed, and the human completion declaration recorded (2026-09-27).

## Context

M9 is complete. The approved umbrella plan, `plans/wide-app-composability-effect-pass.md`, separates the Effect pass into M10 server operations and M11 client workflows. ADR 0021 requires meaningful fallible operations to use Effect with typed expected failures and explicit boundaries; pure, total helpers remain ordinary functions.

Pre-implementation facts:

- There are 35 files under `server/api/`: 34 application-owned handlers plus Better Auth's catch-all handler. The application handlers cover hierarchy CRUD, tickets/links/relations, time entries, agenda, settings, search, and logout.
- Drizzle queries/transactions and Better Auth session/logout calls currently run as Promises in handlers/domain helpers. Rejections generally bubble to Nitro without a consistent application-level error policy.
- `server/domain/decode.ts` is the only production place currently running an Effect. It catches every rejection and maps it to HTTP 400, so an unexpected decoder/runtime failure can be misreported as invalid input.
- `server/domain/errors.ts` already defines `ValidationError`, `UnauthenticatedError`, `NotFoundError`, and `ConflictError`, but current helpers convert them immediately to H3 errors rather than composing typed failures.
- Legacy validation helpers in `server/utils/domain-validation.ts`, most of the matching wrappers in `server/utils/domain.ts`, and `server/utils/validate-duration.ts` have no production call sites. Their remaining references are tests or other unused helpers. Confirm references again before removal or consolidation.
- `server/domain/tickets.ts` imports the pure URL validator from `app/utils/ticket-url.ts`. Nuxt's server-directory guidance says not to import app-only utilities into server code; the validator is a candidate to move to `shared/` without behavior changes.
- Existing owner scoping, archive visibility, status rules, time-entry overlap locking, transaction behavior, and successful response payloads are covered by the current API/E2E suites and must remain unchanged.
- The application uses Effect `4.0.0-rc.117`, Nuxt `4.5.2`, Nitro `2.13.4`, and H3 `1.15.11`. The installed H3 declarations accept `status`/`statusText`; current Nuxt 4 server docs document `createError` with those fields. The current H3 online guide is for H3 v2 and is not the API authority for this installed H3 v1.

## Approved scope

The following scope is approved for M10:

- Convert meaningful fallible work in the application-owned server handlers and domain helpers to Effect v4, including request-body decoding, query/parameter validation, domain rules, session lookups, Drizzle reads/writes/transactions, and the custom logout operation.
- Compose validation, expected domain failures, and infrastructure operations in typed Effect channels. Preserve the original cause on rejected database/auth/runtime operations for server-only diagnostics.
- Add one shared Effect-aware handler boundary. Map expected validation, unauthenticated, not-found, and conflict failures to the existing HTTP status contract (400, 401, 404, 409). Map infrastructure failures, defects, and otherwise-unclassified failures to a safe 5xx response; never return raw causes or convert infrastructure failures to 4xx/success.
- Keep success payloads, routes, status semantics, owner-scoped SQL, archive behavior, domain rules, and transaction/locking guarantees unchanged. Preserve useful existing client-facing error messages where they are intentional.
- Consolidate/remove the confirmed-unused competing validation helpers and their obsolete tests after a fresh reference check. Keep relevant domain validation covered through the active schema/rule paths.
- Move the pure external-URL validator to `shared/` if required to remove the existing app-to-server utility import; preserve its accepted URLs, normalized output, and validation message.
- Add focused unit/API regression coverage for each expected error class, unexpected rejected promises/causes, sanitized 5xx behavior, and preserved API contracts.
- Document the durable server Effect/HTTP boundary in a new ADR (proposed ADR 0023), reviewed and accepted before M10 closeout.

## Out of scope

- M11 client-side Effect migration, Vue/UI loading and feedback changes, or changes to client request handling.
- Changes to route paths, success payloads, authorization policy, ownership filters, schema/storage, product rules, authentication configuration, dependencies, deployment, or database migrations.
- Wrapping pure, total calculations and static values in Effects.
- Replacing Better Auth's `server/api/auth/[...all].ts` catch-all or changing Better Auth's own HTTP contract. Its session lookup used by application APIs is in scope; Better Auth's handler remains library-owned.
- Changing `server/db/index.ts` startup configuration behavior. Missing database configuration remains a fail-fast process-startup error, not a request-level Effect failure.
- Broad service-layer restructuring or unrelated cleanup.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- Approved umbrella plan: `plans/wide-app-composability-effect-pass.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`, completed `docs/milestones/m9-shared-card-composition.md`
- ADR 0002 (Effect baseline; only the Effect-use guidance is superseded), ADR 0005 (validation and expected errors), ADR 0021 (meaningful fallible operations)
- `.agents/skills/effect-development/SKILL.md`
- Effect v4 official guidance: [Creating Effects](https://effect.website/docs/v4/getting-started/creating-effects), [Running Effects](https://effect.website/docs/v4/getting-started/running-effects), [Expected Errors](https://effect.website/docs/v4/error-management/expected-errors), [Schema decoding](https://effect.website/docs/v4/schema/getting-started)
- Nuxt 4 official [server directory guidance](https://nuxt.com/docs/4.x/directory-structure/server), including its shared handler-wrapper pattern and server error-handling behavior. Installed H3 v1 declarations: `node_modules/.pnpm/h3@1.15.11/node_modules/h3/dist/index.d.ts`.
- Existing behavior/tests: `server/domain/{decode,errors,schemas,tickets,time-entries}.ts`, `server/utils/{domain,domain-validation,auth,validate-duration}.ts`, active `tests/unit/{domain-schemas,tickets,time-entry}.test.ts`, and `tests/e2e/{agenda,search,tickets,time-entries}.test.ts`. The unused domain/duration validator tests were removed after reference checks.

## Pre-migration contract inventory

The following contracts were checked against the pre-migration handlers and existing tests. Shared errors remain: invalid bodies/queries/required parameters use 400; no session uses 401 (`UnauthenticatedError`); missing or owner-hidden records use 404 with the route's existing message; conflicts use 409 with the existing message. Rejected Auth/Drizzle operations are server failures, not domain errors. Success payloads and side effects are listed per route:

| Application-owned route                         | Success payload / side effect                                               | Preserved access and domain behavior                                                                                                                 |
| ----------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/agenda`                               | `{ entries, trackedMinutes }`                                               | Authenticated; date required; only owner's entries; relation/link context and archive flags included in agenda rows.                                 |
| `POST /api/logout`                              | Redirect to `/login` after sign-out                                         | Sign-out must complete before redirect; auth catch-all remains separate.                                                                             |
| `GET /api/search`                               | `{ clients, projects, releases, tickets, timeEntries }`                     | Authenticated, owner-scoped, active hierarchy only, bounded result counts; query under 2 chars returns empty lists.                                  |
| `GET /api/clients`                              | `{ clients }` with active-child counts                                      | Own clients; either `archived=true` or `archived=all` controls client archive visibility.                                                            |
| `POST /api/clients`                             | Created client row                                                          | Authenticated; schema validation; default color and timestamps preserved.                                                                            |
| `GET /api/clients/:id`                          | Client row                                                                  | Owner-scoped; archived client visible only with archive query.                                                                                       |
| `PATCH /api/clients/:id`                        | Updated client row                                                          | Owner-scoped; schema validation; non-empty patch required; archive timestamp behavior retained.                                                      |
| `DELETE /api/clients/:id`                       | `{ deleted: true }`                                                         | Owner-scoped; must be archived and have no child projects; otherwise existing 404/409 message.                                                       |
| `GET /api/projects`                             | `{ projects }` with active-child counts                                     | Owner-scoped through client; archived clients remain excluded; archive query controls project visibility.                                            |
| `POST /api/projects`                            | Created project row                                                         | Requires an owned active client; schema validation.                                                                                                  |
| `GET /api/projects/:id`                         | Project plus client name/archive context                                    | Owner-scoped; archive query controls project/client visibility.                                                                                      |
| `PATCH /api/projects/:id`                       | Updated project row                                                         | Owner-scoped; schema validation; non-empty patch required; existing archive behavior retained.                                                       |
| `DELETE /api/projects/:id`                      | `{ deleted: true }`                                                         | Owner-scoped; must be archived and have no releases; otherwise existing 404/409 message.                                                             |
| `GET /api/releases`                             | `{ releases }` with ticket counts                                           | Owner-scoped through active client/project; archive query controls release visibility; archived ancestors remain excluded.                           |
| `POST /api/releases`                            | Created release row                                                         | Requires an owned active project; schema validation; nullable target-date default retained.                                                          |
| `GET /api/releases/:id`                         | Release plus project presentation/archive context                           | Owner-scoped; archive query controls release and ancestor visibility.                                                                                |
| `PATCH /api/releases/:id`                       | Updated release row                                                         | Owner-scoped; schema validation; non-empty patch required; target-date/archive behavior retained.                                                    |
| `DELETE /api/releases/:id`                      | `{ deleted: true }`                                                         | Owner-scoped; release must be archived; existing delete behavior retained.                                                                           |
| `GET /api/settings`                             | Stored settings or `{ userId, ...defaultAgendaSettings }`                   | Authenticated and user-scoped.                                                                                                                       |
| `PATCH /api/settings`                           | Upserted settings row                                                       | Authenticated and user-scoped; schema plus agenda-window/workday validation.                                                                         |
| `GET /api/tickets`                              | `{ tickets }`, each with tracked minutes, active related tickets, and links | Owner-scoped; active client/project/release required; archive query controls ticket visibility; optional release filter retained.                    |
| `POST /api/tickets`                             | Created ticket row                                                          | Requires owned active release; validates linked URLs/related IDs; rejects duplicate relations; transactional ticket/link/relation creation retained. |
| `GET /api/tickets/:id`                          | `{ ticket, hierarchy, links, related }`                                     | UUID ticket ID; owner-scoped; archive query controls ticket/ancestor visibility; related archived targets remain hidden.                             |
| `PATCH /api/tickets/:id`                        | Updated ticket row                                                          | UUID and owner-scoped; schema/non-empty patch validation; changed release must be owned and active.                                                  |
| `DELETE /api/tickets/:id`                       | `{ deleted: true }`                                                         | UUID and owner-scoped; ticket must be archived and have no tracked time; link/relation/ticket deletions remain transactional.                        |
| `POST /api/tickets/:id/links`                   | Created link row                                                            | UUID and owner-scoped; existing visibility rule permits link management for archived tickets; URL validation retained.                               |
| `PATCH /api/tickets/:id/links/:linkId`          | Updated link row                                                            | Parent owner-scoped; link ID validated and scoped to parent; non-empty patch and URL validation retained.                                            |
| `DELETE /api/tickets/:id/links/:linkId`         | `{ deleted: true }`                                                         | Parent owner-scoped; link deletion scoped to parent; missing link remains 404.                                                                       |
| `POST /api/tickets/:id/relations`               | Created relation row                                                        | Owner-scoped; archived source may manage relations, target must be visible/active; self/duplicate relations remain 409.                              |
| `DELETE /api/tickets/:id/relations/:relationId` | `{ deleted: true }`                                                         | Parent owner-scoped; relation ID and parent scope checked; missing relation remains 404.                                                             |
| `GET /api/time-entries`                         | `{ entries, trackedMinutes }`                                               | Authenticated; requires an owned UUID ticket; date/start ordering retained.                                                                          |
| `POST /api/time-entries`                        | Created time-entry row                                                      | Requires a writable, active owned ticket; date/30-minute slot rules and owner-row locking/overlap rejection retained.                                |
| `PATCH /api/time-entries/:id`                   | Updated time-entry row                                                      | Entry owner-scoped; non-empty patch; changed ticket must be writable; overlap check excludes this entry and serializes writes.                       |
| `DELETE /api/time-entries/:id`                  | `{ deleted: true }`                                                         | Entry owner-scoped; existing delete behavior retained.                                                                                               |

Special expected status messages remain unchanged: ticket/link/entry UUID validation is `Invalid identifier`; archive deletion guards say to archive the record first; parent-child guards require deleting children first; archived work cannot receive new entries; overlapping entries report `Time entries cannot overlap`. Schema/query-specific validation messages remain at 400. The common boundary maps only expected typed failures to these statuses and never exposes rejected operation causes.

## Approach

1. Recheck the current route/error inventory and record status/message contracts before edits. Keep the Better Auth catch-all and database startup behavior outside the request boundary.
2. Add typed infrastructure failures that retain their original `cause`; keep the existing four expected error categories or refine them only if their HTTP mapping remains explicit. Use `Schema.decodeUnknownEffect` for schema decoding and `Effect.tryPromise` (with a deliberate typed mapping) for rejectable Promise APIs such as Drizzle and Better Auth. Keep pure validations/calculations as values; convert only their failure result into typed domain errors.
3. Add a shared `defineEffectHandler`-style adapter around application-owned routes. Build route work as Effects and run it at that edge. The adapter maps expected tags to the current HTTP status contract; unclassified failures are logged with useful server-only cause/context and returned as a generic safe 5xx. Do not use a Nitro error hook as a response-rewriting mechanism: Nuxt documents a wrapper pattern, while the Nitro error hook is for observation/logging.
4. Migrate handlers in reviewable groups: clients/projects/releases and settings; tickets, links, and relations; time entries, agenda, and search; then logout. Preserve each current owner-scoped query, transaction, archive rule, and response shape. No handler should turn a failed query into an empty successful result.
5. Consolidate unused validation helpers only after checking every production/test reference. Move the URL validator to `shared/` only if it remains needed by both layers, and keep its behavior unchanged.
6. Add focused Effect-boundary tests, retain/extend existing API regression tests, and add an ADR for the final boundary/error mapping. Record actual changes, verification, deviations, and review outcomes here.

## Files to modify

- This milestone file.
- New `server/utils/effect-handler.ts` (or equivalent single-purpose server boundary helper).
- `server/domain/errors.ts`, `server/domain/decode.ts`, `server/domain/tickets.ts`, `server/domain/time-entries.ts`, `server/utils/domain.ts`, and `server/domain/schemas.ts` as needed for typed request/domain operations.
- Application-owned API handlers:
  - `server/api/agenda/index.get.ts`, `server/api/logout.post.ts`, `server/api/search.get.ts`
  - `server/api/clients/index.get.ts`, `server/api/clients/index.post.ts`, `server/api/clients/[id].get.ts`, `server/api/clients/[id].patch.ts`, `server/api/clients/[id].delete.ts`
  - `server/api/projects/index.get.ts`, `server/api/projects/index.post.ts`, `server/api/projects/[id].get.ts`, `server/api/projects/[id].patch.ts`, `server/api/projects/[id].delete.ts`
  - `server/api/releases/index.get.ts`, `server/api/releases/index.post.ts`, `server/api/releases/[id].get.ts`, `server/api/releases/[id].patch.ts`, `server/api/releases/[id].delete.ts`
  - `server/api/settings/index.get.ts`, `server/api/settings/index.patch.ts`
  - `server/api/tickets/index.get.ts`, `server/api/tickets/index.post.ts`, `server/api/tickets/[id].get.ts`, `server/api/tickets/[id].patch.ts`, `server/api/tickets/[id].delete.ts`
  - `server/api/tickets/[id]/links/index.post.ts`, `server/api/tickets/[id]/links/[linkId].patch.ts`, `server/api/tickets/[id]/links/[linkId].delete.ts`
  - `server/api/tickets/[id]/relations/index.post.ts`, `server/api/tickets/[id]/relations/[relationId].delete.ts`
  - `server/api/time-entries/index.get.ts`, `server/api/time-entries/index.post.ts`, `server/api/time-entries/[id].patch.ts`, `server/api/time-entries/[id].delete.ts`
- Remove or consolidate only after the reference check: `server/utils/domain-validation.ts`, `server/utils/validate-duration.ts`, and unused legacy wrappers in `server/utils/domain.ts`.
- If relocating URL validation: new `shared/ticket-url.ts`, remove/replace `app/utils/ticket-url.ts`, and update imports/tests.
- Tests: new focused `tests/unit/server-effect-handler.test.ts`; update `tests/unit/tickets.test.ts`; retain active schema/time-entry unit suites and existing `tests/e2e/agenda.test.ts`, `tests/e2e/search.test.ts`, `tests/e2e/tickets.test.ts`, and `tests/e2e/time-entries.test.ts` for API outcomes. Remove the confirmed-unused `tests/unit/domain-validation.test.ts` and `tests/unit/validate-duration.test.ts`.
- Proposed ADR 0023 and its index entry in `docs/decisions/README.md`.

No changes are planned to `server/api/auth/[...all].ts`, `server/db/schema.ts`, `server/db/index.ts`, `server/utils/auth.ts`, auth configuration, dependencies, or stored data.

## Reuse

- Effect v4 `Data.TaggedError`, `Schema.decodeUnknownEffect`, `Effect.tryPromise`, and a runner at the application-owned HTTP boundary, verified against the installed `4.0.0-rc.117` package and official v4 docs before implementation.
- Existing expected errors in `server/domain/errors.ts`; request codecs in `server/domain/schemas.ts`; pure date/slot/overlap functions in `shared/time-entry.ts`.
- Existing route patterns for owner-scoped reads/writes, archive visibility, ticket relation/link operations, and overlap-safe `db.transaction` in `server/domain/time-entries.ts`.
- Existing unit suites and Playwright API fixtures/assertions in `tests/unit/` and `tests/e2e/`; extend these rather than creating duplicate domain fixtures.
- Nuxt's documented shared event-handler wrapper pattern rather than a response-rewriting Nitro plugin.

## Decisions and ADR links

- ADR 0021 is authoritative: use Effect for meaningful fallible work, not pure/total calculations.
- Preserve the HTTP contract: validation 400, unauthenticated 401, owner-hidden/not-found 404, domain conflict 409. Unexpected database/auth/runtime failures remain distinct, retain causes for server diagnostics, and return safe 5xx responses.
- Decision: one reusable Effect-aware event-handler wrapper is the response-mapping boundary for app-owned endpoints. Better Auth's catch-all remains library-owned.
- ADR 0023 records the server-side typed-error and HTTP mapping contract; accepted in the human review.
- No scope decision authorizes changes to ownership, auth policy, schema, dependencies, or domain behavior.

## Implementation checklist

- [x] Human approves this M10 plan via Plannotator before implementation.
- [x] Reconfirm and record every application-owned API handler, its success shape, expected status/message, and current auth/owner/archive/transaction behavior in the contract inventory above.
- [x] Implement and unit-test the shared typed Effect-to-HTTP boundary, including expected mappings, safe 5xx projection, and server-only original-cause diagnostics.
- [x] Convert body/query/parameter decoding, domain validation/rules, session lookups, and Drizzle operations to typed Effects without losing expected vs unexpected failure distinctions.
- [x] Convert all in-scope handlers while retaining response payloads, owner scope, archive semantics, transaction atomicity, time-entry serialization/overlap checks, and logout redirect behavior.
- [x] Remove/consolidate confirmed-unused validation helpers, and relocate the pure URL validator only if needed to remove the server-to-app import; verify equivalent tests and behavior.
- [x] Add regression coverage for expected 400/401/404/409 failures and rejected database/session operations; assert unexpected causes are omitted from the public failure projection and remain available to server diagnostics.
- [x] Add ADR 0023, have it reviewed and accepted, and update the decision index.
- [x] Run all verification commands below; document results, deviations, and focused error-boundary checks.
- [x] Submit the full diff for human code review; Plannotator approved with no changes requested.
- [x] Record the human completion declaration before closing M10.

## Journal

### 2026-09-27 — M10 planning research

- Fact: reviewed the workflow, roadmap, accepted ADR 0021, umbrella plan, M9 record, milestone template, and Effect development skill. M10 is explicitly a separate server-side phase; M11 client migration remains out of scope.
- Fact: inventoried 35 API handler files, 34 application-owned. The Better Auth catch-all is distinct from the custom logout handler and session lookup helper. Route families and current failure cases are enumerated in Files to modify and Approach.
- Fact: current `decodeBody` runs an Effect then catches every rejection as 400. Domain helper errors are converted directly to H3 errors, and Drizzle/Auth promises are not composed through a common Effect boundary.
- Fact: `domain-validation.ts` and `validate-duration.ts` have no production call sites; legacy wrappers and `bodyOf` in `domain.ts` are not used by routes. `ticket-url.ts` is only imported by server code and tests, not app UI.
- Fact: official Effect v4 references document `Schema.decodeUnknownEffect`, tagged expected failures, `Effect.tryPromise` for rejecting Promises, and running Effects at a boundary. Nuxt 4 server docs show a wrapper pattern for shared handler behavior. Installed H3 is v1.15.11; its declarations support the status fields in use, so H3 v2 online examples are not used as implementation guidance.
- Decision: use one shared app-owned handler wrapper for explicit HTTP error translation; keep Better Auth's catch-all unchanged. Map no session to 401, but rejected session/database operations to safe 5xx with server-only causes.
- Decision: the human confirmed M10 should remain one milestone covering all 34 app-owned handlers; do not split the server migration into additional milestones.
- Evidence: baseline checks passed before implementation: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (12 files/54 tests), `pnpm check:workflow`, `git diff --check`, `pnpm exec playwright test --workers=1` (15 tests), and `pnpm build`. Build completed with the existing non-failing Vite `PLUGIN_TIMINGS` advisory. No application source was changed.

### 2026-09-27 — M10 plan approval

- Fact: the human approved `docs/milestones/m10-server-effect-reliability.md` via Plannotator (`decision: approved`) after confirming the entire server migration should remain one milestone.
- Decision: M10 may proceed within this approved scope; M11 remains separate. Implementation may begin.

### 2026-09-27 — M10 implementation

- Fact: added schema-backed tagged server failures, a shared Effect-aware event-handler boundary, Promise adapters for rejecting infrastructure operations, typed body/query/ID decoding, and a typed session lookup. Converted all 34 application-owned handlers; Better Auth's catch-all remains unchanged.
- Fact: preserved the existing transaction and owner-row lock in time-entry writes. The overlap decision now returns an internal transaction outcome and raises the typed conflict after the transaction resolves, with no writes made on the conflict path.
- Fact: removed the confirmed-unused legacy domain and duration validators. Moved the pure HTTP(S) URL validator from `app/utils/` to `shared/` without changing validation behavior.
- Fact: drafted ADR 0023 as Proposed and added it to the decision index; human decision-record review remains pending.
- Fact: an initial boundary-test attempt imported H3 directly in Vitest, where H3 is a transitive dependency and not resolvable as a root import. Extracted the typed failure classifier and HTTP-safe projection to an H3-independent domain helper instead of adding a dependency. A first native typecheck also caught an overly broad optional `cause` union member; tightened the discriminated union and both typechecks then passed.
- Fact: final route inventory found 35 API handler files: all 34 application-owned handlers use `defineEffectHandler`, and the one direct Nitro handler is Better Auth's excluded catch-all. No remaining imports of the removed validators or old app URL utility were found; no dependency or schema changes were made.
- Evidence: formatting, lint, both typechecks, unit tests (11 files/52 tests), workflow structure checks, diff checks, all 15 Playwright tests, and the production build passed. The build emitted the existing non-failing Vite `PLUGIN_TIMINGS` advisory. Boundary unit tests verify 400/401/404/409 mappings, absent vs rejected session lookup, rejected Promise cause retention, safe public 500 projection, and server-only diagnostics.

### 2026-09-27 — M10 code review

- Fact: Plannotator reviewed the full working diff and returned `decision: approved` with no changes requested.
- Decision: accept ADR 0023 as the durable server Effect/HTTP boundary decision and update its status and index.

### 2026-09-27 — M10 completion declaration

- Fact: the human declared, “i hereby declare this milestone complete.”
- Decision: mark M10 complete. All approved checklist items, verification evidence, human code review, and ADR acceptance are recorded above.

## Verification

Planning baseline (pre-implementation):

- [x] `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, and `pnpm typecheck:tsgo` — passed.
- [x] `pnpm test` — 12 files, 54 tests passed.
- [x] `pnpm exec playwright test --workers=1` — 15 tests passed.
- [x] `pnpm build` — passed; emitted a non-failing `PLUGIN_TIMINGS` advisory.
- [x] `pnpm check:workflow` and `git diff --check` — passed.

Implementation verification (complete; human completion declaration recorded):

- [x] Unit coverage maps typed validation/auth/not-found/conflict failures; distinguishes no session from rejected session lookup; checks typed rejected-Promise cause retention, safe generic 5xx projection without a `cause` field, and server diagnostic logging.
- [x] Existing API Playwright coverage passed for validation (400), unauthenticated requests (401), owner-hidden/missing records (404), domain conflicts/overlap (409), and ticket/time-entry transaction and concurrency behavior. Success-payload and hierarchy/archive workflows also passed.
- [x] `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (11 files/52 tests), `pnpm exec playwright test --workers=1` (15 tests), `pnpm build`, `pnpm check:workflow`, and `git diff --check` all passed. Build emitted the existing non-failing `PLUGIN_TIMINGS` advisory.
- [x] Focused boundary inspection/tests verified the public 500 descriptor contains only `status`/generic `statusText`, while the unexpected Effect cause is passed to the server-only logger. No injected database failure was sent through a live HTTP endpoint; Promise rejection, classification, public projection, and diagnostics were verified at unit level.

## Review status

- Plan review: Approved via Plannotator (2026-09-27); one-milestone scope confirmed directly in chat.
- Code review: Approved via Plannotator; no changes requested.
- ADR 0023: Accepted via the approved Plannotator code review.
- Milestone completion declaration: Complete; declared by the human via chat on 2026-09-27.
- Implementation: Complete within approved scope.

## Follow-ups

- M11 client-side Effect integration remains a separate plan and approval gate.
- Any server route that cannot retain its framework contract through the shared Effect boundary must be documented with evidence and receive explicit approval for an exception.
- Keep all 34 application-owned handlers within this single approved M10; any scope change still requires explicit approval and an updated plan.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred with human approval.
- [x] Verification evidence recorded.
- [x] Human code review accepted.
- [x] Human completion declaration recorded in the journal and review status.
