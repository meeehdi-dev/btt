# M17 — Agenda UI refinements

> **Status:** Complete. Plan approval and full uncommitted M16–M18 code-review approval were recorded via Plannotator on 2026-09-29; the human completion declaration was recorded on 2026-09-29.

## Context

M16 adds the Week view to the existing `/today` agenda. A follow-up request asked us to validate five UI findings before changing code. The reviewer clarified that the header finding concerns each day header inside the new Week view, and that hierarchy scrolling should be removed from every card that displays hierarchy badges. Review of the source found:

| Finding                                                                 | Verdict                             | Verified evidence and status                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Weekly day header should place Add beside the date, with progress below | **Confirmed**                       | In `WeeklyAgenda.vue`, desktop day headers render the date, tracked value, progress bar, then Add button as separate rows. The narrow header already places Add at the right beside its date/progress block. This is current and introduced by M16; it is not the M7 page-level Day header.     |
| Hierarchy badge groups should wrap instead of scroll                    | **Confirmed**                       | `TodayAgendaEntry.vue` / `TicketHierarchyBadges.vue` and `TicketBoardCard.vue` use horizontal scrolling for hierarchy context; `ProjectCard.vue` already wraps. Removing scroll from all hierarchy-bearing cards is a new refinement that revises the earlier presentation choice in ADR 0022.  |
| Remember Day/Week selection in localStorage                             | **Confirmed (scope clarification)** | `app/pages/today.vue` initializes `view` to an in-memory `ref('day')`; the approved M16 plan excluded persistence, but the reviewer clarified that the preference was intended and forgotten in the initial plan. The follow-up now explicitly includes it.                                     |
| Rename “Today” to “This week” in Week view                              | **Not a bug; refinement**           | The label is static in `app/pages/today.vue`, while `resetToday()` sets the anchor date to today, so Week mode displays the current week. The reviewer confirmed this is a copy refinement, not a defect.                                                                                       |
| Add a per-ticket filter icon beside a time-entry title                  | **Partly**                          | `TodayAgendaEntry.vue` has no per-ticket action by the title; `today.vue` already provides a ticket filter and applies `filters.ticket`. This is a new contextual shortcut, not missing filter functionality. The reviewer confirmed it should be included even though it is separate from M16. |

This plan captures the reviewer's clarifications and requested refinements. M17 shares UI files with M16. The plan originally sequenced implementation after M16 closeout; the human's direct “go” instruction on 2026-09-29 overrides that sequencing constraint. The full-diff code review and completion declarations have since been recorded for M16 and M17.

## Approved scope

**Approved via Plannotator on 2026-09-29.** On 2026-09-29 the human directly authorized implementation before M16 review/closeout. At authorization, M16's review/closeout remained pending; the full-diff review and subsequent completion declaration have since been recorded:

- In each weekly day header, place the Add action on the same first row as the date heading, aligned to the opposite edge. Place the daily tracked/target text and progress bar together beneath it as the second row. Apply the same two-row hierarchy to the stacked narrow-screen day sections, preserving daily progress accessibility information and the date-specific Add action.
- Remove horizontal scrolling from hierarchy-badge groups in every card that displays hierarchy badges; let those groups wrap instead. This applies to Today/Week time-entry cards, Ticket Board cards, Project cards, project-detail release cards, and release-detail ticket cards. Project cards already wrap and should remain consistent. Do not change title/usage overflow behavior unrelated to hierarchy badges.
- Persist the Day/Week view choice in this browser's `localStorage`. On a first visit or when no valid stored value exists, default to Day. Persist the view only—not the selected date or week—and do not add account/server storage.
- Label the current-date action “Today” in Day mode and “This week” in Week mode. Both actions continue to set the anchor date to today; the week displayed is derived from the configured start-of-week setting. Keep its selected/current treatment consistent with the active day or week.
- Add an accessible ticket-filter icon action adjacent to the ticket title in Today time-entry cards. It applies the existing ticket filter to that entry's ticket; retain the title link and existing global filters. Week cards inherit the same control through the shared entry component.
- Add or update tests, record implementation evidence here, and update the roadmap/decision records after approval as needed.

### M18 approved exception — fixed-height desktop agenda entries

M18 was approved via Plannotator on 2026-09-29 and implementation was directly authorized the same day. For fixed-height desktop Day/Week timeline entries only, reduce card padding and compact hierarchy, title-filter, status, and relation/link controls, centering icon-only triggers. Wrap hierarchy badges only when the time block has enough vertical room; otherwise keep the hierarchy group on one line with horizontal scrolling. All naturally sized cards continue to wrap. This narrowly revises M17's wrap-only behavior and ADR 0031; M17's other approved scope is unchanged.

## Out of scope

- Any change to M16 date, ownership, archive, overlap, progress, API, or database behavior.
- Persisting the selected anchor date, synchronizing preferences across browsers/devices, or adding server-side settings.
- Touch dragging, changes to time-entry storage, new dependencies, or changes to filter semantics.
- Changing ticket title/usage scrolling or other overflow unrelated to hierarchy badge groups.
- Declaring M16 complete remained outside M17's implementation scope; M16's code review and completion declaration were recorded afterward. ADR 0029 was accepted after the full-diff code review.

## Source references

- `AGENTS.md`
- `docs/llm-workflow.md`
- `PLAN.md` — existing agenda/card direction
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`
- `docs/milestones/m16-weekly-agenda.md` — approved Week behavior and explicit persisted-view exclusion
- `docs/decisions/0016-agenda-correction-control-and-board-filters.md`
- `docs/decisions/0020-m8-polish-decisions.md`
- `docs/decisions/0022-shared-entity-card-presentation.md`
- `docs/decisions/0025-ticket-board-hierarchy-actions.md`

## Approach

1. Keep the refinements in the existing agenda page and shared components; do not add a new state-management layer or change API contracts.
2. Rework the per-day headers in `WeeklyAgenda.vue`: align date and Add on a shared first row, and combine each day's tracked/target text and accessible progress bar into a second row. Preserve equivalent layout in the desktop columns and narrow stacked sections.
3. Remove horizontal scrolling from hierarchy-badge groups in all affected cards and allow wrapping. Update the shared hierarchy component and its wrappers as needed, including agenda entries and ticket-board cards; preserve the wrapping already used by Project cards. Supersede ADR 0022's one-line scrolling allowance for hierarchy metadata if approved.
4. Initialize the saved view safely on the client, validate stored values against `day` and `week`, and leave Day as the default before a preference exists. Do not persist the selected date.
5. Add a view-dependent label to the existing Today action without changing its `resetToday()` behavior.
6. Add a small accessible title-adjacent filter action that emits the existing `ticket` filter event; keep it separate from the ticket navigation link and existing context controls.
7. Add focused browser coverage for weekly per-day headers, wrapping without horizontal scroll, persistence/navigation behavior, conditional wording, and per-ticket filtering. Update the product roadmap and add proposed ADRs for the browser-local view preference and revised hierarchy wrapping if the human approves those durable behavior changes.

## Files to modify

- `PLAN.md` — record M17 after approval.
- `app/pages/today.vue` — browser-local view preference, conditional label, and existing filter integration.
- `app/components/WeeklyAgenda.vue` — two-row weekly per-day headers in desktop and narrow layouts.
- `app/components/TodayAgendaEntry.vue` — wrapping hierarchy badges and per-ticket filter action.
- `app/components/TicketBoardCard.vue` — wrapping hierarchy context with no horizontal scroller.
- `app/components/ProjectCard.vue` — verify and retain its existing wrapping hierarchy layout.
- `app/pages/projects/[id]/index.vue` — wrapping hierarchy context on release cards.
- `app/pages/releases/[id]/index.vue` — wrapping hierarchy context on release ticket cards.
- `app/components/TicketWorkItem.vue` — title-adjacent action slot/control if required to keep the filter action separate from the ticket link.
- `app/components/TicketHierarchyBadges.vue` — wrap hierarchy groups in both presentation modes and remove their horizontal scrolling.
- `tests/e2e/agenda.test.ts`, `tests/e2e/agenda-week.test.ts`, `tests/e2e/ticket-board-hierarchy-actions.test.ts`, `tests/e2e/ticket-context-popovers.test.ts`, `tests/e2e/hierarchy-card-metrics.test.ts`, `tests/e2e/time-entries.test.ts` (configured-origin test portability), and focused unit tests if a preference utility is extracted.
- `docs/milestones/m17-agenda-ui-refinements.md` — implementation journal and verification evidence.
- `docs/decisions/0030-agenda-view-preference.md`, `docs/decisions/0031-hierarchy-badge-wrapping.md`, and `docs/decisions/README.md` — proposed ADR/index entries for the approved durable behavior changes.

## Reuse

- `app/pages/today.vue` already owns the Day/Week selection, Today action, date navigation, ticket filter state, and `applyFilter` behavior.
- `app/components/WeeklyAgenda.vue` owns both desktop day-column headers and narrow stacked day sections; its daily totals and progressbar are already independent per date.
- `app/components/TodayAgendaEntry.vue` is reused by both Day and Week views and already emits a `filter` event including `ticket`.
- `app/components/TicketWorkItem.vue` owns the time-entry ticket link and title layout; an explicit adjacent action slot can avoid nesting a button inside a link.
- `app/components/TicketHierarchyBadges.vue` owns hierarchy link and filter-action presentation; wrapper-level horizontal scrolling also exists in `TicketBoardCard.vue`, `TodayAgendaEntry.vue`, the project detail release cards, and release detail ticket cards. All hierarchy-group scrolling is in scope for removal.
- `app/components/ProjectCard.vue` already uses wrapping hierarchy layout and provides an existing pattern.
- `docs/decisions/0022-shared-entity-card-presentation.md` currently permits wrapper-owned horizontal scrolling in one-line contexts; the approved M17 decision would supersede that allowance for hierarchy badge groups.

## Decisions and ADR links

- Existing approved behavior: M7's page-level Day header layout is not the target of the weekly day-header refinement.
- Existing approved behavior: M16 explicitly excluded persisted view mode; the reviewer clarified that browser-local Day/Week persistence was intended but omitted from the plan. This proposal seeks approval to add it without persisting dates or changing user settings.
- Accepted behavior (ADR 0030): store the view in per-browser `localStorage`, with Day as the fallback for unset/invalid values.
- Accepted behavior (ADR 0031, refined by M18): hierarchy badge groups wrap in natural-height contexts and desktop cards with enough vertical space. Fixed-height desktop Day/Week entries may scroll the hierarchy group horizontally when another row would clip; title/usage and unrelated scrolling remain unchanged.
- No existing data, ownership, filtering, or agenda interaction ADR is otherwise superseded by this proposal.

## Implementation checklist

- [x] Human approved this plan through Plannotator before implementation.
- [x] Human directly authorized proceeding before M16 code review/closeout; the review and completion declaration were subsequently recorded separately.
- [x] Implement the two-row weekly per-day header in desktop columns and narrow stacked sections without losing date navigation or daily progress accessibility.
- [x] Remove hierarchy-badge horizontal scrolling from all card contexts and verify wrapping on Today/Week entries, Ticket Board cards, Project cards, project-detail release cards, and release-detail ticket cards.
- [x] Persist valid Day/Week selection locally; default to Day on first visit; do not persist the selected date.
- [x] Use “Today”/“This week” according to view while retaining the current anchor-date action.
- [x] Add accessible per-ticket filter action next to a time-entry title and verify it does not trigger ticket navigation.
- [x] Add focused unit/E2E coverage and update `PLAN.md`; add/index proposed ADRs for the approved durable behavior changes.
- [x] Record automated verification and the test-server portability adjustment.
- [x] Human code review of the full uncommitted M16–M18 diff was approved via Plannotator on 2026-09-29; M17 remains open until its completion declaration is recorded.

## Journal

### 2026-09-29 — Findings validation and plan draft

- Fact: `app/pages/today.vue` initializes `view` as `ref('day')`; the M16 scope explicitly lists adding a persisted week/view mode as out of scope.
- Fact: `WeeklyAgenda.vue` desktop headers place the Add button after the date, tracked value, and progress bar; narrow stacked sections align Add beside the heading block. The requested refinement targets these M16 weekly headers, not the M7 page-level Day header.
- Fact: horizontal hierarchy scrolling also existed on project-detail release cards and release-detail ticket cards; Project cards already wrap hierarchy context.
- Fact: the Today action calls `resetToday()`, which sets the anchor to the local current date; Week mode derives the containing configured week from that date.
- Fact: the agenda page already filters by ticket ID, but an entry card has no title-adjacent per-ticket filter control.
- Decision: record the Plannotator clarifications below; scope changes affecting M16/M22-era behavior remain subject to explicit plan approval.
- Question at planning time, resolved by browser checks: verify badge wrapping remains legible in fixed-height short time-entry blocks without altering entry geometry.
- Evidence: reviewed only the submitted finding surfaces and related decisions. No application code was changed. First Plannotator pass returned `annotated`, not approved; the plan is being revised before resubmission.

### 2026-09-29 — Plannotator feedback and plan approval

- Fact: first Plannotator pass returned `decision: annotated` with five comments; the plan was not approved on that pass.
- Human clarification: the day-header request is specifically for each new M16 weekly day header, not the M7 `/today` page-level Day header.
- Human clarification: remove horizontal scrolling and rely on wrapping in all cards with hierarchy badges; the scope covers agenda entries, Ticket Board cards, Project cards, project-detail release cards, and release-detail ticket cards.
- Human clarification: browser-local Day/Week persistence was intended but omitted from the initial plan; the approved follow-up includes it.
- Human clarification: conditional “This week” wording is a refinement, not a bug. The per-ticket title filter is also a desired new refinement even though it was not part of M16.
- Decision: the revised M17 scope was approved via Plannotator on 2026-09-29.
- Evidence: second `plannotator annotate docs/milestones/m17-agenda-ui-refinements.md --gate --json --require-approval` returned `{"decision":"approved"}`.

### 2026-09-29 — Implementation authorization

- Fact: M16 human code review and completion declaration remain pending.
- Decision: the human's direct “go” instruction on 2026-09-29 overrides the M17 plan's sequencing prerequisite to wait for M16 closeout. It does not declare M16 complete or waive its separate code-review requirement.
- Evidence: subsequent M17 implementation is authorized within the already Plannotator-approved scope.

### 2026-09-29 — Playwright test-server portability

- Fact: this environment had another application listening on `127.0.0.1:3000`, so M17 browser checks used an isolated NXMR server on port 3101.
- Fact: the agenda and time-entry unauthenticated API checks hard-coded port 3000, preventing those tests from using Playwright's configured `PLAYWRIGHT_BASE_URL`.
- Decision: update only those test assertions to derive the origin from the current page. This keeps the tested unauthenticated behavior unchanged and makes the tests independent of the local server port.
- Evidence: after making the existing geometry assertion tolerant of expected mobile wrapping, the 7 focused E2E tests passed; the final full Playwright run passed all 27 tests with the NXMR test server isolated on port 3101.

## Verification

Planning checks:

- [x] `node scripts/check-workflow-docs.mjs` — passed after incorporating Plannotator feedback.
- [x] `rg -n '[[:blank:]]+$' docs/milestones/m17-agenda-ui-refinements.md` — no trailing whitespace.
- [x] `git diff --check` — passed for the tracked roadmap update.
- [x] `plannotator annotate docs/milestones/m17-agenda-ui-refinements.md --gate --json --require-approval` — approved on 2026-09-29.
- [x] Record Plannotator feedback and approval outcome in the journal.

Implementation checks (after approval):

- [x] Run focused agenda unit and E2E tests plus the repository's typecheck, lint, format, build, and workflow checks. `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm lint`, `pnpm format:check`, `pnpm test` (13 files, 72 tests), `pnpm build`, `pnpm check:workflow`, and `git diff --check` all passed.
- [x] Browser-check weekly per-day headers on desktop and narrow screens; date and Add share the first row, with daily progress beneath. Playwright Chromium assertions passed in `agenda-week.test.ts`.
- [x] Verify hierarchy badge groups wrap in Today/Week, Ticket Board, Project, project-detail release, and release-detail ticket cards without horizontal badge scrolling or page-level horizontal overflow. Relevant Chromium tests passed in `agenda.test.ts`, `ticket-board-hierarchy-actions.test.ts`, `ticket-context-popovers.test.ts`, and `hierarchy-card-metrics.test.ts`.
- [x] Check short fixed-height agenda blocks for clipped or overlapping wrapped badges without changing time-entry geometry. Agenda-entry bounds and mobile wrapping/overflow assertions passed.
- [x] Verify fresh storage defaults to Day, a chosen mode survives leaving and returning to `/today`, invalid storage falls back to Day, and selected date is not persisted. `agenda-week.test.ts` passed.
- [x] Verify Week mode action is labeled “This week” and still selects the current anchor date/week. `agenda-week.test.ts` passed.
- [x] Verify the per-ticket icon has an accessible name/tooltip, applies only the existing ticket filter, and does not navigate to the ticket. `agenda.test.ts` passed.

### 2026-09-29 — M18 fixed-height badge exception

- Fact: the 30-minute desktop Week block is fixed at 54px while the title, ticket filter, duration, and wrapped hierarchy context compete for that height.
- Human decision: reduce card padding and badge size; wrap hierarchy badges only when available height permits; otherwise allow horizontal scrolling within the hierarchy group.
- Decision: M18 narrowly revises M17's hierarchy wrapping scope for fixed-height desktop Day/Week timeline entries. Natural-height cards remain wrapped; time geometry and adjacent-entry rules remain unchanged.
- Evidence: `docs/milestones/m18-agenda-layout-and-weekly-add.md` was approved via Plannotator and the human directly authorized implementation on 2026-09-29.

### 2026-09-29 — Implementation and verification

- Fact: the weekly day headers now put date and Add together on the first row, with daily tracked/target text and the progress bar beneath. The layout is covered at desktop and narrow widths.
- Fact: hierarchy badge groups wrap in the approved card contexts without horizontal badge scrollers. Existing title/usage overflow behavior is unchanged.
- Fact: the Day/Week preference is stored only in browser `localStorage`; invalid/missing values resolve to Day, and selected dates are not persisted. The current-date control displays “Today” or “This week” based on view, and the ticket-title shortcut uses the existing filter event.
- Evidence: `PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3101 pnpm exec playwright test --workers=1 --timeout=60000` — 27 tests passed. The dedicated M17 coverage includes view persistence, header layout, badge wrapping/overflow, fixed-height entry bounds, and ticket filtering.
- Manual check: no separate M17 screenshot walkthrough was performed. Desktop/narrow browser geometry and overflow assertions passed; the human code review approved the full diff.
- Evidence: `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm lint`, `pnpm format:check`, `pnpm test` (13 files, 72 tests), `pnpm build`, `pnpm check:workflow`, and `git diff --check` all passed.
- Deviation: to run browser tests against an isolated port because another local app occupied `127.0.0.1:3000`, the unauthenticated API test assertions in `agenda.test.ts` and `time-entries.test.ts` now derive the origin from the active page. The assertions and behavior are unchanged.
- Review status at implementation closeout: M17 human code review and completion declaration were pending. The subsequent full-diff Plannotator review accepted the code for M16–M18 and ADRs 0029–0031; the human later declared M16, M17, and M18 complete.

### 2026-09-29 — Full-diff human code review

- Evidence: `plannotator review --git --diff-type uncommitted --no-git-remote-check --json` returned `decision: approved` with “Code review completed — no changes requested.”
- Scope: the uncommitted diff contained M16, M17, and M18 changes; this approval satisfies the M17 code-review gate.
- Status: M17 code review accepted. The completion declaration was pending at this point; see the following journal entry.

### 2026-09-29 — Human completion declaration

- Decision: the human declared M16, M17, and M18 complete: “i declare those milestones complete.”
- Status: M17 is complete; its plan, verification, full-diff human code review, and human completion declaration are recorded.

## Review status

- Plan review: Approved via Plannotator on 2026-09-29
- Code review: Accepted via Plannotator on 2026-09-29 (full M16–M18 diff)
- Milestone completion declaration: Received from the human on 2026-09-29 — Complete

## Follow-ups

- None. M17 is complete; ADRs 0030 and 0031 are accepted.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred.
- [x] Verification evidence recorded.
- [x] Human code review accepted via Plannotator on 2026-09-29.
- [x] Human completion declaration recorded in the journal and review status.
