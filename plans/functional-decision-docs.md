# Functional, non-blocking decision docs

## Context and references

Agents blocked a legitimate change (Node LTS upgrade) because an ADR named a specific version. The underlying problem: decision docs mix intent with implementation detail, ADRs outrank code/config, ADRs are append-only so partial supersessions pile up, and historical milestones/plans read like rules. Separately, the human milestone completion declaration adds a gate with no value beyond code review.

Human decisions (2026-11-21, chat):

- Rewrite ADRs in place; keep reasoning inside the file (no git archaeology).
- Accept Proposed ADRs that are implemented.
- Version pins are already fixed; the goal is the general blocking problem.
- Remove the milestone completion declaration; keep human code review.
- Mark milestones complete when implemented and only the declaration was missing.

## Requirements and acceptance criteria

- R1: Workflow docs state that decisions bind by intent; implementation details (versions, libraries, paths, config, component names) are non-binding and code/config is their source of truth.
- R2: ADRs are living documents edited in place with a `Revisions` log; supersede only when the goal is replaced.
- R3: Milestones, `plans/`, `reviews/` are declared historical, not current constraints.
- R4: When a change seems to conflict with a decision's goal, agents ask instead of refusing.
- R5: No completion declaration in workflow, templates, `AGENTS.md`; completion = checks pass + evidence + human code review.
- R6: Implemented milestones that only lacked the declaration are marked Complete.
- R7: Every ADR is triaged (keep / trim / merge / deprecate); Proposed ADRs 0040, 0061, 0063 accepted if implemented.
- R8: ADRs rewritten per approved triage; index rebuilt; partial-supersession chains folded into the surviving ADR.
- R9: `PLAN.md` reduced to product context, approach, unversioned stack, one-line roadmap.
- R10: `node scripts/check-workflow-docs.mjs` and format check pass; no broken ADR links.

## Non-goals

- Consolidating ADRs into a few large docs.
- Rewriting historical milestone/plan/review bodies (beyond status lines for R6 and README disclaimers).
- Lint rules rejecting versions in docs.
- Removing human approval for dependency/schema/auth/deploy changes or human code review.

## Steps

- [x] Slice 1 — Rules + declaration removal: `AGENTS.md`, `docs/llm-workflow.md`, `docs/decisions/README.md`, `docs/milestones/README.md`, `reviews/README.md`, new `plans/README.md`, templates (ADR: Context, Goal, Decision, Why, Implementation notes (non-binding), Alternatives, Revisions; milestone/plan: drop declaration), `scripts/check-workflow-docs.mjs` headings.
- [x] Slice 1b — Mark milestones whose only missing gate is the declaration as Complete.
- [x] Slice 2 — Triage table of all ADRs for human approval (read-only).
- [x] Slice 3 — Rewrite ADRs per approved triage; rebuild index.
- [x] Slice 4 — Trim `PLAN.md`.
- [x] Slice 5 — Checks.

## Verification

- `node scripts/check-workflow-docs.mjs`
- `pnpm exec oxfmt --check` on changed docs (or the repo format script)
- `grep` for links to removed/renamed ADRs and for remaining "completion declaration" wording in current-rule docs.

## Risks and stop conditions

- Trimming an ADR could drop a real functional rule: triage table is human-approved before Slice 3.
- A milestone may look implemented but have open follow-ups: only flip status when the checklist is done and code review is accepted or the work is on `main`; list ambiguous ones for the human.

## Approval

- Human plan approval: given in chat 2026-11-21 ("update plan and then start doing it").

## Slice 2 — ADR triage (approved by the human in chat, 2026-11-21: "go")

Policy applied:

- **Trim**: rewrite in place to Context / Goal / Decision / Consequences / Implementation notes (non-binding) / Alternatives / Revisions. Product rules (statuses, 30-minute grid, 7-day quiet-Done window, cooldown) stay as rules; versions, libraries, paths, component names, px values, shortcut letters move to non-binding notes or go.
- **Fold**: clause-level supersessions are folded into the ADR that owns the topic, with a Revisions line; the partially superseded ADR goes back to `Accepted` with the clause rewritten.
- **Absorb → Superseded**: small ADR whose goal now lives entirely in another ADR; marked `Superseded by NNNN`, file kept.
- **History**: already-dead Superseded ADRs keep their text and get a one-line "History, not a rule" banner.

| ADR  | Action                                                                           | Binding goal after rewrite                                                                                                                                                                                                    |
| ---- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0001 | History                                                                          | — (0062 owns workflow)                                                                                                                                                                                                        |
| 0002 | Superseded by 0003/0021; move fail-closed test auth → 0003, quality gates → 0052 | —                                                                                                                                                                                                                             |
| 0003 | Trim                                                                             | GitHub sign-in, durable server sessions; test auth can never run in production; logout is a POST action                                                                                                                       |
| 0004 | Trim; absorb 0005 color/selector rules                                           | Client → Project → Release hierarchy; reversible archive; delete only after archive, child-first, never cascades                                                                                                              |
| 0005 | Absorb → 0004 (UI states) and 0023 (boundary validation)                         | —                                                                                                                                                                                                                             |
| 0006 | Trim; drop pre-deploy "reset DB" clause                                          | All generated IDs are time-ordered UUIDs from one generator; provider IDs stay opaque                                                                                                                                         |
| 0007 | Trim; fold 0017's next-status clause; back to Accepted                           | Ticket belongs to one release, fixed ordered statuses, optional estimate, safe http(s) links, undirected unique related tickets                                                                                               |
| 0008 | Trim; drop mobile clauses (0042)                                                 | Human-friendly estimates stored as minutes; Board shows every status lane; atomic create with links/relations                                                                                                                 |
| 0009 | History                                                                          | —                                                                                                                                                                                                                             |
| 0010 | Absorb → 0048 (Board interactions)                                               | —                                                                                                                                                                                                                             |
| 0011 | Trim                                                                             | Logged time is historical truth, survives archive, never overlaps within a user's day; 30-minute grid                                                                                                                         |
| 0012 | Trim                                                                             | Agenda visible-hours window is presentation only; never hides history; progress uses unfiltered total                                                                                                                         |
| 0013 | Absorb → 0048                                                                    | —                                                                                                                                                                                                                             |
| 0014 | Trim; fold 0016 clause; refresh for weekly view; back to Accepted                | Drag to create/move/resize completed-work blocks; no overlap; conflicts snap back with an error; active ticket required                                                                                                       |
| 0015 | History                                                                          | —                                                                                                                                                                                                                             |
| 0016 | Trim; fold 0044 status-filter clause                                             | Double-click to correct an agenda entry; Board has cascading hierarchy filters, no status filter                                                                                                                              |
| 0017 | Trim; absorb its 0007 clause there                                               | Release ticket cards show tracked vs estimate; aggregated reads                                                                                                                                                               |
| 0018 | Trim                                                                             | Links and related tickets look the same on every card type; icon-only controls have tooltips                                                                                                                                  |
| 0019 | Absorb → 0020                                                                    | —                                                                                                                                                                                                                             |
| 0020 | Trim; absorb 0019 and 0047                                                       | Tracked time colored by usage ratio, neutral without estimate; optional link labels; active-descendant counts                                                                                                                 |
| 0021 | Trim                                                                             | Meaningful fallible work uses typed errors handled at explicit boundaries; pure code stays plain (Effect is the current tool, non-binding)                                                                                    |
| 0022 | Absorb → 0057                                                                    | —                                                                                                                                                                                                                             |
| 0023 | Trim; absorb 0005 validation                                                     | Request input validated at the boundary; expected failures typed and mapped to consistent HTTP statuses; causes never leak                                                                                                    |
| 0024 | Trim                                                                             | Client reads/writes fail safely; session-read error is never "logged out"; write-ok/refresh-failed is partial success with retry                                                                                              |
| 0025 | Trim                                                                             | Board hierarchy badges offer Filter or Open, matching Agenda                                                                                                                                                                  |
| 0026 | Trim                                                                             | Hierarchy pages show an ancestor trail with archive context                                                                                                                                                                   |
| 0027 | Trim; absorb 0043                                                                | Release detail changes ticket status per card and is the only place to complete a release                                                                                                                                     |
| 0028 | Trim; fold 0063 clause                                                           | Collection order is stable under ordinary edits; search ranks by recency                                                                                                                                                      |
| 0029 | Trim; normalize status                                                           | Weekly agenda, per-user week start; entries stay within one day; invalid moves preview the conflict and never persist                                                                                                         |
| 0030 | History                                                                          | —                                                                                                                                                                                                                             |
| 0031 | Trim                                                                             | Hierarchy badge groups wrap; fixed-height timeline entries may scroll                                                                                                                                                         |
| 0032 | History                                                                          | —                                                                                                                                                                                                                             |
| 0033 | Trim; absorb 0032 intent; add general rule                                       | Projects discovered from Clients only; removed routes 404 without compatibility aliases                                                                                                                                       |
| 0034 | History                                                                          | —                                                                                                                                                                                                                             |
| 0035 | Trim; fold 0044/0045/0061 clauses                                                | One header: navigation left, search center, account right; no sidebar; keyboard navigation shortcuts (letters non-binding)                                                                                                    |
| 0036 | Trim                                                                             | Deploy builds from source on the host; no registry/release pipeline required; secrets outside the image; migrations before serving; CI is the quality gate                                                                    |
| 0037 | Trim                                                                             | Selectors for user-managed data are searchable; fixed choices stay simple                                                                                                                                                     |
| 0038 | History                                                                          | —                                                                                                                                                                                                                             |
| 0039 | Trim; fold 0044 clause                                                           | Agenda entry context controls sit in one ordered flow                                                                                                                                                                         |
| 0040 | Trim; **Accept** (verified implemented)                                          | Ticket detail is the normal edit surface with field-level saves; time entries are created only from the Agenda                                                                                                                |
| 0041 | History                                                                          | —                                                                                                                                                                                                                             |
| 0042 | Trim                                                                             | Desktop only, no mobile/touch alternates; compact, consistent spacing (scale values non-binding)                                                                                                                              |
| 0043 | Absorb → 0027                                                                    | —                                                                                                                                                                                                                             |
| 0044 | Trim; push its clause effects into target ADRs                                   | Week-only agenda; flat status selector; no Agenda status filter                                                                                                                                                               |
| 0045 | Trim                                                                             | Product is "btt"; header has no branding; deployed identifiers are not renamed implicitly                                                                                                                                     |
| 0046 | Trim                                                                             | Quiet Done tickets (7 days) hidden from active Board only, as a view filter; never mutates data                                                                                                                               |
| 0047 | Absorb → 0020                                                                    | —                                                                                                                                                                                                                             |
| 0048 | Trim; absorb 0010 and 0013 (Board interactions)                                  | Status icon opens a status menu on Agenda/Board; Board supports full-card drag; no next-status arrow                                                                                                                          |
| 0049 | Trim                                                                             | Semantic color roles (primary, neutral, warning) with readable contrast in light and dark; usage colors keep meaning (palette names non-binding)                                                                              |
| 0050 | History                                                                          | —                                                                                                                                                                                                                             |
| 0051 | Trim                                                                             | After a successful write, data visible or revisited in the same tab is never stale; targeted, declared invalidation; no cross-tab sync                                                                                        |
| 0052 | Trim; absorb 0002 quality gates                                                  | CI/local checks block new duplication and unused code/deps; baseline changes are explicit and reviewed (tools non-binding)                                                                                                    |
| 0053 | Trim; back to Accepted; absorb 0054                                              | Optional Low/Mid/High priority editable everywhere; Board orders higher first; neutral icon-only display, no per-value colors                                                                                                 |
| 0054 | Absorb → 0053                                                                    | —                                                                                                                                                                                                                             |
| 0055 | Trim                                                                             | On hold is a distinct leftmost unfinished status; Idea stays the default                                                                                                                                                      |
| 0056 | Trim                                                                             | Create in page-level modals; inline detail edits; toasts on success; failures inline with retry                                                                                                                               |
| 0057 | Trim; absorb 0022                                                                | Inspect sibling surfaces; share presentation where rendering should match; keep intentional differences explicit                                                                                                              |
| 0058 | Trim                                                                             | Settings opens in a shell modal from anywhere; one entry point                                                                                                                                                                |
| 0059 | Trim                                                                             | Modal primary action at the far right; Escape closes only the top modal; Cmd/Ctrl+Enter submits                                                                                                                               |
| 0060 | Absorb → 0066                                                                    | —                                                                                                                                                                                                                             |
| 0061 | Trim; **Accept** (implemented, code review accepted 2026-10-16 in M45)           | Reports shows time per week/month/year vs previous period, server-aggregated, owner-scoped, archived history included, explicit time zone required                                                                            |
| 0062 | Trim; remove declaration clause; fold 0064 clause                                | Plans/reviews/milestones have fixed homes; plan approval and human code review gates; handoff helper only routes                                                                                                              |
| 0063 | Trim; **Accept** (verified implemented in release detail)                        | Release detail lists unfinished tickets first, Done tickets in a labeled section below                                                                                                                                        |
| 0064 | Trim; remove declaration clause                                                  | Agents run retained automated checks; humans test the app manually; no E2E suite                                                                                                                                              |
| 0065 | Absorb → 0066                                                                    | —                                                                                                                                                                                                                             |
| 0066 | Rewrite as "Runtime and dependency freshness"                                    | Follow the active Node LTS; new releases wait a cooldown (currently 7 days) before install; a breaking major may be deferred only with a recorded reason and lift condition; build scripts need explicit per-package approval |

## Build evidence (2026-11-21)

- ADRs rewritten per the triage table by four parallel builders; index rebuilt from file headers (46 Accepted, 20 Superseded, 0 Proposed).
- `PLAN.md` reduced from 921 to 100 lines: product scope, unversioned stack, principles, milestone history list.
- `node scripts/check-workflow-docs.mjs`: passed.
- `pnpm exec oxfmt --check PLAN.md docs AGENTS.md reviews/README.md plans/README.md plans/functional-decision-docs.md scripts`: passed.
- Relative-link scan over docs, root, and READMEs: only two broken links remain, both to the removed `playwright.config.ts` from Superseded history ADRs 0041 and 0050 (left as history).
- Accepted ADRs scanned for leftover "completion declaration", "Proposed", and clause-level supersession wording: none.
- Human code review: Approved in Plannotator `pn-ffcec6` (2026-11-21), no changes requested.
