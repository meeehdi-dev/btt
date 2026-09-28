# M15 — API item ordering

> **Status:** Complete; declared by the human on 2026-09-28.

## Context

M14 documented that changing a ticket updates `updatedAt`, and `/api/tickets` sorts by `updatedAt DESC`; this makes a ticket move in Release detail after a status update. M14 deferred the broader fix to a separate milestone. A status audit found the same recency ordering in client, project, and release collection APIs and in the corresponding categories of global search. It also found unordered nested ticket links/relations in ticket detail, unlike the deterministic nested ordering from the ticket list API.

The user reviewed the status report in Plannotator and provided the ordering direction captured below. The milestone plan was approved via Plannotator on 2026-09-28. Implementation evidence and review status are recorded in the journal below.

## Approved scope

**Approved via Plannotator on 2026-09-28.**

- Replace `updatedAt` sorting for client collections with `createdAt DESC` (newer clients first); edits must not move clients.
- Replace `updatedAt` sorting for project collections with `createdAt DESC` (newer projects first); edits must not move projects.
- Make every release collection API use the existing `compareReleases` policy: undated releases first, then target date ascending, then name ascending; use `createdAt` instead of ID as the next fallback. The API and project detail must agree.
- Order ticket collections first by estimate presence, then by `createdAt DESC` within both groups. Tickets **with** an estimate appear before tickets without one. Do not sort by estimate amount. This applies consistently to the board API, Release detail, and ticket-selection lists.
- Keep global search's current `updatedAt` ordering, as requested in Plannotator feedback. Search remains a deliberate exception to the M14 note that updated-time ordering should not be used on pages.
- Make ticket-detail nested links and related tickets use the same deterministic sort as those collections from `GET /api/tickets` (links by label/ID; related tickets by title/ID).
- Add an explicit ID tie-break to ticket-scoped time-entry ordering without changing its date/start-time order; preserve the existing agenda order.
- Add focused regression coverage for API order, update stability, API/UI consistency, and nested collection ordering. Record an ADR for the resulting durable ordering policy.

## Out of scope

- Schema or database migration, manual drag/reorder, or adding a persisted position field. Existing `createdAt` columns are sufficient for the proposed rules.
- Changing `updatedAt` writes, audit/display semantics, search ranking, archive/ownership/filter behavior, ticket status policy, release target dates, or time-entry overlap rules.
- Changing agenda chronology (`startMinute ASC, id ASC`) or ticket-scoped time chronology (`date DESC, startMinute DESC`).
- Sorting ticket cards by numeric estimate; estimate presence is only the first grouping key in the proposed ticket policy.
- Broad UI redesign, pagination, adding a new API, or changing dependencies.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`
- `docs/milestones/m14-release-ticket-status-actions.md` — prior ordering observation and explicit deferral
- `docs/decisions/0027-release-ticket-status-actions.md` — release ticket status mutation behavior
- `docs/decisions/0006-uuidv7-identifiers.md` — ID strategy
- `docs/decisions/0011-manual-time-entry-history-and-slots.md` — time-entry domain rules
- `docs/decisions/0012-today-agenda-settings-and-history.md` — agenda read semantics
- Status-review Plannotator feedback on the proposed per-collection policy (2026-09-28)

## Approach

1. **Collections:** replace `updatedAt` ordering for clients/projects with creation-time ordering and explicit deterministic tie-breakers. For tickets, order estimated items first, then newest creation time first in each bucket. Keep `updatedAt` available for its other uses.
2. **Releases:** centralize/reuse the existing `compareReleases` rule so `/api/releases` returns the same ordering used by project detail. Extend its final fallback to `createdAt DESC`; retain an ID-only final tie-break if creation timestamps are equal.
3. **Nested ticket collections:** add label/ID ordering for ticket-detail links and title/ID ordering for related tickets, matching `GET /api/tickets` and agenda presentation.
4. **Time and search:** preserve search's current update-recency rank as an explicit exception. Keep agenda order unchanged. Add an ID tie-break after date/start time for ticket-scoped time entries.
5. **Regression tests:** create authenticated fixtures with controlled timestamps and varied estimates; assert exact endpoint ordering, that ordinary edits do not change position, that changing estimate presence changes only its intended bucket, that Release detail/board reflect the API order, that search remains recency-ranked, and that ticket-detail nested arrays are deterministic.
6. **Document and verify:** add/index an ordering ADR as Proposed during implementation, accept only after human code review, and record all checks and any deviations here.

## Files to modify

- `docs/milestones/m15-api-item-ordering.md`
- `server/api/clients/index.get.ts`
- `server/api/projects/index.get.ts`
- `server/api/releases/index.get.ts`
- `server/api/tickets/index.get.ts`
- `server/api/tickets/[id].get.ts`
- `server/api/time-entries/index.get.ts`
- `shared/release-order.ts` — shared deterministic release comparator
- `app/pages/projects/[id]/index.vue` — consume the API's established release order
- `app/utils/release-date.ts` — remove the page-local comparator after extraction
- `tests/e2e/api-item-ordering.test.ts` — authenticated API and desktop/mobile ordering coverage
- `tests/unit/release-date.test.ts` — comparator coverage
- New `docs/decisions/0028-api-item-ordering.md` and `docs/decisions/README.md`

`server/api/search.get.ts` is intentionally not in the change list; its current `updatedAt` ranking remains by explicit user direction.

## Reuse

- Extract and reuse the existing `compareReleases` behavior in `shared/release-order.ts`; let the API response be the source of release ordering for project detail.
- Reuse entity `createdAt` fields in `server/db/schema.ts`; do not add a sort column or migration.
- Reuse existing ticket-list nested ordering from `server/api/tickets/index.get.ts` for ticket detail.
- Reuse authenticated API/browser fixture and cleanup patterns from `tests/e2e/tickets.test.ts`, `tests/e2e/release-ticket-status.test.ts`, and `tests/e2e/hierarchy-card-metrics.test.ts`.
- Preserve the existing time-entry overlap validation in `server/domain/time-entries.ts` and agenda query order in `server/api/agenda/index.get.ts`.

## Decisions and ADR links

- Approved: clients/projects use newest-created first; releases use `compareReleases` with creation time replacing its ID fallback; tickets with estimates precede unestimated tickets, then both groups use newest-created first; search retains updated-time order.
- Approved technical tie-breaker: use ID only after equal creation timestamps to keep ordering deterministic. For releases, creation time replaces ID as the primary fallback after date/name; ID remains only as a final fallback if creation timestamps also tie.
- ADR 0028 was added and indexed as Proposed during implementation, then accepted after human code review. ADR 0027 and the M14 historical journal remain unchanged.

## Implementation checklist

- [x] Human approves this M15 plan through Plannotator before implementation.
- [x] Confirm estimated tickets precede unestimated tickets; retain ID only as a final deterministic tie-break after equal creation timestamps.
- [x] Apply the approved order to client, project, release, and ticket collection APIs; preserve API response order in consuming lists.
- [x] Keep search recency ranking and agenda chronology unchanged; make ticket-scoped time-entry and ticket-detail nested collection ordering explicit.
- [x] Add regression tests for each collection policy, update stability, release comparator consistency, search exception, and nested ticket arrays.
- [x] Add/index ADR 0028 as Proposed, then accept it after human code review.
- [x] Run and record project checks plus focused/full browser tests; document failures, manual checks, deviations, and follow-ups.
- [x] Submit the implementation for separate human code review; do not declare M15 complete without the human completion declaration.

## Journal

### 2026-09-28 — Status audit and Plannotator feedback

- Fact: M14 records the updated-time ticket ordering issue and explicitly defers the broader correction. Inspection found `updatedAt DESC` on client, project, release, and ticket list APIs, plus search entity categories. Client/project/release/ticket PATCH handlers update `updatedAt`.
- Fact: `/api/releases` currently sorts by `updatedAt`, while project detail locally uses `compareReleases` (undated first, target date ascending, name, ID). Ticket list nested links and related tickets are sorted; ticket detail nested `links` and `related` arrays have no explicit order.
- Fact: agenda is ordered by start minute and ID; ticket time-entry history is ordered by date and start minute; no persistent manual order field exists.
- Decision from Plannotator feedback: clients and projects should use `createdAt DESC`; all release collections should use the `compareReleases` rule with `createdAt` in place of its ID fallback; tickets should first group by estimate presence, then use `createdAt DESC` within both groups; search may retain `updatedAt` ordering.
- Decision: tickets with estimates appear before tickets without estimates. Use ID as a final deterministic tie-break only when creation timestamps match; for releases, `createdAt` replaces ID as the fallback after the existing date/name criteria.
- Evidence: searched API/app ordering with `rg`; inspected list/detail handlers, PATCH timestamp writes, schema, sort comparator, consumers, and existing authenticated E2E patterns. `git status --short` was clean before creating this plan. No implementation or tests had been run at plan approval.

### 2026-09-28 — Implementation and verification

- Fact: client and project list APIs now sort by `createdAt DESC, id DESC`. The ticket list API orders estimated tickets first, then each estimate-presence group by `createdAt DESC, id DESC`. An update that does not change estimate presence no longer changes a ticket's list/lane order; changing estimate presence intentionally changes its group.
- Fact: the release comparator now lives in `shared/release-order.ts` and orders undated first, target date ascending, name ascending, creation time descending, then ID ascending for an exact timestamp tie. `/api/releases` uses it; project detail now preserves the API order instead of independently re-sorting.
- Fact: ticket-detail links and related tickets now use the same label/ID and title/ID ordering as ticket-list responses. Ticket-scoped time history now has an explicit ID tie-break after date/start; agenda ordering is unchanged. Global search keeps updated-time ranking.
- Fact: added authenticated E2E coverage for client/project creation ordering and update stability; release ordering and project-detail consistency; ticket estimate groups, stable order after a status edit, intentional movement after estimate addition, board/release rendering, retained search recency, ticket-detail nested order, time-entry chronology, and mobile project/release ordering. Added shared release-comparator unit coverage.
- Decision: no schema or dependency changes. ADR 0028 documents this policy as Proposed pending code review.
- Verification correction: the first production build failed because an app utility re-exported the shared comparator through a relative path that Nitro could not resolve from its generated chunk. Removed the app-runtime re-export and imported the comparator directly from `shared/` in the server and unit test; the final production build passed. An initial lint warning for a test helper was fixed by moving it to module scope.
- Exploratory browser checks: an initial attempt to expand the mobile ticket lane from the ordering test left it collapsed (`aria-expanded=false`), so the ordering test verifies mobile project/release ordering in a fresh mobile context; existing mobile board interaction tests pass in the full suite. A temporary 390px horizontal-overflow assertion also failed on project detail. No layout changes are in scope; this was not changed and should be confirmed separately if it recurs.
- Evidence: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (12 files/68 tests), `pnpm check:workflow`, and `git diff --check` passed. `pnpm exec playwright test tests/e2e/api-item-ordering.test.ts --workers=1` passed (1 test); `pnpm exec playwright test --workers=1` passed (24 tests). `pnpm build` passed with the non-failing Vite `PLUGIN_TIMINGS` advisory for `vite-plugin-checker`. No standalone manual visual inspection was performed; desktop/mobile ordering was asserted in Playwright.

### 2026-09-28 — Human code review

- Fact: Plannotator reviewed the uncommitted implementation diff and returned approval with no requested changes.
- Decision: accept ADR 0028 after human code review. M15 completion remains pending the separate human completion declaration; no declaration was made in this review.
- Evidence: `plannotator review --git --diff-type uncommitted --no-git-remote-check --json` returned `{"decision":"approved","message":"# Code Review\n\nCode review completed — no changes requested."}`.

### 2026-09-28 — Milestone completion declaration

- Fact: the human declared, “i hereby declare this milestone complete.”
- Decision: record M15 as Complete. The standalone visual inspection was not performed and is deferred; the 390px Project detail overflow remains documented as a follow-up.
- Evidence: human completion declaration received in chat on 2026-09-28.

## Verification

Planning/status review:

- [x] Inspected all API ordering expressions and app-side sorting; recorded the inventory and source paths above.
- [x] Human reviewed the status report in Plannotator and supplied per-entity policy direction.
- [x] `plannotator annotate docs/milestones/m15-api-item-ordering.md --gate --json --require-approval` — approved (`decision: approved`) on 2026-09-28; implementation is authorized only within this scope.

Implementation (only after plan approval):

- [x] Focused authenticated tests assert API ordering and persistence/update stability for clients, projects, releases, and tickets.
- [x] Focused tests assert the documented search exception, agenda/time-entry behavior, and deterministic ticket-detail links/relations.
- [x] `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test`, focused and full Playwright, `pnpm build`, `pnpm check:workflow`, and `git diff --check` pass; exact outcomes are recorded in the journal.
- [x] Human completion declaration accepts standalone visual inspection as deferred; browser order assertions passed, and the 390px overflow remains a documented follow-up.

## Review status

- Plan review: Approved via Plannotator on 2026-09-28.
- Code review: Approved via Plannotator on 2026-09-28; no changes requested.
- Milestone completion declaration: Complete; declared by the human on 2026-09-28.

## Follow-ups

- If the human wants user-controlled/manual order in the future, plan it separately as a data-model migration; it is intentionally excluded here.
- Do not rewrite M14 or ADR 0027; record the search exception and new ordering policy in ADR 0028.
- An exploratory 390px width check reported horizontal overflow on Project detail with the ordering-test fixture. No layout behavior changed in this milestone; confirm separately if reproduced.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred.
- [x] Verification evidence recorded.
- [x] Human code review accepted.
- [x] Human completion declaration recorded in the journal and review status.
