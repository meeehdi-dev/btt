# ADR 0062: Pi workflow modes and artifact locations

- Status: Accepted
- Date: 2026-10-18
- Supersedes: [ADR 0001](0001-llm-assisted-development-workflow.md)
- Superseded by: [ADR 0064](0064-manual-application-testing.md) for browser-verification and verification-server clauses only; all other decisions remain accepted.

## Context

The personal Pi workflow-modes extension separates Plan, Build, Review, UI, and Finalize into fresh sessions, while the project's original workflow permits combined roles. Focused plans and independent reports were split between root directories and `.pi/`, and templates lacked sufficient fresh-session references. The human approved the integration and five-file migration plan in Plannotator `pn-6a54f9` and explicitly authorized Build.

## Decision

- Retain harness-neutral governance in `AGENTS.md` and `docs/llm-workflow.md`, with an optional Pi adapter. Do not copy or modify the personal extension, require Pi for other agents, or make external-home files structural prerequisites.
- Carry forward ADR 0001: mandatory orientation, approved plans before implementation, human code review before acceptance, sequential ADRs for durable choices, milestone plan/log/evidence, consistent templates, and deterministic structural checks without subjective automation. Preserve scope-change approval and explicit human milestone completion declarations.
- Store focused Plans and Plan-produced feedback in `plans/<topic>.md`; standalone Review reports and Review/UI human-feedback reports in `reviews/<topic>-<UTC timestamp>.md`; milestone plan/log/evidence in `docs/milestones/`. Root `PLAN.md` stays the roadmap. Explicit task paths override per artifact type. Preserve earlier/input reports; never replace one with its corrective plan.
- Treat `workflow_handoff` as routing only, using an authorized next mode and absolute saved reference with concise self-contained context. It neither saves, approves, checks, nor enforces ordering. Deliberate human `/build <plan>` can authorize that plan without another receipt/start confirmation; automation or selected mode alone cannot invent approval.
- Build records implementation/check evidence; Review writes standalone findings without fixes/journal maintenance. Revalidate findings in Plan if chosen by the human, or let the human explicitly proceed with unresolved findings visible. No-findings requires human diff review. After human review ask UI or Finalize.
- Use Plannotator saved-plan annotation with an explicit approval gate and ordinary diff review with verified comparison scope. Explain the next step, request a chat reply on closure without decision, and wait after opening. Closing, failure, and silence are never approval.
- Keep UI optional unless required by the approved task. It uses a separately user-managed, already-running app and performs no server lifecycle management. UI cannot waive required automated browser tests or manual acceptance cases. ADR 0050 remains accepted and unchanged: final-worktree checks/full E2E for application changes, agent-owned verification servers retained through failures and stopped/released only after success, first-failure evidence, and evidence-based targeted timeouts only.
- Finalize performs instructed bookkeeping and records actual human decisions, not implied code acceptance or completion. Git writes remain human-owned.
- Migrate the five explicitly mapped `.pi/` artifacts, preserving descriptive basenames and timestamp identity. Repair repository references and annotate relocation separately; preserve historical findings, commands/results, dates, hashes, and approvals. Hashes describe pre-relocation bytes, not new checksums. Leave external archives and M45 status untouched.

## Consequences

Fresh sessions can recover scope and evidence without a transcript. Project-local routing overrides personal defaults explicitly, and preserved reports remain navigable. Governance still relies on human decisions and honest evidence rather than an approval runner, mandatory mode ordering, or tooling enforcement. Application verification policy is not weakened by this documentation-only task's narrower checks.

## Alternatives considered

- Rely on personal extension defaults: rejected because project artifacts would live outside the repository and existing directories alone do not override routing.
- Add an enforcement runner or approval receipts: rejected because routing is intentionally not governance and redundant confirmation adds no authorization.
- Bulk rename historical files or regenerate hashes: rejected because existing names are descriptive and historical identity/evidence must remain intact.

## Links

- [Canonical workflow](../llm-workflow.md#pi-workflow-modes-integration), [agent entry instructions](../../AGENTS.md)
- [Approved integration plan](../../plans/workflow-modes-integration.md), [M46 evidence and migration accounting](../milestones/m46-workflow-modes-integration.md)
- [Review convention](../../reviews/README.md), [milestone lifecycle](../milestones/README.md)
- [ADR 0050](0050-e2e-verification-and-server-handoff.md)
