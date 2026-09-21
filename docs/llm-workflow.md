# LLM-Assisted Development Workflow

This document is the canonical workflow for human/LLM collaboration in this repository. All future agents must read it before planning or implementation.

## Documentation layout

- `AGENTS.md` — concise root entry point for agents. It lists mandatory reading and non-negotiable operating rules.
- `PLAN.md` — product and milestone roadmap. It explains what the app is and the intended order of product implementation.
- `plans/*.md` — temporary or focused planning documents reviewed before implementation.
- `docs/llm-workflow.md` — canonical collaboration workflow, governance rules, roles, lifecycle, and evidence standards.
- `docs/decisions/README.md` — ADR index and conventions.
- `docs/decisions/NNNN-descriptive-slug.md` — durable decision records. Use four-digit sequential numbers.
- `docs/milestones/README.md` — milestone execution convention.
- `docs/milestones/mN-slug.md` — human-readable milestone plan/log/evidence file for milestone `N`.
- `docs/templates/*.md` — reusable templates for milestone plans, ADRs, reviews, and handoffs.
- `scripts/` — optional deterministic compliance checks. Scripts must check structure and omissions, not judge prose quality.

## Naming conventions

- ADRs: `docs/decisions/0001-short-slug.md`, `0002-short-slug.md`, etc.
- Milestones: `docs/milestones/m0-project-bootstrap.md`, `m1-authentication-shell.md`, etc.
- Templates: `docs/templates/<artifact>-template.md`.
- Plan files: `plans/<short-topic>.md` for focused plans; reserve root `PLAN.md` for the product roadmap.

## Constitution

### Source-of-truth precedence

When sources conflict, resolve them in this order:

1. Direct human instruction in the current conversation.
2. Approved Plannotator plan for the current task.
3. `AGENTS.md` and this workflow document.
4. Current milestone file in `docs/milestones/`.
5. ADRs in `docs/decisions/`, preferring the newest non-superseded record for the same topic.
6. Product roadmap in `PLAN.md`.
7. Existing implementation and tests.

If a conflict cannot be resolved safely, stop and ask the human before changing code or durable docs.

### Scope control

- Work only inside the approved plan and current milestone scope.
- Keep milestones small enough for a human to review end-to-end.
- Prefer vertical slices that leave the app working over broad unfinished layers.
- Treat schema/auth/security/dependency/tooling changes as high-impact: they require explicit human-approved planning.
- Record any approved deviation in the milestone file and, if durable, an ADR.

### Evidence standards

Agents must distinguish:

- **Facts** — observed in files, command output, docs, or user instructions; cite paths/commands.
- **Decisions** — choices approved by the human or captured in ADRs; link the ADR or conversation-derived plan.
- **Hypotheses** — plausible but unverified assumptions; either verify or label as open.
- **Open questions** — items that need human judgment or further research.

Implementation evidence should include the relevant commands run, their result, and any manual checks performed.

### Safety rules

- Do not perform destructive operations, secret exposure, broad rewrites, dependency upgrades, or external publishing unless explicitly approved.
- Read existing files and reuse established patterns before introducing new structure.
- Keep edits focused and reviewable.
- Do not hide failing checks. Record failures, explain cause, and either fix them or document why they remain.

### Definition of done

A task is done only when:

- The approved scope is implemented or explicitly deferred with human approval.
- Relevant docs, ADRs, and milestone records are updated.
- Verification commands/manual checks are recorded with outcomes.
- The diff is ready for human code review.
- Any follow-up work is captured in the milestone file or roadmap.

## Agent roles and handoffs

Agents may perform multiple roles in one session, but they must make the active role clear in their artifacts.

### Planner / researcher

Purpose: understand scope, inspect existing code/docs, and produce a human-readable plan.

Required inputs:

- User request.
- `AGENTS.md`, this workflow, `PLAN.md`, relevant milestone and ADR files.

Required outputs:

- A plan file in `plans/` or `docs/milestones/` with context, approach, files to modify, reuse, steps, and verification.
- Explicit open questions and tradeoffs that require human judgment.

Handoff: implementation may begin only after human approval of the plan.

### Implementer

Purpose: execute an approved plan in small reviewable slices.

Required inputs:

- Approved plan.
- Relevant source files and docs.

Required outputs:

- Focused code/docs changes.
- Updated milestone log with deviations and verification evidence.
- Any needed ADR updates.

Handoff: reviewer/tester receives the diff, milestone file, and verification notes.

### Reviewer / tester

Purpose: independently assess correctness, maintainability, and workflow compliance.

Required inputs:

- Diff under review.
- Approved plan and milestone evidence.
- Relevant ADRs and tests.

Required outputs:

- Review findings with severity and file references.
- Verification gaps or additional checks.
- Approval recommendation or required changes.

Handoff: human reviews code and findings before merge/acceptance.

### Documentation keeper

Purpose: preserve durable reasoning and keep navigation current.

Required inputs:

- Implemented changes, decisions, reviewer feedback, and verification results.

Required outputs:

- Updated ADR indexes, milestone closeout, templates, and roadmap links.
- Clear notes for future agents.

### Human approval gates

Human approval is mandatory for:

- Every milestone plan before implementation.
- Every code review before accepting completed work.
- Architecture, data model, auth/security, dependency, deployment, and workflow changes.
- Any deviation from an approved plan that changes scope, risk, or user-visible behavior.

## Milestone lifecycle

Every product milestone follows the lifecycle in `docs/milestones/README.md`:

1. Orient.
2. Plan.
3. Research.
4. Implement.
5. Verify.
6. Review.
7. Close.

A milestone is **completed** only when its approved implementation checklist is complete or explicitly deferred, verification evidence is recorded, required ADRs/docs are updated, human code review is accepted, and a human completion declaration is recorded in the milestone file. The human may declare completion directly in chat (for example, “I hereby declare M1 complete”); the agent must transcribe that decision, update review/closeout status, and preserve any follow-ups. The declaration is an acceptance gate, not a replacement for tests or review evidence.

The milestone file is the running log for that work. It must be human-readable enough for a reviewer to understand what changed without reconstructing the entire agent session.

## Decision records and journals

Use ADRs for durable decisions and milestone journals for execution history.

- ADR rules live in `docs/decisions/README.md`.
- New durable decisions use `docs/templates/adr-template.md`.
- Do not rewrite accepted ADRs to change meaning. Supersede them with a newer ADR.
- Use milestone journals for discoveries, deviations, verification evidence, and reviewer feedback that matters within a milestone but does not become durable policy.
- If a journal entry reveals a durable choice, promote it to an ADR and link both directions.

## Compliance checks

Use lightweight deterministic checks to catch missing artifacts and required headings:

```bash
node scripts/check-workflow-docs.mjs
```

These checks intentionally verify structure only. They do not decide whether a plan is good, whether an ADR is wise, or whether verification evidence is sufficient. Those remain human review responsibilities.

Before opening a milestone for implementation or submitting a workflow/doc change for review, agents should run the check above when Node is available and record the outcome in the relevant plan or milestone file.
