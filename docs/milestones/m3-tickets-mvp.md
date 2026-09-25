# M3 — Tickets MVP

## Context

M2 establishes clients → projects → releases and M2.5 establishes UUIDv7 identifiers. M3 adds the roadmap's full lightweight ticket layer before M4 time entries.

## Approved scope

Approved via Plannotator: `plans/m3-tickets-mvp.md`.

- Release-linked ticket CRUD, required release; title, description, fixed statuses (Idea, Estimate, Develop, Review, Test, Deploy, Done), next-status quick action, optional minute estimate.
- External ticket links (label and URL); non-hierarchical ticket-to-ticket relations.
- Ticket list grouped by status, ticket detail/edit, release-linked navigation and responsive UI.
- Authenticated ownership, validation, archive visibility/restore/permanent-delete conventions aligned with M2.

## Out of scope

- Time entries and estimate utilization (M4); agenda, drag/drop, comments/activity, hierarchy between tickets, generic non-ticket relation targets, custom statuses.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`, `plans/m3-tickets-mvp.md`
- `docs/milestones/m2-core-data-model.md`, `docs/milestones/m2.5-uuidv7-identifier-migration.md`
- ADRs 0003–0008 under `docs/decisions/`, including `docs/decisions/0007-m3-ticket-model-and-relations.md` and `docs/decisions/0008-ticket-estimates-and-board-layout.md`

## Approach

Extend the Drizzle hierarchy with restrictive ticket-parent FK, UUIDv7 IDs, indexed link/relation tables and checks/uniqueness for link relationships as appropriate. Decode request bodies with Effect v4 schemas, enforce user ownership and active-parent rules in API handlers. Treat ticket relations as symmetric, unique, same-user links across releases/projects; exclude self-links. Follow M2 archive semantics and explicit child cleanup before permanent deletion. Provide grouped status lists, forms, detail and release context using existing Nuxt UI patterns. Shared ordered statuses drive next-status behavior; Done has no next status.

## Files to modify

- `server/db/schema.ts`, generated `drizzle/` migration and metadata
- `server/domain/schemas.ts`, ticket status/rule utility, `server/api/tickets/` handlers
- `app/pages/tickets.vue` → `app/pages/tickets/index.vue` plus `new.vue`, `[id]/index.vue`, `[id]/edit.vue`; `app/pages/releases/[id]/index.vue`
- `tests/unit/`, `tests/e2e/`; this milestone file; ADR/index if durable new choices require it

## Reuse

- `server/utils/id.ts`, `server/utils/domain.ts`, `server/domain/decode.ts`, `server/domain/schemas.ts`
- `server/api/releases/` for authenticated hierarchy lookup and archive behavior
- `app/pages/releases/new.vue`, `app/pages/releases/[id]/edit.vue`, `app/pages/projects/[id]/index.vue` for forms, selectors, archive controls
- `tests/e2e/auth-shell.test.ts`, `tests/unit/domain-schemas.test.ts` for test infrastructure

## Decisions and ADR links

- Existing accepted constraints: ADRs 0003–0006. Ticket-specific persistence and symmetric relation semantics: ADR 0007. Human-readable estimates, atomic create extras and responsive board: `docs/decisions/0008-ticket-estimates-and-board-layout.md`.

## Implementation checklist

- [x] Approve M3 plan before implementation.
- [x] Add ticket, link, relation schema and migration with indexes/constraints.
- [x] Implement validated, owned ticket CRUD, archive/restore, status progression and linked-resource endpoints.
- [x] Build ticket list/detail/create/edit and release integration with mobile-friendly states.
- [x] Add unit, API/browser coverage; record verification and relevant ADRs.
- [x] Submit the final related-ticket/navigation diff for human code review and record acceptance.
- [x] Record the human M3 completion declaration (received 2026-09-25); closeout completed after final code review.

## Journal

### Planning — orientation

- Fact: M2 and M2.5 milestone files record accepted human review and completion declarations.
- Decision (human): retain all M3 roadmap features rather than reducing its scope.
- Decision (human): approved `plans/m3-tickets-mvp.md` via Plannotator before implementation.
- Fact: Tickets page is currently a placeholder at `app/pages/tickets.vue`; dashboard already navigates there. No ticket tables exist.
- Decision (approved plan; recorded in ADR 0007): follow M2 archive/delete patterns and model relations as symmetric cross-release same-owner pairs.

### Implementation — schema

- Fact: generated `drizzle/0004_awesome_dormammu.sql` with three UUID tables, restrictive FKs, initial status/positive-estimate and canonical-pair checks, relation uniqueness and lookup indexes; reviewed generated SQL before applying.
- Evidence: `pnpm db:generate` and `pnpm db:migrate` passed using configured local PostgreSQL.

### Implementation — API

- Fact: added Effect v4 ticket body schemas, shared next-status utility, authenticated ticket CRUD and separate link/relation mutations with same-owner checks, canonical deduplication, URL validation, archived-parent visibility and transactional child cleanup.
- Evidence: `pnpm typecheck` passed after switching to v4 `Schema.Literals` (the initial v3-style multi-argument `Literal` failed and was corrected). Official v4 Schema getting-started documentation and installed v4 declaration were consulted.

### Implementation — UI

- Fact: replaced placeholder `/tickets` with responsive status-grouped list, added create/detail/edit pages and release detail links, plus status-advance and external/related link controls. Client status utility is isolated from server DB imports.
- Evidence: `pnpm typecheck` and `pnpm build` passed; two lint shadow warnings were resolved before final checks.

### Implementation — tests and review preparation

- Fact: added unit tests for ordered statuses, schema boundaries and safe URLs; browser/API flow covers release prerequisite, form creation, group advance, estimate, links and same-owner/cross-release relations, self/duplicate rejection, foreign-user isolation, archiving, guarded delete and 390px mobile overflow.
- Fact: added ADR 0007 and indexed it. No dependencies or auth configuration were changed.
- Deviation/correction: initial Vitest import of server domain helper pulled in `h3`; extracted pure URL validation into `app/utils/ticket-url.ts` and reran tests. Browser tests initially clicked before hydration, matched a non-exact link, and had a missing JSON await; corrected the test waits/selectors/await. A later extra cross-release ticket required scoping a list assertion to its release. All final checks passed.
- Manual checks: no separate interactive manual browser session; automated Playwright desktop/mobile and authenticated API assertions were used. Human code review was subsequently accepted.

### Code review follow-up — status enum

- Review feedback: human requested `pgEnum` instead of a manual status check and approved retaining the positive-estimate database check.
- Decision: share the ordered statuses from `shared/ticket-status.ts` with Drizzle `pgEnum`, Effect `Schema.Literals`, and the UI; remove the redundant status check. Keep the already-applied M3 migration `0004` intact and append `drizzle/0005_lovely_beast.sql` to migrate existing text values without resetting records. ADR 0007 now records the physical representation.
- Fact: reviewed generated SQL; adjusted it to drop the existing text default before the `USING status::ticket_status` conversion and restore the enum default afterward. The legacy status check is dropped. The positive-estimate check is unchanged.
- Evidence: `pnpm db:generate`, `pnpm db:migrate`, then `pnpm db:generate` again (no schema changes); `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (8 files / 21 tests), `pnpm exec playwright test --workers=1` (4 passed), `pnpm build`, `pnpm check:workflow`, and working/staged `git diff --check` all passed after conversion.

### 2026-09-25 — Human code review

- Decision (human): code review completed with no changes requested, including the `pgEnum` follow-up.
- Fact: milestone completion has not yet been declared by the human; closeout remains pending.

### 2026-09-25 — Approved M3 UI/create follow-up

- Decision (human): approved `plans/m3-ticket-creation-and-board-polish.md` for implementation, including the `parse-duration-ms` dependency, atomic ticket creation with optional links/relations, full-width authenticated pages, seven desktop board lanes and mobile collapsed sections.
- Fact: prior code review acceptance covers only the previous scope; the follow-up will need a new human review before M3 completion.

### 2026-09-25 — M3 create/board follow-up implementation

- Fact: `POST /api/tickets` accepts optional link rows and related-ticket IDs; it validates ownership/archival, URL safety and duplicates, then saves ticket, links and canonical relation pairs inside one Drizzle transaction. Existing minimal create bodies continue to work; no schema migration or auth change.
- Fact: ticket create UI has repeatable link rows and multi-selection of existing tickets; `parse-duration-ms` 0.1.0 parses human durations through a small adapter that treats bare numbers as minutes, rejects non-whole/nonpositive/out-of-range minutes, and formats clock-icon displays. Ticket edit, detail, cards and release summaries use the same conversion/display conventions. Decision: ADR 0008.
- Fact: dashboard content and authenticated create/edit pages now use full width; seven desktop status lanes stay on one board-local scroll row with empty placeholders, and seven mobile sections stack as Nuxt UI collapsibles (closed by default, counts visible). Login remains centered.
- Evidence: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (9 files / 44 tests), `pnpm exec playwright test --workers=1` (4 passed), `pnpm build`, `pnpm check:workflow`, and `git diff --check` (working and staged) passed. Playwright exercised multi-link and cross-release creation, invalid/duplicate/foreign/archived relation rejection with no partial ticket, form entry with duration/links/relation, full-width form at 1920px, desktop seven-lane single row, and 390px mobile collapsed-by-default status sections.
- Correction: Playwright initially clicked a mobile collapsible before client hydration; waiting for network idle resolved the test timing issue. No separate manual visual inspection was performed.
- Follow-up: Plannotator code review approved with no changes requested; wait for explicit human completion declaration.

### 2026-09-25 — Follow-up code review

- Decision (human, via Plannotator): follow-up diff approved; code review completed with no changes requested.
- Fact: M3 remains open pending explicit human completion declaration.

### 2026-09-25 — Related-ticket navigation planning

- Decision (human, via Plannotator): approved `plans/m3-ticket-links-and-entity-icons.md` after adding hover-highlight, persistent click-highlight, and scroll-to-target behavior; this follow-up was **not** implemented at approval time.
- Fact: prior M3 code review acceptance does not cover this newly approved scope; M3 closeout remains pending.

### 2026-09-25 — Related-ticket navigation implementation (review pending)

- Fact: `GET /api/tickets` now returns client/project IDs and a batched, title-sorted list of related `{id,title}` targets. Relation and target reads are bounded by the visible owned board tickets and target ownership/active ancestor checks; release filtering only limits board cards, not valid cross-release shortcuts. The detail response includes owned hierarchy names/IDs.
- Fact: shared Lucide icon mapping is used in navigation, hierarchy headings/links and ticket detail. Board cards keep names as separate same-tab entity links, show only visible related icon links with title and accessible name, and omit the icon area when empty. Hover/focus highlights the in-board target; ordinary click pins it, expands its mobile lane if needed, waits for its opening animation and scrolls it into view. Filtered-out targets navigate to detail; modifier/middle click uses the real href. No auth/write/schema/dependency change.
- Implementation detail: related icon links use native anchors with `href`, `title` and `aria-label`; ordinary clicks are synchronously intercepted for board targeting or delegated to `navigateTo` for release-filtered targets. This avoids a NuxtLink internal-click race observed in the browser. Nuxt UI tooltip wrapping did not produce a visible popup in the Playwright hover check, so native title tooltips provide the reliable hover text. Other internal hierarchy links remain `NuxtLink`s.
- Evidence: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (9 files / 44 tests), `pnpm exec playwright test --workers=1` (5 passed), `pnpm build`, `pnpm check:workflow`, and staged/unstaged `git diff --check` all passed. New browser test covers multiple/cross-release shortcuts, parent navigation in one tab, visible names/accessible title, hover vs pinned borders, keyboard Enter, horizontal scrolling, release-filter fallback, archived ticket/ancestor suppression, empty icon area, 390px mobile lane expansion, scrolling past another card and no document overflow. Repeated the new test three times successfully before the final title-tooltip fallback change; final suite passed after that change. Existing board E2E locator was updated for the new card header layout.
- Correction: first full browser run timed out because the prior test located a status button via the ticket title's immediate parent; it now scopes the card by its ticket ID. Immediate mobile test clicks during collapsible animation hit the title rather than the shortcut; the test waits for that opening transition. No separate manual visual inspection was performed. Human code review is still required; M3 is not declared complete.
- Follow-up correction (human report): ticket detail's related-ticket row accidentally rendered a literal `>` before its Unlink button. Removed it and added a browser assertion that the row has no stray marker. Rechecked formatting, lint, typecheck, focused browser test (1 passed), and staged/unstaged whitespace checks. Review of this correction is still pending.

### 2026-09-25 — Human completion declaration received

- Decision (human, directly in chat): “I hereby declare M3 complete.” Recorded verbatim as the M3 completion declaration.
- Fact: previous M3 code reviews were accepted, but the later related-ticket/navigation follow-up and stray-marker correction have not yet received a new human code-review decision. The declaration does not replace that review under `docs/llm-workflow.md`. Formal M3 closeout and the M3.5 implementation prerequisite remain pending final code review.
- Evidence after declaration: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (9 files / 44 passed), `pnpm exec playwright test --workers=1` (5 passed), `pnpm build`, `pnpm check:workflow`, and both unstaged/staged `git diff --check` passed.

### 2026-09-25 — Final M3 code review and closeout

- Decision (human, via Plannotator): the uncommitted M3 diff, including related-ticket/navigation changes and the stray-marker correction, was approved with no changes requested.
- Fact: the approved scope is implemented; earlier and final verification evidence is recorded above, and the explicit human completion declaration is recorded in the preceding journal entry. No separate manual visual inspection was performed; automated desktop/mobile browser checks passed. M3 meets all closeout gates and is **Complete**. The separately approved M3.5 plan can now begin implementation; its own code review and completion declaration are still required.

## Verification

- [x] `pnpm db:generate` and `pnpm db:migrate` after reviewing `drizzle/0004_awesome_dormammu.sql` and follow-up `drizzle/0005_lovely_beast.sql`: applied M3 schema and converted existing status column to enum.
- [x] `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (8 files / 21 tests), `pnpm exec playwright test --workers=1` (4 passed), `pnpm build`, `pnpm check:workflow`: passed after fixes.
- [x] Browser/API: unauthenticated and foreign-user reads/mutations denied, release required, fixed statuses/Done endpoint, estimate and URL validation, cross-release/duplicate/self/foreign relation cases, archived-parent visibility, archive and child-first deletion, form prerequisite and browser creation, grouped list and mobile width verified by Playwright.
- [x] `git diff --check`: passed.
- [x] Follow-up quality gates: formatting, lint, typecheck, 44 unit tests, 4 browser tests, build, workflow checks and diff checks passed (see journal).

## Review status

- Plan review: Approved via Plannotator
- Code review: Accepted via Plannotator, including final related-ticket/navigation changes and stray-marker correction (2026-09-25).
- Milestone completion declaration: Received directly in chat 2026-09-25.
- Milestone status: Complete.

## Follow-ups

- M3 is complete; keep M3.5's drag/drop implementation and acceptance separate.
- Optional future manual visual polish of desktop/mobile ticket screens; E2E checked behavior and narrow-viewport overflow, not visual appearance.
- M4 computes tracked/estimated ratio from mandatory ticket-linked time entries.

## Closeout checklist

- [x] Approved implementation scope implemented.
- [x] Verification evidence recorded.
- [x] Human code review accepted for the navigation follow-up and correction (prior M3 reviews accepted).
- [x] Human completion declaration recorded in journal and review status; M3 complete.
