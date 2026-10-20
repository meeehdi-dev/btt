# M47 independent review

What this change does: Release detail now shows unfinished tickets first and Done tickets below a labeled divider. It keeps API order within each section, uses the same card template, and restores lost focus after a status change moves a card.

## Scope reviewed

- Created UTC: 2026-10-20T17:07:44Z; repository `/Users/mehdi/code/btt`.
- Reference: `/Users/mehdi/code/btt/plans/release-done-tickets-bottom.md` (read completely). Its historical pending-approval prose is superseded by the supplied human authorization and M47 approval evidence.
- Evidence: `docs/milestones/m47-release-done-tickets-bottom.md`.
- Branch: `main`; HEAD/base: `b442581575ebba538a7e481c3779dc11ebd428e3`.
- Comparison: all staged, unstaged, and untracked implementation changes against HEAD. No staged changes exist.
- Tracked files: `PLAN.md`, `app/pages/releases/[id]/index.vue`, `docs/decisions/README.md`, `tests/e2e/api-item-ordering.test.ts`, `tests/e2e/release-ticket-status.test.ts`, `tests/e2e/ticket-context-popovers.test.ts`.
- Untracked inputs reviewed: `docs/decisions/0063-release-done-ticket-sections.md`, `docs/milestones/m47-release-done-tickets-bottom.md`, `plans/release-done-tickets-bottom.md`. Workflow artifacts are not defects because they are untracked.
- Connected code inspected: ticket-list API, data invalidation registry, ticket creation modal, shared card/work-item/detail section components, sibling project detail, Release status handler and its template callers, and relevant ordering/context regression tests. Applicable ADRs 0027, 0028, 0046, 0062, and Proposed 0063 were read.
- Assumed load: the roadmap's solo work organizer, with release-sized in-memory ticket lists. Partitioning is linear in the existing fetched list and adds no requests or shared server state.
- Exclusions: no whole-repository audit, no changes to M45 or unrelated browser failures. This newly written review report is an output, not part of the implementation comparison.

## Findings

**No actionable findings within the reviewed scope.**

Looks good. Ship, subject to required human code review; this recommendation is not human acceptance or a milestone completion declaration.

## Plan compliance

| Requirement           | Implementation and coverage                                                                                                                                                                                                                                                                                      |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1 placement          | Separate two-column grids and a full-width Done separator. The mixed-list browser test checks separator/grid geometry with three unfinished cards.                                                                                                                                                               |
| R2 stable order       | Filters preserve source order; no API changes. Ordering coverage independently constructs expected API order, then checks its stable partition in Release DOM before/after edits and an estimate-presence change.                                                                                                |
| R3 edge states        | Empty/no-Done/all-Done assertions and mixed fixtures exist. Old Done fixtures remain visible in an undated release; no Board-only query flag was added.                                                                                                                                                          |
| R4 reactive moves     | Existing page-owned write/refresh/retry handling is retained. Tests cover failed Done writes, refresh failure/retry, both boundary transitions, unchanged document identity, creation invalidation, and full-list completion count.                                                                              |
| R5 interaction parity | One shared card template retains usage, hierarchy links, status controls, and context popovers. New parity coverage exercises Done cards. Focus recovery waits for rendering and only focuses the matching status control if focus has fallen to the body.                                                       |
| R6 layout             | Geometry assertions cover 1280 and 1600 CSS px. Independently inspected preserved 1280-light and 1600-dark screenshots: the divider spans both columns, Done starts on a fresh row, and long titles truncate without displacing usage/context. This was screenshot inspection, not a fresh live-browser session. |

Documentation stays within scope: Proposed ADR 0063 records only the approved Release presentation exception, the historical ADR is unchanged, M47 stays open, and M45 status is untouched.

## Independent verification

Read `package.json` before running scripts. These commands perform non-fixing formatting/linting, clone/unused checks, Vue and TypeScript validation, unit tests, and structural workflow validation; none require starting the application or migrating a database.

All exited 0:

- `pnpm format:check`.
- `pnpm lint`: two existing `unicorn/consistent-function-scoping` warnings at `tests/e2e/ticket-context-popovers.test.ts:254,257`, outside changed lines; no errors.
- `pnpm check:duplicates`: 92 existing/baselined clones reported, no new-clone gate failure.
- `pnpm check:unused`.
- `pnpm typecheck`.
- `pnpm typecheck:tsgo`.
- `pnpm test`: 20 files, 109 tests passed.
- `pnpm check:workflow`.
- `git diff --check`.

Rechecked `git status --short` after commands: implementation scope unchanged; no unexpected tracked/untracked source changes. No source/config edits, Git writes, dependency installation, snapshot updates, database operations, or server lifecycle changes were performed in Review.

## Historical Build evidence and limitations

- Inspected `/tmp/btt-m47-verify/full-serial.log`: `pnpm test:e2e --workers=1 --trace=on`, 70/70 passed in 4.6 minutes, including M47 tests.
- Inspected default-run failure summaries: `full-1.log` has 69/70 passed; `full-2.log` has 67/70 passed. These expose Reports grouping, New client modal opening, and release archive navigation failures. Root cause is not independently proven; do not label them fixed or claim default-parallel verification passed.
- M47 records focused 6/6, serial diagnostics 10/10, full non-browser gates including isolated migration/build, visual/focus checks, explicit human acceptance of serial verification, and app/database shutdown with released ports. Those are historical Build evidence, not independently rerun checks.
- Did not rerun E2E, migration, production build, or live keyboard interactions in Review. The accepted verification server/database were already stopped; they were not restarted. Browser confidence therefore combines code/test inspection, preserved run output, screenshots, and the supplied human decision.
- Parallel-browser reliability remains a separate unresolved concern. The local failure evidence is temporary storage, not a durable CI artifact guarantee.

## Recommendation and fresh-session handoff

- No corrective Plan is recommended from this review; no finding IDs require revalidation.
- Open human Plannotator diff review for the current uncommitted implementation against the HEAD above. Ask the human to verify the comparison and the new/untracked ADR and milestone are visible. This report can also appear as a newly untracked workflow artifact.
- After explicit human code-review feedback/approval, ask optional UI or Finalize. Preserve any annotations in a new feedback report; do not overwrite this review or the approved plan.
- Original implementation-plan input for UI/Finalize: `/Users/mehdi/code/btt/plans/release-done-tickets-bottom.md`.
- UI needs a separately user-managed app URL. Finalize must leave code acceptance/completion pending unless the human actually supplies those decisions. ADR 0063 remains Proposed until the instructed bookkeeping follows human review. Leave Git writes human-owned.

Verdict: Ship, pending human code review.

Not checked: fresh browser/build/database execution; default-parallel browser failures remain unresolved and explicitly separate from the accepted serial result.
