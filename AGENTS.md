# Agent Instructions

Before planning or implementation, every agent must read:

1. `docs/llm-workflow.md` — canonical collaboration workflow.
2. `PLAN.md` — product scope, technical direction, and milestone roadmap.
3. Relevant files in `docs/decisions/` and `docs/milestones/`.
4. The approved plan for the current task, if one exists.

## Non-negotiable rules

- Human approval is required before implementing every milestone plan.
- Human code review is required before accepting completed work.
- Before review handoff, run every approved local check on the final worktree, including full E2E/browser tests. Keep an agent-owned app server running through failures; stop it only after all checks pass and verify its port is released. Never stop a user-owned server. Follow `docs/llm-workflow.md` for the full handoff and evidence-based targeted-timeout policy.
- Project-local skills are in `.agents/skills/`; read the relevant skill before using its tool. M0 reviewed maintainer guidance for Nuxt UI, Effect, and Oxc is linked there.
- Keep milestone plans and logs human-readable.
- Record durable decisions as ADRs in `docs/decisions/`.
- Record implementation evidence in the active milestone file: commands, outcomes, manual checks, deviations, and follow-ups.
- Distinguish facts, decisions, hypotheses, and open questions.
- Stay within the approved scope. Ask before making high-impact changes to architecture, auth/security, schema, dependencies, deployment, or workflow.

## Current workflow state

The LLM-assisted workflow is defined by ADR `docs/decisions/0001-llm-assisted-development-workflow.md` and `docs/llm-workflow.md`. M0 must not start until its milestone plan is created from the template and approved.
