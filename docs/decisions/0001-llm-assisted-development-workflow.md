# ADR 0001: LLM-assisted development workflow

- Status: Accepted
- Date: 2026-09-21
- Supersedes: None
- Superseded by: None

## Context

The project is about to start M0 from `PLAN.md`. Before implementation, the team needs a durable workflow that future LLM agents can read to understand why decisions were made, what process to follow, and what evidence to leave for human review.

The existing `PLAN.md` defines the product direction, technical stack, and milestone roadmap. It does not by itself define how agents should plan, document decisions, perform handoffs, or prove that work was verified.

## Decision

Adopt a documentation-first LLM-assisted workflow:

- Use `AGENTS.md` as the concise root entry point for all agents.
- Use `docs/llm-workflow.md` as the canonical detailed workflow.
- Use sequential ADRs in `docs/decisions/` for durable decisions.
- Use milestone files in `docs/milestones/` for human-readable plan/log/evidence records.
- Require human approval before implementing every milestone plan.
- Require human code review before accepting completed work.
- Use templates in `docs/templates/` to keep artifacts consistent.
- Add deterministic compliance checks where useful, but avoid automating subjective judgment about prose or architecture.

## Consequences

- Future agents have a predictable orientation path before making changes.
- Human reviewers can inspect milestone plans and code changes without reconstructing the whole agent conversation.
- Decisions have stable homes and can be superseded without losing history.
- Implementation may be slower at first because agents must update docs and evidence, but reviewability and continuity should improve.
- Custom executable skills/agents are deferred until repeated tasks prove they are worth maintaining.

## Alternatives considered

- Only keep instructions in chat prompts: rejected because future agents would lose context.
- Only keep a root `AGENTS.md`: rejected because detailed workflow rules would become too long for a concise entry point.
- Build custom executable agents immediately: rejected because the workflow should stabilize before automation encodes it.

## Links

- `AGENTS.md`
- `docs/llm-workflow.md`
- `docs/milestones/README.md`
- `docs/decisions/README.md`
- `PLAN.md`
- `plans/llm-assisted-workflow.md`
