# Wide-app composability and Effect reliability pass

> **Status:** Planning proposal; no implementation is authorized by this umbrella document. Each implementation phase must have its own template-based milestone plan and Plannotator approval.

## Context

The app has completed M8. This pass reviews the whole application for two qualities: reusable/composable UI and behavior where it reduces duplication, and Effect-based modeling of meaningful fallible work so failures are typed and have an explicit handling path. The goal is predictable, maintainable code—not a promise that software can never fail.

Initial review facts:

- Existing shared UI includes `TicketWorkItem.vue`, `TicketHierarchyBadges.vue`, `TicketTrackedUsage.vue`, `TicketContextPopovers.vue`, `ProjectCard.vue`, and `HierarchyCounts.vue`. Reuse and consolidate these patterns instead of adding parallel versions.
- Client, project, release, and ticket cards already share a recognizable pattern: a heading/content row and a context row containing links, labels, counts, or actions. Their link/drag/action ownership differs, and release cards have a progress detail row; a generic shell should allow these differences without becoming a large domain-specific component.
- `ProjectCard.vue` applies `group-hover:text-primary` to its title, unlike the client card. The client card's border-only hover is the desired visual reference; align project and other card hover/focus behavior with it.
- `app/pages/today.vue` and `app/pages/tickets/index.vue` repeat hierarchy filter state, option construction, cascading resets, clear behavior, and touch-aware searchable-menu configuration. Today has an extra status filter that should remain Today-specific.
- `today.vue` (670 lines) and `tickets/index.vue` (554 lines) are orchestration-heavy. Length alone is not a reason to split them; extract cohesive behavior and keep agenda gestures and board drag/status ownership local.
- Effect Schema is run in production by `server/domain/decode.ts`. `server/utils/validate-duration.ts` defines a separate Effect validator covered by tests but has no production call sites. Route/domain code also directly throws H3 errors; tagged errors exist in `server/domain/errors.ts` but are commonly translated to `createError` locally.
- `server/utils/domain-validation.ts`, the legacy validation/body helpers in `server/utils/domain.ts`, and `validateDuration` currently have no production call sites (confirmed with `rg`); verify before removing or consolidating.
- Planning baseline: `pnpm lint`, `pnpm typecheck`, and `pnpm test` passed (12 files, 54 tests). No application code has been changed for this plan.

These are initial findings, not an exhaustive audit. The first phase records a complete inventory across `app/`, `server/`, `shared/`, and `tests/` before implementation scopes are finalized.

## Goals and principles

- Reuse components/composables when their responsibilities and repeated behavior are genuinely shared. Keep domain/view differences in wrappers or named slots; avoid generic components with many boolean mode flags.
- Use Effect v4 for meaningful fallible work throughout the app where the integration supports it: validation, domain operations, database/auth/network boundaries, and UI-triggered requests/mutations. Expected failures should be represented with typed errors and handled at the HTTP or UI boundary.
- Do not wrap pure, total calculations or static values in Effects just for uniformity. Effect does not eliminate defects or infrastructure failure: unexpected causes must remain distinguishable, be handled safely, and not be disguised as success.
- Preserve Nuxt SSR/hydration, Better Auth/session behavior, accessibility, current product rules, and existing interactions. Research official Effect v4 and Nuxt guidance before selecting adapters or APIs.
- Keep the work reviewable. This proposal sequences the pass into separately planned and approved milestones rather than authorizing one broad rewrite.

## Proposed sequence

### Phase 0 — Complete code audit and decision alignment (planning/research only)

- Inventory shared UI cards and all meaningful fallible paths across pages, composables/components, server APIs/domain, shared logic, and tests. Record locations, current failure states, duplication, and recommendations in the first implementation milestone.
- Review the installed Effect v4 RC and official v4 documentation, plus Nuxt data-fetching/runtime guidance, before specifying concrete integration APIs.
- Clarify the Effect-use guideline in accepted ADR 0021. Do not rewrite accepted ADR 0002; ADR 0021 supersedes only its ambiguous Effect-use clause.
- This phase has no application implementation changes.

### Phase 1 — M9: Shared card composition and hierarchy filters

Proposed implementation scope, captured in `docs/milestones/m9-shared-card-composition.md`; that milestone plan must be approved before code:

- Introduce a small slot-based shared card shell (proposed `app/components/EntityCard.vue`) and use it to align Client, Project, Release, and Ticket card frames. Use a shared heading/content row and a consistent context row for links, labels, counts, or actions. In project-release cards, replace the horizontal progress bar with an accessible circular completion ring while retaining the ticket icon and numeric done/total fraction. Omit the visible “done” suffix and percentage; the ring's accessible value text continues to describe completion (including the percentage and 0/0 case). Domain-specific card wrappers retain their own data, route targets, full-card navigation, nested controls, and drag behavior.
- Extract a `ClientCard.vue` from the current inline Clients list card, keep `ProjectCard.vue` as the project wrapper, and compose the shared shell in project-release cards, release-ticket cards, and board cards only where it preserves existing interaction semantics. Reuse `TicketHierarchyBadges`, `HierarchyCounts`, `TicketWorkItem`, usage, and context popovers.
- Align hover/focus treatment with the client card: card border/surface responds consistently; the Project title no longer changes color independently on card hover.
- Extract the repeated Today/Tickets hierarchy-filter behavior into a focused app composable. Keep Today status filtering, view presentation, agenda gestures, and board drag/status logic owned by their existing pages/components.
- Add responsive/accessibility regression tests, including nested-link/action precedence, board dragging, popovers, keyboard focus, and desktop/mobile layout.

### Phase 2 — M10: Effect for server-side fallible operations

Proposed direction, requiring a separate approved M10 milestone plan:

- Apply Effect to meaningful fallible server work across request decoding, domain validation/rules, authorization/session lookups, and database operations where a typed failure channel improves control and diagnostics.
- Represent expected validation/authentication/not-found/conflict outcomes as tagged errors; represent rejected infrastructure operations distinctly with the original cause available to server diagnostics. Translate expected errors to stable HTTP statuses at one explicit Nitro boundary; unexpected failures produce safe 5xx responses and are never swallowed or mapped to 4xx.
- Consolidate or remove unused competing validation helpers after reference checks. Keep owner-scoped SQL, auth policy, API payloads, and stored domain behavior unchanged.
- Test all expected failure classes and unexpected database/runtime failures, including safe client responses and retained server diagnostics.

### Phase 3 — M11: Effect for client-side fallible workflows

Proposed direction, requiring a separate approved M11 milestone plan:

- Model meaningful client-side API reads/actions and Better Auth operations with Effect and typed failures, using a Nuxt integration that preserves SSR/hydration, request deduplication/cancellation, loading state, retry behavior, and accessible page feedback.
- Keep pure view transformations and infallible local state in ordinary Vue code. Do not hide failed refreshes, clear errors as success, or let rejected operations become unhandled UI failures.
- Test loading/success/expected-error/unexpected-error behavior across representative list, form, search, agenda, and authentication interactions; manually verify the full app at desktop/mobile sizes.

The exact component API, Nuxt Effect adapter, and endpoint/component migration list are intentionally left for the phase-specific plans after the audit and upstream documentation research. Any integration that would require changes to auth/security policy, schemas, dependencies, or deployment needs explicit human approval before it is added to a phase plan.

## Out of scope

- One-shot conversion of the entire 7,000+ line app, an unreviewable mass rewrite, or automatic extraction of every long file.
- Effect wrappers around constants, pure total transformations, or operations that cannot fail merely to make syntax uniform.
- A new dependency, database/schema migration, auth/session/ownership redesign, API/product rule changes, deployment changes, or workflow changes.
- Broad visual redesign. The card changes are limited to consistent reusable framing/hover behavior and preserving existing content/actions.
- Removing context, changing navigation semantics, or losing SSR, touch, keyboard, or accessible error behavior in pursuit of generic abstractions.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`, completed `docs/milestones/m8-polish-and-shared-ticket-work-items.md`
- ADR 0002 (current bootstrap guidance), ADR 0005 (Effect Schema and tagged domain failures), ADR 0020 (shared presentation and preserved domain semantics), ADR 0021 (Effect at meaningful fallible boundaries)
- `.agents/skills/effect-development/SKILL.md`, `.agents/skills/nuxt-ui/SKILL.md`, `.agents/skills/oxc/SKILL.md`

## Reuse

- Shared presentation: `TicketWorkItem.vue`, `TicketHierarchyBadges.vue`, `TicketTrackedUsage.vue`, `TicketContextPopovers.vue`, `ProjectCard.vue`, and `HierarchyCounts.vue`.
- Existing card examples: inline client cards in `app/pages/clients/index.vue`, `ProjectCard.vue`, release cards in `app/pages/projects/[id]/index.vue`, release ticket cards in `app/pages/releases/[id]/index.vue`, and `TicketBoardCard.vue`.
- Existing filter tests: `tests/e2e/filter-search.test.ts`, `tests/e2e/agenda.test.ts`, and ticket-board tests.
- Existing Effect schemas/errors and tests: `server/domain/schemas.ts`, `server/domain/errors.ts`, `server/domain/decode.ts`, `tests/unit/domain-schemas.test.ts`, `tests/unit/server-effect-handler.test.ts`, and `tests/unit/time-entry.test.ts`.

## Decisions and ADR links

- Direct human feedback on the first Plannotator review: the shared-card audit should include Client/Project and Release/Ticket families; make their two-row framing/context presentation consistent where possible; align Project hover behavior with Client. Later M9 review feedback requested a circular completion ring in place of the release ticket icon/horizontal progress bar. The user subsequently clarified the final display: retain the ticket icon beside the numeric done/total fraction and ring, omit the visible “done” suffix and percentage, and preserve detailed accessible progress text. The M9 phase plan records this final display.
- Direct human feedback clarifies Effect guidance: meaningful fallible code should use Effect so typed failures can be handled; the warning against “sprinkling” Effect is about trivial/infallible uses, not meaningful fallible operations. ADR 0021 records this and supersedes only the ambiguous Effect-use clause in ADR 0002.
- ADR 0005's existing validation/error-mapping direction remains authoritative. The phased plan extends its principle to meaningful fallible work throughout server and client code; it does not change product rules or auth/ownership policy.
- Expected domain failures and unexpected infrastructure failures must remain distinct. Any failure that reaches a user must have an intentional accessible state; unknown causes must not be exposed as raw internal details.

## Approval and verification gates

- This umbrella proposal must be approved via Plannotator before any phase starts.
- Each phase must then have its own milestone file created from `docs/templates/milestone-template.md`, with exact file lists, research, and verification, and be independently approved via Plannotator before implementation.
- Each phase gets a focused code review. Record automated commands, manual checks, deviations, findings, and human review evidence in that phase's milestone file.
- For the complete pass, expected verification includes `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test`, `pnpm exec playwright test --workers=1`, `pnpm build`, `pnpm check:workflow`, and `git diff --check`, plus desktop/mobile and keyboard/manual failure-state checks.

## Plan review status

- Plannotator review: Approved (2026-09-27); the human's requested card-composition and Effect-scope clarifications were incorporated.
- M9 milestone plan: approved via Plannotator (2026-09-27), `docs/milestones/m9-shared-card-composition.md`.
- M9 implementation and closeout are complete within the approved scope. The updated diff received Plannotator review with no changes requested, and the human completion declaration was recorded in the milestone file (2026-09-27).
- M10 implementation and closeout are complete within its separately approved scope; Plannotator code review and the human completion declaration are recorded in `docs/milestones/m10-server-effect-reliability.md` (2026-09-27). M11 remains a separate phase requiring its own plan and approval.
- Phase-specific open questions: the card-shell API is defined by M9; Nuxt/Effect integration and migration details will be researched and reviewed in the separate M10/M11 plans before implementation.
