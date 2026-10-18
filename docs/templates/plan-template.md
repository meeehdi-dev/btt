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

Exact automated checks and mandatory manual acceptance cases on the final worktree. For application changes include full E2E and canonical agent-owned server failure/cleanup rules; optional UI does not replace these checks.

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
