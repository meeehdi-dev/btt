# M46 — Pi workflow modes integration

## Context

Integrate the optional personal Pi workflow modes with harness-neutral project governance and consolidate focused plans and independent reviews. This is documentation maintenance, not an M45 reconciliation or application change.

## Approved scope

- Implement S1–S6 and R1–R6 of [the approved plan](../../plans/workflow-modes-integration.md).
- Migrate exactly one plan and four reviews, preserving basenames and historical evidence; repair repository references.
- Update entry instructions, canonical workflow, lifecycle, four templates, ADR index, and structural declarations; add review conventions and ADR 0062.

## Out of scope

Application/tests, dependencies/lockfile, CI/deployment, personal extensions, external archives, unrelated historical cleanup, M45 completion, and Git writes.

## Source references

- [AGENTS.md](../../AGENTS.md), [canonical workflow](../llm-workflow.md), [roadmap](../../PLAN.md)
- [Approved plan](../../plans/workflow-modes-integration.md), human approval in Plannotator `pn-6a54f9`; user explicitly directed Build without another start confirmation.
- [ADR 0001](../decisions/0001-llm-assisted-development-workflow.md), [ADR 0050](../decisions/0050-e2e-verification-and-server-handoff.md)

## Requirements and acceptance criteria

R1–R6 in the approved plan are the acceptance criteria: consistent mode contracts, explicit routing, complete migration, faithful historical evidence, preserved governance, and durable documentation/structural coverage.

## Risks and stop conditions

Stop for destination collisions, unexpected artifact changes, occupied identifiers, historical meaning changes, or new scope/runtime logic. Historical hashes are never regenerated as if they verified relocated bytes.

## Approach

Follow the approved ordered checklist; keep governance canonical and the Pi adapter optional. Preserve historical verdicts, hashes, dates, commands, and acceptance statements. Record new evidence here rather than rewriting old verification.

## Files to modify

The exact five-file migration and named workflow documents/templates/checker declarations in the approved plan, plus this milestone and the concise M46 roadmap entry.

## Reuse

Existing milestone, ADR, plan, review, and handoff templates; existing structural checker's file/heading declarations. No new parser or runner.

## Decisions and ADR links

- [ADR 0062](../decisions/0062-pi-workflow-modes-and-artifact-locations.md) carries forward ADR 0001 governance and leaves ADR 0050 unchanged.
- Human plan approval authorizes implementation, not code acceptance or milestone completion.

## Implementation checklist

- [x] S1: Orient, confirm identifiers, record authority and baseline.
- [x] S2: Migrate five artifacts and repair references.
- [x] S3: Update canonical workflow and entry instructions.
- [x] S4: Align lifecycle, templates, and review convention.
- [x] S5: Add ADR and structural coverage.
- [x] S6: Validate final worktree; next authorized action is fresh Review handoff.

## Journal

### 2026-10-18 — Build baseline and authorization

- Fact: initial HEAD was `ad29bc141bb74bab63a73bf970873ed4a571f42f`; `git status --short` showed only untracked `plans/workflow-modes-integration.md`; no tracked/staged modifications. M46 and ADR 0062 were unassigned; `.pi/` contained exactly the five approved migration artifacts. No destination collisions were found.
- Decision: implement the plan approved in `pn-6a54f9`, reinforced by the user's explicit Build invocation. Preserve the selected plan unchanged.
- Evidence: read the complete selected plan, workflow/roadmap, relevant ADRs, lifecycle/templates, checker, five source artifacts, and inbound-reference documents. Relevant skills: Ponytail and Oxc.
- Open questions: none blocking. Code acceptance and completion remain pending.

### 2026-10-18 — Implementation and migration accounting

- Updated canonical role/mode/routing contracts, entry instructions, lifecycle, four templates, review conventions, and ADR 0062/index. Only ADR 0001 status/supersession metadata changed; ADR 0050 remains byte-identical. The structural checker adds only required-file/heading declarations.
- Moved the five artifacts with ordinary `mv`, no Git index operations. Removed `.pi/plans`, `.pi/reviews`, and `.pi` using `rmdir` only after empty. No unrelated config existed there. Preserved all basenames, historical verdicts, dates, IDs, hashes, commands/results, and approval meaning. Added relocation annotations and repaired reference/self-location paths; historical inventory paths now point to relocated homes and are explicitly annotated, not represented as new observations.
- Repaired inbound references in the two M45 corrective plans and M45 journal; no M45 acceptance/completion status was changed. External archives were not touched. No migrated file required a Markdown relative-link-depth change because their repository references were root-based plain text/code, not destination-relative links.

| Old source → new destination                                                                                                                      | Accounting                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `.pi/plans/reports-filter-loading-layout-stability.md` → `plans/reports-filter-loading-layout-stability.md`                                       | Exists; basename unchanged; old source absent. |
| `.pi/reviews/m45-reports-time-allocation-20261015T151738Z.md` → `reviews/m45-reports-time-allocation-20261015T151738Z.md`                         | Exists; basename unchanged; old source absent. |
| `.pi/reviews/m45-reports-response-range-20261015T193923Z.md` → `reviews/m45-reports-response-range-20261015T193923Z.md`                           | Exists; basename unchanged; old source absent. |
| `.pi/reviews/m45-reports-verification-fixes-20261015T211030Z.md` → `reviews/m45-reports-verification-fixes-20261015T211030Z.md`                   | Exists; basename unchanged; old source absent. |
| `.pi/reviews/reports-filter-loading-layout-stability-20261016T142702Z.md` → `reviews/reports-filter-loading-layout-stability-20261016T142702Z.md` | Exists; basename unchanged; old source absent. |

## Verification

- First `node scripts/check-workflow-docs.mjs` — exit 0, structure complete. First `pnpm format:check` — exit 1, 399 files scanned; formatting issues only in edited `docs/decisions/README.md`, `docs/llm-workflow.md`, and `docs/templates/review-template.md`. Preserved this first failure; `pnpm exec oxfmt docs/decisions/README.md docs/llm-workflow.md docs/templates/review-template.md` formatted only those three files (exit 0). No formatter configuration or protected selected plan edits.
- `git diff --check` — exit 0 before final evidence entry.
- Read-only `python3 - <<'PY'` inspections using `git diff --name-only`, `git ls-files --others --exclude-standard`, `git ls-tree -r --name-only HEAD .pi`, and `git show HEAD:<old-path>` — exit 0. All **23** existing affected files passed whitespace/conflict-marker/final-newline inspection; **158** local Markdown file links resolved, including moved artifacts and M45. No unrelated broken-link cleanup. The five migrated files exactly matched their Git originals after only old-to-new prefix repair, removal of the new relocation note, and self-location update. No wording/command/hash/approval changes were hidden by normalization.
- `rg -n --hidden` searches for old artifact prefixes/basenames, including absolute repository paths, found only explicit relocation mappings and the unchanged selected plan's historical baseline/migration instructions; no live old destinations remain. Hidden repository documents were included; generated/dependency/Git data excluded. All five old sources are absent and `.pi` no longer exists.
- Final tracked/new diff inspection found only the approved Markdown artifacts and checker declarations; no application source/tests, package/lockfile, CI, personal tooling, or unrelated milestone status changes. Staged diff is empty. Existing selected plan remains unchanged.

### Paper contract walkthrough (not runtime testing)

| Scenario                                | Expected contract verified in documentation                                                                                 |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Approved plan → Build → Review          | Explicit human authority; same absolute plan path; Build evidence in milestone; fresh independent Review.                   |
| Findings → corrective Plan              | Human chooses route; Plan revalidates stable IDs and preserves original report/unresolved findings.                         |
| No findings → human diff review         | Verify comparison scope; recommendation is not acceptance.                                                                  |
| UI chosen / skipped                     | Ask after human diff review; optional unless required; no required browser/manual case waived.                              |
| Browser closed without decision         | Explain chat fallback before opening, end turn, never infer approval from silence/closure/failure.                          |
| Verification server → UI app            | Owned verification server retained through failures, stopped/released after green checks; separate user-managed app for UI. |
| Finalize without completion declaration | Bookkeeping only; code acceptance and milestone completion remain separate actual human decisions.                          |

- After the evidence/table additions, `node scripts/check-workflow-docs.mjs` passed again; `pnpm format:check` exited 1 on only this new milestone's table alignment. Targeted `pnpm exec oxfmt docs/milestones/m46-workflow-modes-integration.md` normalized its presentation; final results follow.

No application server, database migration, unit/typecheck/build/E2E, remote checks, or extension tests ran: none is required for this approved documentation-only task. No historical M45 verification was rerun. No scope deviations or runtime logic were needed. Final documentation checks are repeated after this evidence entry below.

### Final Build checks and handoff

- `node scripts/check-workflow-docs.mjs` — exit 0, documentation structure complete.
- `pnpm format:check` — exit 0, all 399 matched files formatted.
- `git diff --check` — exit 0.
- Repeated read-only migration/link/whitespace/scope inspection — exit 0: 23 affected existing files, 158 resolved local Markdown file links, five faithful migrations, only authorized document/checker changes, no staged changes.
- Next authorized mode: Review, input `/Users/mehdi/code/btt/plans/workflow-modes-integration.md`. Human code acceptance and M46 completion remain pending; no browser review is opened by Build.

### 2026-10-18T10:48:44Z — Finalize bookkeeping

- Fact: [Independent Review](../../reviews/workflow-modes-integration-20261018T104642Z.md) found no actionable findings. Its independently executed documentation checks and limitations are recorded separately from Build evidence. The supplied Review handoff also reports `pnpm format:check` passed on 400 files after adding the report.
- Decision: the human approved code review in Plannotator `pn-837fdb` with no changes requested, then explicitly chose Finalize. Human code acceptance is recorded; no M46 completion declaration was supplied, so completion remains pending.
- Final summary: optional Pi mode contracts and artifact routing are documented, five historical artifacts are consolidated with evidence preserved, and templates/ADR/structural declarations are aligned with the approved plan. No new scope or deferrals were introduced.
- Limitations: no checks were rerun during Finalize. No runtime/browser tests ran for this approved documentation-only scope. M45 status and historical evidence are preserved; no Git writes were performed.

### 2026-10-18T10:49:49Z — Human completion declaration

- Decision: the human stated, “i declare this milestone complete.” M46 is Complete; implementation, verification evidence, independent Review, and accepted human code review are recorded above.
- Updated M46 closeout/review status and its roadmap entry. No checks were rerun or Git writes performed; M45 status and historical evidence remain unchanged.

## Review status

- Plan review: Approved in Plannotator `pn-6a54f9`; explicit user Build authorization.
- Independent review: Complete; no actionable findings. See [report](../../reviews/workflow-modes-integration-20261018T104642Z.md).
- Human code review: Accepted in Plannotator `pn-837fdb`, no changes requested; recorded above from the supplied human decision.
- Milestone completion declaration: Complete; explicit human declaration recorded on 2026-10-18 above.

## Follow-ups

- No outstanding M46 follow-ups; independent Review, human code acceptance, and completion declaration are recorded.
- Leave M45 status and ADR 0061 untouched.

## Closeout checklist

- [x] Approved implementation checklist complete; human acceptance/completion remain separate.
- [x] Verification evidence recorded.
- [x] Human code review accepted.
- [x] Human completion declaration recorded in the journal and review status.
