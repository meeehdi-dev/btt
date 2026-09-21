# Milestones

Each milestone must be small, human-readable, and independently reviewable. Use `docs/templates/milestone-template.md` when creating a milestone file.

## Required lifecycle

1. **Orient** — read `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`, relevant ADRs, and prior milestone files.
2. **Plan** — create/update a milestone file with context, approach, files to modify, reuse, steps, and verification. Submit it for human review.
3. **Research** — inspect existing code/docs and record reusable patterns or constraints in the milestone file.
4. **Implement** — work in small slices under the approved plan. Record deviations as they happen.
5. **Verify** — run relevant automated checks and manual checks. Record commands and outcomes.
6. **Review** — submit the diff for human code review. Address feedback in focused changes.
7. **Close** — update the milestone file with final summary, decisions, verification evidence, known follow-ups, and links to ADRs.

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
