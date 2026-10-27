# Plan Title

Save focused plans and Plan-produced feedback in `plans/<topic>.md`; milestone plan/log/evidence stays in `docs/milestones/`. Explicit task paths win per artifact type. Preserve input reports and earlier plans; never replace a review with its corrective plan.

## Context and references

Why this change is being made and intended outcome. Link the request, current milestone, relevant ADRs, and any input review/report. Distinguish facts, decisions, hypotheses, and open questions; revalidate reported findings against current code.

## Requirements and acceptance criteria

- R1: Observable outcome and how it will be verified.

## Non-goals

- ...

## Approach

Recommended approach only, with rationale for consequential choices.

## Files to modify

- ...

## Reuse

Existing functions, utilities, docs, or patterns to reuse.

## Steps

- [ ] ...

## Verification

Exact retained automated checks on the final worktree and human-owned manual application acceptance cases. No E2E/browser suite or verification app server is required (ADR 0064). Follow canonical resource ownership/cleanup rules; optional UI does not replace retained checks or human manual acceptance. Leave unperformed manual cases pending.

## Risks and stop conditions

What could break; which missing input or consequential decision requires stopping for human direction?

## Finding disposition and open questions

Account for each input finding by stable ID: confirmed, disproved with evidence, deferred with human approval, or out of scope. Keep unresolved findings visible.

## Approval and fresh-session handoff

- Human plan approval: Pending (record actual authority, not an inferred receipt).
- Next mode: Build after approval.
- Absolute input: resolve this saved plan's path at handoff time.
- Context: scope, milestone, constraints, evidence limitations, and pending decisions sufficient without the previous transcript.

Build must not rewrite this approved plan to justify extra work. Implementation approval is not human code acceptance or a milestone completion declaration.
