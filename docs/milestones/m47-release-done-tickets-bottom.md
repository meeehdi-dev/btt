# M47 — Release Done tickets at the bottom

## Context

Long-lived maintenance releases accumulate completed tickets that obscure unfinished work. Separate Done cards below unfinished cards without hiding history.

## Approved scope

Human approved [the focused plan](../../plans/release-done-tickets-bottom.md) in Plannotator `pn-d7538f` and explicitly instructed Build to begin. That document defines the implementation scope, requirements R1–R6, ordered steps, and validation; do not duplicate it here. Human subsequently approved the [focus simplification amendment](../../plans/release-focus-simplification.md) in `pn-781184` and explicitly authorized Build on 2026-10-20. It removes only automatic Release focus recovery; all shortcuts and other focus behavior remain.

## Out of scope

No API/data/auth/dependency changes, collapse controls, Board visibility changes, or unrelated M45 work.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- [Focused plan](../../plans/release-done-tickets-bottom.md)
- ADRs 0027, 0028, 0046, and 0062.
- Actual human implementation approval authority: current Build instruction and supplied Plannotator approval `pn-d7538f`.

## Requirements and acceptance criteria

R1–R6 in the focused plan: unfinished-first placement, stable within-section order, edge states, reactive status moves, interaction parity and keyboard access with explicit control reacquisition, and supported desktop layout. Automatic focus transfer after section remounts is not required.

## Risks and stop conditions

Section remounts may leave focus on the body; default browser/component behavior is accepted. Preserve ordinary keyboard access, full-list completion counts, and default visibility. Stop for approval if implementation requires broader architecture, API, or dependency changes.

## Approach

Stable page-local partitions, shared existing card markup, and a labeled horizontal Done separator above a nonempty Done grid. Preserve page-owned writes and refresh/retry behavior.

## Files to modify

Release detail page; release status and API ordering E2E tests; next available ADR and index; roadmap; this evidence journal. Exact paths and boundaries are in the focused plan.

## Reuse

Existing EntityCard, TicketWorkItem, hierarchy/context components, status handler, data invalidation, and Nuxt UI Separator.

## Decisions and ADR links

[Proposed ADR 0063](../decisions/0063-release-done-ticket-sections.md) records the narrow Release-only exception to ADR 0028. Historical accepted text is unchanged.

## Implementation checklist

- [x] Human plan approval.
- [x] Release grouping and separator, preserving interactions; automatic focus recovery removed by approved amendment.
- [x] Focused regression coverage and narrow ADR/roadmap updates.
- [x] Amendment final-worktree automated/manual checks recorded; latest full default-parallel suite passes, with earlier failures retained.
- [x] Independent Review and human code review.
- [x] Human completion declaration.

## Journal

### Planning

- Fact: inspected Release detail, sibling project detail and Board cards, ticket-list API, status/order tests, and relevant workflow/ADRs.
- Fact: saved the focused plan; no application code changed, tests run, or services managed during Plan.
- Decision: implementation approval remains pending.

### Build implementation

- Initial Git state: only the supplied plan and M47 journal were untracked; no tracked changes. M45 left untouched.
- Read installed Nuxt UI guidance, upstream skill and Separator reference (`https://ui.nuxt.com/docs/components/separator`). Reused existing card markup with two stable page-local groups and a non-decorative labeled separator. Added narrow lost-focus recovery after Done-boundary updates.
- Added edge-state/failure assertions, mixed estimated/unestimated API-versus-DOM ordering, keyboard transitions, modal creation invalidation, and Done-section context/density parity. Shared a file-local release fixture instead of adding duplicate test setup/cleanup.
- Added Proposed ADR 0063, its index entry, and M47 roadmap entry. No API/schema/dependency or other route behavior changes.

## Verification

Evidence logs: `/tmp/btt-m47-verify/`. Disposable agent-owned PostgreSQL container `btt-m47-verification`, ID `d9f4e761a83c41a341ccc6b7e1f1baae00e9794ce778f8ee00f14294b20c9d71`, uses installed `postgres:18`, loopback port 55438, database `btt_m47`. No user database is migrated/reset. Explicit process environment sets `DATABASE_URL` to that database, a test-only `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL=http://127.0.0.1:3017`.

- First non-browser run: `pnpm db:migrate`, `pnpm format:check`, `pnpm lint`, `pnpm check:unused`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test`, `pnpm build`, `pnpm check:workflow`, and `git diff --check` passed. `pnpm check:duplicates` failed on two new test setup/cleanup clones; full output preserved in `check-duplicates.log`. Fixed by sharing a file-local fixture (no baseline/config changes).

### Final implementation checks and browser evidence

All commands below use the explicit isolated database/auth environment described above. Browser commands also set `PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3017`.

- Duplication iterations: the fixture extraction exposed overlapping previously baselined token runs; logs `final-check-duplicates.log`, `duplicates-fixed.log`, and `duplicates-fixed-2.log` preserve these failures. Simplified pending promises with `Promise.withResolvers`, reused a small local request helper, removed redundant settings deletion (user FK cascades), and made hierarchy cleanup transactional. `duplicates-fixed-3.log` and the final check pass, without changing the baseline or exclusions.
- Final non-browser run (`final2-*.log`): `pnpm db:migrate`, `pnpm format:check`, `pnpm lint`, `pnpm check:duplicates`, `pnpm check:unused`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (20 files, 109 tests), `pnpm build`, and `pnpm check:workflow` all exit 0. `git diff --check` passes.
- Agent-owned server: `pnpm dev --host 127.0.0.1 --port 3017`, launcher PID 79784, log `server.log`, PID file `server.pid`. Initial HTTP response 302. Kept running throughout browser failures; user services untouched.
- Focused command: `pnpm exec playwright test tests/e2e/release-ticket-status.test.ts tests/e2e/api-item-ordering.test.ts tests/e2e/ticket-context-popovers.test.ts --workers=1`. First run 5/6: new grouping test clicked completion before hydration; fixed using existing `waitForClientMount`. Second run 5/6: exact Title locator omitted the required-field `*`; fixed to `/^Title/` (no timeout increase). First/second failure contexts preserved in `first-focused-results/` and `second-focused-results/`, logs `focused-1.log` and `focused-2.log`.
- `focused-3.log` and final `focused-final.log`: all 6 pass. Screenshot capture now disables CSS animations to avoid inspecting intermediate color-transition frames; no application theme changes.
- First default `pnpm test:e2e`: 69/70 pass, Reports project rename test remained in Clients grouping after its initial Projects click (`reports.test.ts:224`). Evidence: `full-1.log`, `full-first-results/`. A targeted diagnostic `pnpm exec playwright test tests/e2e/reports.test.ts --grep 'project renames' --workers=1 --trace=on` passes (`reports-diagnostic.log`).
- Second default `pnpm test:e2e`: 67/70 pass; the same Reports test fails plus existing New client dialog opening and release archive navigation assertions (`entity-modals-and-toasts.test.ts:31`, `auth-shell.test.ts:363`). Full evidence: `full-2.log`, `full-second-results/`. No M45, shared hydration, or unrelated test changes made. Hypothesis: early-interaction/hydration races under parallel load; root cause not proven by the snapshots alone.
- Diagnostic `pnpm exec playwright test tests/e2e/auth-shell.test.ts tests/e2e/entity-modals-and-toasts.test.ts tests/e2e/reports.test.ts --workers=1 --trace=on`: all 10 pass in 36.3s (`unrelated-diagnostic.log`).
- Full serial `pnpm test:e2e --workers=1 --trace=on`: all 70 pass in 4.6m (`full-serial.log`), including every M47 case. No retries, skips, changed expectations, timeouts, or config/CI modifications. This does not erase the two default-parallel failures.

### Agent visual and keyboard acceptance

- Inspected verification-server screenshots at 1280×900 and 1600×900 in light and dark modes: odd unfinished count leaves its final card on the left; Done starts below both columns on a fresh row, with a quiet full-width labeled divider. Long titles truncate, usage stays visible, hierarchy/status controls fit, and compact spacing is unchanged. Dark-mode settled captures are readable (initial captures were mid-transition, corrected in screenshot options).
- Screenshots preserved under `/tmp/btt-m47-verify/focused-final-results/release-ticket-status-rele-f902e-ed-grid-and-preserves-focus-chromium/release-{1280,1600}-{light,dark}.png`.
- Browser-driven Enter selection across unfinished → Done → On hold verifies the moved status control is focused after each refresh; the document marker survives (no reload). Existing pointer/error/retry checks pass. This is agent browser verification, not human acceptance.

### Human verification decision and server release

- Human explicitly selected: **“Accept serial verification; stop the agent server and hand off to Review.”** This accepts the 70/70 serial full-suite evidence for M47, not code acceptance or milestone completion. Default-parallel failures remain visible above and as follow-ups; no broader investigation/fixes were authorized.
- Stopped only the tracked agent-owned app (`kill -TERM 79799 79784`). After shutdown, `lsof -nP -iTCP:3017 -sTCP:LISTEN` reports no listener: app port released.
- Stopped disposable database with `docker stop btt-m47-verification` (container retained, not removed). `lsof -nP -iTCP:55438 -sTCP:LISTEN` reports no listener: database port released. User services untouched.
- Final diff inspection: changes limited to Release grouping/focus, three E2E files, Proposed ADR/index, roadmap, and M47. Supplied focused plan remains unchanged. Human Git writes, code review, and completion remain pending.

### Focus simplification amendment — 2026-10-20

- Authority: human approval in Plannotator `pn-781184` and explicit Build instruction; no code acceptance or completion authorized.
- Initial Git state: inherited uncommitted M47 page/tests/roadmap/ADR-index changes and untracked plans, ADR, journal and historical reviews. Preserved existing work and M45; no Git writes.
- Removed only the post-status `nextTick`, body-focus check, DOM query and focus call; unconditional pending cleanup remains. No replacement abstraction.
- Renamed the grouping test, removed automatic-focus assertions, and explicitly focused the live replacement locator after enabled/Done assertions before the reverse keyboard transition. Also removed the same obsolete On hold focus assertion from the existing failure/retry scenario; it too crosses the Done boundary. Both keyboard submissions, grouping, no-reload and other coverage remain.
- Aligned original R5/steps/validation/risk text, Proposed ADR 0063 and the M47 roadmap/live summary. Historical focus results and original review reports remain unchanged.
- Verification logs: `/tmp/btt-m47-focus-verify/`. Restarted the existing agent-owned disposable `btt-m47-verification` PostgreSQL container on loopback 55438; same isolated `btt_m47` database. Explicit environment uses that database, a test-only auth secret and `BETTER_AUTH_URL=http://127.0.0.1:3017` (private temporary `env.sh`, no user database or secrets).
- Non-browser commands: `pnpm db:migrate`, `pnpm lint`, `pnpm check:duplicates`, `pnpm check:unused`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (20 files / 109 tests), `pnpm build`, `pnpm check:workflow` all exit 0; `git diff --check` passes. Logs named after each command with `:` replaced by `-`.
- **Initial format blocker (resolved by human direction below):** `pnpm format:check` exits 1, listing only inherited `plans/release-focus-simplification.md` and historical `reviews/release-done-tickets-bottom-20261020T170744Z.md`. No amended application/test/docs file is flagged. Preserved both input artifacts unchanged; requesting direction before formatting the historical report or accepting an exception.
- Started tracked agent-owned `pnpm dev --host 127.0.0.1 --port 3017`; launcher PID in `/tmp/btt-m47-focus-verify/server.pid`, log `server.log`. Kept running while format gate remains unresolved; no user services touched.
- Browser environment: `PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3017`. Focused command `pnpm exec playwright test tests/e2e/release-ticket-status.test.ts tests/e2e/api-item-ordering.test.ts tests/e2e/ticket-context-popovers.test.ts --workers=1 --output=/tmp/btt-m47-focus-verify/focused-results`: **6/6 pass in 18.9s** (`focused.log`). Full command `pnpm test:e2e --trace=retain-on-failure --output=/tmp/btt-m47-focus-verify/full-results`: **70/70 pass using default six workers in 1.2m**, first attempt, no retries/skips/config/timeout changes (`full.log`). This is new parallel evidence, not reliance on prior serial acceptance.
- Agent visual inspection of fresh 1280×900 light and 1600×900 dark captures: compact two-column cards, long-title truncation, odd unfinished last row, full-width readable Done divider, and Done starting below both columns all retained. All four width/theme captures are in `focused-results/release-ticket-status-rele-7bc27-ith-keyboard-status-changes-chromium/`.
- Additional browser-driven interaction smoke: temporary `/tmp/btt-m47-focus-verify/manual.spec.ts` via `pnpm exec playwright test --config=/tmp/btt-m47-focus-verify/manual.config.ts --output=/tmp/btt-m47-focus-verify/manual-results`. Enter selects Done then On hold with explicit replacement-control focus; observed body focus after both remounts. Explicit focus still opens controls and Tab advances focus. `/` focuses global search; Meta+Enter saves New client; Escape dismisses a reopened modal. First smoke completed interactions but failed teardown due to fixture hierarchy FK restrictions (`manual.log`); fixed only temporary cleanup, deleted that exact orphaned agent fixture, reran **1/1 pass** (`manual-2.log`). No repository application/test changes for this diagnostic. This is agent observation, not human acceptance.

- Human verification direction: selected **“Apply formatting-only changes to both files, reverify, and hand off to Review.”** Ran `pnpm exec oxfmt plans/release-focus-simplification.md reviews/release-done-tickets-bottom-20261020T170744Z.md`; only Markdown formatting changed, with original requirements/findings/history preserved. This narrow exception authorizes no review-content rewrite or unrelated cleanup.

- Post-format final non-browser rerun: all ten required pnpm commands above exit 0, now including `pnpm format:check`; `git diff --check` passes (`final-*.log`). Focused suite **6/6 pass in 15.8s** (`final-focused.log`).
- **Final parallel rerun failed: 68/70 in 1.9m** (`final-full.log`; same full command/output path prefix `final-full-results`). `agenda-week.test.ts:999` lacked the expected drag-preview status `15:00–16:00`; `auth-shell.test.ts:351` lacked the expected `Project name saved.` toast after Tab. All Release/M47 cases passed. Read complete failure output; traces/error contexts retained under `final-full-results/`. Root causes unproven; no unrelated source/test/timeout changes made. Earlier 70/70 parallel pass remains evidence but does not erase this final failure. Kept agent server/database running and requested human direction as required by the approved amendment.

- Human selected **“Run focused diagnostics for the two failures and a full serial suite; ask again before accepting any remaining parallel failure.”** Ran `pnpm exec playwright test tests/e2e/agenda-week.test.ts tests/e2e/auth-shell.test.ts --grep 'week gestures|creation modals preserve hierarchy' --workers=1 --trace=on --output=/tmp/btt-m47-focus-verify/diagnostic-results`: **2/2 pass in 13.2s** (`diagnostic.log`). Then `pnpm test:e2e --workers=1 --trace=on --output=/tmp/btt-m47-focus-verify/serial-results`: **70/70 pass in 4.7m** (`serial.log`). No source changes, retries, skips, expectation/timeout changes or reliability fixes. Serial pass does not prove root causes or clear the final parallel failure. Await explicit verification acceptance; app/database remain running.

- Human selected **“Keep Build open and investigate parallel failures further; preserve the narrow application scope.”** Diagnostic-only inspection: Agenda failure trace shows create mouse-down at monotonic 24696.839ms while preceding resize invalidation GETs were still in flight (week/tickets/settings complete around 24865–24868ms). `WeeklyAgenda.vue` rejects new gestures while `busy` and resets gestures on busy/row changes; `agenda.vue` keeps busy through invalidation. The test polls persisted API state before starting the next gesture, not UI refresh completion: evidence supports a test/UI-readiness race, not a timeout-budget shortage. Project trace has no project PATCH after fill/Tab, and failure snapshot shows the original name; `waitForClientMount` waits only for root `__vue_app__`, not page hydration completion. Hydration overwriting the early edit is a hypothesis, not independently proven. Neither failure involves the removed Release focus block. No unrelated fix was authorized or made.
- Parallel focused diagnostic: `pnpm exec playwright test tests/e2e/agenda-week.test.ts tests/e2e/auth-shell.test.ts --grep 'week gestures|creation modals preserve hierarchy' --workers=2 --trace=on --output=/tmp/btt-m47-focus-verify/parallel-diagnostic-results`: **2/2 pass in 9.6s** (`parallel-diagnostic.log`).
- Latest full default-parallel command: `pnpm test:e2e --trace=retain-on-failure --output=/tmp/btt-m47-focus-verify/parallel-investigation-results`: **70/70 pass using six workers in 1.3m** (`parallel-investigation.log`). No application/test/config changes between the failed and successful parallel runs, no automatic retries/skips, and no timeout increases. This latest green suite meets the verification gate without serial-only acceptance; intermittent reliability remains a follow-up, not a claimed fix.

- After all required gates passed, stopped only tracked agent app PIDs 91047/91030 (`kill -TERM`) and verified `lsof -nP -iTCP:3017 -sTCP:LISTEN` has no listener. Stopped disposable `btt-m47-verification` with `docker stop` (retained, not removed); verified no listener on 55438. User services untouched. Final documentation/diff checks `pnpm format:check`, `pnpm check:workflow`, `git diff --check` pass (`handoff-format.log`, `handoff-workflow.log`).
- Final scope inspection: only Release status recovery deletion, its coupled test changes, listed M47 docs, and explicitly authorized formatting of the inherited plan/review. Other inherited M47 changes and M45 preserved. Human code acceptance, ADR acceptance and milestone completion remain pending; no Git writes.

### Finalize — 2026-10-20T18:00:03Z

- Authority: direct human instruction to begin Finalize with supplied review/UI decisions. Scope includes the focus amendment and inherited Release Done grouping plan; no additional acceptance is inferred.
- Independent [review report](../../reviews/release-focus-simplification-20261020T175511Z.md): no actionable findings across the full inherited M47 uncommitted scope against HEAD `b442581575ebba538a7e481c3779dc11ebd428e3`. Reviewer independently passed non-browser checks, including 109 tests; browser/build/database evidence remains attributed to Build.
- Human approved the full M47 diff in Plannotator `pn-9e156c`, with no changes requested (supplied handoff decision).
- Human approved the live UI at `http://localhost:3001/` in Plannotator `pn-6b8e75`, with no annotations (supplied handoff decision). UI ran no checks, changed no files and did not manage the user-owned server. Approval does not establish specific route or interaction coverage.
- Latest Build full E2E evidence remains 70/70 using six workers; earlier intermittent failures and diagnostics above are preserved, not claimed fixed. Accepted tradeoff remains no automatic Release focus recovery.
- Finalize updated only this journal; no tests/checks rerun, application changes, server management or Git writes. M45 and historical records remain unchanged. ADR 0063 remains Proposed; ADR acceptance and the human milestone completion declaration remain unauthorized/pending.

### Human completion declaration — 2026-10-20T18:12:22Z

- Human stated: **“i declare this milestone complete”**. Recorded M47 as Complete, covering Release Done grouping and its approved focus simplification amendment.
- Approved implementation/check evidence and human code/UI approvals are recorded above. Known browser reliability follow-ups remain; no additional verification or reliability fix is claimed.
- This declaration does not separately accept ADR 0063; it remains Proposed. M45 and historical records are unchanged. No checks rerun or Git writes.

## Review status

- Milestone status: **Complete**, by direct human declaration recorded above.

- Plan review: Approved in `pn-d7538f`; focus amendment approved in `pn-781184`.
- Independent review / comparison scope: No actionable findings; full inherited M47 scope against HEAD `b442581575ebba538a7e481c3779dc11ebd428e3`, per linked report.
- Human code review: Approved in `pn-9e156c`, no changes requested (supplied handoff decision).
- Human live UI review: Approved in `pn-6b8e75`, no annotations; coverage limitations recorded above.
- ADR 0063 acceptance: Pending; remains Proposed.
- Milestone completion declaration: Recorded on 2026-10-20; M47 Complete.

## Fresh-session handoff

- Current reference: `/Users/mehdi/code/btt/plans/release-focus-simplification.md`, including inherited `/Users/mehdi/code/btt/plans/release-done-tickets-bottom.md` scope.
- Independent Review, human diff approval, optional live UI approval and the human completion declaration are recorded above. M47 is Complete; no next phase is requested. Separate ADR acceptance remains pending.
- Preserve M45 status, input reports and user work. Latest parallel browser evidence and agent service release evidence are above; earlier serial acceptance describes the original Build only. Git writes remain human-owned.

## Follow-ups

Original six-worker browser runs exposed unrelated early-interaction failures in Reports, New client creation, and release archive navigation. Amendment verification additionally exposed an Agenda create-after-resize readiness race and a project-name edit not reaching PATCH (hydration remains a hypothesis). Latest amendment six-worker suite and full serial suite both pass, but no reliability fix is claimed. Preserve evidence above; any test/shared-readiness fixes require separate scope approval.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred.
- [x] Verification evidence recorded.
- [x] Human code review accepted.
- [x] Human completion declaration recorded in journal and review status.
