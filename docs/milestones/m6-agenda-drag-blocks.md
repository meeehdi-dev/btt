# M6 — Agenda drag/drop time blocks (Complete)

## Context

M5 is complete. M6 makes the single-day Today timeline interactive on desktop without changing the ticket-linked, non-overlapping, 30-minute time-entry model. Approved plan: `plans/m6-agenda-drag-blocks.md` (Plannotator approved after `../tt` mechanics review and near-edge move feedback).

## Approved scope

- Desktop visible-hours-only bidirectional drag creation (clamped at occupied intervals), move with a small near-edge tolerance (proposed ≤12 CSS px) but substantial collisions snap back with an alert, and top/bottom resize clamped at neighboring intervals/window bounds. Creation requires active ticket selection before save.
- During gestures show filtered-out entries semitransparently; all owned entries including archived-parent history occupy time. Existing entries remain correctable regardless of parent archival. Non-drag mobile/keyboard creation and same-day correction; outside-window/date correction and deletion remain available through ticket detail.
- Reuse transactional owner-scoped POST/PATCH and current date-only/slot semantics. Do not introduce new packages, DB migration or cross-day/weekly gestures.

## Out of scope

Weekly view/cross-day drag, touch dragging, changing slot/overlap/storage/auth rules, additional reporting or timeline settings.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`, `plans/m6-agenda-drag-blocks.md`, `docs/milestones/README.md`, `docs/templates/milestone-template.md`, M4/M5 milestone files.
- ADRs 0009/0010 (desktop drag policy), 0011 (time-entry rules), 0012 (Today settings/history); `../tt/app/pages/index.vue`, `components/{day-slot,event}.vue`, `composables/{use-events,use-long-press}.ts` as UX inspiration only.

## Approach

Follow the approved plan: pure interval geometry for 30-minute pointer snapping, directional creation/resize clamping, small edge-tolerance placement versus substantial occupied-drop rejection; pointer-captured desktop state on the Today timeline; persist via existing APIs with server-side conflict checks, refresh and accessible error. Preserve interactive card links/popovers and use a same-day non-drag edit form on the agenda.

## Files to modify

- `app/utils/agenda-drag.ts`, `app/components/{TodayAgenda,TodayAgendaEntry}.vue`, `app/pages/today.vue`.
- `tests/unit/agenda-drag.test.ts`, `tests/e2e/agenda.test.ts` or focused additional browser test.
- This milestone file; `docs/decisions/0014-agenda-drag-interactions.md` and decision index.

## Reuse

- `shared/time-entry.ts` slot size and `overlaps`; `server/api/agenda/index.get.ts` returns all day entries even with filtered/archived-parent history.
- `server/api/time-entries/{index.post,[id].patch}.ts` and `server/domain/time-entries.ts` serialize owner writes and enforce interval rules.
- `app/pages/today.vue` add modal/day refresh, `app/components/TicketTimeEntries.vue` date/time correction UX, `app/components/TicketBoardCard.vue` noninteractive pointer-origin guard, existing Playwright fixtures.

## Decisions and ADR links

- Approved interaction decisions in `plans/m6-agenda-drag-blocks.md`; human clarified edge auto-placement (few pixels) versus substantial collision snapback; ADR `docs/decisions/0014-agenda-drag-interactions.md` records the approved interaction policy. ADR 0011/0012 remain authoritative.

## Implementation checklist

- [x] Human approved focused plan via Plannotator; milestone record created before code changes.
- [x] Geometry helpers and tests.
- [x] Desktop pointer gestures and API saves with hidden-entry ghosts and failure states.
- [x] Keyboard/mobile non-drag same-day edit.
- [x] Browser/API checks, ADR, evidence, human code review and explicit completion declaration.

## Journal

### Planning/approval

- Fact: reviewed `../tt` slot creation/resize/move: it uses slot-origin selection and top/bottom grab handles but mutates global events, only checks creation overlap at release and auto-shifts occupied moves. The approved design uses pure geometry and a limited few-pixel edge tolerance instead.
- Decision (human): retain 30-minute no-overlap; historical entries remain correctable; only visible hours are draggable. The Plannotator review requested limited auto-placement for near-edge movement; plan revised and approved.
- Evidence: before implementation `node scripts/check-workflow-docs.mjs` and `git diff --check` passed (planning artifact only).

### Implementation — geometry

- Fact: added pure pointer-slot, anchored creation, top/bottom resize and move candidate helpers using existing half-open overlap and 30-minute grid. Moved entries can settle at a free edge within 12 CSS px of the raw pointer position; substantial collision returns no candidate. Tests include forward/reverse blockers, adjacent slots and visible bounds.
- Evidence: first `pnpm exec vitest run tests/unit/agenda-drag.test.ts tests/unit/time-entry.test.ts` failed due to Vitest not resolving the Nuxt-only `#shared` alias; a temporary relative import passed 2 files / 8 tests. Build later rejected this relative import; final solution uses `#shared` plus a Vitest-only alias in `vitest.config.ts`. Focused test and build subsequently passed.

### Implementation — timeline gestures

- Fact: Today timeline now handles desktop mouse pointer create/move/edge resize with pointer capture, slot-based previews and semitransparent filtered-out blocks during gestures. Creation pre-fills the existing ticket-required modal; move/resize PATCH preserve other fields and refresh after success or failure. Occupied drops reset and report an error; server failures surface separately. Out-of-window/partially clipped entries are not draggable.
- Evidence: `pnpm typecheck` and focused `pnpm exec vitest run tests/unit/agenda-drag.test.ts` (4 passed). Browser behavior remains to be verified in step 5.

### Implementation — non-drag correction

- Fact: each agenda entry now has an accessible Edit button (desktop, mobile and before/after sections). A Today correction modal edits the current day's start, duration and description through the existing PATCH endpoint, preserving ticket and date. Ticket-detail editor remains available for date corrections and deletion. Day change closes modals to avoid stale-date edits.
- Evidence: `pnpm typecheck` and `pnpm lint` passed. Browser validation pending.

### Pre-review verification and ADR

- Fact: ADR 0014 records the approved bounded edge tolerance, hidden blockers, desktop-only day interactions and accessible alternatives. New Playwright fixture creates two tickets (one filtered out), verifies forward/reverse creation previews, ticket-required save, cancel, near-edge placement, substantial collision snapback, both resize edges, mobile same-day edit, archived-parent drag correction and stale-client server conflict rollback. Unit tests cover pure slot/interval geometry.
- Fact: first new E2E run failed on an exact bottom-resize duration: while pointer dragging, the browser scrolled the timeline by 92px, so the live pointer position landed in a later slot. Browser assertion now verifies duration increases while unit tests fix exact snap/clamp arithmetic; top-edge clamp is separately verified against persisted API data. Focused test passed twice consecutively after adjustments.
- Fact: initial production build failed because a relative import of `shared/time-entry.ts` from the client-side helper was rewritten as an unresolved Nitro import. Restored Nuxt `#shared` import and mapped that alias in `vitest.config.ts`; next production build passed. No dependency or server contract changes.
- Evidence (final pre-review): `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (12 files / 54 passed), `pnpm exec playwright test --workers=1` (9 passed), `pnpm build`, `pnpm check:workflow`, `git diff --check` passed. Focused browser test also passed with `--repeat-each=2`. No separate manual visual session beyond automated browser checks. Code review pending.

### First code review — compact edit action and double-click

- Plannotator returned annotated feedback, not approval. Verdict discussed with human: **confirmed**, both are new M6 behavior: agenda entry Edit button displayed its label, and the card did not respond to double-click. Human authorized the requested focused change in chat (“go”).
- Revision: show only the edit icon while retaining its accessible name; double-click noninteractive entry content opens the same correction modal. Preserve ticket links/badge buttons. Desktop pointer capture can retarget a double-click to the timeline; a timeline-level hit-test resolves the actual entry, while the entry component handles mobile/before/after double-clicks and stops propagation to avoid duplicate opens.
- Evidence: first focused Playwright run after the change failed because pointer capture retargeted desktop double-click away from the card. Added the guarded timeline-level handler; focused `pnpm exec playwright test tests/e2e/agenda-drag.test.ts --workers=1` passed (1). Revised full checks: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (12 files/54 passed), `pnpm exec playwright test --workers=1` (9 passed), `pnpm build`, `pnpm check:workflow`, `git diff --check` passed. Fresh human code review pending.

### Second code review — preview threshold

- Plannotator returned annotated feedback, not approval. Verdict discussed with human: **confirmed**, M6 showed the dragged-card dimming and preview as soon as pointer-down began, so a double-click briefly highlighted the card. Human approved deferring the visual drag state until actual movement in chat (“yes, go”).
- Revision: keep pointer capture and candidate state, but render previews, filtered ghosts and card dimming only after the existing 6px motion threshold. E2E asserts no preview/dimming on press or a 3px shift, then checks dimming after a substantial move. Focused Playwright passed (1). Revised full checks passed: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (12 files/54 passed), `pnpm exec playwright test --workers=1` (9 passed), `pnpm build`, `pnpm check:workflow`, `git diff --check`. Fresh review was accepted via Plannotator with **no changes requested**.

### Human completion declaration and closeout

- Decision (human, directly in chat): “i hereby declare this milestone complete.” In context this declares **M6 complete**. The approved scope and verification checklist are complete, ADR 0014 records the interaction rules, and the final Plannotator code review accepted the revised diff with no changes requested. Follow-ups remain the weekly view/cross-day gestures; M6 is **Complete**.

## Verification

- [x] Unit: directional creation/resize bounds, near-edge move tolerance, collisions/hidden entries.
- [x] Browser/API: persisted gestures, ticket requirement, archived history, visible-window and mobile/keyboard alternatives, owner/server conflict.
- [x] `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test`, `pnpm exec playwright test --workers=1`, `pnpm build`, `pnpm check:workflow`, `git diff --check`; outcomes above. Manual visual review not performed.

## Review status

- Plan review: Approved via Plannotator
- Code review: Approved via Plannotator (final diff, no changes requested)
- Milestone completion declaration: Received in chat; M6 status **Complete**.

## Follow-ups

- Weekly view/cross-day moves are deferred; no touch drag.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred.
- [x] Verification evidence recorded.
- [x] Human code review accepted.
- [x] Human completion declaration recorded in journal and review status.
