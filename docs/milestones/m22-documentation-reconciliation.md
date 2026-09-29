# M22 — Roadmap and documentation reconciliation

> **Status:** Complete — documentation changes, verification, human code review, and completion declaration are recorded.

## Context

M21 (pnpm v12) is complete. This M22 plan was created to reconcile several documentation records that disagree with completed milestone evidence:

- `PLAN.md` skips M9–M15, although those milestones have completed records under `docs/milestones/`.
- `PLAN.md` still calls M2.5 a planning placeholder, while `docs/milestones/m2.5-uuidv7-identifier-migration.md` records it complete.
- The M7 heading and final implementation checklist still say in progress/pending, despite the journal and review status declaring it complete.
- `plans/next-milestone.md` is the completed M8 implementation plan, but its final checklist item is unchecked and its status does not state M8 is complete.
- The product feature inventory in `PLAN.md` has unchecked boxes even for capabilities delivered by completed milestones; the final Steps/Verification sections also retain stale unchecked items, including M0 planning.

M2.5 explicitly defers production migration/backfill and rollback planning until before deployment if the database is no longer disposable. The user has directed that first-release deployment work follows this documentation cleanup. That deployment work is a separate future milestone, not authorized by this plan.

## Approved scope

**Approved by the human after review with no feedback.**

- Reconcile `PLAN.md` with completed milestone evidence: add concise M9–M15 roadmap entries with links and completed status; correct M2.5's status; confirm M19–M21 completion status is clear; and distinguish the historical pnpm 10 snapshot from the current pnpm 12.8.1 pin in ADR 0034.
- Reconcile the `PLAN.md` feature inventory and Steps/Verification checklists against completed milestone records. Mark delivered items complete only where evidence supports them; reword obsolete descriptions and leave genuinely deferred/post-MVP items open. Preserve intentional product exclusions and identify remaining work clearly.
- Correct M7's stale heading and final checklist item without changing its historical implementation/review journal.
- Update `plans/next-milestone.md` to identify it as the completed M8 plan and reconcile its final checklist with the M8 milestone's accepted review and completion declaration. Preserve the approved plan's historical scope and journal.
- Record in this milestone's follow-ups that first-release deployment is the next planning task after M22. Preserve M0's deferral and M2.5's production-migration caveat as source references; do not design or implement deployment here.

## Out of scope

- Application code, tests, dependencies, schema, auth/security, CI workflow, deployment configuration, credentials/secrets, release-please, Docker/GHCR, Coolify, or database migration/backfill implementation.
- Changing accepted product or architecture decisions, milestone implementation scope, or historical journal facts.
- Treating the future deployment task as planned or approved implementation. It requires its own milestone plan and human approval.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`
- Completed milestone evidence: `docs/milestones/m0-project-bootstrap.md`, `m2.5-uuidv7-identifier-migration.md`, `m7-search-and-ui-polish.md`, `m8-polish-and-shared-ticket-work-items.md`, and M9–M21 records
- Historical M8 plan: `plans/next-milestone.md`
- Completed broader planning sequence: `plans/wide-app-composability-effect-pass.md`
- Deployment deferral: M0 milestone; production ID migration caveat: M2.5 milestone

## Approach

1. Build a claim-to-evidence inventory from the completed milestone records before editing roadmap/checklist statuses. Preserve distinctions between implemented, intentionally deferred, and later/post-MVP features.
2. Add a concise chronological M9–M15 section to `PLAN.md`, using each milestone's accepted goal and a link to its execution record; avoid duplicating detailed implementation journals.
3. Update inaccurate statuses and reconcile the product inventory and planning checklists against evidence. Do not mark ambiguous items complete; record them as open or ask the human if a product-scope judgment is required.
4. Correct only the stale M7 status/checklist and M8 plan status/checklist; retain their historical journal entries and approved scope.
5. Run documentation/workflow/format/whitespace checks, inspect the final diff, and record results here. Do not touch deployment implementation.

## Files to modify

- `PLAN.md`
- `docs/milestones/m7-search-and-ui-polish.md`
- `plans/next-milestone.md`
- `docs/milestones/m22-documentation-reconciliation.md` (this plan and execution record)

No application, test, dependency, ADR, CI, or deployment files are planned.

## Reuse

- Treat each completed milestone's approved scope, review status, and completion declaration as evidence; do not infer delivery from roadmap text alone.
- Use the existing chronological milestone conventions in `PLAN.md` and link each summary to its full milestone record.
- Preserve M0's deployment deferral and M2.5's production-migration caveat for the later deployment plan.

## Decisions and ADR links

- No new product or architecture decision is proposed. This is a documentation consistency pass.
- Human sequencing direction: complete this documentation cleanup before planning first-release deployment. Record as a follow-up; it does not authorize deployment changes.

## Implementation checklist

- [x] Human approves this plan before documentation edits.
- [x] Inventory roadmap/checklist statements against completed milestone evidence.
- [x] Add completed M9–M15 summaries, correct M2.5's stale status, and confirm M19–M21 completion status in `PLAN.md`.
- [x] Reconcile `PLAN.md` feature inventory, Steps, and Verification sections without marking unsupported/ambiguous claims complete.
- [x] Reconcile the stale M7 heading/checklist and completed M8 plan status/checklist.
- [x] Run and record formatting, workflow, link/reference, and whitespace checks.
- [x] Submit the full documentation diff for human review and record the review decision.
- [x] Record the completion declaration before closing M22.

## Journal

### 2026-09-29 — Planning research

- Fact: M21 is complete; `git status --short --branch` showed a clean `main` branch at `276d06e` during orientation.
- Fact: `PLAN.md` jumps from M8 to M16, describes M2.5 as a planning placeholder, and has unchecked feature/verification items for work delivered by completed milestones.
- Fact: M7's journal/review status records completion while its heading and final checklist remain pending. The M8 plan's milestone record reports completion while its own final checklist remains unchecked.
- Fact: M0 deferred release automation/deployment to a separately approved follow-up. M2.5 defers production migration/backfill/rollback planning until before deployment if existing data must be preserved.
- Decision (human): documentation cleanup comes before planning first-release deployment. Deployment implementation is outside M22.
- Evidence: read the workflow, roadmap, milestone template, relevant completed milestone records, `plans/next-milestone.md`, and `plans/wide-app-composability-effect-pass.md`. No application or existing documentation files were edited during planning.

### 2026-09-29 — Plan approval

- Fact: the human reviewed this plan and reported no feedback.
- Decision: treat the no-feedback review as approval; documentation implementation is authorized within the stated scope.
- Evidence: direct user annotation in chat.

### 2026-09-29 — Documentation reconciliation

- Fact: `PLAN.md` now records completed M9–M15 work, the completed M2.5 local UUIDv7 migration, and the current pnpm 12.8.1 baseline alongside the historical version snapshot. M19–M21 were already explicitly marked complete, so those records were verified without redundant edits.
- Fact: the feature inventory distinguishes delivered scope from open work. It reflects the M19 removal of the Projects collection, the actual Today progress placement, and the remaining client recent-time and project-wide summary gaps. Post-MVP items remain open.
- Fact: M7's stale heading/checklist and the completed M8 plan's stale status/checklist are reconciled with their accepted review and completion declarations. Historical journals and approved scopes were left unchanged.
- Decision: deployment remains a separate future milestone. The roadmap preserves M0's deployment deferral and M2.5's production migration/backfill/rollback caveat.
- Evidence: `pnpm format:check` passed on 258 files; `pnpm check:workflow` passed; `pnpm exec oxfmt --check` passed on all four touched Markdown files; `git diff --check` and the untracked M22 whitespace check passed. Manually verified all added milestone/ADR file references exist. No application, test, dependency, CI, or deployment files changed.

### 2026-09-29 — Human code review

- Fact: the human reviewed the documentation diff and requested no changes.
- Decision: code review accepted; no follow-up edits requested. M22 remains open until the human completion declaration is recorded.
- Evidence: direct human review in chat: “Code review completed — no changes requested.”

### 2026-09-29 — Completion declaration

- Fact: after being asked for the M22 completion declaration before starting first-release deployment planning, the human replied, “go”.
- Decision: interpret this contextual approval as the human's declaration that M22 is complete and authorization to start planning the next milestone. No deployment implementation is authorized by this declaration.
- Evidence: direct user statement in chat.

## Verification

Planning checks before approval:

- [x] `node scripts/check-workflow-docs.mjs` — passed.
- [x] `pnpm exec oxfmt --check docs/milestones/m22-documentation-reconciliation.md` — passed.
- [x] Human reviewed the plan and reported no feedback; implementation authorized.

Implementation checks:

- [x] `pnpm format:check` — passed on 258 files.
- [x] `pnpm check:workflow` — passed.
- [x] `git diff --check` and untracked M22 whitespace check — passed.
- [x] Manually verified every added milestone/ADR reference exists and inspected the full diff; historical milestone journals and approved scopes are preserved.

## Review status

- Plan review: Approved by the human after review with no feedback.
- Code review: Accepted by the human; no changes requested.
- Milestone completion declaration: Recorded from the human's contextual “go” after the code review and request to proceed to deployment planning.

## Follow-ups

- After M22 is reviewed and complete, create a separate approved milestone plan for first-release deployment. Include the M0-deferred release/deployment automation decisions only if still desired, and address M2.5's production migration/backfill/rollback caveat based on the target database state. No deployment decisions are made here.

## Closeout checklist

- [x] Approved scope complete or explicitly deferred.
- [x] Verification evidence recorded.
- [x] Human code review accepted.
- [x] Human completion declaration recorded in the journal and review status.
