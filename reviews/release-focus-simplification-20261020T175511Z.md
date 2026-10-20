# M47 amendment independent review

What this change does: Release detail puts unfinished tickets first and Done tickets below a labeled divider, preserving API order inside each section. The amendment removes special focus recovery after a card changes sections; keyboard users explicitly reacquire its replacement control.

## Scope and references

- Repository: `/Users/mehdi/code/btt`; branch `main`.
- HEAD/base: `b442581575ebba538a7e481c3779dc11ebd428e3`.
- Comparison: all current staged, unstaged and untracked changes against HEAD; no staged changes exist. This is the full inherited M47 scope, not only the amendment.
- Primary reference: `/Users/mehdi/code/btt/plans/release-focus-simplification.md`, read completely, with original `/Users/mehdi/code/btt/plans/release-done-tickets-bottom.md` read completely. Supplied human approval `pn-781184` supersedes the amendment's historical pending-approval heading.
- Tracked implementation: `PLAN.md`, `app/pages/releases/[id]/index.vue`, `docs/decisions/README.md`, `tests/e2e/api-item-ordering.test.ts`, `tests/e2e/release-ticket-status.test.ts`, `tests/e2e/ticket-context-popovers.test.ts`.
- New artifacts read: Proposed ADR `docs/decisions/0063-release-done-ticket-sections.md`, M47 journal, both plans, original review `reviews/release-done-tickets-bottom-20261020T170744Z.md`, and human question report `reviews/release-done-tickets-bottom-feedback-20261020T171500Z.md`. Untracked workflow inputs are not defects.
- Connected code inspected: ticket-list API, full Release page and its status/completion callers, data invalidation registry, ticket creation modal, EntityCard, TicketWorkItem, HierarchyDetailSections, sibling project detail, ordering fixtures/cleanup and context parity tests. Read applicable ADRs 0027, 0028, 0046, 0062 and Proposed 0063.
- Expected load: the roadmap's solo workspace with release-sized fetched lists. Two linear partitions add no requests, server state or writes.
- No whole-repository audit, M45 changes, source/config edits, Git writes, dependency installation, snapshot updates or journal updates. Earlier reports are preserved. This new report is review output.

## Findings

**No actionable findings within the reviewed scope.**

Looks good. Ship, subject to required human code review. This is not human acceptance, ADR acceptance or a milestone completion declaration.

## Plan compliance

- R1–R3: separate grids make Done start below both unfinished columns. Stable filters preserve source order; empty sections are omitted. Tests cover mixed estimated/unestimated ordering, empty/no-Done/all-Done states, odd unfinished counts and old Done tickets in undated releases. The API query is unchanged.
- R4: page-owned mutation, pending guards, failure reporting, invalidation and retry are unchanged. Coverage retains failed writes, refresh failure/retry, both boundary transitions, document identity, creation invalidation and full-list completion counts.
- R5–R6: one card template retains density, usage, hierarchy/navigation and popovers. Done-card parity coverage remains. Geometry assertions cover 1280 and 1600 CSS px; screenshots are captured for both themes.
- S1: `changeTicketStatus` finally only clears pending state. No post-update nextTick, DOM lookup or replacement recovery exists.
- S2–S3: keyboard transitions remain; the live locator waits for enabled/Done state and is explicitly focused before the reverse transition. Neither body focus nor automatic restoration is asserted. Removing the old On hold focus assertion is consistent with the same accepted boundary-remount tradeoff.
- S4: no shortcut, modal, Board, Agenda, API, schema, auth, dependency, CI or timeout changes appear in the diff.
- S5: original plan and live roadmap/journal/Proposed ADR reflect the amendment. Historical focus evidence remains historical. M45 status is unchanged; M47 and ADR acceptance remain pending. Formatting-only cleanup authority is recorded; this session cannot independently reconstruct pre-format bytes of untracked historical artifacts.

## Independent verification

Read package scripts before execution. Ran this non-fixing chain, which completed with exit 0:

```sh
pnpm format:check && pnpm lint && pnpm check:duplicates && pnpm check:unused && pnpm typecheck && pnpm typecheck:tsgo && pnpm test && pnpm check:workflow && git diff --check
```

- Format passes for 406 files.
- Lint has no errors; two unchanged function-scoping warnings at `tests/e2e/ticket-context-popovers.test.ts:254,257` remain.
- Duplicate check reports 92 baselined clones and passes its no-new-clones gate.
- Unused analysis, Vue typecheck and tsgo typecheck pass.
- Unit tests: 20 files, 109 tests pass.
- Structural workflow check and diff whitespace check pass.
- Rechecked Git status after execution: no unexpected implementation changes.

These scripts check formatting, lint, duplicate/unused code, types, unit behavior and document structure. They do not run the app or migrate a database.

## Build evidence and separate limitations

Independently inspected the preserved run summaries under `/tmp/btt-m47-focus-verify/`:

- `final-focused.log`: six focused tests run with one worker.
- `parallel-investigation.log`: latest full suite, 70 passed using six workers in 1.3 minutes.
- `serial.log`: 70 passed using one worker in 4.7 minutes.
- `final-full.log`: earlier parallel run, 68 passed and two failed. Read both complete failure sections: Agenda preview missing at `agenda-week.test.ts:999` and project-name toast missing at `auth-shell.test.ts:351`. The later green run does not prove these intermittent failures fixed.

M47 records migration/build and all non-browser gates, focused 6/6, keyboard/global shortcut/modal smoke checks, supported-width visual inspection, retained diagnostics and final app/database shutdown with released ports. These remain Build evidence, not independently repeated live-browser observations. Build labels the Agenda readiness diagnosis as evidence-supported and project hydration as a hypothesis; this review does not independently prove either root cause.

Did not restart services or independently rerun E2E, production build, migration, live keyboard or visual checks. Browser confidence therefore combines code/test inspection and preserved Build output. Intermittent unrelated browser reliability remains a follow-up, not a defect demonstrated in this Release-only change. Temporary evidence paths are not durable CI artifacts.

## Recommendation and fresh-session context

- No finding IDs require corrective planning. Open human Plannotator diff review against the exact HEAD above; verify the UI includes all uncommitted and new files, not only a saved staged/unstaged preference.
- Preserve both original reports and both plans. Save any new human annotations as a fresh feedback report for revalidation, not as proven defects.
- After explicit human review, ask optional UI or Finalize. Original current implementation reference: `/Users/mehdi/code/btt/plans/release-focus-simplification.md`, together with `/Users/mehdi/code/btt/plans/release-done-tickets-bottom.md` for inherited scope.
- UI needs a separately user-managed app URL. Finalize records only actual human decisions; code acceptance, ADR acceptance, milestone completion and Git writes are not authorized by this report.

Verdict: Ship, pending human code review.

Not checked: fresh browser/build/database execution. Accepted focus loss and unrelated intermittent browser failures remain known limits.
