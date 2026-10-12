# M41 — Agenda time-entry ticket autofocus

> **Status: Complete — amended behavior, full verification, human code review, and the user's completion declaration are recorded.**

## Context

The initial M41 implementation focuses the Ticket selector trigger when the Agenda's “Add completed work” modal opens. In code review, the user reports that they still cannot type a ticket search immediately because the selector menu is closed and its search textbox is unavailable. The user has asked to amend M41 so typing a ticket search works immediately.

### Confirmed facts

- `app/pages/agenda.vue` controls the add modal with `addOpen`; drag-create opens it through `beginDragCreate()`.
- The modal's Ticket field is a Nuxt UI `USelectMenu`, controlled by `ticketPickerOpen`, which defaults to `false`.
- The current top-level `autofocus` prop focuses the selector trigger when the component mounts. `ticketSearchInput` already sets `autofocus: true` for the actual search textbox, but that textbox is rendered only while the options menu is open.
- The current E2E assertion verifies focus on the Ticket trigger and then clicks it before selecting an option; it does not verify immediate typing into the search textbox.
- This project supports desktop viewports of 1280 CSS px and wider (ADR 0042).

## Approved scope

**Initial scope approved via Plannotator session `pn-eb0e8c` on 2026-10-12.** The initial implementation focused the Ticket selector trigger while leaving its menu closed. The amendment below supersedes that behavior for M41 and was approved via Plannotator session `pn-2d5ee8` on 2026-10-12.

## Approved amended scope

**Approved via Plannotator session `pn-2d5ee8` on 2026-10-12.**

- When the Agenda add modal opens, open the Ticket selector menu and focus its actual search textbox so the user can type a ticket query immediately.
- Preserve the existing searchable options, eligibility rules, selection behavior, and the automatic close after a ticket is selected. Close/reset the picker when the add modal closes and make it ready for the next modal opening.
- Add browser coverage that confirms the search textbox—not the selector trigger—has focus when the modal opens, then type a query, select the filtered ticket, and continue the existing save flow. Update all existing add-modal E2E flows affected by opening the picker by default.

## Out of scope

- Changing the shared selector composable or autofocus behavior on other pages.
- Changes to Agenda data, time-entry behavior, APIs, schema, dependencies, or supported viewport policy.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`
- `docs/milestones/m29-today-week-only-ui-polish.md` — Agenda modal and drag-create behavior
- `docs/milestones/m40-ticket-board-card-title-time-alignment.md` — latest completed milestone context
- `docs/decisions/0037-searchable-data-backed-selectors.md` — searchable entity selector policy
- `docs/decisions/0042-desktop-only-ui-and-spacing.md` — supported viewport and keyboard-accessibility policy
- `docs/decisions/0044-week-only-agenda-and-status-selector.md` — current Agenda behavior
- `docs/decisions/0050-e2e-verification-and-server-handoff.md` — full local browser verification and server handoff
- `.agents/skills/nuxt-ui/SKILL.md` — Nuxt UI maintainer-guidance pointer
- `app/pages/agenda.vue`, `app/composables/useSelectSearchInput.ts`, `tests/e2e/agenda-week.test.ts`, `tests/e2e/data-invalidation.test.ts`

## Approach

1. Open `ticketPickerOpen` with the Agenda add modal and reset it when the modal closes. Remove the top-level `autofocus` that focuses the selector trigger; keep using the existing search-input autofocus so the actual textbox receives focus when the menu opens. Use the smallest state/watch adjustment that handles repeated opens and ticket selection without changing other selectors.
2. Update the Agenda drag-create browser flow to assert that the search textbox is focused as soon as the dialog appears, type a query without clicking the selector, verify the matching ticket option, and preserve selection/save coverage. Update other existing add-modal flows to use the already-open picker.
3. Run focused browser coverage and all approved local gates, including the full Playwright suite against an agent-owned server. Record exact commands, results, and server handoff evidence here.
4. The amended M41 summary is updated in `PLAN.md`. No ADR is expected: this is a focused interaction refinement using the existing Nuxt UI selector API.

## Files to modify

- `app/pages/agenda.vue` — open the add-modal Ticket selector and focus its search textbox; reset the picker on modal close and remove trigger-only autofocus.
- `tests/e2e/agenda-week.test.ts`, `tests/e2e/data-invalidation.test.ts` — verify immediate search typing and selection on modal open and preserve existing add flows.
- `PLAN.md` — add the approved M41 roadmap entry.
- `docs/milestones/m41-agenda-time-entry-ticket-autofocus.md` — record implementation, verification, review, and closeout evidence.

No API, server, database/schema, authentication, dependency, or other selector changes are planned.

## Reuse

- Reuse the existing controlled `ticketPickerOpen` state and `USelectMenu` search input; its `autofocus` setting already focuses the actual search textbox when the menu opens.
- Extend the existing drag-create modal flow and authenticated fixtures in `tests/e2e/agenda-week.test.ts`.
- Keep `useSelectSearchInput('Search tickets…')` and all other selectors unchanged; do not add shared search behavior.

## Decisions and ADR links

- Initial interpretation (approved via Plannotator pn-eb0e8c): focus the selector trigger while keeping its menu closed. Code review confirmed this did not allow immediate ticket-search typing.
- Human direction on 2026-10-12: amend M41 so the modal opens the Ticket selector and focuses the actual search textbox. The user's “yes please amend so i can type immediately” authorized the plan revision, and Plannotator approved it in session `pn-2d5ee8`.
- No new ADR is expected. Existing data-backed selector policy (ADR 0037), desktop keyboard accessibility (ADR 0042), and Agenda modal behavior (ADR 0044) remain unchanged.

## Implementation checklist

- [x] Obtain approval of the initial plan before implementation (Plannotator session `pn-eb0e8c`, 2026-10-12).
- [x] Implement and verify the initial trigger-focus behavior; the subsequent review found it did not enable immediate typing.
- [x] Record initial-scope checks and server handoff; these checks do not verify the proposed amended behavior.
- [x] Obtain Plannotator approval of the proposed amendment before changing code (session `pn-2d5ee8`, 2026-10-12).
- [x] Open the Ticket selector with the add modal and focus its search textbox, resetting it correctly on close/reopen and selection.
- [x] Update E2E coverage to type/search/select immediately without activating the selector, including the existing same-tab flow.
- [x] After amendment approval, update the M41 roadmap entry in `PLAN.md`.
- [x] Run focused and full browser checks plus all approved local checks for the amended implementation.
- [x] Complete final server handoff after all amended-scope checks pass; leave unowned servers untouched.
- [x] Submit the amended final diff for human code review; Plannotator accepted it with no changes requested (`pn-cafd8a`).
- [x] Record the user's completion declaration before closing M41.

## Journal

### 2026-10-12 — Planning research

- Fact: the Agenda add modal is opened by drag-create and contains a Ticket `USelectMenu`; existing E2E coverage already tests the dialog and required-ticket flow.
- Fact: Nuxt UI `USelectMenu` has a top-level `autofocus` prop that focuses its trigger on mount. The existing search-input `autofocus` option is separate and acts when the menu opens.
- Decision proposed from the user's request: autofocus only the Ticket selector trigger when the add modal opens; do not automatically open the options menu.
- Evidence: read the required workflow and roadmap, milestone lifecycle/template, relevant completed Agenda milestones, ADRs 0037/0042/0044/0050, the local Nuxt UI skill pointer, Agenda page and composable, current Nuxt UI `SelectMenu.vue` types/implementation, and Agenda Week E2E coverage. `git status --short --branch` showed a clean worktree before this plan was created. No application code was changed.
- Open questions: none identified.

### 2026-10-12 — Plan approval

- Decision: the human approved M41's scope. This authorizes the implementation checklist above.
- Evidence: Plannotator session `pn-eb0e8c` approved `docs/milestones/m41-agenda-time-entry-ticket-autofocus.md` on 2026-10-12.
- Status: implementation of the initial trigger-focus scope was authorized.

### 2026-10-12 — Implementation and local verification

- Fact: added the top-level Nuxt UI `autofocus` prop only to the Ticket `USelectMenu` in the Agenda add modal. The existing search-input config, selector opening behavior, and all other selectors are unchanged.
- Fact: the weekly Agenda E2E test now asserts that the Ticket selector is focused when the drag-create modal opens, then continues through the existing selection, save, and correction flow.
- Verification: the focused weekly Agenda test passed (1/1 in 9.0s); the final full Playwright suite passed (48/48, no skips) in 3.0 minutes after the roadmap/journal updates.
- Verification: format, lint, Nuxt and tsgo typechecks, duplicate detection, Knip unused-code check, Vitest, production build, workflow checks, documentation structure, and diff whitespace checks passed. jscpd reported the existing 118 baseline clones with no new clones; `pnpm lint` reported two non-failing warnings in the unmodified `tests/e2e/ticket-context-popovers.test.ts`; build emitted non-fatal plugin-timing warnings.
- Setup: ran `pnpm db:migrate` against the isolated agent-owned PostgreSQL 17 database `btt_m41` on port 55432. Started the agent-owned Nuxt server on port 3000 with a throwaway local auth secret; `/api/health` returned 200. Focused and full Playwright ran with `PLAYWRIGHT_SKIP_DEV_SERVER=1`, the same auth configuration, one worker, and zero retries.
- Scope: no API, data, schema, dependency, or shared-selector behavior changed. After every approved check passed, the agent-owned server and database were stopped; see the handoff evidence below.

### 2026-10-12 — Server handoff

- Fact: after the final full Playwright run passed, stopped only the tracked agent-owned Nuxt process tree (launcher PID 68609, Nuxt listener PID 68628, and its tracked children). No tracked PIDs remained; port 3000 had no listener and `/api/health` was unreachable.
- Fact: stopped only the agent-owned PostgreSQL container `btt-m41-postgres-20261012-pi`; Docker reported `exited`, and port 55432 had no listener. User-owned PostgreSQL forwards on ports 5432 and 5433 remained active and untouched.
- Status: initial-scope agent-owned server/database handoff is complete; code review later requested amended behavior.

### 2026-10-12 — Code review finding and requested amendment

- Feedback: Plannotator code review pn-fc0dbe reported that the Ticket control looks focused but does not let the user type a ticket search immediately.
- Verdict: Confirmed. `app/pages/agenda.vue:633` adds top-level autofocus; Nuxt UI `SelectMenu.vue:180–183` focuses the trigger. The menu is controlled by `ticketPickerOpen` (`agenda.vue:103, 624`), initially false, and the search input is inside the open menu content (`SelectMenu.vue:440–457`). The existing E2E assertion focuses the Ticket button before clicking it (`tests/e2e/agenda-week.test.ts:568–570`).
- Classification: trigger autofocus was introduced by M41; the closed-menu default predates M41 and was deliberately retained in the initially approved plan's out-of-scope clause. Together, they fail to provide immediate typing.
- Human direction: “yes please amend so i can type immediately”. Revise M41 to open the selector when the add modal opens and focus the search textbox. No code has been changed in response to this review feedback.
- Status: amendment plan review was pending; implementation of amended behavior had not started at that point.

### 2026-10-12 — Amended plan approval and implementation research

- Decision: the human approved M41's amended scope to open the Ticket picker with the add modal and focus the actual search textbox.
- Evidence: Plannotator session `pn-2d5ee8` approved the amended `docs/milestones/m41-agenda-time-entry-ticket-autofocus.md` on 2026-10-12.
- Fact: source/test search found a second existing add-modal flow in `tests/e2e/data-invalidation.test.ts` as well as two in `tests/e2e/agenda-week.test.ts`; all selector-click assumptions need adjustment because the picker will already be open.
- Decision: update those existing tests to type into the open search box rather than click the selector. This is regression maintenance within the approved search-on-open behavior, not additional product scope.
- Status: amended scope is approved; implementation is authorized.

### 2026-10-12 — Amended implementation and verification

- Fact: `ticketPickerOpen` is now synchronized with `addOpen`: the Ticket menu opens with the modal and closes/resets when the modal closes. Selecting a ticket still closes the menu while leaving the modal open.
- Fact: removed the top-level `USelectMenu` autofocus that focused only the trigger. The existing search-input autofocus now focuses the actual `Search tickets…` textbox as soon as the picker opens.
- Fact: Agenda Week E2E now types `Weekly first ticket` directly after modal open, verifies the other ticket is filtered out, selects the result, and completes the save/correction flow. Updated the second Week add flow and the same-tab data-invalidation helper/test so neither assumes the selector must be clicked first.
- Deviation: research found another add-modal selector-click path in `tests/e2e/data-invalidation.test.ts`; added that file to the test changes to preserve the existing same-tab data-invalidation flow. No product scope changed.
- Verification: focused browser coverage for the weekly add flow, Week gesture add flow, and same-tab data-invalidation add flow passed 3/3 in 22.0s. The final full Playwright suite passed 48/48, 0 failed, 0 skipped in 3.1 minutes, with one worker and zero retries.
- Verification: format (318 files), lint, Nuxt/tsgo typechecks, duplicate detection (118 existing baseline clones; no new clone), Knip, Vitest (15 files / 77 tests), build, workflow/doc checks, and diff checks passed. Lint emitted two non-failing warnings in unmodified `tests/e2e/ticket-context-popovers.test.ts`; build emitted non-fatal plugin-timing warnings.
- Setup: the isolated agent-owned PostgreSQL 17 database `btt_m41` was migrated and used for checks. An unrelated Nuxt server (PID 74237) was already listening on port 3000 bound to `::1`; its ownership was not established, so it was not used or stopped. The M41-owned Nuxt server was started on `127.0.0.1:3001` with a throwaway auth secret; `/api/health` returned 200. Playwright used `PLAYWRIGHT_SKIP_DEV_SERVER=1` and the agent-owned port 3001.
- Status: all amended-scope checks pass. The agent-owned server/database were stopped after verification; see the amended server handoff below.

### 2026-10-12 — Amended server handoff

- Fact: a Nuxt server (PID 74237) was already listening on port 3000 bound to `::1`; its ownership was not established. It was not used or stopped.
- Fact: after the amended focused/full browser checks and all non-browser gates passed, stopped only the agent-owned Nuxt process tree (launcher PID 85117, Nuxt listener PID 85136, and tracked children) on port 3001. No tracked PIDs remained and `lsof -nP -iTCP:3001 -sTCP:LISTEN` returned no listeners.
- Fact: stopped only the agent-owned PostgreSQL container `btt-m41-amended-postgres-20261012-pi`; Docker reported `exited` and port 55432 had no listener.
- Status: amended server/database handoff is complete; the final diff is ready for human code review.

### 2026-10-12 — Amended code review

- Decision: Plannotator accepted the amended implementation with no changes requested.
- Evidence: Plannotator code review session `pn-cafd8a` reviewed the final local changes on 2026-10-12 and approved them.
- Status: human code review is accepted; the user's completion declaration is recorded below.

### 2026-10-12 — User completion declaration

- Human declaration: “i declare this milestone complete.”
- Decision: record the explicit user declaration and mark M41 Complete.
- Status: M41 is Complete; amended implementation, local verification, server handoff, and accepted human code review are recorded above.

## Verification

Planning checks:

- [x] `node scripts/check-workflow-docs.mjs` — passed before plan approval.
- [x] `pnpm exec oxfmt --check docs/milestones/m41-agenda-time-entry-ticket-autofocus.md` — passed.
- [x] `git diff --check` and no-index whitespace check for this new milestone — no whitespace diagnostics.
- [x] Initial plan review — approved in session `pn-eb0e8c`; the amended plan review was approved in session `pn-2d5ee8`.

Initial-scope implementation verification (2026-10-12; these checks do not cover the proposed amendment):

- [x] `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/btt_m41 pnpm db:migrate` — passed against the isolated PostgreSQL 17 database. No migration or schema change was introduced.
- [x] `pnpm format:check` and `pnpm lint` — passed.
- [x] `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/btt_m41 pnpm typecheck` and `pnpm typecheck:tsgo` — passed.
- [x] `pnpm check:duplicates` — passed with the existing 118 fingerprinted baseline clones and no new clone; `pnpm check:unused` — passed.
- [x] `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/btt_m41 pnpm test` — 15 files / 77 tests passed.
- [x] `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/btt_m41 pnpm build` — passed; Vite/Rolldown emitted non-fatal plugin-timing warnings.
- [x] Focused browser test: `CI=true DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/btt_m41 BETTER_AUTH_SECRET=<same local throwaway value on server and runner> BETTER_AUTH_URL=http://127.0.0.1:3000 GITHUB_CLIENT_ID=m41-ci-github-client-id GITHUB_CLIENT_SECRET=m41-ci-github-client-secret PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 pnpm exec playwright test tests/e2e/agenda-week.test.ts --grep 'weekly agenda reads seven owner-scoped dates with per-day progress and localized controls' --workers=1 --retries=0 --reporter=line` — final focused run passed 1/1 in 9.0s.
- [x] Full browser suite: same environment with `pnpm exec playwright test --workers=1 --retries=0 --reporter=line` — final run passed 48/48, 0 failed, 0 skipped in 3.0 minutes.
- [x] `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and `git diff --check` — passed.
- [x] Final-document checks after the final roadmap and handoff-journal updates: `pnpm format:check` passed for 318 files; `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, `git diff --check`, and no-index milestone whitespace check passed.
- [x] After all checks passed, stopped only the agent-owned Nuxt process tree (launcher PID 68609; Nuxt listener PID 68628 and tracked children). No tracked PIDs remained, `lsof -nP -iTCP:3000 -sTCP:LISTEN` returned no listeners, and `/api/health` was unreachable.
- [x] Stopped only the agent-owned PostgreSQL container `btt-m41-postgres-20261012-pi`; Docker reports `exited` and `lsof -nP -iTCP:55432 -sTCP:LISTEN` returned no listeners. Existing user-owned PostgreSQL forwards on ports 5432 and 5433 remained untouched.

Amended-scope implementation verification (2026-10-12):

- [x] `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/btt_m41 pnpm db:migrate` — passed against a fresh, isolated agent-owned PostgreSQL 17 database.
- [x] `pnpm format:check` (318 files), `pnpm lint`, `DATABASE_URL=... pnpm typecheck`, `DATABASE_URL=... pnpm typecheck:tsgo`, `pnpm check:duplicates`, `pnpm check:unused`, `DATABASE_URL=... pnpm test` (15 files / 77 tests), `DATABASE_URL=... pnpm build`, `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and `git diff --check` — passed. Duplicate detection found the 118 reviewed baseline clones and no new clone. Lint produced two non-failing warnings in the unmodified `tests/e2e/ticket-context-popovers.test.ts`; build produced non-fatal plugin-timing warnings.
- [x] Focused browser command: `CI=true DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/btt_m41 BETTER_AUTH_SECRET=<same local throwaway value on server and runner> BETTER_AUTH_URL=http://127.0.0.1:3001 GITHUB_CLIENT_ID=m41-ci-github-client-id GITHUB_CLIENT_SECRET=m41-ci-github-client-secret PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 pnpm exec playwright test tests/e2e/agenda-week.test.ts tests/e2e/data-invalidation.test.ts --grep 'weekly agenda reads seven owner-scoped dates with per-day progress and localized controls|week gestures create, resize, move across dates, and preview move conflicts at the attempted position|ticket and time-entry writes update the Agenda picker and inactive board without reload' --workers=1 --retries=0 --reporter=line` — 3 passed in 22.0s.
- [x] Full browser suite: same environment with `pnpm exec playwright test --workers=1 --retries=0 --reporter=line` — 48 passed, 0 failed, 0 skipped in 3.1 minutes. No retries or timeout changes.
- [x] After the final roadmap and handoff-journal update, final-document checks passed: `pnpm format:check` (318 files), `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, `git diff --check`, and no-index milestone whitespace check.
- [x] After all approved checks passed, stopped the agent-owned Nuxt server on port 3001 and isolated PostgreSQL container; ports 3001 and 55432 are released. The unowned port-3000 listener was left untouched.

## Review status

- Plan review: Initial scope approved via Plannotator (`pn-eb0e8c`) and amended scope approved via Plannotator (`pn-2d5ee8`) on 2026-10-12.
- Initial code review: Changes requested via Plannotator (`pn-fc0dbe`); finding confirmed and addressed in the approved amendment.
- Amended code review: Accepted via Plannotator (`pn-cafd8a`) on 2026-10-12; no changes requested.
- Milestone completion declaration: Recorded on 2026-10-12 — “i declare this milestone complete.”

## Follow-ups

- None identified.

## Closeout checklist

- [x] Amended checklist complete or explicitly deferred.
- [x] Verification evidence for initial and amended scopes recorded; final-document checks passed and agent-owned ports are released.
- [x] Human code review accepted via Plannotator `pn-cafd8a`.
- [x] Human completion declaration recorded in the journal and review status.
