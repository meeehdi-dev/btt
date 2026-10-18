# Pi workflow modes integration and artifact consolidation

## Context and goal

Update the repository's LLM collaboration documentation to work with the installed personal Pi workflow-modes extension, without replacing project governance with tooling assumptions. Consolidate focused plans in `plans/` and independent reviews and human feedback in `reviews/`, including existing `.pi/` artifacts and all repository references to them.

The human requested review and planning first, then explicitly requested migration, filename assessment, cleanup, and updates to all links to moved files. This document proposes implementation; no migration or implementation has occurred yet.

## Scope and non-goals

In scope: workflow instructions, lifecycle and artifact conventions, templates, a durable ADR, structural documentation checks, migration of five existing artifacts, repository-wide reference repair, and execution evidence for this maintenance milestone.

Out of scope: changing the installed extension or personal Pi files, adding project extensions/dependencies, application behavior, databases, CI/deployment, changing historical findings or approval decisions, bulk-renaming existing `plans/` files, relocating external session/Plannotator archives, and completing or reconciling M45. No new artifact runner, approval receipt, sandbox, mandatory mode ordering, or generic Markdown-link checker.

## Current-state evidence and review findings

Research baseline: clean worktree at `ad29bc1` (`feat(reports): add period-based time allocation reports`). Read the canonical workflow, complete product roadmap, ADR 0001 and ADR 0050, milestone conventions, all five relevant templates, structural checker, installed extension source and all five phase prompts, and all five artifacts to migrate.

- **F1 — Confirmed: roles and handoffs lack the actual mode contract.** `docs/llm-workflow.md` permits several roles in one session. The installed `~/.pi/agent/extensions/workflow-modes.ts` creates fresh sessions for Plan, Build, Review, UI, and Finalize. Its helper only routes; it does not write documents, approve work, run checks, or enforce governance. Adapt role mapping without making Pi mandatory for other agents.
- **F2 — Confirmed: review storage is undocumented and plans are split.** Canonical docs prescribe `plans/`, but one plan and four reviews are tracked under `.pi/`. Extension defaults route unspecified reviews to `~/.pi/reviews/btt/`; existing directories alone are not project overrides. Explicit per-artifact project instructions are needed.
- **F3 — Confirmed: templates omit fresh-session requirements.** `plan-template.md` lacks explicit acceptance criteria and stop conditions; `review-template.md` lacks stable IDs, precise comparison scope, evidence separation, and remediation context; `handoff-template.md` does not identify next mode or absolute routing input.
- **F4 — Confirmed: UI/server responsibilities need separation.** ADR 0050 and canonical verification rules require ownership tracking and stopping the agent's verification server after successful checks. UI mode uses a separately user-managed, already-running app. Preserve both contracts; never stop a user-owned server or silently keep Build's verification server for UI.
- **F5 — Confirmed: closeout and acceptance need mode-specific wording.** Build records implementation/check evidence; Review writes standalone findings but no journal; Finalize performs instructed bookkeeping. Finalize selection or a commit suggestion is not human code acceptance or a milestone completion declaration.
- **F6 — Confirmed: stale bootstrap instruction.** `AGENTS.md` still says M0 must not start; the roadmap records it complete. Replace with current workflow entry guidance, not a broad product-status reconciliation.
- **F7 — Not applicable as a defect: extension automation does not enforce project gates.** This is documented intentional behavior in `~/.pi/agent/workflow/README.md`, not a reason to add custom enforcement. Keep approval/evidence requirements in repository instructions.

All confirmed findings map to implementation steps below. No confirmed issue is silently deferred.

## Decisions and rationale

1. Keep harness-neutral project governance canonical. Add a concise Pi adapter section describing `/plan`, `/build`, `/review`, `/ui`, `/finalize`, `/workflow`, fresh sessions, and `workflow_handoff`. Reference the installed extension contract without committing copies or machine-specific absolute paths.
2. Standardize focused Plans and Plan-produced feedback in `plans/<topic>.md`; Review reports and Review/UI human-feedback reports in `reviews/<topic>-<UTC timestamp>.md`. Preserve earlier reports and never overwrite an input report with its corrective plan. Explicit task paths still win per artifact type. Milestone plan/log/evidence files remain under `docs/milestones/`; root `PLAN.md` remains the roadmap.
3. Migrate all five `.pi/` artifacts, preserving current basenames. Each basename is already descriptive; reviews already contain UTC timestamp suffixes. Filename timestamps differ slightly from some recorded creation times: preserve both as historical identity, not an error to retroactively correct. No collisions were found in the destination inventory.
4. Cleanup means paths, navigable links, narrow formatting, and a relocation note where needed—not rewritten findings, commands, scope snapshots, hashes, timestamps, or approval history. Reference repairs inside historical reports are expressly authorized by this plan. Explain that embedded hashes describe pre-migration bytes; do not regenerate historical hashes to imply current verification.
5. Preserve human plan approval before implementation, human code review before acceptance, explicit scope-change approval, and explicit human milestone completion declarations. A deliberate human `/build <plan>` can authorize that plan's implementation; an automated helper request or selected mode alone cannot invent approval. No extra approval receipt or redundant start confirmation.
6. Review findings route to a revalidating Plan when chosen by the human, or the human may explicitly proceed; unresolved findings and deferrals remain visible. No-findings opens human diff review, not automatic acceptance. After human review, ask UI or Finalize. UI is optional unless an approved task explicitly requires it; skipping it does not waive required automated browser tests or mandatory manual acceptance cases.
7. Use M46 for this workflow maintenance implementation and evidence, without changing M45's status. Recheck numbering at Build; ask if M46 or ADR 0062 has since been assigned rather than overwriting another task.

## Exact artifact migration

- `.pi/plans/reports-filter-loading-layout-stability.md` → `plans/reports-filter-loading-layout-stability.md`.
- `.pi/reviews/m45-reports-time-allocation-20261015T151738Z.md` → `reviews/m45-reports-time-allocation-20261015T151738Z.md`.
- `.pi/reviews/m45-reports-response-range-20261015T193923Z.md` → `reviews/m45-reports-response-range-20261015T193923Z.md`.
- `.pi/reviews/m45-reports-verification-fixes-20261015T211030Z.md` → `reviews/m45-reports-verification-fixes-20261015T211030Z.md`.
- `.pi/reviews/reports-filter-loading-layout-stability-20261016T142702Z.md` → `reviews/reports-filter-loading-layout-stability-20261016T142702Z.md`.

Known inbound references occur in the moved files, `plans/m45-reports-response-range-fix.md`, `plans/m45-reports-verification-fixes.md`, and `docs/milestones/m45-reports-time-allocation.md`. Search all tracked and new repository documents, including hidden directories, for additional relative, root-relative, and absolute references. Correct relative link depths after moving. Remove only emptied `.pi/plans` and `.pi/reviews` directories; remove `.pi` only if truly empty. Do not touch unrelated config or external copies.

## Requirements and acceptance criteria

- **R1 — Consistent mode guidance:** a fresh agent can identify role boundaries, next-step routing, required reference, missing-input handling, and the fact that the helper is not an approval/check system. Plannotator plan review uses annotate with an explicit gate; diff review uses ordinary review with verified comparison scope. Closing/failure/silence is not approval; tell users to continue in chat if closing without deciding.
- **R2 — Explicit artifact routing:** `AGENTS.md`, canonical workflow, and templates agree on `plans/`, `reviews/`, and milestone homes. Add `reviews/README.md` describing report/feedback naming and preservation, without a manually maintained report index.
- **R3 — Complete migration:** exactly the five mapped artifacts exist at their new destinations; no old source copies remain. Basenames stay unchanged for the reasons above. Repository references resolve to new paths; migration history may mention old paths only explicitly as old-to-new mappings, not live destinations.
- **R4 — Evidence fidelity:** historical verdicts, commands/results, observation dates, IDs, hashes, and acceptance statements remain unchanged in meaning. Record relocation and any presentation-only edits separately. Do not treat historical M45 findings as new current defects or claim historical checks were rerun.
- **R5 — Governance preserved:** agent-owned verification servers, all approved final-worktree checks, full E2E for application changes, first-failure evidence, targeted-timeout rules, human code review, and completion declarations remain intact. Review does not become a fix phase; UI does not manage servers; Git writes stay human-owned.
- **R6 — Durable documentation:** add ADR 0062 for the updated workflow and artifact convention, superseding ADR 0001 while explicitly carrying forward its governance. Update only ADR 0001 status/supersession metadata, preserving its historical decision text. Keep ADR 0050 accepted and unchanged. M46 logs exact checks, migration evidence, deviations, and pending acceptance.

## Ordered implementation checklist

- [ ] **S1 — Orient and create maintenance evidence (F5/F6).** Re-read this approved plan and applicable instructions, inspect current Git state and artifact inventory, verify milestone/ADR availability, and create `docs/milestones/m46-workflow-modes-integration.md` from the existing template. Record actual approval authority and this plan reference. Add only a concise maintenance entry in `PLAN.md`; do not reconcile unrelated product statuses.
- [ ] **S2 — Consolidate artifacts and repair references (F2).** Move the five mapped files using ordinary filesystem tools, not Git index operations. Search the entire repository including hidden docs for old paths and basenames, repair inbound and inter-report references plus self-location wording, and validate destination-relative links. Preserve findings/evidence, with a concise relocation annotation explaining historical hashes/paths. Inspect each content diff for unintended history changes; remove only empty old directories.
- [ ] **S3 — Update canonical workflow and entry instructions (F1/F2/F4/F5/F6/F7).** Edit `docs/llm-workflow.md` and `AGENTS.md`: declare paths per artifact type, map roles to modes, document handoff inputs and explicit decision handling, reconcile optional UI with verification ownership, and distinguish Finalize bookkeeping from acceptance/completion. Keep current mandatory orientation and security/scope/evidence rules. Remove stale M0-start wording.
- [ ] **S4 — Align lifecycle and templates (F1/F3/F5).** Update `docs/milestones/README.md` to map lifecycle activities to modes, with research before plan approval and verification during Build, not a second mandatory state machine. Update all four plan/review/handoff/milestone templates with the minimal missing fields: references, requirements/non-goals/risks, comparison scope and stable finding IDs, evidence limitations, next-mode input, and separate human acceptance/completion statuses. Add `reviews/README.md`. Do not require duplicate Build reports or copied plans.
- [ ] **S5 — Record durable decision and structural coverage (F1–F7).** Add `docs/decisions/0062-pi-workflow-modes-and-artifact-locations.md`, update the ADR index and ADR 0001 supersession metadata, and link M46 and the canonical workflow. Extend `scripts/check-workflow-docs.mjs` only through its existing required-file/heading declarations to cover the review convention and canonical integration section. No new parser, dependency, semantic approval validator, or external-home prerequisite.
- [ ] **S6 — Validate and hand off.** Run the approved documentation checks below, inspect all moved/new files and the final diff, and append exact results and a five-file migration accounting to M46. Keep human code acceptance and completion pending. Summarize and hand off to fresh Review with this plan's absolute path, not a new self-review browser session from Build.

## Validation

This is documentation maintenance plus declarative additions to an existing structural checker, not an application/runtime change. Approved checks for this task are `node scripts/check-workflow-docs.mjs` (also exposed as `pnpm check:workflow`), `pnpm format:check`, and `git diff --check`, plus the read-only inspections below. Read the project Oxc skill before using formatting tools. Formatting fixes are limited to changed/new workflow artifacts and expressly authorized migration-reference edits.

- Verify the five-file before/after mapping, unchanged basenames, no collisions or lost artifacts, no residual `.pi/plans/` or `.pi/reviews/` live references, and no unrelated deletion. Include hidden documents and absolute project-path references in searches; explicitly distinguish migration mappings from stale destinations.
- Check every affected local Markdown link resolves from its containing file, including links among relocated reports/plans and links from M45. Do not turn unrelated pre-existing broken links into unapproved cleanup.
- Compare migrated content against the original Git versions; only authorized reference/relocation/formatting changes may differ. Historical hashes remain historical, not checksums of the new files.
- Inspect modified/new files for conflict markers, trailing whitespace, and final newline; `git diff --check` alone omits untracked contents.
- Walk through contracts on paper: approved plan → Build → Review; findings → corrective Plan; no-findings → human diff review; UI chosen/skipped; browser closed without decision; verification server stopped before a separate user-run UI server; Finalize invoked without a completion declaration. None may silently approve, lose the original reference, rerun stale work, or mark a milestone complete.
- Confirm no application source/tests, dependencies/lockfile, CI, personal Pi files, or unrelated milestone statuses changed. If runtime logic beyond declarative structural entries becomes necessary, stop for scope/validation approval.

No app server, migration, unit/typecheck/build/E2E execution, or remote checks are required for this documentation-only plan. Do not weaken the standing verification policy for future application changes. Review may independently rerun these documentation checks; no extension tests are required because the installed extension is not modified.

## Risks and stop conditions

- Historical reports contain exact command transcripts and hashes. Do not rewrite their historical meaning when repairing navigation. A relocation note makes new paths and pre-relocation evidence distinguishable.
- Stop if destinations collide, artifacts changed unexpectedly, new `.pi/` content appears whose intended migration is unclear, or milestone/ADR identifiers are occupied.
- Ask before broadening cleanup to all historical plans, rewriting approval state, altering formatter configuration, relaxing browser/server rules, or modifying the installed extension.
- Plannotator browser scope can inherit preferences; Review must confirm the intended uncommitted/branch comparison, not assume the UI matches its report.

## Fresh-session Build handoff

Implement this approved documentation/migration plan only. Consolidate the five explicit `.pi/` artifacts into root `plans/` and `reviews/`, preserve their basenames and evidence, and update every repository reference. Integrate existing personal Pi modes as an optional execution adapter while preserving repository approval, verification, ownership, and completion gates. Update the named docs/templates/structural declarations, add ADR 0062 and M46 evidence, and run only the documentation checks approved here. Do not modify this selected plan to justify scope changes, alter personal tooling or application code, or mark M45 complete. After checks pass, hand off once to Review using `/Users/mehdi/code/btt/plans/workflow-modes-integration.md`. Finalize later records only real human decisions and the required M46 closeout; it must not invent a completion declaration.
