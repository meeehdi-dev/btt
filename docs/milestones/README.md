# Milestones

Each milestone must be small, human-readable, and independently reviewable. Use `docs/templates/milestone-template.md` when creating a milestone file.

## Required lifecycle

1. **Orient** — read `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`, relevant ADRs, and prior milestone files.
2. **Research** — inspect existing code/docs and record reusable patterns or constraints before seeking plan approval.
3. **Plan** — create/update the milestone and focused plan with references, acceptance criteria, non-goals, approach, files/reuse, steps, risks/stop conditions, and verification. Obtain human approval before implementation.
4. **Implement** — work in small slices under the approved plan. Record deviations as they happen.
5. **Verify** — during Build, run all approved retained automated checks on the final worktree and record commands/outcomes. Application testing is human-owned and manual (ADR 0064); record only actual human results and leave other manual cases pending. Follow canonical resource ownership/cleanup rules before handoff.
6. **Review** — independently assess the diff, then submit it for human code review. Findings require human direction for corrective planning or proceeding; Review itself does not fix code.
7. **Close** — update the milestone file with final summary, decisions, verification evidence, known follow-ups, and links to ADRs. A milestone is complete only after the approved checklist is done or explicitly deferred, evidence is recorded, human code review is accepted, and the human’s completion declaration is recorded in the milestone journal/review status. A direct chat statement such as “I hereby declare M1 complete” is sufficient; the agent must transcribe it and update the artifact.

With optional Pi modes, Orient/Research/Plan map to Plan, Implement/Verify to Build, independent assessment and human diff review to Review, optional app inspection to UI, and bookkeeping/Close to Finalize. These activities are not a second mode state machine. See [canonical mode contracts](../llm-workflow.md#pi-workflow-modes-integration).

Focused plans and Plan-produced feedback live in `plans/`; standalone Review and Review/UI human-feedback reports live in `reviews/` with a UTC timestamp. Explicit task paths win per artifact type. This directory remains the milestone plan/log/evidence home; do not duplicate the approved plan or require a separate Build report. Preserve earlier input reports. Finalize selection alone never accepts code or supplies a completion declaration.

## Required sections in each milestone file

- Context
- Approved scope
- Out of scope
- Source references
- Approach
- Files to modify
- Reuse
- Decisions and ADR links
- Implementation checklist
- Journal
- Verification
- Review status
- Follow-ups

## Closeout checklist

- [ ] All approved checklist items are complete or explicitly deferred.
- [ ] Relevant tests/checks pass or failures are documented with next steps.
- [ ] User-visible behavior is described clearly enough for review.
- [ ] ADRs are added or updated for durable decisions.
- [ ] Follow-ups are captured and linked.
- [ ] Human completion declaration is recorded in the journal and review status is updated to `Complete`.
