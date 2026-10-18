# LLM-Assisted Development Workflow

This document is the canonical workflow for human/LLM collaboration in this repository. All future agents must read it before planning or implementation.

## Documentation layout

- `AGENTS.md` — concise root entry point for agents. It lists mandatory reading and non-negotiable operating rules.
- `PLAN.md` — product and milestone roadmap. It explains what the app is and the intended order of product implementation.
- `plans/*.md` — focused plans and Plan-produced feedback reports reviewed before implementation; preserve earlier inputs.
- `reviews/*.md` — standalone independent Review reports and Review/UI human-feedback reports; conventions in [`reviews/README.md`](../reviews/README.md).
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
- Plans and Plan-produced feedback: `plans/<short-topic>.md`; reserve root `PLAN.md` for the product roadmap.
- Review reports and Review/UI human feedback: `reviews/<short-topic>-<UTC timestamp>.md`, for example `reviews/filter-loading-20261018T104016Z.md`.
- Explicit task paths override defaults per artifact type, not for all artifacts. Milestone plan/log/evidence remains in `docs/milestones/`; do not copy plans or require a separate Build report. Existing directories alone are not routing instructions.
- Never overwrite an input report with its corrective plan or overwrite earlier reports. Make fresh-session references self-contained and navigable.

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
- For UI changes on analogous routes/components, inspect sibling surfaces and relevant tests before implementation. When rendering should match, prefer shared presentation components and add parity coverage; preserve and test intentional density or interaction differences.
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

### Local verification and server handoff

Before an implementation is handed to a human for code review, run every automated check required by its approved plan against the final worktree. For application changes, this includes the full E2E/browser suite; listing tests, running only focused tests, or skipping browser execution because a server is unavailable does not count as full verification. Record exact commands and outcomes in the active milestone.

Run non-browser gates before browser tests (database migration on an isolated test database, format, lint, both typechecks, unit tests, build, workflow/documentation checks, and diff checks as applicable). Then:

1. Start and track a local app server owned by the agent. Do not silently attach to or terminate a process whose owner is unknown.
2. Run focused browser tests as needed, then the full Playwright suite against that already-running server. Use `PLAYWRIGHT_SKIP_DEV_SERVER=1` and `PLAYWRIGHT_BASE_URL` as needed so Playwright does not own and automatically stop the server.
3. If any check fails, keep the agent-owned server running while investigating and fixing the issue; repeat focused checks and then the full suite. Do not report the work ready for review or stop the server while required checks remain failing.
4. Only after all required checks pass on the final worktree, stop the server started by the agent and verify it exited/released its port. Then hand off for human code review. Never stop a user-owned server without explicit permission.

Keep first-failure evidence visible. Do not add automatic retries or raise global assertion/test/job timeouts to make a red check pass. A per-test timeout increase may be used only when recent run durations show that a specific test regularly takes over 20–25 seconds or approaches the default 30-second budget and trace evidence shows its intended work continues to progress. Add only bounded, test-specific headroom, document the before/after budget and evidence in the milestone, and do not use extra time to mask missing state, stale/detached locators, wrong expectations, or fixture defects. Preserve ADR 0041's no-automatic-retry CI policy.

## Agent roles and handoffs

These roles are harness-neutral. Make the active role clear in artifacts; agents outside Pi may combine roles in a session. The optional Pi adapter below uses fresh sessions to separate their context.

### Planner / researcher

Purpose: understand scope, inspect existing code/docs, and produce a human-readable plan.

Required inputs:

- User request.
- `AGENTS.md`, this workflow, `PLAN.md`, relevant milestone and ADR files.

Required outputs:

- A focused plan in `plans/` or a milestone plan in `docs/milestones/`, with source references, requirements/acceptance criteria, non-goals, approach, files/reuse, ordered steps, risks/stop conditions, and verification.
- When planning from findings, revalidate them against current code, preserve the input report, and account for each finding as confirmed, disproved, deferred with human approval, or out of scope.
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

Handoff: after all approved final-worktree checks pass, reviewer/tester receives the approved plan, diff, milestone file, and verification notes. Build records evidence in the active milestone, not a duplicate Build report; human acceptance/completion entries belong to later closeout.

### Reviewer / tester

Purpose: independently assess correctness, maintainability, and workflow compliance.

Required inputs:

- Diff under review.
- Approved plan and milestone evidence.
- Relevant ADRs and tests.

Required outputs:

- A standalone report in `reviews/` with exact comparison scope (HEAD/base, staged/unstaged/untracked files or branch range), stable finding IDs, severity, locations, evidence, and remediation/revalidation context.
- Independently executed checks separated from historical Build evidence, plus verification gaps and limitations.
- Approval recommendation or required changes, never inferred human acceptance.

Review does not fix code or maintain the implementation journal. With findings, ask whether the human wants a corrective Plan or explicitly chooses to proceed; preserve unresolved findings and approved deferrals. Without findings, open human diff review, not automatic acceptance. Human review remains required before merge/acceptance.

### Documentation keeper

Purpose: preserve durable reasoning and keep navigation current.

Required inputs:

- Implemented changes, decisions, reviewer feedback, and verification results.

Required outputs:

- Updated ADR indexes, milestone closeout, templates, and roadmap links.
- Clear notes for future agents.

Finalize maps to this bookkeeping role: record actual human decisions, instructed ADR/index/roadmap updates, and milestone closeout. Selecting Finalize or suggesting a commit does not accept code or declare a milestone complete. Leave Git writes to the human.

### Human approval gates

Human approval is mandatory for:

- Every milestone plan before implementation.
- Every code review before accepting completed work.
- Architecture, data model, auth/security, dependency, deployment, and workflow changes.
- Any deviation from an approved plan that changes scope, risk, or user-visible behavior.

## Pi workflow modes integration

Pi is an optional execution adapter, not a project requirement. The installed personal `workflow-modes` extension supplies `/plan`, `/build`, `/review`, `/ui`, `/finalize`, and `/workflow` (mode selection/status). Its prompts and routing helper do not replace this repository's governance; do not copy the extension into the project or require external-home files for checks.

| Mode     | Role and required reference                                                  | Boundary / next step                                                                                                                     |
| -------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Plan     | Planner/researcher; request or saved plan/report                             | Research first, save a self-contained plan/feedback in `plans/`, obtain human approval before Build.                                     |
| Build    | Implementer; approved plan                                                   | Implement and verify; append milestone evidence; hand the same plan path to fresh Review.                                                |
| Review   | Independent reviewer; approved plan or explicit review report/task           | Establish actual Git scope, save findings in `reviews/`; ask about corrective Plan or proceed, or open human diff review on no findings. |
| UI       | Optional visual/interaction review; plan/report plus already-running app URL | Use a separately user-managed server; save feedback in `reviews/`. Do not start/stop servers or alter application code.                  |
| Finalize | Documentation keeper; plan/report and actual human decisions                 | Perform instructed bookkeeping; leave acceptance/completion pending when not explicitly supplied.                                        |

Each mode starts a fresh session. Read the complete selected reference and applicable instructions; follow relevant code/docs, and ask for missing consequential inputs before dependent changes. Saved handoffs must stand alone: original plan/report, current state, findings/deferrals, exact evidence/limitations, next mode, and absolute input path. Resolve repository paths to absolute paths at handoff time; do not rely on the preceding transcript or stale temporary resources.

When the next phase is known and authorized, call `workflow_handoff` once with its mode, absolute saved plan/report path (or a new task for Plan), and concise context. The helper only routes: it does not save artifacts, approve work, run checks, or enforce phase order. If the next step is unclear, ask the human. Modes guide work, not a second mandatory state machine; direct human changes of direction remain valid within governance.

A deliberate human `/build <plan>` can authorize implementation of that plan; do not demand an extra approval receipt or redundant start confirmation. An automated helper request or mode selection alone cannot invent human plan approval. Review findings do not automatically authorize fixes. After human diff review, ask whether to use UI or Finalize; UI is optional unless the approved task requires it. Skipping UI never waives automated browser tests or mandatory manual acceptance cases.

### Plannotator decisions

Use the installed Plannotator tool (read its applicable skill first), not a private integration or native plan mode. For saved plan review use `annotate` with the plan path and `gate: true`; for human diff review use ordinary `review`. Verify the intended uncommitted or branch/base comparison before opening and confirm the UI scope matches the report; inherited browser preferences are not evidence of scope.

Before opening, explain the next step and tell the human to reply in chat if they close without deciding. End the turn after opening and wait for an explicit decision. Closing, tool failure, dismissal, or silence is not approval: ask in chat whether to approve, retry, stop, or change direction. Preserve actual decisions and outstanding findings without inventing timestamps or receipts.

### UI versus verification server ownership

Build's agent-owned verification server follows the mandatory policy above: keep it through failures, stop it only after every required check passes, and verify its port is released before review handoff. Do not silently retain it for UI. If UI is chosen later, the human separately starts/manages an app and supplies its URL; UI must not stop that user-owned server. Recheck ownership if more implementation or verification is requested. Optional UI is not a substitute for full E2E on application changes. [ADR 0050](decisions/0050-e2e-verification-and-server-handoff.md) remains accepted and unchanged.

The durable adapter/artifact decision is [ADR 0062](decisions/0062-pi-workflow-modes-and-artifact-locations.md), superseding ADR 0001 while carrying its governance forward. Implementation evidence lives in [M46](milestones/m46-workflow-modes-integration.md).

## Milestone lifecycle

Every product milestone follows the lifecycle in `docs/milestones/README.md`:

1. Orient.
2. Research.
3. Plan and obtain human approval.
4. Implement.
5. Verify during implementation before handoff.
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
