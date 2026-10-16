# M45 — Response-range review verification fixes

## Purpose and approval boundary

This is a focused corrective amendment to M45, not a new milestone. It addresses the findings in `.pi/reviews/m45-reports-response-range-20261015T193923Z.md`: the incompatible retained-label race test, newly duplicated browser-test sequences, and the protected-input formatting blocker. The response-authoritative Reports implementation is to remain unchanged.

The desired outcome is meaningful regression coverage and a complete, passing final verification sequence. Users must retain accurate response-derived dates, disabled adjacent navigation while results are unavailable, readable selections, mounted grouping controls, and independent Settings recovery.

**Approval of this plan explicitly includes a one-time formatting-only exception for the two historical artifacts identified below.** Their original bytes must be preserved before formatting. This exception replaces only the earlier amendment's prohibition on formatting those two inputs; it does not authorize changing their meaning, editing this task's approved plan, weakening checks, or changing repository workflow policy. It is proposed Build work, not work performed during Plan.

Implementation and verification happen only in a fresh Build session after authorization. This planning session has not edited application/test/configuration files, run checks or tests, or changed services.

## Inputs and current-state evidence

### Governing inputs

- Current review, read completely: `.pi/reviews/m45-reports-response-range-20261015T193923Z.md`.
- Response-range amendment, read completely: `plans/m45-reports-response-range-fix.md`. Its authorization and incomplete final gates are recorded in the M45 journal.
- Earlier approved amendment, read completely: `plans/m45-reports-review-fixes.md`, Plannotator session `pn-f60bf4`.
- Original approved scope and execution log, read completely: `docs/milestones/m45-reports-time-allocation.md`, original approval `pn-edefcf`.
- Earlier review and discovery, read completely: `.pi/reviews/m45-reports-time-allocation-20261015T151738Z.md` and `plans/reports-discovery.md`.
- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`, milestone/ADR conventions, and relevant ADRs 0001, 0024, 0041, 0042, 0050, 0051, 0052, 0057, 0058, and Proposed 0061.

### Verified facts from this investigation

- The inspection baseline is `main` at `57a8f7f10bf1ded6cc694af1d280a5b825fa75bc`. Both tracked and staged diffs were inspected. Before this plan artifact, there were 14 modified tracked files, no staged changes, and 27 untracked files/inputs, including the new review. Preserve all existing M45 and unrelated work; do not reset, clean, stage, or commit it as part of this task.
- `app/pages/reports.vue` makes its successful current response the display authority. Adjacent buttons depend on that displayable response and are disabled during loading and failure. Grain buttons, grouping tabs, and filter controls remain outside the conditional results. The retained-label reconciliation requires public successful async-data status.
- In `tests/e2e/reports-interactions.test.ts`, the label-recovery scenario holds a selected-client request, then clicks Previous month before releasing it. This cannot progress with the approved disabled-navigation behavior.
- The saved review trace was inspected independently, without replaying a test. It identifies the click at line 214 and repeated disabled-button waits. Its page snapshot shows a loading period, disabled Previous/Next, a readable Recoverable Client selection, and an enabled Year button. The cleanup DELETE timeout is a consequence of the exhausted test budget, not the first failure.
- The three reported clone pairs are present in the current source: clearing the client filter and checking all descendants; opening Settings and selecting Sunday; and selecting the Releases breakdown/row and checking its filter. The repeated code is in `reports-period-state.test.ts` and `reports-interactions.test.ts`.
- `tests/e2e/helpers/reports.ts` already owns Reports fixtures, cleanup, API reads, and shell navigation. Small Reports-specific UI workflow helpers belong there; no general test framework is needed.
- `package.json` runs duplication detection against `.jscpd-baseline.json` with zero new clones allowed. `.jscpd.json` scans application, server, shared, script, and test sources with the existing 50-token/5-line minimums. ADR 0052 requires retaining that strict gate.
- The saved formatter log independently confirms the two historical failures: `plans/m45-reports-response-range-fix.md` and `.pi/reviews/m45-reports-time-allocation-20261015T151738Z.md`. The formatter command and `.oxfmtrc.json` are unchanged. This session has not rerun formatting or duplication detection.
- Package scripts and Playwright/Vitest configurations were inspected. Playwright supports an externally managed server, uses retained failure traces with `CI=1`, and requires the fixture process to receive a database connection. A base URL alone does not isolate fixture writes.
- Read-only process inspection still found the historical Nuxt listener, PID 8926, on loopback port 3004, launched from `/tmp/btt-m45-range-nJjwGo/source`. That scratch directory has a real dependency-cache parent and an explicit real-path Nuxt build directory. Database/container availability and current source equivalence were not established in Plan. Historical ownership details are leads to revalidate, not permission to control arbitrary processes.

### Limits of the evidence

R2 is confirmed by source and the saved trace; R3 is confirmed by matching source sequences and the unchanged strict configuration, supported by the review's executed gate result. No fresh browser or gate execution is claimed here. The review's passing focused scenarios and the milestone's historical 64-test pass do not establish final readiness for the current amendment.

Official Oxfmt CLI documentation confirms support for explicitly listed file paths and in-place formatting without configuration changes: <https://oxc.rs/docs/guide/usage/formatter/cli.html>. Use the repository's installed version, not an installation or upgrade.

## Scope and non-goals

### In scope

- Adapt the existing selected-label race scenario to supersede a held selection through Year selection, which remains intentionally usable while results are pending.
- Preserve and strengthen observable request overlap, label retention, failure/recovery, rename/archive reconciliation, unavailable metadata, and clearing assertions.
- Extract the three repeated Reports UI workflows into small helpers and replace their directly corresponding call sites.
- Normalize formatting only in the two named historical inputs, after preserving originals and recording the exceptional authorization.
- Update the active M45 journal, verification state, and review handoff evidence.
- Complete every previously required local gate, all Reports/Settings/invalidation coverage, the full repository browser suite, and the outstanding supported-width visual/keyboard checks.

### Protected behavior and exclusions

- No changes to `app/pages/reports.vue`, application utilities/composables/components, server queries/endpoints, shared contracts, or their behavior are expected or authorized.
- Preserve response-derived labels and navigation, successful-state display gating, selected-label reconciliation, mounted automatic-activation tabs, all four Reports invalidation resources, and Settings-owned read-only recovery.
- Preserve date-only entry semantics, configured weeks, calendar months/years, explicit reporting time zones, owner isolation, archived history, completion bounds, lifetime estimate formulas, and the accepted `updatedAt` completion-proxy limitation.
- Preserve independent settings-failure, superseded-grain, keyboard grouping, SPA navigation/time-origin, resource-matrix, API boundary, and ownership assertions. Do not replace a real API interaction with mocked aggregates merely to make a test pass.
- No new schema or migration files, dependencies, lockfile changes, authentication policy, deployment, CI changes, retries, timeout-default changes, gate exclusions, suppressions, or duplication-baseline updates.
- No broad fixture/auth/cleanup refactor, new generic interception framework, unrelated lint cleanup, roadmap edits, or new ADR. Existing migrations may run only against an isolated disposable test database.
- Do not edit this plan during Build. Apart from the two explicit formatting exceptions, other approved plans, discovery inputs, and review reports remain untouched. ADR 0061 stays Proposed; M45 stays open.

## Decisions and rationale

### D1 — Change the test trigger, not the approved product interaction

Use Year selection to issue the superseding failed request while the selected-client Month request is still held. A grain change is intentionally available during loading. Re-enabling Previous/Next, forcing clicks, or releasing the first request before the second one would respectively change approved behavior, bypass real interaction rules, or weaken the race regression.

After recovery, the scenario remains in Year mode. Its later archive and unavailable-metadata checks use Previous year rather than assuming Month is still active. Selected metadata is independent of period activity, so this preserves the purpose of those checks.

### D2 — Share three meaningful Reports workflows

Add narrowly named helpers in `tests/e2e/helpers/reports.ts`:

- `selectReportRelease`: accept the page and expected release display name; activate Releases, select that release's row within the allocation list, and assert the readable release filter. Keep tab handles, subsequent loading assertions, and request barriers in the caller.
- `chooseReportWeekStart`: accept the page and weekday label; open Workspace settings, choose that weekday through the existing accessible controls, and return the dialog locator. It must not save, toggle failure flags, install interception, retry, or inspect write counts.
- `clearReportClientFilter`: clear through the existing labelled native clear control and assert that client, project, and release show their All placeholders. This is specifically the parent-clear cascade invariant, not a replacement for individual child-clear tests.

Use these helpers in the two affected browser files where those workflows recur. Helpers must retain Playwright's ordinary assertions and explicit caller-owned state; do not hide clocks, owner fixtures, counters, or pending-request behavior. Existing fixture creation and cleanup contracts remain unchanged.

### D3 — Resolve formatting without relaxing the gate

During Build, preserve byte-for-byte originals and SHA-256 hashes for exactly these two files in an agent-created archive outside the repository and all formatter scan roots:

- `plans/m45-reports-response-range-fix.md`.
- `.pi/reviews/m45-reports-time-allocation-20261015T151738Z.md`.

Then apply the installed formatter only to these named historical inputs. Approval of this plan authorizes presentation-only normalization, such as Markdown table alignment and whitespace, without changing wording, decisions, identifiers, links, commands, findings, or recorded outcomes. Inspect the before/after differences against the preserved originals. Historical approval references continue to identify the original approved content; do not rewrite receipts or claim a new approval of changed semantics.

Do not run a repository-wide fixing formatter, move inputs out of the check, add ignores, or change formatter configuration/scripts. The current review and this task's approved plan remain immutable. A newly discovered protected-input failure outside these two paths requires further direction rather than an improvised exception.

This is one-time artifact housekeeping, not a new policy for modifying approved plans. No durable workflow/ADR change is required.

## Requirements and acceptance criteria

- **VF-01 — Real overlapping label race:** The selected-client Month request is demonstrably held when an enabled Year control issues the selected-client Year request. The Year request fails independently, without waiting for or releasing Month first. While loading and after failure, the selected client remains readable and clearable, never a UUID or premature Unavailable client label.
- **VF-02 — Approved unavailable-state behavior:** Previous/Next are explicitly asserted disabled during the held selection and failed Year read. Loading/error states hide loaded totals and rows. The test makes no forced clicks and changes no application behavior.
- **VF-03 — Recovery and reconciliation:** Releasing the superseded Month read does not replace the active Year/error state. A real rename followed by a successful report retry updates the retained name. A later real archive plus successful Previous year read adds Archived. A further successful read with unavailable selected metadata yields the neutral unavailable label, no UUID, and a working clear action.
- **VF-04 — Duplication fixed through reuse:** All three reported repeated workflows have shared ownership and their original assertions remain covered. The unchanged `pnpm check:duplicates` passes with zero new clones against the existing baseline. Baseline totals need not become zero.
- **VF-05 — Auditable formatting exception:** Both originals and their hashes are preserved before normalization. Only formatting changes in the two authorized historical inputs. The unmodified repository-wide `pnpm format:check` passes, including the final evidence records and this approved plan.
- **VF-06 — No regression or scope expansion:** Existing Reports, Settings, invalidation, boundary, archive, ownership, and keyboard scenarios pass. Application/server/shared/package/configuration/baseline contents are unchanged by this fix task.
- **VF-07 — Complete final verification:** Every required final gate and the full browser suite finish successfully on the final source, with no skipped scenarios or automatic retries. An interrupted or tool-timed-out command is incomplete even if a wrapper reports exit zero.
- **VF-08 — Honest handoff:** The M45 record distinguishes original failures, diagnostic reruns, and final passing results; identifies environment/source equivalence and owned-resource cleanup; and leaves human code acceptance, ADR acceptance, and milestone completion pending.

## Files to change and reuse

### Expected implementation changes

- `tests/e2e/reports-interactions.test.ts` — adapt the retained-label race and its later Year navigation; replace the directly repeated release-selection, Settings, and parent-clear workflows with helper calls.
- `tests/e2e/reports-period-state.test.ts` — reuse the same workflows without removing response/range/totals, settings traffic, supersession, unavailable-state, or tab-connectivity assertions.
- `tests/e2e/helpers/reports.ts` — add the three focused UI helpers described in D2, retaining existing fixture/API/navigation/cleanup behavior.
- The two historical Markdown files named in D3 — formatter-only differences.
- `docs/milestones/m45-reports-time-allocation.md` — approval, review dispositions, formatting audit, current verification status, commands/outcomes, manual checks, environment ownership, and handoff.

Reuse existing owner/fixture helpers, accessible control names, `waitForClientMount`, browser clocks, route interception, response observation, and document time-origin assertions. No new production or test file is expected. Additional refactoring is limited to directly related repetitions within these same Reports test/helper files if the unchanged strict gate exposes clones introduced by extraction.

Before Build changes/checks, read the project-local Oxc guidance. Retain Nuxt UI's existing accessible tabs/select behavior; no new UI component or Effect API work is involved.

## Ordered implementation checklist

- [ ] **S1 — Re-establish scope, authorization, and a safe verification environment.** Read this approved plan, the complete input review, M45 record, and preceding amendments. Inspect tracked/staged/untracked changes and preserve all prior work. Record this amendment's approval and the explicit D3 formatting exception in M45. Revalidate the historical scratch environment, listener ownership, database isolation, and source contents before reusing it; otherwise establish a new disposable environment on an unused port. Treat unknown/user-owned services as untouchable. Preserve previous failure artifacts and account for possibly incomplete fixture cleanup in the disposable database. Archive/hash the two D3 originals before any formatter write. Completion evidence: recorded baseline, archive locations/hashes, approval, and server/database/cache ownership.

- [ ] **S2 — Capture the current failures in Build without changing their cause.** Run the unchanged formatting and duplication checks and the isolated old retained-label scenario. Preserve logs and traces showing the disabled Previous click rather than attributing the failure to cleanup. Use the correct disposable database/auth environment for both server and fixtures. Keep the verified agent-owned server running after the expected red result. Do not add retries or timeout increases. Completion evidence: current format/clone diagnostics and a trace-confirmed R2 reproduction, or a documented stop for materially different current behavior.

- [ ] **S3 — Adapt the retained-label race without serializing it.** In `reports-interactions.test.ts`, first establish a successful Month report at the fixed October 15 clock. Arm the selected-client hold only after that initial read is complete. Match the held Month request to the fixture client and observe that the route's release callback has actually been installed; observing only a request event is not enough. Keep the existing per-request failure decision captured before waiting so changing the failure flag later does not turn the held request into the failed request. Assert retained client text, clearability, loading state, and disabled Previous/Next while the hold is active. Change the superseding action to Year, observe the Year request with the same selection, and fail it while Month remains held. Assert safe report failure, unavailable period, Year selection, disabled adjacent controls, hidden loaded values, and the retained client label. Release the old read, observe route settlement, and confirm that the Year/error state and readable label are not overwritten; cancellation of a superseded request must not strand the handler. Keep unconditional release in cleanup. Rename through the existing API PATCH, allow report success, and retry the Year report to obtain the new name. Archive through the existing PATCH, navigate to the previous year, and verify the archived name. Return unavailable selected metadata on the next successful previous-year read and preserve neutral-label/no-ID/clear coverage. Completion evidence: the scenario passes under the existing test budget and its logged request/hold/error/release sequence proves overlap.

- [ ] **S4 — Remove the three clones with small Reports helpers.** Add D2's helpers in `helpers/reports.ts` and replace their repeated blocks in both browser files. For release selection, scope the row to the allocation list so the helper cannot click the filter control instead. The Settings helper ends after choosing Sunday, before callers enable failures or save, keeping failure ownership and exact write-count/read-only-retry assertions visible. The parent-clear helper preserves the checks for all three placeholders. Keep individual clear/cascade coverage, fixed clocks, fixture isolation, retained tab handles, source-of-truth response assertions, and superseded-read barriers in their original scenarios. Re-run the unchanged duplication check; resolve extraction-related Reports clones through genuine shared workflows rather than token edits or suppressions. Completion evidence: zero new clones, useful helper contracts, and passing affected browser scenarios with the original assertions retained.

- [ ] **S5 — Normalize authorized historical inputs and make the record current.** Apply the installed Oxfmt only to D3's two archived inputs and inspect the differences for presentation-only changes. Record archive paths, original hashes, formatted hashes, and the explicit authorization in M45. Append the new review's R2/R3 dispositions and preserve all previous first-failure evidence. Clarify that older completed verification checklists are historical and that the response-range amendment still needs this task's final sequence; do not erase earlier results or mark human review accepted. Format changed tests/helpers and the milestone explicitly, never this approved plan or unrelated files. Completion evidence: restricted semantic-neutral input differences, an accurate current milestone, and a passing unchanged repository-wide format check.

- [ ] **S6 — Run every final non-browser gate.** Execute the complete command set below on the final source, with existing migrations only on the disposable database and isolated Nuxt build/cache output where required. Preserve first failures and fix only within this test/artifact scope. Verify copied sources, package/lockfile contents, and relevant configuration against the final worktree whenever a disposable verification copy is used. Completion evidence: successful completed checks, unchanged protected implementation/configuration/baseline, and exact results recorded.

- [ ] **S7 — Complete browser/manual verification, release owned resources, and stop.** Run the focused race and affected tests, all four Reports files, standalone Settings/failure and invalidation files, and then the entire repository browser suite against the tracked already-running server. Give the local command enough execution time to finish; do not repeat the review's 180-second interruption or count aborted output as a pass. Complete V4's supported-width keyboard/visual review. After any implementation/test change, repeat affected checks and the complete final handoff sequence. Keep the agent-owned server available through failures. Only when every required check passes, stop owned resources and verify the app port is released; leave user-owned/unknown processes untouched. Finish the M45 evidence and hand off for separate human code review without starting Review or declaring completion.

## Validation

### V1 — R2 race and metadata regression

Run the selected-label scenario alone before adaptation to capture its current failure, then after S3 and again after helper extraction. Use the existing 30-second budget; this is a state/interaction defect, not evidence that the scenario needs more time.

The passing scenario must establish this order: successful unfiltered Month report, held selected-client Month read with its release barrier installed, failed selected-client Year read while Month is still held, safe retained-label error state, old-request release/settlement without stale replacement, renamed-label retry, archive reconciliation, unavailable metadata, and clear. Ordinary successful serial selection followed by an error is not equivalent coverage.

Observe active period/query identity as well as readable labels. The later successful reads should be the Year containing October 15, 2026, followed by the previous years as applicable, not accidentally retained month navigation. Keep private error text hidden and retain unconditional held-route release before fixture cleanup.

### V2 — Helper parity and strict quality gates

- Release helper callers must still verify the expected release selection and retain all client/project/release parent state checks where present.
- Both Settings scenarios must preserve their distinct fault: one fails Reports refresh; the other fails the independent settings GET while Reports succeeds. Each retains exactly-one-write and read-only retry assertions, mounted-tab identity, and stable document time origin.
- Both parent-clear callers must prove all three hierarchy selections reset. Do not replace these checks with merely observing a clear button click.
- Run `pnpm check:duplicates` with its existing baseline and zero-new-clone setting, and `pnpm check:unused` without new exceptions. Inspect diffs to confirm there is no baseline/configuration change or cosmetic clone evasion.
- Run the unchanged full format check after the two targeted normalizations and milestone updates. Compare the normalized historical inputs with their archived originals for unchanged meaning and literal commands.

### V3 — Preserved Reports integration and boundaries

Run all four Reports files, not just the new response-state file. Preserve coverage for Sunday-start reports on Thursday and Sunday clocks; both visible labels matching the returned range; Previous/Next/Current correctness; no Reports-owned settings traffic; mounted Settings success/partial-success recovery; delayed and superseded grain reads; hidden inherited values; automatic keyboard grouping focus; retained/archive/unavailable selections; real SPA mutation invalidation; resource tags; current/prior totals; completion bounds; archived history; selected-metadata ownership; and lifetime estimates.

Run `tests/e2e/client-effect-failures.test.ts` and `tests/e2e/data-invalidation.test.ts` explicitly, followed by the full repository suite. Keep boundary/API and owner-isolation tests real. No migration/security-policy changes are needed; these unchanged tests are the regression evidence.

### V4 — Supported-width visual and keyboard completion

At 1280 CSS px, inspect a loaded non-empty report, independently failed Settings with successful Sunday Reports, report loading/error/retry, both date-label locations, and adjacent/current navigation. Confirm no new document overflow. Check keyboard-only grouping, retained filter search/clear, row selection, and Settings dismissal/reopen/read-only retry. Inspect loaded/error states, not only loading screenshots. Record this as agent review, not human acceptance.

### V5 — Required final commands and execution environment

The command names below were verified from repository scripts/configuration, not executed in Plan. All database-backed unit/API/browser commands and the app server must receive the same disposable database and compatible test-auth configuration. Do not migrate/reset the normal database or expose credentials in logs.

Run final non-browser checks before final browser verification:

1. `pnpm db:migrate`, using only existing migrations against the isolated database.
2. `pnpm format:check`, `pnpm lint`, `pnpm check:duplicates`, `pnpm check:unused`.
3. `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test`, `pnpm build`.
4. `pnpm check:workflow`, `git diff --check`, and whitespace/conflict-marker checks of all changed new/untracked files. Tracked Git diff checks alone do not cover the untracked M45 files.
5. `TZ=UTC pnpm exec vitest run tests/unit/report-navigation.test.ts tests/unit/report-period.test.ts` and the same command with `TZ=America/Los_Angeles`.

Where the worktree also backs a user-owned app server, use a genuinely isolated verification copy for cache-generating Nuxt commands. Include all final tracked and untracked source/tests and required input/configuration files; record any scratch-only build-directory configuration separately. A whole-directory dependency symlink that shares Nuxt's cache is not isolation. Reuse installed dependencies without installing/upgrading packages or editing repository configuration to repair scratch resolution. Verify source and dependency-manifest equivalence before the final browser run.

For all browser commands set `CI=1`, `PLAYWRIGHT_SKIP_DEV_SERVER=1`, and `PLAYWRIGHT_BASE_URL` to the tracked owned server, with the disposable environment also supplied to the fixture process. Use one worker and zero retries:

- Focused R2: `pnpm exec playwright test tests/e2e/reports-interactions.test.ts --grep "Reports keeps selected labels" --workers=1 --retries=0`.
- Affected/all Reports: `pnpm exec playwright test tests/e2e/reports.test.ts tests/e2e/reports-boundaries.test.ts tests/e2e/reports-interactions.test.ts tests/e2e/reports-period-state.test.ts --workers=1 --retries=0`.
- Settings/invalidation: `pnpm exec playwright test tests/e2e/client-effect-failures.test.ts tests/e2e/data-invalidation.test.ts --workers=1 --retries=0`.
- Full repository: `pnpm exec playwright test --workers=1 --retries=0`, with no file/grep arguments or skipped scenarios.

Use an outer local execution budget sufficient for actual completion. This is not permission to increase Playwright test/assertion timeouts, CI budgets, or retries. An aborted run must be logged as incomplete regardless of a wrapper's exit code. Preserve traces and logs under distinct output locations so diagnosis/final runs do not erase first-failure evidence.

If unrelated intermittent failures recur, inspect their traces and state before a deliberate diagnostic rerun. The review's keyboard/Settings timeouts later passed unchanged and have no established root cause; do not preemptively raise their budgets. Any evidence-based targeted timeout elsewhere must satisfy the existing workflow/ADR 0050 policy and must not mask a state, locator, or fixture defect. R2's disabled-button wait is never a justification for extra time.

Only after every required check passes, stop the verified agent-owned app server and verify its port is released. Clean up only verified agent-created database/process resources. Record any historical orphaned disposable fixture concern and what cleanup was actually performed. Remote CI, live OAuth, deployment, and production databases are neither required nor authorized; isolated real API/database tests, both typechecks, build, full Chromium execution, and the manual checks provide local evidence.

## Review-finding disposition

- **R2, Medium — Confirmed.** Current source and the independently inspected saved trace establish the disabled-Previous deadlock. S3 replaces only the superseding trigger and adjusts subsequent Year expectations. VF-01 through VF-03 and V1 preserve delayed-selection sensitivity, retained labels, error recovery, and rename/archive/unavailable reconciliation. Application navigation remains unchanged.
- **R3, Low — Confirmed.** The three repeated workflows remain in current files, and the unchanged strict gate makes the review's new-clone result applicable. S4 extracts them with parity assertions. VF-04 and V2 require zero new clones against the unchanged baseline plus affected/full browser coverage.
- **Protected-input formatting blocker — Confirmed historical gate failure, not an application defect.** S1/S5 and D3 provide an explicitly scoped approval path: archive originals, normalize only the two named files, inspect meaning, and pass the unchanged full gate. No blanket input-edit authorization or formatter exception is granted.
- **Earlier R1 — Addressed implementation to protect.** Source inspection confirms returned-range display authority and removal of the redundant Reports settings read. No further production change is planned. V3 and the complete final suite retain the independently passing regressions and guard against accidental test weakening.
- **Incomplete final verification — Confirmed.** S6/S7 and V3 through V5 require the entire final sequence, not historical or partial results.
- **Initial keyboard/Settings timeouts — Unconfirmed as persistent defects.** Preserve first failures and diagnose if they recur; no speculative timeout/retry fix is planned.
- **Existing lint warnings and completion proxy — Not actionable findings for this amendment.** Preserve the two existing `consistent-function-scoping` warnings honestly in evidence and leave the accepted completion-proxy limitation unchanged.

No confirmed actionable finding is silently deferred or excluded.

## Risks and stop conditions

- Stop for a new Plan if making the adapted race pass requires an application, shared cache, invalidation, API, auth, schema, dependency, or product-behavior change. Do not weaken the assertions or undo disabled adjacent navigation.
- Stop if S2 shows that current source no longer matches the reported interaction/clone problem in a way that changes the fix's premise. Preserve the differing evidence instead of implementing the report blindly.
- Do not release the selected-client read before causing the Year failure, hide the race behind a helper that waits for successful selection, or use fixed sleeps. A passing serial test is not an acceptable substitute.
- Keep helper extraction limited to the repeated Reports workflows. If a duplication failure requires unrelated cleanup or a baseline/configuration change, stop rather than widening scope.
- Stop if formatter output changes meaning or requires modifying a protected artifact outside D3's two files. Never normalize this approved plan in Build. If this plan itself fails the unchanged formatter, return to Plan for correction and renewed authorization rather than silently editing it or excluding it.
- If isolated database/cache execution or verified server ownership cannot be established, record the blocker. Do not attach to unknown services, operate on the normal database, stop a user-owned server, skip full E2E, or claim readiness.
- Preserve the owned server through failures. Verification failures must remain visible; successful focused reruns do not erase an incomplete full run or authorize human acceptance.

## Fresh-session Build handoff

Implement only this approved test/artifact remediation: adapt the existing held-selection race through Year, extract the three Reports-specific workflows, apply the expressly authorized formatting-only normalization with original-byte preservation, and update the M45 evidence. Leave production source, contracts, dependencies, configuration, duplication baseline, Proposed ADR 0061, and approved product behavior unchanged.

Expected outputs are focused changes in the three Reports test/helper files, formatting-only differences in the two named historical inputs, and an accurate M45 log with complete final gate/browser/manual evidence and owned-resource cleanup. **This approved plan file must not be edited during Build.**

This plan makes no claim of newly passing checks. Historical process IDs, ports, and disposable databases must be revalidated. The accepted completion-proxy limitation and absence of remote/production verification remain nonblocking limitations.

After every required local check passes and the owned app port is released, stop before Review and hand off this plan path, the diff, validation evidence, archive/hash references, and any honest limitations for separate human code review. Do not start Review, accept ADR 0061, or declare M45 complete.
