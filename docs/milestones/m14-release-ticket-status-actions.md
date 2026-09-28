# M14 — Release ticket status badge actions

> **Status:** Complete; declared by the human on 2026-09-28.

## Context

The release detail page (`/releases/:id`) renders each ticket's status as a static badge. Today agenda entries already expose an interactive status badge with all fixed ticket statuses, a marked current status, and page-owned persistence. This task adds status selection to the release ticket badge, presenting the status choices directly rather than adding an action menu and nested submenu, without changing status rules or other ticket surfaces.

Planning facts:

- `app/pages/releases/[id]/index.vue` owns the release ticket list, fetches `/api/tickets?releaseId=…`, and derives the release's Done count from that data. Its ticket status is currently a static `UBadge` inside the card context row.
- `app/components/TodayAgendaEntry.vue` builds the existing `Change` submenu from `ticketStatuses`, checks the current status, and emits a typed `change-status` event. `app/pages/today.vue` handles the PATCH and refreshes its agenda and ticket data.
- `server/api/tickets/[id].patch.ts` already accepts status updates through the existing ticket update schema and ownership checks. The release ticket list read omits archived tickets and tickets under archived ancestors by default.
- M8 records agenda status changes as Today-specific, while ADR 0013 keeps the ticket board without a non-drag status control. This plan proposes a narrow release-detail addition; it does not revise the board policy or rewrite the completed M8 journal.
- ADR 0024 requires explicit safe client-operation failures and clear handling when a write succeeds but its follow-up refresh fails.
- `git status --short` was clean before this planning file was created. No approved plan for this task exists yet.

## Approved scope

**Approved via Plannotator on 2026-09-28; implementation may proceed only within this scope.**

- On active ticket cards at `/releases/:id`, turn the static status badge into an accessible, badge-styled single-select control. Keep its compact neutral appearance and circle-dot icon.
- Activating the badge presents every value from shared `ticketStatuses` directly as the available status choices; show the ticket's current value as selected/checked. Do not add a separate `Change` action, nested submenu, or `Filter by status` action.
- Keep persistence in the Release detail page. Update the selected ticket with the existing `PATCH /api/tickets/:id` contract, then refresh the release ticket data so the badge and Done count used by release-completion confirmation stay current. Preserve the existing API, fixed statuses, ownership checks, and archive behavior.
- Provide pending, success, and accessible error feedback. Follow the existing Effect-aware client request and refresh conventions. If the write succeeds but refresh fails, report the partial success, offer a refresh retry, and prevent another status write until the current ticket data is refreshed.
- Preserve ticket-card navigation, hierarchy links, related-ticket/external-link popovers, release completion controls, and responsive layout. Badge selection must not activate the card's ticket link.
- Add focused authenticated browser regression coverage for direct status choices/current selection, status persistence and refresh, write/refresh failures, keyboard and mobile activation, and unaffected card navigation/context actions.
- Update the current product-plan description without rewriting the completed M8 milestone log. Add and index a concise ADR documenting this release-detail status action; keep the ADR Proposed until human code review accepts it.

## Out of scope

- Changing Today status behavior, ticket-board status controls (including ADR 0013's no-board-status-action decision), ticket detail/edit status controls, status values, or status-transition rules.
- Adding a status filter to Release detail, a new endpoint, API/schema/database/auth changes, or a dependency.
- Changing archive visibility or enabling status changes for archived tickets/hierarchies.
- Extracting a general status-menu component or broadly refactoring ticket cards/pages unless review identifies a small, clearly necessary reuse.
- Any changes beyond this approved plan.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`
- `docs/milestones/m8-polish-and-shared-ticket-work-items.md` — current Today status interaction and its original Today-only scope
- `docs/milestones/m13-hierarchy-breadcrumbs.md` — completed release detail baseline
- ADR 0013 — ticket board status-control policy
- ADR 0020 — M8 presentation decisions
- ADR 0024 — safe Effect-aware client requests and write/refresh partial success
- `app/pages/releases/[id]/index.vue`
- `app/components/TodayAgendaEntry.vue`, `app/pages/today.vue`
- `server/api/tickets/[id].patch.ts`, `server/api/tickets/index.get.ts`
- `tests/e2e/agenda-status.test.ts`, `tests/e2e/ticket-context-popovers.test.ts`

## Approach

1. **Present status choices directly:** turn the existing status badge into a single-level status chooser. Populate it from shared `ticketStatuses` and show the current status selected/checked; do not add an action group or nested submenu. Preserve the badge appearance and expose an accessible status label.
2. **Keep persistence page-owned:** add a typed status-change handler in the Release detail page. Validate that the ticket is present and active, reject same-status/invalid/concurrent updates, call the existing PATCH endpoint through `runClientRequest`, and refresh the ticket query through the Effect refresh boundary. No server or data-contract changes are needed.
3. **Handle pending and failures explicitly:** disable status actions during a write and while the page has stale ticket data. Announce progress/success through a status region; show safe errors through an alert. Distinguish a failed write from a successful write followed by a failed refresh, and provide a retry path before allowing another write.
4. **Preserve card interactions:** retain the overlay ticket navigation and the existing hierarchy/context controls. Verify badge activation by pointer, touch, and keyboard does not navigate or interfere with the other card actions.
5. **Verify and document:** add focused Playwright coverage, update the existing release-card status assertions as needed, run project checks, update `PLAN.md`, and add/index ADR 0027 as Proposed pending code review. Record commands, results, manual checks, and any deviations here.

## Files to modify

- This milestone file.
- `app/pages/releases/[id]/index.vue` — status chooser, update/refresh handler, pending/error/success feedback.
- `tests/e2e/release-ticket-status.test.ts` — new focused authenticated coverage.
- `tests/e2e/ticket-context-popovers.test.ts` — update release-card status assertions to reflect an interactive trigger while retaining layout and context-popover checks.
- `PLAN.md` — record the current release-detail status action and M14 scope without rewriting M8 history.
- New `docs/decisions/0027-release-ticket-status-actions.md` and `docs/decisions/README.md` — concise proposed decision and index entry.

No server, shared status/schema, database, dependency, or generated files are in scope.

## Reuse

- Import `ticketStatuses` from `shared/ticket-status.ts`, the source used by `TodayAgendaEntry.vue`; do not duplicate or redefine status values. Use Nuxt UI `USelect` for this short fixed list, rather than copying Today’s nested action-menu structure.
- Reuse the page-owned request pattern from `app/pages/today.vue` and `app/pages/tickets/index.vue`: `runClientRequest`, `runClientEffect`, `refreshEffect`, safe feedback, and state refresh after a successful update.
- Reuse the existing `useApiFetch` ticket query and current `refreshTickets` method in the Release detail page; refreshed ticket data already drives the status badge and Done/total count.
- Keep status interaction in the release page/wrapper, not `TicketWorkItem.vue` or a broad shared card component.
- Extend authenticated Playwright fixture/cleanup patterns from `tests/e2e/agenda-status.test.ts` and assertions from `tests/e2e/ticket-context-popovers.test.ts`.

## Decisions and ADR links

- Proposed: activating a Release ticket status badge directly presents the fixed status choices, with the current value selected/checked. This follows Plannotator feedback to use a direct selector rather than a `Change` action/submenu; the Release page has no status-filter action.
- Proposed: ticket writes remain page-owned and use the existing PATCH contract; refresh and failure handling follow ADR 0024.
- ADR 0013 remains authoritative for the board: this release-detail interaction does not add a board status action.
- Add ADR 0027 as Proposed during implementation; accept it only after human code review.

## Implementation checklist

- [x] Human approves this M14 plan via Plannotator before implementation.
- [x] Replace the Release detail static status badge with an accessible single-select trigger while preserving its badge appearance and card interaction behavior.
- [x] Present all fixed statuses directly, show the current value as selected/checked, and persist selected changes through the existing ticket PATCH endpoint.
- [x] Refresh ticket data and the Done count used by release completion confirmation; provide pending, safe error, success, and partial-success/retry feedback.
- [x] Cover the direct status choices/current selection, successful persistence/refresh, write and refresh failures, keyboard/mobile use, and preservation of card navigation/context actions.
- [x] Update `PLAN.md`; add/index ADR 0027 as Proposed during implementation and accept only after code review, without rewriting completed M8 records.
- [x] Run and record automated checks plus desktop/mobile manual checks; record failures, deviations, and follow-ups.
- [x] Submit the implementation for separate human code review; accept ADR 0027 only after review approval.

## Journal

### 2026-09-28 — Planning research

- Fact: inspected the current Release detail, Today status badge/page handler, ticket PATCH/list endpoints, status E2E tests, M8/M13 milestone records, and ADRs 0013/0020/0024. The Release page's current status is a static badge; Today provides the status choices and page-owned mutation pattern. Release detail derives a Done count for its completion-confirmation flow, not a visible Done/total progress bar.
- Fact: Nuxt UI's pinned maintainer guidance recommends `USelect` for a short fixed list; its documented controlled value, `items`, leading slot, selected icon, and disabled/loading props fit the badge selector. No new component or dependency is needed.
- Fact: the existing release ticket query is owner-scoped and excludes archived tickets/archived ancestors by default; its returned ticket data powers the release Done count.
- Decision proposed: activating the Release status badge presents status choices directly; do not add a `Change` action, nested submenu, or status-filter action. Leave status rules, API behavior, archive rules, and board controls unchanged.
- Evidence: `git status --short` returned no changes before this plan was written. No application code was changed during planning. No approved plan for this task existed.

### 2026-09-28 — Plannotator plan feedback

- Fact: the first Plannotator review requested a direct status selector, with the current status checked/selected, rather than a `Change` action and nested submenu.
- Decision: revise the plan to show the available statuses directly from the badge, without an action menu or submenu.
- Evidence: the first `plannotator annotate docs/milestones/m14-release-ticket-status-actions.md --gate --json --require-approval` returned `decision: annotated`; the feedback was incorporated before resubmission.

### 2026-09-28 — Plan approved

- Fact: Plannotator approved the revised M14 plan with no further annotations.
- Decision: the plan is approved; implementation may begin within its scope and remains subject to separate human code review.
- Evidence: `plannotator annotate docs/milestones/m14-release-ticket-status-actions.md --gate --json --require-approval` returned `{"decision":"approved"}`. No application code had been changed at plan approval.

### 2026-09-28 — Implementation and verification

- Fact: replaced the static Release detail status badge with a direct Nuxt UI `USelect`, populated from shared `ticketStatuses`. The current status is selected/checkmarked. No filter action, nested submenu, new API, or status rule was added.
- Fact: the Release page owns the status mutation and refresh. It uses the existing ticket PATCH through `runClientRequest`, refreshes the current release's ticket query through `refreshEffect`, and provides accessible pending/success/error feedback. It blocks concurrent or stale-data writes and temporarily disables release completion while a status write is pending/stale, avoiding an archive/status race. A successful PATCH followed by failed refresh is reported as partial success with a manual retry; the existing failed-read presentation hides ticket cards until refresh succeeds. `PLAN.md` now describes the current status surfaces, and ADR 0027 is indexed as Proposed pending code review. The completed M8 journal remains unchanged.
- Fact: added authenticated Playwright coverage for every status choice and current selection, keyboard opening, pending state, persisted changes, write failure, refresh partial failure and recovery, real touch selection on mobile, page overflow, and preservation of the ticket link. Updated the existing release-card context/layout assertion to expect a combobox.
- Deviation within approved responsive scope: the first mobile E2E check found the release `EntityCard` could contribute intrinsic width beyond the viewport. Added `min-w-0` only to Release detail ticket cards; desktop/mobile visual checks and the regression now confirm no page-level overflow.
- Verification correction: the initial Nuxt typecheck rejected the readonly `ticketStatuses` tuple as `USelect` items; passed a mutable spread to the component. Lint also caught a shadowed `endpoint` local, which was renamed. The first mobile run then identified the intrinsic-width issue above; all subsequent focused and full checks passed.
- Evidence: final `pnpm format:check` passed (233 files); `pnpm lint`, `pnpm typecheck`, and `pnpm typecheck:tsgo` passed; `pnpm test` passed (12 files/67 tests); focused Playwright passed after the caret adjustment (2 tests); final full Playwright passed (23 tests); final `pnpm build`, `pnpm check:workflow`, and `git diff --check` passed. Build emitted the non-failing Vite `PLUGIN_TIMINGS` advisory for `vite-plugin-checker`.
- Manual check: inspected temporary desktop (1280×720) and mobile (390×844) screenshots of the open selector. The badge remains compact with its status icon; all direct options fit without truncation, the current status is checked, and the document has no horizontal overflow. Temporary screenshot calls were removed from the test.

### 2026-09-28 — Code-review annotation

- Fact: the first Plannotator code review was annotated with a request to remove the select's down caret. Inspection confirmed it was Nuxt UI `USelect`'s default `trailingIcon`, not an explicit M14 design choice. The reviewer then authorized the adjustment.
- Decision: suppress the idle default caret while retaining Nuxt UI's trailing loading icon during a pending update. Removing the caret narrowed the trigger enough to truncate longer options, so set a 7rem minimum width on the menu content while leaving the badge itself compact.
- Fact: updated E2E assertions cover no idle trailing icon, retained pending spinner, and untruncated status labels on desktop and mobile. Manually re-inspected desktop/mobile open-menu screenshots; no caret is shown, all values are readable, and the current value remains checked.
- Review status: the first code-review annotation was addressed; the follow-up ordering question is answered and deferred by the user below, who then explicitly approved the review.

### 2026-09-28 — Code review approval and ordering deferral

- Fact: the follow-up Plannotator review was annotated with a question about why tickets move after status updates. The current release page renders API response order without a client sort; `server/api/tickets/index.get.ts` orders tickets by `updatedAt DESC`, and the ticket PATCH endpoint updates `updatedAt` on each write.
- Decision: the user confirmed that updated-time ordering should not be used on any page, but explicitly deferred correcting it to a separate milestone. Leave current cross-page ordering and M14 code unchanged; record the global ordering correction as a future milestone follow-up, not an M14 blocker.
- Review: the user explicitly approved the M14 code review on 2026-09-28 with this ordering correction deferred. ADR 0027 is now Accepted. Milestone completion declaration remains a separate pending closeout step.

### 2026-09-28 — Milestone completion declaration

- Fact: the user declared M14 complete after code review approval.
- Decision: close M14 with the global ticket-ordering correction retained as an explicitly deferred follow-up for another milestone.
- Evidence: human completion declaration received in the conversation on 2026-09-28; no additional code changes were requested.

## Verification

Planning artifact:

- [x] `pnpm exec oxfmt --check docs/milestones/m14-release-ticket-status-actions.md` — passed before implementation.
- [x] `pnpm check:workflow` — passed before implementation.
- [x] First Plannotator review feedback was incorporated: status choices are presented directly from the badge without a `Change` submenu.
- [x] `plannotator annotate docs/milestones/m14-release-ticket-status-actions.md --gate --json --require-approval` — revised plan approved (`decision: approved`).

Implementation (only after approval):

- [x] Focused Playwright: `pnpm exec playwright test tests/e2e/release-ticket-status.test.ts tests/e2e/ticket-context-popovers.test.ts --workers=1` — 2 tests passed after the caret adjustment; the release-status test verifies desktop/mobile label fit and pending spinner behavior.
- [x] Final `pnpm format:check` (233 files), `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (12 files/67 tests), `pnpm exec playwright test --workers=1` (23 tests), `pnpm build`, `pnpm check:workflow`, and `git diff --check` passed. Build emitted the non-failing Vite `PLUGIN_TIMINGS` advisory for `vite-plugin-checker`.
- [x] Inspected desktop/mobile selector screenshots; keyboard/touch selection, pending/error/retry paths, no page-level overflow, card navigation, and hierarchy/context actions passed browser checks.

## Review status

- Plan review: Approved via Plannotator on 2026-09-28 after incorporating first-round feedback.
- Code review: Human approved on 2026-09-28 after review feedback was addressed; the broader ticket-ordering correction was explicitly deferred to another milestone. ADR 0027 is Accepted.
- Milestone completion declaration: Complete; declared by the human on 2026-09-28.

## Follow-ups

- Deferred to a separate milestone by the user: replace the current `updatedAt DESC` ticket ordering across pages with an ordering policy that does not rank by update time. M14 intentionally leaves current API/page ordering unchanged.
- An intermediate full Playwright run emitted repeated non-failing `ResizeObserver loop completed with undelivered notifications` dev-server diagnostics. They were not reproduced in the final full run or focused status tests; investigate only if they recur in CI or during future responsive/popover work.
- Any request to add status filtering, board status actions, status-transition rules, or shared status-menu architecture requires an explicit scope review.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred.
- [x] Verification evidence recorded.
- [x] Human code review accepted.
- [x] Human completion declaration recorded in the journal and review status.
