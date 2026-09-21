# LLM-Assisted Development Workflow Plan

## Context

Before implementing M0, define a durable, repository-local workflow for human/LLM collaboration. Future agents must be able to understand not only what was built, but why decisions were made, which constraints apply, what was tried, and how work was verified.

This plan will establish the documentation system, agent roles/instructions, decision records, milestone execution loop, and enforcement checks. It should complement the existing product and milestone plan in `PLAN.md` rather than replace it.

## Approach

- Create a canonical project constitution/workflow document that every agent reads before acting.
- Define focused agent roles (planner/researcher, implementer, reviewer/tester, documentation keeper) with explicit handoff artifacts and boundaries.
- Record durable choices as lightweight ADRs/decision records, linked from milestone plans and implementation changes.
- Give each milestone a repeatable lifecycle: orient → plan → research → implement in small slices → verify → review → document/close.
- Maintain an append-only project/milestone journal for significant discoveries, deviations, and verification evidence.
- Make compliance observable through templates, checklists, repository scripts/CI where practical, and review gates—not memory or prompt wording alone.
- Require agents to distinguish facts, decisions, hypotheses, and open questions, and to cite source files/commands when relevant.

## Files to modify

Initial documentation/workflow artifacts (exact names may be refined after review):

- `PLAN.md` — link to the workflow and make workflow compliance a prerequisite for M0.
- `AGENTS.md` or equivalent root agent instructions — mandatory orientation and operating rules.
- `docs/llm-workflow.md` — canonical workflow and roles.
- `docs/decisions/README.md` — ADR index/conventions.
- `docs/decisions/NNNN-*.md` — durable architectural/product decisions.
- `docs/milestones/README.md` — milestone execution and closeout convention.
- `docs/milestones/m0-*.md` — first milestone plan, log, and evidence (once M0 is prepared).
- `docs/templates/*` — reusable plan, ADR, journal, review, and handoff templates.
- `.pi/` project-local agent configuration/skills only if the chosen harness supports and requires them.
- `scripts/` and CI configuration only if lightweight automated checks are needed after the documentation convention is settled.

The recommended first version is documentation-first with a few deterministic checks, not a custom autonomous agent system. Use `AGENTS.md`, workflow docs, templates, and Plannotator approval gates as the source of behavioral rules. Add small project-local commands later for mechanical validation (required headings, links, checklist state, and verification evidence), but do not try to automate judgment about prose quality or architectural correctness. Add project-local skills only when a repeated domain task demonstrates a stable procedure worth packaging.

## Reuse

- Existing milestone/product scope and technical direction in `PLAN.md`.
- Existing architecture principles and acceptance criteria in `PLAN.md`.
- Plannotator for plan review and annotated human feedback, following the project’s available Plannotator skill.
- Repository history/diffs and test/lint/typecheck commands as evidence sources once implementation begins.

## Steps

- [x] Decide the canonical documentation layout and naming convention.
- [x] Define the constitution: source-of-truth precedence, scope control, evidence standards, safety rules, and definition of done.
- [x] Define agent roles, required inputs/outputs, handoffs, and when human approval is mandatory.
- [x] Define the milestone lifecycle and required artifacts for each phase.
- [x] Define ADR and journal rules, including how superseded decisions are handled.
- [x] Create the root agent instructions and reusable markdown templates.
- [x] Add an initial ADR documenting this workflow and its relationship to `PLAN.md`.
- [x] Update `PLAN.md` so workflow setup precedes M0 and each milestone follows the lifecycle.
- [x] Define practical compliance checks and verification commands without over-automating prose quality.
- [x] Submit the completed workflow plan for review; after approval, implement the documentation/agent artifacts as a separate, reviewable change.

## Verification

- A new agent can identify what to read, what it may change, and what evidence it must leave behind.
- A milestone can be started and closed using only the documented templates and checklists.
- Product requirements, technical decisions, and implementation notes have distinct homes and links between them.
- A reviewer can reconstruct why a change was made from the milestone record, ADRs, diff, and verification evidence.
- The workflow itself is reviewed before M0 implementation begins.

## Confirmed decisions

1. Use both a concise root `AGENTS.md` and detailed `docs/llm-workflow.md`; the root file points agents to the canonical documentation.
2. Use sequential ADRs with descriptive slugs, e.g. `docs/decisions/0001-llm-assisted-workflow.md`.
3. Human approval is required for every milestone plan and code review. Milestone artifacts must be human-readable, and implementation proceeds only under an approved plan.
4. Start documentation-first. Add small deterministic compliance checks only where they reduce omission risk; defer custom executable agents/skills until repeated work justifies them.

## Remaining questions for the user

- None required before submitting this workflow plan. The implementation phase can refine exact scripts and template fields while preserving the confirmed governance rules.
