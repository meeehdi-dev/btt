# Workflow modes integration — independent review

## What this change does:

This change documents optional Pi workflow modes and project-local artifact routing. It relocates five historical artifacts, repairs references, and updates workflow templates and structural checks without changing the application.

## Scope reviewed

- Created: 2026-10-18T10:46:42Z.
- Repository: `/Users/mehdi/code/btt`; branch: `main`.
- HEAD/base: `ad29bc141bb74bab63a73bf970873ed4a571f42f`.
- Comparison: all uncommitted staged, unstaged, and untracked files. Staged diff is empty. No branch-history comparison substituted.
- Primary reference: [approved integration plan](../plans/workflow-modes-integration.md), approval authority supplied as `pn-6a54f9` and explicit human Build authorization.
- Build evidence: [M46](../docs/milestones/m46-workflow-modes-integration.md).

Complete existing file set reviewed (before this report):

- `AGENTS.md`, `PLAN.md`, `docs/llm-workflow.md`.
- `docs/decisions/0001-llm-assisted-development-workflow.md`, `docs/decisions/README.md`, `docs/decisions/0062-pi-workflow-modes-and-artifact-locations.md`.
- `docs/milestones/README.md`, `docs/milestones/m45-reports-time-allocation.md`, `docs/milestones/m46-workflow-modes-integration.md`.
- `docs/templates/handoff-template.md`, `docs/templates/milestone-template.md`, `docs/templates/plan-template.md`, `docs/templates/review-template.md`.
- `plans/m45-reports-response-range-fix.md`, `plans/m45-reports-verification-fixes.md`, `plans/reports-filter-loading-layout-stability.md`, `plans/workflow-modes-integration.md`.
- `reviews/README.md`, `reviews/m45-reports-response-range-20261015T193923Z.md`, `reviews/m45-reports-time-allocation-20261015T151738Z.md`, `reviews/m45-reports-verification-fixes-20261015T211030Z.md`, `reviews/reports-filter-loading-layout-stability-20261016T142702Z.md`.
- `scripts/check-workflow-docs.mjs`.

Also reviewed all five deleted `.pi/` originals against their corresponding destinations using `git show HEAD:<old-path>`. The selected plan is an input, not an implementation defect because it is untracked. Supporting contracts inspected include ADR 0001, ADR 0050, the complete roadmap/canonical workflow, and package scripts. Expected workload is local human/agent documentation maintenance; no application load claim is made.

## Findings

**No actionable findings within the reviewed scope.**

Looks good. Ship, subject to required human diff review. This recommendation is not human code acceptance or a milestone completion declaration.

## Plan compliance

- **R1:** Mode boundaries, fresh-session references, routing-only helper behavior, missing-input handling, Plannotator decisions, and chat fallback are consistent across entry instructions and canonical guidance.
- **R2:** Plans, independent reviews/human feedback, and milestone evidence have explicit, separate homes. Templates and review conventions preserve earlier inputs; no duplicate Build report is required.
- **R3:** Exactly five baseline artifacts have corresponding destinations with unchanged basenames. Their old sources are absent. Remaining old-path mentions are migration mappings or the selected plan's baseline/instructions, not live destinations.
- **R4:** Direct before/after diffs show only relocation notes, reference substitutions, and the moved plan's self-location update. Historical verdicts, hashes, dates, commands/results, and approval meaning are preserved. Relocation notes explicitly qualify historical inventories and checksums.
- **R5:** Human approval/acceptance/completion gates, final-worktree verification, application E2E, first failures, targeted timeouts, and server ownership remain explicit. UI cannot manage servers or waive checks; Review cannot fix code; Finalize cannot infer acceptance. Paper walkthrough covers approved Build→Review, findings→Plan, no-findings→human review, optional UI, closure without decision, separate UI server ownership, and Finalize without completion.
- **R6:** ADR 0062 carries forward ADR 0001 governance. Only ADR 0001 status/supersession metadata changed; ADR 0050 is unchanged. M45 status is not reconciled. M46 records actual checks and pending acceptance/completion. Checker changes are limited to required-file/heading declarations, so no new runtime-logic regression test is needed.

## Independent verification

Inspected scripts before execution: the workflow checker reads required files/headings only; `format:check` invokes non-fixing `oxfmt --check`. No install or fixing command ran.

- `node scripts/check-workflow-docs.mjs` — exit 0; structure complete.
- `pnpm format:check` — exit 0; all 399 matched files formatted.
- `git diff --check` — exit 0.
- Read-only Python inspection using `git diff --name-only`, `git ls-files --others --exclude-standard`, `git ls-tree -r --name-only HEAD .pi`, and `git show HEAD:<old-path>` — exit 0. Inspected complete five-file migration diffs; all 23 existing affected files passed whitespace/conflict-marker/final-newline checks; all 158 affected local Markdown file links resolved. This checks target files, not heading anchors.
- `rg -n --hidden '\.pi/(plans|reviews)/' AGENTS.md PLAN.md docs plans reviews scripts -g '*.md' -g '*.mjs'` — remaining matches inspected and classified as migration notes/mappings or unchanged plan context. The complete Git changed/new inventory includes hidden paths; no additional hidden artifact was present to repair.
- `git diff HEAD -- docs/decisions/0050-e2e-verification-and-server-handoff.md` — empty, independently confirmed.
- Final `git status --short` matched the initial implementation scope; staged changes remained absent. No application, test, manifest/lockfile, CI, or unrelated milestone changes were found. Checks produced no observed non-ignored side effects. This report is the only Review-authored addition.

Historical Build evidence inspected, not adopted as independent execution: M46 records initial formatting failures, narrowly targeted normalization, final green checks, migration accounting, and contract walkthroughs. No historical M45 verification was rerun.

## Limitations and fresh-session context

No application/unit/typecheck/build/E2E, database, remote, live UI, or installed-extension tests ran; the approved documentation-only plan explicitly excludes these. No server was started, stopped, or attached to. External archives and personal tooling were not changed or independently verified. This is not a whole-repository audit.

No corrective Plan is required by confirmed findings. Open human diff review for this repository's **uncommitted** changes against HEAD and ask the human to verify that comparison, including new files. If later feedback requests changes, save a new feedback report, preserve this report, and have Plan revalidate requests before implementation.

After explicit human review approval/proceed direction, ask UI or Finalize. Route the selected authorized phase with original input `/Users/mehdi/code/btt/plans/workflow-modes-integration.md`. Keep M46 acceptance/completion and M45 status unchanged until actual human decisions authorize bookkeeping. Leave Git writes human-owned.

Not checked: runtime/browser behavior or personal extension execution; no runtime changes are included.
Risk boundary: this bounded recommendation does not replace human review or the separate completion declaration.
