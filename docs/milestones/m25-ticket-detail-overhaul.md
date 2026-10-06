# M25 — Ticket detail page overhaul

## Context

The current `/tickets/:id` page displays status and description as read-only metadata, renders external-link and related-ticket creation forms permanently below their lists, and offers time-entry creation on this page. Common ticket changes require navigating to a separate Edit ticket page.

The requested outcome is a readable, compact ticket detail surface with live editing for ticket fields, a title-only pencil modal, on-demand link/relation modals, and Today as the only time-entry creation surface. The existing partial ticket PATCH and link/relation endpoints already support the needed operations.

**Plan review status: Approved via Plannotator on 2026-10-03.** Implementation may proceed only within the approved scope below.

## Approved scope

- Keep the hierarchy breadcrumbs and ticket identity; remove the top-level Edit ticket action. Ticket detail becomes the normal place to edit ticket fields. Retire the `/tickets/:id/edit` route; direct requests to that path return 404 with no compatibility redirect.
- Compactness means tighter spacing, padding, and margins rather than smaller controls: keep editable inputs and the primary archive lifecycle action at standard size, with that action at the upper-right of the detail header.
- Put a pencil action beside the title. It opens a modal that edits only the title and persists only `{ title }` through the existing ticket PATCH endpoint.
- Replace the static status text with a direct, accessible selector using shared fixed `ticketStatuses`. Persist only `{ status }` through the existing PATCH endpoint; do not navigate to an edit page to change status.
- Show the description as an editable multiline field and save automatically on blur. Do not couple it to title/status or other ticket fields; persist only `{ description }`.
- Add live edit controls for the other existing ticket fields currently available on the edit page: release association and estimate. Persist each field independently through the existing PATCH endpoint. Parse/display estimates using the existing ticket-estimate utility and validate before writing.
- Preserve archive lifecycle controls without bringing back an Edit action: provide an Archive/Restore action and, for archived tickets, the existing confirmed permanent-delete action. After archive/restore, keep the user on the matching active/archived detail route; preserve the existing API constraints and delete restrictions.
- Keep external-link and related-ticket lists on the detail page, but replace their permanently visible creation forms with separate “Add external link” and “Link ticket” modal flows. Preserve safe external anchors, relation navigation/unlink behavior, optional-label hostname fallback, and exclusion of self/already-linked tickets.
- Keep tracked-time usage and existing entries visible. Do not offer creation of a new time entry from ticket detail; Today is the create surface. Make the tracked-time summary/history visually more compact and minimal: keep the total/estimate usage together, show date/time/duration as compact primary row metadata, descriptions as secondary text, and use accessible icon-only correction/deletion actions. Avoid repeating the current ticket title in each entry row. Preserve existing correction/deletion actions and entry information.
- Reuse the existing page-owned Effect-aware request/refresh conventions. Provide pending, accessible error, and partial-success/refresh-retry feedback for live edits, archive actions, and link/relation mutations. Prevent duplicate writes while a write or required refresh retry is in progress.
- Preserve archived ticket and archived-ancestor behavior, all existing API/data rules, and responsive usability.
- Add focused browser coverage and update the roadmap and durable decision records after approval.

## Out of scope

- API endpoint, database/schema, auth/ownership, dependency, status-value, archive-policy, time-entry-rule, or new-route changes. The approved removal of the existing ticket edit route is in scope.
- Changing the ticket board's status controls or status behavior on Today and Release detail.
- Time-entry creation on ticket detail; all creation remains on Today.
- Removing tracked-time history or changing time-entry correction/deletion semantics.
- Broad component refactors or redesigns outside `/tickets/:id`, the ticket time-history presentation, the approved ticket edit-route removal, and focused tests/docs.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`
- `docs/milestones/m3-tickets-mvp.md` — original ticket detail and relations behavior
- `docs/milestones/m7-search-and-ui-polish.md` — ticket-detail status-control policy
- `docs/milestones/m8-polish-and-shared-ticket-work-items.md` — ticket usage and time-entry display policy
- `docs/milestones/m14-release-ticket-status-actions.md` — direct status selector and page-owned update/refresh pattern
- ADR 0017 — existing ticket-detail status/edit behavior; ADR 0020 — usage/link display decisions; ADR 0024 — client failure and partial-success handling; ADR 0027 — status selector pattern on Release detail
- `app/pages/tickets/[id]/index.vue`, `app/pages/tickets/[id]/edit.vue`
- `app/components/TicketTimeEntries.vue`, `app/pages/releases/[id]/index.vue`
- `server/api/tickets/[id].patch.ts`, ticket link/relation handlers, and existing ticket detail E2E coverage

## Approach

1. **Make detail the normal edit surface:** remove its Edit ticket action. Keep the hierarchy breadcrumbs and current title. Provide standard-size live inputs for status, description, estimate, and release association; keep title editing in its dedicated pencil modal as requested. Place the archive lifecycle action at the upper-right of the header; compact the page with reduced spacing and padding rather than smaller controls.
2. **Use field-scoped writes:** each field update sends only that field in a PATCH. Status and release select on change; description saves on blur (the human-approved direction from initial Plannotator feedback); estimate validates/parses on blur or Enter and saves only when valid/changed. Keep unsaved drafts intact and show field-specific validation/network feedback. Serialize writes and refresh through the existing Effect-aware pattern; report successful writes with failed refresh as partial success and require refresh recovery before more writes.
3. **Edit title in a focused modal:** initialize the draft from the current title when opened and submit only `{ title }`. Keep the modal open with safe feedback on failure; close after successful refresh.
4. **Preserve archive/delete lifecycle:** surface Archive/Restore separately from field editors. Confirm permanent deletion of an archived ticket using the existing wording/rules and navigate to `/tickets` after success. After archive, route to `?archived=true`; after restore, retain `?archived=true` if the ticket or any ancestor remains archived, and remove it only when the whole hierarchy is active. Retire `/tickets/:id/edit` without a redirect; the path should return 404. Do not alter API visibility rules.
5. **Move create forms into modals:** leave external-link and relation rows visible, with add actions in their section headings. Each action opens its own modal containing the existing fields/selector and submit/cancel controls. On success, refresh ticket detail and close/reset the modal; keep current URL validation, optional link label, relation filtering, and unlink behavior. Compactness comes from reduced spacing/padding, not reduced input size.
6. **Use Today for new time entries:** disable creation on ticket detail. Compact its tracked-time summary and entry rows: pair tracked total/estimate usage; keep date/time/duration together; show optional description beneath; remove the repeated ticket-title link; and use tooltip-labeled icon-only edit/delete buttons. Retain existing history, correction, and deletion behavior. Do not change `TicketTimeEntries` semantics for another caller.
7. **Update durable scope and verify:** update `PLAN.md` to describe detail-page live editing and Today-only time-entry creation; add/index a new Proposed ADR (expected next number 0040) for the durable detail-page interaction policy, then accept only after human code review. Add focused browser coverage for live edits, modals, status, archive lifecycle, errors/retry, and mobile layout.

## Files to modify

- `app/pages/tickets/[id]/index.vue` — remove Edit action; live title/status/description/estimate/release updates; archive/restore/delete; separate link/relation modals; disable time-entry creation here.
- `app/components/TicketTimeEntries.vue` — compact detail-page summary/history layout without changing entry actions or persistence rules (only current caller is ticket detail).
- `app/pages/tickets/[id]/edit.vue` — remove the retired edit route (approved via Plannotator).
- `tests/e2e/ticket-detail-overhaul.test.ts` — focused authenticated desktop/mobile and failure-path coverage (or extend existing ticket coverage if the test setup is materially simpler).
- `tests/e2e/tickets.test.ts` — update existing detail-page assertions/selectors affected by live editing and moving add forms to modals.
- `tests/e2e/hierarchy-breadcrumbs.test.ts` — remove its ticket-edit-page breadcrumb coverage and assert the old edit path returns 404.
- `tests/e2e/time-entries.test.ts` — verify ticket-detail creation is disabled and compact history retains correction/deletion.
- `tests/e2e/ticket-status-moves.test.ts` — update its ticket-detail status assertion to the new direct selector.
- `PLAN.md` — reconcile ticket editing/status and time-entry creation surface descriptions without changing unrelated roadmap scope.
- `docs/decisions/0040-ticket-detail-inline-editing.md` and `docs/decisions/README.md` — proposed durable interaction decision; accept after code review.
- This milestone file — implementation journal, verification evidence, review status, and closeout.

No server, database, migration, auth, or dependency changes are expected.

## Reuse

- `server/api/tickets/[id].patch.ts` and `TicketUpdate` already accept partial `{ title }`, `{ description }`, `{ status }`, `{ estimateMinutes }`, `{ releaseId }`, and `{ archived }` updates.
- `app/pages/releases/[id]/index.vue` demonstrates a direct `USelect` status selector, shared `ticketStatuses`, page-owned PATCH, refresh, pending/error/success feedback, and write/refresh partial-success recovery.
- `app/pages/tickets/[id]/index.vue` already has owner-scoped read data, safe external links, optional-label fallback, relation list/unlink, searchable ticket choices, a shared action/request guard, and refresh handling; retain and adapt these rather than adding endpoints.
- `app/pages/tickets/[id]/edit.vue` supplies current release selection, estimate parsing/formatting, archive/restore/delete semantics, and title/description/status field behavior; port/reuse these patterns before removing the route.
- `app/utils/ticket-estimate.ts` parses human-readable estimates and validates positive whole-minute values; preserve empty estimate as `null`.
- `app/components/TicketTimeEntries.vue` separates `canCreate` from history and existing entry edit/delete controls; disable only the create form and compact the displayed summary/rows.
- Existing `UModal` forms in Release detail and Today establish modal body, accessible title/description, and responsive action-row patterns.
- ADR 0024 and the M14 Release status handler establish safe client errors and refresh retry after a successful write.

## Decisions and ADR links

- **Proposed by this plan:** remove the detail-page Edit action and retire `/tickets/:id/edit` (404, no redirect); use ticket detail as the normal edit surface. Title remains a title-only modal; status, description, estimate, and release association use field-scoped live edits. Plannotator selected the route-removal option.
- **Human direction via initial Plannotator feedback:** description saves automatically on blur (or short debounce); this plan recommends blur to avoid per-keystroke writes.
- **Proposed by this plan:** status is directly selectable on detail using the existing fixed statuses/PATCH contract; board, Today, and Release status policies remain unchanged.
- **Proposed by this plan:** link and relation creation use separate on-demand modals; no schema/API changes.
- **Human direction via initial Plannotator feedback:** retain tracked time/history and make it more visually compact; creation remains on Today, and existing correction/deletion behavior is preserved.
- **Human clarification during implementation:** keep the Archive action in the upper-right at standard size and use standard-size inputs; interpret compactness as less padding and margins.
- ADRs 0017, 0020, 0024, and 0027 remain relevant. A new ADR 0040 will supersede only the ticket-detail edit/status policy in ADR 0017; its other decisions and other surfaces remain unchanged.
- Open questions: none. Plannotator selected automatic description save on blur and removal of the `/tickets/:id/edit` route (404, no redirect).

## Implementation checklist

- [x] Receive Plannotator approval for this plan before implementation; incorporate annotations and record the final decision here.
- [x] Implement compact ticket detail with title-only modal; direct status, description-on-blur, estimate, and release live edits; no Edit action.
- [x] Move archive/restore and confirmed permanent delete to ticket detail; remove `app/pages/tickets/[id]/edit.vue` and verify `/tickets/:id/edit` returns 404 while preserving active/archived route context.
- [x] Move external-link and related-ticket creation forms into separate modals; preserve list, unlink, validation, and empty-state behavior.
- [x] Disable only new time-entry creation from ticket detail; compact tracked-time summary/history with grouped date/time/duration, secondary descriptions, no repeated ticket-title link, and tooltip-labeled icon-only correction/deletion actions.
- [x] Add/update regression coverage for field-scoped writes, modals, archive lifecycle, write/refresh failures, keyboard/touch behavior, and absence of page-level overflow.
- [x] Update `PLAN.md`; add/index ADR 0040 as Proposed. ADR acceptance remains pending human code review.
- [x] Run automated checks and record all outcomes/deviations below.
- [ ] Perform the planned manual desktop and 390px mobile checks.
- [ ] Submit the complete diff for separate human code review; record review feedback and wait for the human completion declaration before closing M25.

## Journal

### 2026-10-03 — Planning research

- Fact: the current ticket detail renders status and description read-only, keeps external-link and relation creation forms permanently visible, and enables ticket-level time-entry creation. The ticket editor contains release, title, description, status, estimate, and archive/delete controls.
- Fact: `PATCH /api/tickets/:id` supports partial title, description, status, estimate, release, and archive updates; separate owner-checked endpoints already add links and relations. `TicketTimeEntries` has a `canCreate` prop independent of history and existing entry edit/delete controls.
- Fact: the Release detail selector provides a direct status-change and safe refresh pattern; ADR 0024 specifies safe failure handling and partial-success retry.
- Evidence: read the workflow/roadmap, ADRs 0017/0020/0024/0027, M3/M7/M8/M14 records, current ticket detail/editor, `TicketTimeEntries.vue`, ticket PATCH handler, Release detail page, and E2E ticket/status coverage. `git status --porcelain=v1` was empty before this plan file was created. No application code or roadmap/ADR files were changed.

### 2026-10-03 — Initial Plannotator review

- Fact: Plannotator selected automatic description save on blur or debounce; it requested removing the Edit ticket action and using live-edit controls for estimate and other fields; it approved retaining time entries with a more compact/minimal visual treatment.
- Decision proposed: use blur-triggered description save; extend live editing to status, estimate, and release association. Preserve archive/restore/delete as explicit lifecycle actions, not an Edit action. Compact tracked-time/history rows while retaining existing correction/deletion.
- Decision (Plannotator): remove the `/tickets/:id/edit` route; the old path will return 404 without a compatibility redirect. The answer is recorded in Decisions and ADR links above. No implementation has begun.
- Evidence: `plannotator annotate docs/milestones/m25-ticket-detail-overhaul.md --gate --json --require-approval` returned `decision: annotated`; this feedback is incorporated in the proposed scope.

### 2026-10-03 — Second Plannotator review

- Decision (Plannotator): remove `/tickets/:id/edit`; the direct path should return 404, without a compatibility redirect. Recorded this as approved scope and removed the open question.
- Feedback: add questions if any matters remain unclear. No further scope question remains; description save behavior and editor-route disposition have both been answered.
- Evidence: the second `plannotator annotate docs/milestones/m25-ticket-detail-overhaul.md --gate --json --require-approval` returned `decision: annotated` with the route decision above. No implementation has begun.

### 2026-10-03 — Revised plan checks

- Evidence: `node scripts/check-workflow-docs.mjs` passed (“Workflow documentation structure looks complete.”). `git diff --no-index --check /dev/null docs/milestones/m25-ticket-detail-overhaul.md` produced no whitespace diagnostics. No application code changed.

### 2026-10-03 — Plan approved

- Decision (Plannotator): M25 plan approved. The approved scope includes removal of `/tickets/:id/edit` with 404/no redirect, description save on blur, direct live edits for status/estimate/release, title-only modal, on-demand link/relation modals, Today-only time-entry creation, compact time history, and preserved archive/delete behavior.
- Evidence: final `plannotator annotate docs/milestones/m25-ticket-detail-overhaul.md --gate --json --require-approval` returned `{"decision":"approved"}`. `node scripts/check-workflow-docs.mjs` passed; the final plan file passed `git diff --no-index --check /dev/null docs/milestones/m25-ticket-detail-overhaul.md` with no whitespace diagnostics. No application code changed.

### 2026-10-03 — Implementation started

- Fact: the approved plan is the implementation boundary; no source files were modified before plan approval. Initial working tree contained only the approved M25 plan.
- Evidence: reviewed the approved plan, current ticket detail/editor, ticket update schema/handler, release list/delete APIs, ticket-time-entry component, and relevant E2E tests. Re-read the project Nuxt UI/Effect/Oxc skills; fetched the pinned Nuxt UI maintainer guidance and modal/select/form references. No dependency or schema change is planned.

### 2026-10-03 — Human layout clarification

- Decision: standard-size controls are required; compactness is achieved by tightening padding, margins, and gaps. Place the archive lifecycle action at the upper-right of ticket detail.
- Evidence: direct user feedback clarified the intended meaning of “compact” and requested standard sizing for the archive action and all inputs.

### 2026-10-03 — Implementation and automated verification

- Fact: ticket detail now owns field-scoped live updates, the title-only modal, link/relation modals, and archive/restore/delete. The old ticket edit route is removed. Ticket time-entry history remains compact and correctable/deletable, with creation disabled on detail.
- Decision: keep ADR 0040 Proposed until human code review; do not mark M25 complete before review and a human completion declaration.
- Evidence: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (13 files, 72 tests), `pnpm exec playwright test --workers=1` (30 tests), `pnpm build`, `pnpm check:workflow`, and `git diff --check` passed. `pnpm db:migrate` passed on a fresh temporary PostgreSQL 18 container, which was stopped and removed after test runs. No project database/schema change was made.
- Evidence: browser coverage verifies independent title/status/description/estimate/release updates, invalid-estimate rejection, modal flows, archived and active route behavior, write/refresh failure feedback and retry, compact history/correction/deletion, mobile touch use and no horizontal overflow, and 404 responses for active/archived `/edit` paths. Existing tests also passed after updating stale ticket-detail expectations in `ticket-status-moves.test.ts`.
- Fact: E2E failure injection showed `useApiFetch` clears detail data after a failed refetch; the no-data fallback now displays the partial-success message and the required details-retry action instead of only a generic load error. This remains within ADR 0024/M25 behavior.
- Follow-up: manual desktop/mobile interaction checks and human code review remain pending. The full E2E run logged non-failing `ResizeObserver loop completed with undelivered notifications` messages from the dev server; retired-route no-match warnings are expected.

### 2026-10-03 — User confirmation of layout clarification

- Feedback: the user confirmed the revised layout looks good after moving the standard-size Archive action to the upper-right, restoring standard-size inputs, and tightening spacing/padding rather than shrinking controls.
- Evidence: the full Playwright suite passed (30 tests); focused M25 browser coverage passed (6 tests), and the ticket-detail cases passed again after adding explicit standard-control-size assertions (2 tests). Automated checks and build passed as recorded above.
- Status: this records approval of the requested visual clarification. Formal code-review acceptance and the M25 completion declaration remain pending.

## Verification

Planning artifact checks before plan review:

- [x] Initial `node scripts/check-workflow-docs.mjs` — passed; repeat after the revised scope below.
- [x] Initial `git diff --no-index --check /dev/null docs/milestones/m25-ticket-detail-overhaul.md` — no whitespace diagnostics; repeat after the revised scope below.
- [x] Revised `node scripts/check-workflow-docs.mjs` — passed (“Workflow documentation structure looks complete.”).
- [x] Revised `git diff --no-index --check /dev/null docs/milestones/m25-ticket-detail-overhaul.md` — no whitespace diagnostics.
- [x] Final Plannotator decision and feedback/answers recorded in the journal; approved on 2026-10-03.

Implementation verification (after approval):

- [x] M25 browser coverage (ticket-detail overhaul, ticket CRUD, hierarchy breadcrumbs, time entries, and ticket status moves) passes in the full Playwright run.
- [x] `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test`, `pnpm exec playwright test --workers=1`, `pnpm build`, `pnpm check:workflow`, and `git diff --check` — all pass. The full browser suite has 30 passing tests; the dev server logs a non-failing ResizeObserver warning and the expected no-match warning when testing retired `/edit` paths.
- [ ] Manual desktop and 390px mobile check — compact title/status/estimate/release layout; title and create modals open/close and submit by keyboard/touch; description saves on blur; invalid estimate feedback; archive/restore route context; no page-level horizontal overflow; `/edit` returns 404; no add-time form on ticket detail; compact tracked entries and existing correction/deletion remain available.

## Review status

- Plan review: Approved via Plannotator on 2026-10-03, after two annotated rounds of feedback/answers.
- Layout clarification: User confirmed the revised sizing, spacing, and Archive placement look good on 2026-10-03.
- Code review: Pending
- Milestone completion declaration: Pending

## Follow-ups

- No follow-up is approved yet. Any changes to schema/API rules, time-entry correction/deletion policy, or other ticket-status surfaces require a separate scope review.

## Closeout checklist

- [ ] Approved checklist complete or explicitly deferred.
- [ ] Verification evidence recorded.
- [ ] Human code review accepted.
- [ ] Human completion declaration recorded in the journal and review status.
