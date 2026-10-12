# M40 — Ticket Board card title and tracked-time alignment

> **Status: Complete — implementation, local verification, Plannotator code review, and the user's completion declaration are recorded.**

## Context

The user reports that Ticket Board ticket cards do not look vertically aligned between the ticket title and the clock/tracked-time/estimate content.

### Confirmed facts

- `app/components/TicketBoardCard.vue` renders the ticket title/status action and tracked usage together in the card header via `TicketWorkItem`.
- The header and its title/usage children use flex `items-center`, so their boxes are nominally center-aligned. The Board opts into `usageTextSize="xs"`, but `TicketTrackedUsage.vue` still renders its clock glyph at `size-4` (16px).
- `tests/e2e/ticket-context-popovers.test.ts` checks the horizontal placement of the title and usage group, but does not assert vertical alignment among the title, status icon, clock icon, and tracked/estimate text.
- A health check found no app server responding at `127.0.0.1:3000`; this confirms a code/test coverage gap and a plausible compact-scale mismatch, but does **not** visually reproduce or prove a measured offset in the running app.

### Hypothesis

The 16px clock glyph may look oversized beside the Board's 12px tracked-time text, creating the reported optical misalignment even though the flex boxes use center alignment. Confirm the rendered geometry and visual appearance before choosing the CSS adjustment; do not reduce the status-menu button or change time typography without evidence.

## Approved scope

- Correct the vertical/optical alignment of the status-icon/title and clock/tracked-time/optional-estimate content in Ticket Board cards at the supported 1280 CSS px minimum and wider.
- Keep any sizing/alignment change scoped to the Ticket Board compact presentation. Reuse the shared ticket/usage components with an explicit compact behavior if required; do not unintentionally change Agenda, Release detail, or ticket detail.
- Preserve title navigation, status-menu behavior, time values and formatting, estimate semantics, usage ratio colors, drag-and-drop, context controls, and horizontal board scrolling.

## Out of scope

- API, database, data, or time-calculation changes.
- Changes to status-menu hit targets, ticket status behavior, ticket card content/order, Agenda or Release card geometry, or the application's spacing policy.
- Dependency, authentication, deployment, CI-policy, or schema changes.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`
- `docs/milestones/m32-ticket-board-status-icons-cards-and-done-visibility.md` — compact Board card treatment and existing verification history
- `docs/milestones/m34-agenda-board-status-icon-menus.md` — status-icon action and drag protections
- `docs/decisions/0020-m8-polish-decisions.md` — tracked-time/estimate presentation and ratio colors
- `docs/decisions/0042-desktop-only-ui-and-spacing.md` — 1280 CSS px support floor and compact spacing
- `docs/decisions/0048-agenda-and-board-status-icon-menus.md` — Board status menu behavior
- `.agents/skills/nuxt-ui/SKILL.md` — reviewed maintainer-guidance pointer; consult relevant upstream component reference before implementation if needed
- `app/components/TicketBoardCard.vue`, `app/components/TicketWorkItem.vue`, `app/components/TicketTrackedUsage.vue`
- `tests/e2e/ticket-context-popovers.test.ts`, `tests/e2e/ticket-status-moves.test.ts`

## Approach

1. Reproduce the reported appearance in the running app at 1280 CSS px using Board cards with tracked time, with and without estimates, and representative short/long titles. Record a screenshot and inspect the title text, status trigger/icon, usage wrapper, clock glyph, tracked value, and estimate label bounds.
2. Determine whether the cause is a real box-center offset, an oversized 16px clock glyph beside compact text, or another local line-height/alignment rule. Choose the smallest Board-only correction based on this evidence. A compact clock glyph for `xs` usage is a candidate only if visual inspection supports it; preserve the status trigger's current hit target.
3. Extend the existing Board-card E2E geometry helper in `tests/e2e/ticket-context-popovers.test.ts` to cover vertical alignment of the title/status and usage contents, including estimate-present and estimate-absent cases. Use a small, documented pixel tolerance and keep the existing horizontal/context/drag assertions.
4. Inspect the result at 1280 CSS px and verify that other card surfaces retain their existing sizing. Run focused browser coverage and all required local checks, including the full Playwright suite against the agent-owned server; record exact outcomes here.
5. After plan approval, add the M40 summary to `PLAN.md`. No new ADR is expected: this is a localized presentation refinement governed by ADRs 0020 and 0042.

## Files to modify

- `app/components/TicketTrackedUsage.vue` — if evidence supports it, provide a compact clock-icon size for Board `xs` usage without changing other callers.
- `app/components/TicketBoardCard.vue` and/or `app/components/TicketWorkItem.vue` — only if a Board-scoped alignment adjustment is needed.
- `tests/e2e/ticket-context-popovers.test.ts` — add vertical geometry assertions and cover usage with/without an estimate.
- `PLAN.md` — add the approved M40 roadmap entry after plan approval.
- `docs/milestones/m40-ticket-board-card-title-time-alignment.md` — record implementation, verification, deviations, review, and closeout evidence.

No server, API, schema, data, or dependency files are planned.

## Reuse

- Reuse `TicketWorkItem` and `TicketTrackedUsage`; avoid duplicated title or usage markup.
- Extend `expectTwoRowBoardTicketCard` in `tests/e2e/ticket-context-popovers.test.ts`, which already measures the Board title, status trigger, usage wrapper, and compact card layout.
- Reuse existing authenticated browser fixtures and Board drag/status assertions; do not alter interaction ownership.

## Decisions and ADR links

- This plan addresses the user-reported Ticket Board card alignment only; it does not reopen or revise completed M32 or M34 scope.
- The initial plan treated the 16px clock beside `xs` usage text as a hypothesis. Live reproduction measured a 2px inline-baseline offset; the clock-size hypothesis was not supported.
- No durable product/domain decision or ADR is expected unless implementation research uncovers a broader shared-card policy that needs human approval.

## Implementation checklist

- [x] Obtain Plannotator approval of this plan before implementation.
- [x] Reproduce and measure the Board card alignment at 1280 CSS px before changing styles.
- [x] Apply the smallest evidenced, Board-scoped alignment/sizing correction.
- [x] Add E2E alignment coverage for tracked usage with and without an estimate; retain existing Board interactions.
- [x] Run focused and full browser checks, all approved local checks, and the 1280 CSS px visual review; record exact evidence below.
- [x] Add the approved M40 summary to `PLAN.md` after plan approval.
- [x] Record implementation/verification evidence in this milestone.
- [x] Submit the completed diff for human code review; Plannotator approved with no changes requested.
- [x] Record the user's completion declaration before closing M40.

## Journal

### 2026-10-12 — Planning research

- Fact: the Board card header composes status/title and usage on one flex row. Its nested containers use `items-center`; tracked usage uses `text-xs` on the Board but an unconditional 16px clock icon.
- Fact: existing Board-card E2E checks cover title/usage horizontal spacing and context-row placement, not vertical centers. The relevant test fixture includes a ticket with both an estimate and tracked time; add coverage for no-estimate usage as well.
- Fact: `curl -fsS --max-time 2 http://127.0.0.1:3000/api/health` could not connect, and no listener was found on port 3000. No live visual reproduction was performed.
- Hypothesis: the 16px clock glyph against compact 12px usage text may cause the perceived vertical/optical mismatch. This must be confirmed visually before selecting a fix.
- Evidence: inspected the required workflow and roadmap, milestone lifecycle/template, M32/M34, ADRs 0020/0042/0048, the Nuxt UI skill pointer, Board/shared usage components, and relevant E2E coverage. The worktree was clean before this plan was created. No application code was changed.

### 2026-10-12 — Plan approval

- Decision: Plannotator approved M40's plan. This authorizes the approved milestone scope.
- Evidence: Plannotator session `pn-6696d5` approved `docs/milestones/m40-ticket-board-card-title-time-alignment.md` on 2026-10-12.

### 2026-10-12 — Browser reproduction and alignment fix

- Fact: an agent-owned PostgreSQL 17 container `btt-m40-postgres-20261012-pi` was started on `127.0.0.1:55432`; the M40 database was migrated with `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/btt_m40 pnpm db:migrate`. The agent-owned Nuxt server runs on `127.0.0.1:3000` (launcher PID 32483, listener PID 32498); `/api/health` returned 200. The port was free before startup.
- Verification setup correction: the first focused Playwright attempt received HTTP 401 because the server and test helper used different Better Auth secrets. Re-running with the same `BETTER_AUTH_SECRET` for both passed; no application code changed for this setup issue.
- Fact: at 1280×900, before the UI fix, the card title/status center was y=184 and the usage wrapper center was y=184, while the clock, tracked value, and estimate centers were y=182 (16px content in a 20px usage wrapper). The no-estimate fixture showed the same 2px offset (title/status/wrapper y=308; clock/value y=306). The new 1.5px-tolerance browser assertion failed before the fix at 2px. Screenshot: `/tmp/m40-ticket-board-card-before.png`.
- Decision: the measured root cause was the Board usage wrapper's inline formatting/baseline line box, not the clock glyph's 16px size. Keep typography, clock size, and status-button target unchanged; make only the Board usage wrapper a flex-aligned container.
- Fact: `TicketBoardCard.vue` now passes `flex shrink-0 items-center` as its usage-wrapper class. Its wrapper collapses to the 16px content height and centers the clock/value/estimate with the title and status icon. The shared `TicketWorkItem`/`TicketTrackedUsage` defaults and Release/Agenda callers remain unchanged.
- Verification: at 1280×900 after the fix, all title/status/usage/clock/tracked/estimate centers matched (y=184 for the estimate card; y=308 for the no-estimate card). Focused Playwright alignment assertions passed; an after screenshot is `/tmp/m40-ticket-board-card-after.png`. The focused passing test was rerun after removing temporary screenshot/log statements.
- Scope: presentation and regression coverage only; no API, time, data, schema, or dependency behavior changed. Agent-owned app/database remain running for full verification and are not to be stopped until all required checks pass.

## Verification

Planning evidence:

- [x] `node scripts/check-workflow-docs.mjs` — passed.
- [x] `pnpm exec oxfmt --check docs/milestones/m40-ticket-board-card-title-time-alignment.md` — passed.
- [x] `git diff --check` and `git diff --no-index --check /dev/null docs/milestones/m40-ticket-board-card-title-time-alignment.md` — no whitespace diagnostics.
- [x] Plannotator plan review — approved in session `pn-6696d5`.

Implementation verification (2026-10-12):

- [x] `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/btt_m40 pnpm db:migrate` — passed against the isolated PostgreSQL 17 database.
- [x] `pnpm format:check` and `pnpm lint` — passed.
- [x] `pnpm typecheck` and `pnpm typecheck:tsgo` — passed.
- [x] `pnpm check:duplicates` and `pnpm check:unused` — passed; jscpd found the 118 fingerprinted baseline clones and no new clone.
- [x] `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/btt_m40 pnpm test` — 15 files / 77 tests passed.
- [x] `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/btt_m40 pnpm build` — passed; Vite/Rolldown emitted non-fatal plugin-timing warnings.
- [x] `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, `git diff --check`, and the no-index whitespace check for this new milestone — passed.
- [x] Focused browser coverage: `CI=true DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/btt_m40 BETTER_AUTH_SECRET=<same throwaway value on server and runner> BETTER_AUTH_URL=http://127.0.0.1:3000 GITHUB_CLIENT_ID=m40-ci-github-client-id GITHUB_CLIENT_SECRET=m40-ci-github-client-secret PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 pnpm exec playwright test tests/e2e/ticket-context-popovers.test.ts tests/e2e/ticket-status-moves.test.ts --workers=1 --retries=0 --reporter=line` — 4 passed.
- [x] Full browser suite: the same environment with `pnpm exec playwright test --workers=1 --retries=0 --reporter=line` — 48 passed, 0 failed, 0 skipped, in 2.9 minutes.
- [x] Manual 1280×900 comparison: before/after screenshots at `/tmp/m40-ticket-board-card-before.png` and `/tmp/m40-ticket-board-card-after.png`; measured inner usage contents moved from 2px above the title center to exact center alignment, with tracked time both with and without an estimate.
- [x] No retries, timeout changes, dependency changes, or remote CI runs. The app server and isolated database remained available through verification.

### 2026-10-12 — Final verification and server handoff

- Fact: non-browser verification passed on the implementation worktree: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm check:duplicates` (118 baseline clones; no new clones), `pnpm check:unused`, `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/btt_m40 pnpm test` (15 files / 77 tests), `DATABASE_URL=postgres://postgres:postgres@127.0.0.1:55432/btt_m40 pnpm build`, `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and diff whitespace checks. Build emitted only non-fatal plugin-timing warnings.
- Fact: focused browser coverage for `ticket-context-popovers.test.ts` and `ticket-status-moves.test.ts` passed 4/4 with one worker and zero retries. Full Playwright passed 48/48, 0 skipped, in 2.9 minutes with one worker and zero retries against the agent-owned server and isolated `btt_m40` PostgreSQL database.
- Fact: after the evidence/documentation updates, final `pnpm format:check` passed all 317 matched files; `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, `git diff --check`, and the no-index whitespace check for M40 passed.
- Fact: after all approved checks passed, stopped only the agent-owned Nuxt process tree (launcher PID 32483; Nuxt listener PID 32498 and tracked children). `ps` returned no tracked PIDs and `lsof -nP -iTCP:3000 -sTCP:LISTEN` returned no listeners.
- Fact: stopped only the agent-owned PostgreSQL container `btt-m40-postgres-20261012-pi`; Docker reports `exited` and `lsof -nP -iTCP:55432 -sTCP:LISTEN` returned no listeners. Existing user-owned database containers on ports 5432 and 5433 were untouched.
- Status: local verification and server handoff are complete. The diff is ready for human code review; the user's completion declaration remains pending.

### 2026-10-12 — Plannotator code review

- Decision: Plannotator approved the final implementation diff with no changes requested.
- Evidence: Plannotator session `pn-ba87c6` reviewed the changes in `btt` on 2026-10-12 and returned “Code review completed — no changes requested.”
- Status: human code review is accepted. M40 remains open only for the user's completion declaration.

### 2026-10-12 — User completion declaration

- Human declaration: “i declare this milestop complete.”
- Decision: record the user's explicit declaration and mark M40 Complete.
- Status: M40 is Complete; implementation, verification, code review, and user acceptance are recorded.

## Review status

- Plan review: Approved via Plannotator (`pn-6696d5`) on 2026-10-12.
- Code review: Accepted via Plannotator (`pn-ba87c6`) on 2026-10-12; no changes requested.
- Milestone completion declaration: Recorded on 2026-10-12 — “i declare this milestop complete.”

## Follow-ups

- None.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred.
- [x] Verification evidence recorded.
- [x] Human code review accepted via Plannotator `pn-ba87c6`.
- [x] Human completion declaration recorded in the journal and review status.
