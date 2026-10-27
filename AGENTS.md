# Agent Instructions

Before planning or implementation, every agent must read:

1. `docs/llm-workflow.md` — canonical collaboration workflow.
2. `PLAN.md` — product scope, technical direction, and milestone roadmap.
3. Relevant files in `docs/decisions/` and `docs/milestones/`.
4. The approved plan for the current task, if one exists.

## Non-negotiable rules

- Human approval is required before implementing every milestone plan.
- Human code review is required before accepting completed work.
- Before review handoff, run every approved retained automated check on the final worktree. Application testing is human-owned and manual; no E2E/browser suite or agent verification app server is required (ADR 0064). Record manual results only when supplied by the human; otherwise leave them pending. Clean up agent-owned verification resources, verify released ports, and never stop a user-owned server. Follow `docs/llm-workflow.md`.
- Project-local skills are in `.agents/skills/`; read the relevant skill before using its tool. M0 reviewed maintainer guidance for Nuxt UI, Effect, and Oxc is linked there.
- Keep milestone plans and logs human-readable.
- Record durable decisions as ADRs in `docs/decisions/`.
- Record implementation evidence in the active milestone file: commands, outcomes, manual checks, deviations, and follow-ups.
- Distinguish facts, decisions, hypotheses, and open questions.
- Stay within the approved scope. Ask before making high-impact changes to architecture, auth/security, schema, dependencies, deployment, or workflow.
- For UI changes on analogous surfaces, inspect sibling routes/components and relevant tests. Share presentation components when rendering should match, test parity, and preserve intentional density or interaction differences.

## Artifact routing and workflow entry

- Focused Plans and Plan-produced feedback: `plans/<topic>.md`.
- Standalone Review reports and Review/UI human-feedback reports: `reviews/<topic>-<UTC timestamp>.md`; see `reviews/README.md`.
- Milestone plan/log/evidence: `docs/milestones/mN-slug.md`; root `PLAN.md` remains the roadmap. Explicit task paths win per artifact type. Preserve input and earlier reports; never overwrite a review with its corrective plan.
- Follow `docs/llm-workflow.md` and ADR `docs/decisions/0062-pi-workflow-modes-and-artifact-locations.md` (superseding ADR 0001). Read the current task reference, not a historical bootstrap instruction.
- Pi modes are optional fresh-session role adapters. `workflow_handoff` routes an authorized next mode with an absolute saved plan/report path and concise context; it does not save, approve, verify, or enforce ordering. Ask when inputs or the next decision are unclear.
- A deliberate human `/build <plan>` may authorize that plan; no second start confirmation is required. Mode selection or automation alone is not approval. After human code review ask UI or Finalize; optional UI never waives required checks/manual acceptance.
- Build records implementation/check evidence; Review writes standalone findings without fixes/journal updates; UI uses a separately user-managed running app without server lifecycle changes; Finalize records only actual human decisions and instructed bookkeeping. Git writes stay human-owned.
- Use installed Plannotator for review: saved plans via `annotate` with `gate: true`, diffs via `review` with verified comparison scope. Explain the next step and ask for a chat reply if closed without deciding; end the turn after opening. Closure/failure/silence is not approval. Human acceptance and an explicit milestone completion declaration remain separate gates.
