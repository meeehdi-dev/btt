# M43 — On hold ticket status

> **Status: Complete. Human completion declaration recorded on 2026-10-13. Plan approved via Plannotator session `pn-992142`; code review approved via session `pn-79dd64`.**

## Context

The Ticket Board currently has seven fixed statuses, ordered from Idea through Done. Add a distinct state for work that is paused, display it as the first lane at the far left, and use a pause icon wherever ticket status is represented.

### Observed facts

- `shared/ticket-status.ts` is the ordered source for status values and icons. Its order drives Ticket Board lanes; the icon map is reused by the Board, Agenda, Release detail, ticket detail, and global search.
- The PostgreSQL `ticket_status` enum and `TicketCreate`/`TicketUpdate` Effect schemas are derived from that shared list. Supporting a new persisted status therefore needs an additive database migration as well as the shared value.
- Existing status-change controls are the Ticket Board and Agenda icon menus, the Release detail selector, and ticket detail's inline selector. The New ticket form does not currently expose a Status field; tickets created from that form default to Idea. The create API already accepts an optional status.
- Existing Done-specific behavior (including quiet-Done Board visibility and Release completion counts) keys on `Done`; a new non-Done status should remain unfinished and should not be treated as completed.
- At initial planning, user changes were present in `PLAN.md` and `docs/milestones/m42-ticket-priorities.md`. The user reported committing them during review; the current worktree shows the M42 file clean but `PLAN.md` still modified. Preserve that remaining roadmap edit, and after approval make only the narrowly scoped M43 roadmap changes.

### Naming research and recommendation

Recommendation: use **On hold** (exact status value/label) rather than **Hold**. “On hold” reads as a current state; “Hold” is terse and can sound like an instruction. This is a fixed workflow status, not a priority, a label, or a synonym for Blocked.

- Linear documents configurable team issue statuses and treats labels as categorization. That supports representing paused work as a status rather than a label; Linear does not prescribe a default “On hold” status. [Linear workflows](https://linear.app/docs/configuring-workflows) · [Linear labels](https://linear.app/docs/labels)
- Atlassian's Jira Software documentation uses **On Hold** as a workflow status and explains its relationship to board columns. [Jira board columns and statuses](https://support.atlassian.com/jira-software-cloud/docs/manage-columns-with-multiple-statuses-in-a-team-managed-project/)

### Proposed behavior

- Add the fixed status **On hold** as the first entry in the shared status list, before Idea. It becomes the leftmost Ticket Board lane; the existing Idea → Estimate → Develop → Review → Test → Deploy → Done order remains intact after it.
- Use the neutral `lucide:pause` icon for On hold. The installed Lucide collection was checked and contains this icon.
- Make On hold selectable through all existing status-change controls and show the pause icon anywhere an individual ticket's status icon is displayed. Preserve the existing flat status choices, keyboard/accessibility, busy/archive behavior, and write/refresh/error flows.
- Keep newly created tickets defaulting to Idea in the current New ticket form. The API's optional `status` input will accept On hold through the shared validation list.
- Keep existing tickets' status values unchanged. Do not add a priority, blocked reason, custom workflow, status-transition rule, time-tracking state, or new endpoint.

## Approved scope

**Approved via Plannotator session `pn-992142` on 2026-10-13.**

- Add the exact status value/label `On hold`, at the front of the fixed status ordering, and map it to `lucide:pause`.
- Add it to the Ticket Board as the far-left lane. Keep the existing Board-local horizontal scrolling and the supported 1280 CSS px minimum; do not introduce page-level horizontal overflow or change lane/card behavior.
- Use the shared status value and icon consistently across status menus, selectors, lane headings, and ticket identity surfaces (including Agenda, Release detail, ticket detail, and search). Do not add a separate status control to a surface that does not currently have one.
- Extend server request validation and the PostgreSQL enum with one additive migration. Preserve all current records and the `Idea` default for newly created tickets. No status backfill is needed.
- Preserve existing Done-only semantics: On hold is unfinished, remains visible under the quiet-Done rule, and counts as unfinished in Release completion/progress. Keep archive, ownership, status-write, Agenda history, priority, estimate, and time-entry behavior unchanged.
- After approval, update the active status list/feature inventory and add M43 to `PLAN.md`; create/index Proposed ADR 0055 for the durable fixed-status, label, icon, and lane-order choice. Accept the ADR only after human code review. Do not rewrite historical M3/M32 entries or modify ADRs 0053/0054, whose On hold exclusion refers to **priority**, not ticket status.

## Review feedback incorporated

The reviewer chose to keep the current New ticket form and Idea default. Do not add a Status field; On hold remains available through the existing status-change controls after creation.

## Out of scope

- A `Hold` label, `Paused`, `Blocked`, or any other additional status; customizable workflows, status reasons, or transition restrictions.
- Changing the meaning or ordering of the seven existing statuses, or restoring a next-status arrow/automatic status progression.
- Changing the ticket priority model or priority controls. In particular, do not add On hold as a priority; ADRs 0053/0054 remain authoritative for priorities.
- Changing the New ticket form or the default ticket status from Idea.
- Changes to quiet-Done cutoffs, Done semantics, archive lifecycle, API ownership/authentication, estimates, time entries, dependencies, deployment, or CI policy.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`, `docs/templates/adr-template.md`
- `docs/milestones/m3-tickets-mvp.md` — original fixed-status model
- `docs/milestones/m32-ticket-board-status-icons-cards-and-done-visibility.md` — Board lane/status presentation and quiet-Done policy
- `docs/milestones/m34-agenda-board-status-icon-menus.md` — shared Board/Agenda status-menu behavior
- `docs/milestones/m42-ticket-priorities.md` — current priority/status boundary; its latest changes were committed during plan review
- ADR 0007 (ticket status model), 0013 (Board status interaction), 0044 (Agenda status selector), 0046 (quiet Done visibility), 0048 (Board/Agenda status menus), 0053/0054 (priority values and presentation)
- External research: [Linear workflows](https://linear.app/docs/configuring-workflows), [Linear labels](https://linear.app/docs/labels), [Jira board columns and statuses](https://support.atlassian.com/jira-software-cloud/docs/manage-columns-with-multiple-statuses-in-a-team-managed-project/)
- `shared/ticket-status.ts`, `server/db/schema.ts`, `server/domain/schemas.ts`, `server/api/tickets/index.post.ts`, `server/api/tickets/[id].patch.ts`
- `app/pages/tickets/index.vue`, `app/components/TicketStatusMenu.vue`, `app/components/TicketWorkItem.vue`, `app/pages/agenda.vue`, `app/components/WeeklyAgenda.vue`, `app/pages/releases/[id]/index.vue`, `app/pages/tickets/[id]/index.vue`, `app/pages/tickets/new.vue`, `app/components/GlobalSearch.vue`
- `tests/unit/tickets.test.ts`, `tests/unit/domain-schemas.test.ts`, `tests/e2e/ticket-status-moves.test.ts`, `tests/e2e/agenda-status.test.ts`, `tests/e2e/release-ticket-status.test.ts`, `tests/e2e/tickets.test.ts`, `tests/e2e/ticket-context-popovers.test.ts`, `tests/e2e/search.test.ts`, `tests/e2e/ticket-board-quiet-done.test.ts`

## Approach

1. After approval, update `shared/ticket-status.ts` with `On hold` first and `ticketStatusIcons['On hold'] = 'lucide:pause'`. Preserve the ordering of the current seven statuses and keep all status icons neutral.
2. Update `server/db/schema.ts` and rely on the shared list for Effect create/update validation. Generate and inspect a single additive Drizzle migration that adds `On hold` to PostgreSQL's enum before applying it to an isolated, agent-owned test database. Do not rewrite existing ticket statuses or change the column default.
3. Reuse the shared list/map in existing Board lanes, status menus/selectors, and status-aware ticket identity components. Confirm all four current status mutation surfaces can select On hold and all existing identity surfaces show the pause icon. Keep the New ticket form unchanged, with its Idea default.
4. Add focused unit/API/browser coverage for the new enum value, icon mapping, leftmost lane, all current status controls, persisted writes, existing-status compatibility, and unchanged Done/priority behavior. Verify On hold remains visible in the active Board even when old, and is treated as unfinished in Release progress.
5. Update `PLAN.md` and draft/index ADR 0055 only after plan approval. Record exact verification commands, migration evidence, supported-width inspection, deviations, and review outcomes in this milestone file.

## Files to modify

- `shared/ticket-status.ts` — fixed ordered status list and neutral icon map.
- `server/db/schema.ts`, generated `drizzle/*.sql`, and `drizzle/meta/*` — enum and additive migration metadata.
- `server/domain/schemas.ts` — shared create/update validation follows the expanded list.
- Existing status surfaces as needed: `app/pages/tickets/index.vue`, `app/components/TicketStatusMenu.vue`, `app/components/TicketWorkItem.vue`, `app/pages/agenda.vue`, `app/components/WeeklyAgenda.vue`, `app/pages/releases/[id]/index.vue`, `app/pages/tickets/[id]/index.vue`, and status-aware search components.
- Existing focused tests listed in Source references; add/edit fixtures only where needed.
- After approval: `PLAN.md`, `docs/decisions/README.md`, new `docs/decisions/0055-on-hold-ticket-status.md`, and this milestone file.

No dependency, auth, deployment, or new endpoint changes are planned.

## Reuse

- Reuse `ticketStatuses`, `TicketStatus`, and `ticketStatusIcon` as the single source for validation, ordering, labels, and status icons.
- Reuse the existing `TicketStatusMenu` and the Board, Agenda, Release, and ticket-detail mutation paths. Do not introduce a parallel status write/cache path.
- Reuse existing enum migration, isolated database, authenticated E2E fixture, and Board horizontal-scroll patterns; retain the existing `Idea` default and Done-specific rules.
- Reuse existing neutral status-icon styling. No status color system or dependency is needed.

## Decisions and ADR links

- User request: add a pause state, put it at the far left of Ticket Board, and use a pause icon.
- Planner recommendation for review: label/value `On hold`, not `Hold`, based on the clearer state wording and comparison to Linear's customizable statuses and Jira's documented On Hold status.
- Boundary: this is a ticket **status**, not a ticket priority. ADRs 0053/0054 exclude On hold from the priority values; they do not prevent adding this separate workflow status.
- Proposed durable decision record after plan approval: ADR 0055. It will be accepted after code review.

## Implementation checklist

- [x] Receive explicit Plannotator approval of this milestone plan before implementation (`pn-992142`, 2026-10-13).
- [x] Resolve the New ticket form question: keep the form unchanged and retain the Idea default.
- [x] After approval, update the current roadmap and draft/index Proposed ADR 0055.
- [x] Add On hold first in the shared status list and use the `lucide:pause` status icon.
- [x] Add the PostgreSQL enum value in one additive migration; verify the existing row remains present and the Idea default remains unchanged.
- [x] Make On hold available across all current status menus/selectors and verify status icons across ticket identity surfaces.
- [x] Verify the Ticket Board lane is far left, with no page-level overflow at 1280 CSS px and intact local horizontal scrolling.
- [x] Verify On hold is non-Done: visible under quiet-Done behavior and counted as unfinished in Release progress.
- [x] Add/update unit, API, and E2E coverage for On hold plus existing status, priority, archive, and Done regressions.
- [x] Run all approved local checks, including full Playwright E2E, against the final worktree; record exact evidence below.
- [x] Perform a manual visual/accessibility check at the supported 1280 CSS px minimum.
- [x] Submit the implementation for human code review; Plannotator session `pn-79dd64` approved with no changes requested, so ADR 0055 is now Accepted.
- [x] Record the human completion declaration before closing M43.

## Journal

### 2026-10-13 — Planning research

- Fact: the shared status list currently contains Idea, Estimate, Develop, Review, Test, Deploy, Done in that order; it drives both Board lane order and current status options/icons.
- Fact: PostgreSQL stores status in a fixed enum. API schemas derive allowed values from the shared list, ticket creation defaults to Idea, and the New ticket UI currently has no Status field.
- Fact: the current status controls are on Board cards, Agenda entries, Release detail tickets, and ticket detail. The shared status icon is also used in ticket identity/search surfaces.
- Research: Linear's documentation describes configurable team issue statuses and separate categorization labels; Jira's board documentation includes On Hold as a status. These support using a workflow status, not a priority or label. The exact URLs are listed above.
- Decision proposed: use the human-readable label/value On hold, `lucide:pause`, and first position in the status list/Board lanes.
- Fact: before drafting, `git status --short --branch` showed user modifications in `PLAN.md` and `docs/milestones/m42-ticket-priorities.md`. The user later reported committing the M42 update; current status shows `PLAN.md` still modified and the M42 milestone clean. Preserve the remaining `PLAN.md` change and do not reset it.
- Evidence: read the required workflow, roadmap, milestone template, relevant status/priority decisions and milestones, current status sources/components/APIs/tests, and the Plannotator skill. Verified `lucide:pause` is available in the installed icon collection. No application code, schema, migration, roadmap, or ADR has been changed for M43.

### 2026-10-13 — First Plannotator feedback

- Decision: keep the New ticket form unchanged and retain Idea as the default; no Status field will be added in M43.
- Fact: the user reported committing the earlier M42 changes during review. `git status --short --branch` confirms `docs/milestones/m42-ticket-priorities.md` is clean and `PLAN.md` remains modified; the latter will be preserved and updated only within the approved M43 scope.
- Evidence: Plannotator session `pn-6a9b07` answered the form question and annotated the worktree note. Feedback was incorporated; plan approval remained pending until the resubmission below.

### 2026-10-13 — Final plan approval

- Decision: the user approved the M43 plan in Plannotator. The accepted plan uses the label `On hold`, places it first/leftmost, assigns `lucide:pause`, and leaves the New ticket form unchanged with Idea as its default.
- Evidence: Plannotator session `pn-992142` returned Approved after the feedback was incorporated.
- Status: plan approval is complete. Implementation began only after the user's follow-up “go”; roadmap and Proposed ADR 0055 updates are now part of the approved scope.

### 2026-10-13 — Implementation and verification

- Decision followed: added the exact status/label `On hold` before Idea, mapped it to `lucide:pause`, preserved the Idea default and unchanged New ticket form, and kept On hold out of the priority model.
- Implementation: the shared ordered list/icon map now drives the additional first Board lane, all existing status menus/selectors, and status identity icons. The Board uses eight columns with a 120rem local content minimum so each lane retains its previous width; the existing Board-local horizontal scrolling remains in place. Added/indexed Proposed ADR 0055 and M43 in `PLAN.md`, preserving the user's pre-existing M42 roadmap edits.
- Migration: `drizzle/0011_shocking_midnight.sql` contains only `ALTER TYPE "public"."ticket_status" ADD VALUE 'On hold' BEFORE 'Idea';`. Applied via Drizzle to the isolated agent-owned PostgreSQL container `btt-m43-postgres-20261013-pi` on port 55432, database `btt_m43`. The Drizzle migration journal contains entry 0011. No dependency, API endpoint, default, or existing status value was replaced.
- Database evidence: final enum order is `On hold, Idea, Estimate, Develop, Review, Test, Deploy, Done`; `information_schema.columns` reports the ticket status default as `'Idea'::ticket_status`. A transaction inserting a ticket without a status returned `Idea` and was rolled back. The pre-migration fixture row `50000000-0000-7000-8000-000000000043` remained present with its existing value immediately after the DDL; the subsequent storage check set that same row to On hold. Temporary E2E search fixtures were cleaned from the isolated database.
- Coverage: unit/API tests cover ordered statuses, icon mapping, request validation, direct On hold creation/update, and unchanged defaults. E2E tests cover Board lane order/drag/status menu, Agenda, Release detail, ticket detail, search identity icons, stale On hold visibility, Release progress (`1 of 2` done with On hold unfinished), archive behavior, and existing priority/Done paths.
- Visual check: at Chromium's supported 1280 CSS px width, manually inspected `/tmp/btt-m43-ticket-board-1280.png`. On hold is the first visible lane; its heading and ticket status show the pause icon. Content remains inside the Board's horizontal scroller without page-level horizontal overflow. Browser checks also exercised Board scrolling and verified document width does not exceed the viewport.
- Verification: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm check:duplicates`, `pnpm check:unused`, `pnpm test` (79 tests), `pnpm build`, `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and `git diff --check` all passed on the implementation worktree. Lint reports two existing `consistent-function-scoping` warnings in `tests/e2e/ticket-context-popovers.test.ts` (lines 254 and 257); that file is unchanged. `pnpm check:duplicates` passed with no new clones after reducing test cleanup to the fixture IDs.
- Browser verification: focused status/search coverage passed, then `pnpm test:e2e --workers=1 --retries=0` passed all 50 tests in 2.1 minutes against the agent-owned server and isolated database. The Playwright runner used the same isolated `BETTER_AUTH_SECRET` as the server.
- Investigation/deviations: the first targeted Playwright run omitted the server's test secret from the runner and returned 401; rerunning with matching auth configuration fixed it. The search icon assertion was split into a focused E2E case after the long search test timed out with concatenated queries; the new case waits for Nuxt client mount and selects the ticket result by its status-icon marker. Adding the first lane also exposed a drag-test helper assumption: a partially clipped destination lane had its left edge inside the viewport but its center outside, causing the helper to choose the wrong edge. The helper now chooses based on the lane center; the status drag test and final full E2E suite pass. An initial duplicate-code check flagged three clones in copied fixture cleanup; cleanup now deletes the known fixture rows directly, and the final duplicate check passes.
- Server lifecycle: kept the agent-owned Nuxt server running through all checks, then stopped it after the final E2E pass and verified port 3000 was released. Stopped the isolated PostgreSQL container and verified port 55432 was released.
- Status at implementation handoff: local verification was complete; human code review and the completion declaration were pending.

### 2026-10-13 — Human code review

- Evidence: Plannotator code review session `pn-79dd64` approved the M43 changes with no requested changes.
- Decision: accepted ADR 0055 after the approved code review.
- Status: implementation and code review are complete; the human completion declaration was still pending at that point.

### 2026-10-13 — Human completion declaration

- Decision: the human declared, “i declare this milestone complete.”
- Status: M43 is complete; all approved scope, verification evidence, human code review, and ADR acceptance are recorded.

## Verification

Planning-artifact checks before review:

- [x] `node scripts/check-workflow-docs.mjs` — passed during planning; rerun after implementation and the current milestone edits (see below).
- [x] `pnpm exec oxfmt --check docs/milestones/m43-on-hold-ticket-status.md` — passed during planning; `pnpm format:check` passed on the final implementation worktree.
- [x] `git diff --no-index --check /dev/null docs/milestones/m43-on-hold-ticket-status.md` — no whitespace diagnostics during planning; final `git diff --check` passed after implementation.
- [x] First Plannotator review (`pn-6a9b07`) — feedback received; the form question is resolved as above.
- [x] Resubmit the revised file through Plannotator with an approval gate; approved in session `pn-992142` on 2026-10-13.

Implementation verification after approval:

- [x] Generate and inspect the migration; apply it only to an isolated agent-owned test database. Verify the existing fixture row remains present, the enum accepts On hold, and the default remains Idea.
- [x] `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm check:duplicates`, `pnpm check:unused`, `pnpm test`, `pnpm build`, `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and diff/whitespace checks.
- [x] Focused status E2E coverage, then the full `pnpm test:e2e --workers=1 --retries=0` suite against an agent-owned app server and isolated test database; followed ADR 0050/`docs/llm-workflow.md` server ownership and handoff requirements.
- [x] Manually inspect Board lane ordering, pause icon/labels, current status selectors, and no-overflow/local horizontal scrolling at 1280 CSS px. Confirmed On hold remains visible and unfinished rather than Done.

## Review status

- Plan review: Approved via Plannotator session `pn-992142` on 2026-10-13.
- Code review: Approved via Plannotator session `pn-79dd64` with no changes requested; ADR 0055 accepted.
- Milestone completion declaration: Declared by the human on 2026-10-13; M43 complete.

## Follow-ups

- No implementation follow-ups identified. Any new scope or migration/deployment concern requires approval before implementation.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred.
- [x] Verification evidence recorded.
- [x] Human code review accepted.
- [x] Human completion declaration recorded in the journal and review status.
