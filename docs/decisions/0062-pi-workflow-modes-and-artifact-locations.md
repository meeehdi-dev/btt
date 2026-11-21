# ADR 0062: Workflow artifact homes, approval gates, and handoff

- Status: Accepted
- Date: 2026-10-18
- Supersedes: [ADR 0001](0001-llm-assisted-development-workflow.md)
- Superseded by: None

## Context

An optional personal workflow extension separates Plan, Build, Review, UI, and Finalize into fresh sessions, while the project's original workflow allowed combined roles. Focused plans and reports were split between root directories and a tool-private directory, and templates lacked fresh-session references.

## Goal

Keep the workflow harness-neutral and recoverable from the repository alone: artifacts have fixed homes, plans are approved before implementation, a human reviews code before acceptance, and any handoff helper only routes.

## Decision

- Governance lives in repository docs, with an optional adapter for the Pi harness. Other agents are not required to use Pi, and nothing depends on files outside the repository.
- Carry forward ADR 0001: mandatory orientation, approved plans before implementation, human code review before acceptance, sequential ADRs for durable choices, milestone plan/log/evidence, consistent templates, and deterministic structural checks only. Scope changes need approval. Completion is human code review accepted.
- Artifact homes: focused Plans and Plan-produced feedback in `plans/<topic>.md`; standalone Review reports and Review/UI human-feedback reports in `reviews/<topic>-<UTC timestamp>.md`; milestone plan/log/evidence in `docs/milestones/`. Root `PLAN.md` stays the roadmap. Explicit task paths override per artifact type. Earlier and input reports are preserved, never replaced by a corrective plan.
- Handoff only routes: it names an authorized next mode and an absolute saved reference with concise self-contained context. It does not save, approve, check, or enforce ordering. A deliberate human instruction to build a plan authorizes that plan; automation or a selected mode alone never does.
- Build records implementation and check evidence. Review writes standalone findings without fixes or journal edits. After human review, ask for UI or Finalize. Finalize records actual human decisions and instructed bookkeeping. Git writes stay human-owned.
- Plan approval and diff review use an explicit gate. Closing, failure, and silence are never approval.
- UI is optional unless the task requires it, uses a separately user-managed running app, and cannot waive required automated checks or manual acceptance. No browser verification or verification server is required of agents (ADR 0064).

## Consequences

Fresh sessions can recover scope and evidence without a transcript. Project-local routing overrides personal defaults explicitly, and preserved reports stay navigable. Governance relies on human decisions and honest evidence, not an approval runner or enforced mode order.

## Implementation notes (non-binding)

- Canonical text: `docs/llm-workflow.md` and `AGENTS.md`; conventions in `reviews/README.md` and `docs/milestones/README.md`. The five `.pi/` artifacts were migrated into these homes (M46) with names and historical evidence preserved.
- Handoff tool: `workflow_handoff`; plan and diff gates use Plannotator.

## Alternatives considered

- Rely on the personal extension's defaults: rejected; artifacts would live outside the repository.
- An enforcement runner or approval receipts: rejected; routing is not governance and extra confirmation adds no authorization.
- Bulk renaming or re-hashing historical files: rejected; historical identity must stay intact.

## Revisions

- 2026-11-21: Rewritten to goal-level form; folds ADR 0064's clause (no browser verification or verification server), drops the milestone-completion-declaration clause and the stale ADR 0050 clause; migration details moved to notes.
