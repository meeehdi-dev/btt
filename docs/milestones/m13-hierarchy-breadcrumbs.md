# M13 — Hierarchy breadcrumb consistency

> **Status:** Complete (2026-09-28); approved scope implemented, verification passed, code review accepted, and human completion declared.

## Context

The app has no reusable breadcrumb component. Hierarchy navigation is currently assembled independently on entity detail pages: client detail links from “Clients” to the client, project detail links from the client, release detail links from the project, and ticket detail puts a “Tickets” back-link above the title while showing client/project/release links below it. Hierarchy-aware create and edit forms use separate back-links, and preselected parent context is not consistently represented.

The intended result is one coherent, navigable hierarchy. In particular, a ticket detail page should communicate `client > project > release > ticket`, with each available ancestor linked to its detail page and the current page clearly identified. There is no collection-root “Clients” crumb: the app's left navigation already provides that destination. Client detail is the root entity page and shows its title without a breadcrumb. The same component should be reusable on other hierarchy-aware pages without moving data fetching or navigation ownership out of their pages.

Planning research facts:

- `rg -n -i 'breadcrumb|breadcrumbs' app tests` found no named breadcrumb component or breadcrumb-specific tests; existing trails are hand-built in page templates.
- Relevant pages are under `app/pages/clients/`, `projects/`, `releases/`, and `tickets/`. There is no `/releases` index route: releases are listed under a project, with separate create and detail routes.
- Project detail data already supplies its client ID/name. Ticket detail data already supplies the client/project/release names and relevant IDs/archive timestamps. Release detail/edit data has project context but not the client ID/name; the existing release endpoints already join the client table and can expose this minimal additional read metadata without a new query or stored-data change.
- Existing pages have archive-aware detail routes. Breadcrumb links to descendants hidden by an archived ancestor need `?archived=true` to resolve.
- No application code had been changed when this plan was submitted.

## Approved scope

**Approved via Plannotator on 2026-09-28.**

- Add a presentational, reusable `HierarchyBreadcrumbs.vue` component for a typed sequence of hierarchy items. The page supplies labels, entity kinds, route targets, and the current-page item; the component owns consistent breadcrumb markup, separators, icons, responsive presentation, and accessible current-page semantics. It must not fetch data or own page navigation state.
- Standardize the detail-page path and use it on:
  - `/clients/:id`: no breadcrumb; show the client title.
  - `/projects/:id`: client > project.
  - `/releases/:id`: client > project > release.
  - `/tickets/:id`: client > project > release > ticket.
- Apply the same presentation to hierarchy-aware project/release/ticket edit pages. Their trail includes the hierarchy and entity being edited, then ends in the current “Edit …” page, e.g. client > project > release > ticket > Edit ticket. Client detail becomes title-only with no back-link; client edit remains title/back-link UI and does not gain breadcrumbs.
- Apply it to project/release/ticket create pages when the selected parent provides hierarchy context. Update the trail as the parent selection changes (e.g. client > New project, client > project > New release, and client > project > release > New ticket). With no selected parent, keep the current title/back-link treatment rather than adding a collection-root crumb. Client create/edit pages retain their current title/back-link treatment. Do not invent a release collection route.
- Extend the existing authenticated release list/detail read responses with the client ID and name needed to build release and preselected-ticket breadcrumbs. This is additive response metadata only: no schema, persistence, ownership, archive-policy, or authentication changes.
- Preserve archive-aware navigation: when an ancestor required to view a crumb target is archived, generate a detail URL with `archived=true`. Do not add a Clients collection crumb; global navigation remains the route to the collection.
- Keep one visible page heading, avoid duplicating the current entity name, and retain current actions, content, hierarchy filtering, card navigation, and form behavior. Breadcrumbs should wrap or otherwise adapt on narrow screens without page-level horizontal overflow; full item names must remain available accessibly.
- Add focused authenticated browser coverage and record the reusable breadcrumb contract in a new ADR if the final implementation establishes the proposed app-wide navigation convention.

## Out of scope

- Adding a `/releases` index page, changing collection-page hierarchy, or fabricating collection-root breadcrumbs. `/clients`, `/projects`, and `/tickets` remain collection entry points; their current page headings and global navigation are sufficient. The absence of `/releases` is intentional for this milestone.
- Replacing hierarchy badges/popovers in cards, Today, or the ticket board with breadcrumbs. Preserve `TicketHierarchyBadges.vue` and its existing interaction modes.
- Changing route structure, hierarchy ownership, archive rules, page actions, card navigation, ticket status behavior, stored data, database schema, authentication, dependencies, or global navigation.
- Broad page-layout, card-composition, or API refactoring beyond the additive client metadata needed by the existing release read responses.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`
- `docs/decisions/0015-compact-navigation-and-mobile-columns.md` — compact detail headings and mobile layout convention
- `docs/decisions/0018-ticket-context-and-application-ui-consistency.md` — hierarchy navigation inline with detail headings
- `docs/decisions/0022-shared-entity-card-presentation.md` — keep data and interaction ownership in entity-specific wrappers
- `docs/decisions/0025-ticket-board-hierarchy-actions.md` — preserve board hierarchy badge behavior
- `docs/milestones/m2-core-data-model.md`, `docs/milestones/m7-search-and-ui-polish.md`, `docs/milestones/m12-ticket-board-hierarchy-actions.md`
- Existing hierarchy pages: `app/pages/clients/[id]/index.vue`, `app/pages/projects/[id]/index.vue`, `app/pages/releases/[id]/index.vue`, `app/pages/tickets/[id]/index.vue`
- Hierarchy-aware forms: `app/pages/projects/new.vue`, `app/pages/projects/[id]/edit.vue`, `app/pages/releases/new.vue`, `app/pages/releases/[id]/edit.vue`, `app/pages/tickets/new.vue`, `app/pages/tickets/[id]/edit.vue`. Client create/edit remains title/back-link UI.
- Supporting read endpoints: `server/api/releases/index.get.ts`, `server/api/releases/[id].get.ts`
- Existing browser-test patterns: `tests/e2e/ticket-navigation.test.ts`, `tests/e2e/tickets.test.ts`, `tests/e2e/ticket-status-moves.test.ts`

## Approach

1. **Confirm the item contract:** use a small typed item shape with entity kind, full display name, destination for ancestors, and an explicit current item. Preserve parent-specific `archived=true` routing. Keep page data selection and route decisions in the page owners.
2. **Build the shared presentation:** implement `app/components/HierarchyBreadcrumbs.vue` with a labeled breadcrumb navigation landmark, ordered-list semantics, linked ancestors, a non-link current item marked `aria-current="page"`, consistent entity icons/separators, and responsive text handling. Compose the current item with the page heading so its label is not visibly repeated.
3. **Map all applicable pages:** replace the ad hoc hierarchy links on project/release/ticket detail pages and hierarchy-aware edit/create pages with the shared component. Keep client detail as a title without a breadcrumb. On new project/release/ticket forms, derive the crumb path from the selected parent so it stays accurate when the selection changes; with no selected parent retain the existing title/back-link treatment. Keep root collection pages and existing entity actions intact.
4. **Supply release context:** add `clientId` and `clientName` to the existing release list and detail response selections, which already join the client table. Use this only for breadcrumb construction; add endpoint assertions where appropriate and make no schema or ownership changes.
5. **Regression and review:** add an authenticated Playwright suite covering complete trails and destinations at every entity depth, form contexts, archived-parent routing, keyboard access, and a narrow viewport. Verify no page-level overflow and inspect detail/form layouts manually. Add a concise ADR and index it if the shared trail contract is accepted as a durable UI rule.

## Files to modify

- This milestone file.
- New `app/components/HierarchyBreadcrumbs.vue`.
- Detail pages: `app/pages/clients/[id]/index.vue` (remove its collection link; title-only), `app/pages/projects/[id]/index.vue`, `app/pages/releases/[id]/index.vue`, `app/pages/tickets/[id]/index.vue`.
- Hierarchy-aware create/edit pages: `app/pages/projects/new.vue`, `app/pages/projects/[id]/edit.vue`, `app/pages/releases/new.vue`, `app/pages/releases/[id]/edit.vue`, `app/pages/tickets/new.vue`, `app/pages/tickets/[id]/edit.vue`. Client create/edit remains title/back-link UI.
- `server/api/releases/index.get.ts`, `server/api/releases/[id].get.ts` — additive client ID/name fields only.
- New `tests/e2e/hierarchy-breadcrumbs.test.ts` (or extend an existing hierarchy-focused suite if fixture reuse is materially simpler).
- `tests/e2e/auth-shell.test.ts` — assert client detail has no collection breadcrumb.
- `tests/e2e/ticket-status-moves.test.ts` — update the ticket-detail release-navigation assertion to target the new breadcrumb location.
- New `docs/decisions/0026-hierarchical-breadcrumb-navigation.md` and `docs/decisions/README.md`, if the proposed reusable contract is accepted as a durable UI decision.

Client detail (`app/pages/clients/[id]/index.vue`) should be title-only with no collection link; client create/edit retain their current title/back-link UI without breadcrumbs. Root collection pages (`app/pages/clients/index.vue`, `app/pages/projects/index.vue`, and `app/pages/tickets/index.vue`) are included in the route audit but are not expected to change. There is no `app/pages/releases/index.vue`.

## Reuse

- Use `EntityIcon.vue` and `app/utils/entity-icons.ts` for consistent entity icons.
- Reuse route data already present on client, project, and ticket detail pages. Extend the existing release endpoint projections rather than adding client fetches or a new endpoint.
- Keep page-level action rows, existing Nuxt UI semantic styling, and mobile-column behavior from ADR 0015.
- Reuse authenticated browser-test setup and cleanup patterns from `tests/e2e/ticket-navigation.test.ts` and hierarchy assertions from `tests/e2e/tickets.test.ts`.
- Do not reuse `TicketHierarchyBadges.vue` as a breadcrumb: its badges/popovers have different card/filter interaction semantics.

## Decisions and ADR links

- Proposed: use a shared, presentational component for the same ordered client → project → release → ticket trail across detail and hierarchy-aware form pages; pages retain data and destination ownership.
- Proposed: ancestor links remain navigable, the current route is a non-link with `aria-current="page"`, and the visible current title is not duplicated.
- Existing ADR 0018's inline hierarchy/title treatment remains relevant; this milestone applies it consistently to project, release, and ticket detail without a collection-root “Clients” crumb. Client detail remains title-only.
- ADR 0026 records the lasting breadcrumb contract and is indexed as Proposed. Human code review must accept it before its status changes to Accepted.

## Implementation checklist

- [x] Human approves this milestone plan via Plannotator before implementation.
- [x] Add and verify the reusable, accessible hierarchy breadcrumb component.
- [x] Remove the Clients collection link from client detail so it is title-only; apply the parent-rooted hierarchy to project, release, and ticket detail pages.
- [x] Apply hierarchy-aware trails to project/release/ticket create/edit pages, including dynamic parent selection and no-parent fallbacks; keep client create/edit title/back-link-only.
- [x] Add release client ID/name to the existing release read responses without changing data or authorization behavior.
- [x] Preserve working ancestor navigation for archived client/project/release/ticket hierarchies.
- [x] Add authenticated regression coverage for all trail depths, links, current-page semantics, forms, archive routing, keyboard use, and mobile overflow.
- [x] Run and record automated checks and manual desktop/mobile checks; document failures, deviations, and follow-ups.
- [x] Human code review accepts ADR 0026 and the complete diff.

## Journal

### 2026-09-28 — Planning research

- Fact: existing detail breadcrumbs differ by entity depth; ticket detail uses a Tickets back-link plus hierarchy metadata, rather than a continuous parent-rooted trail. Create/edit pages use separate back-links.
- Decision (human via Plannotator feedback): omit the initial “Clients” breadcrumb because the left navigation already provides the collection destination. Client detail has no breadcrumb and shows only its title. Remove collection-root crumbs from the proposed trails.
- Fact: no shared breadcrumb component or breadcrumb-specific test was found. There is no `/releases` collection route; project detail owns release listings.
- Fact: project and ticket detail responses already include the hierarchy names and IDs needed for their trails. Release list/detail handlers already join client and can return the missing client ID/name as additive metadata.
- Decision proposed: put breadcrumb rendering/accessibility in one presentational component, keep data/routes owned by each page, and preserve existing badge behavior in cards/board/Today.
- Decision (approved plan): apply the shared component to project/release/ticket create/edit pages whenever hierarchy context exists; retain existing fallback titles/back-links when it does not.

### 2026-09-28 — Plannotator plan feedback

- Fact: the first Plannotator review returned one annotation asking to remove the initial “Clients” crumb because the left-side menu already links to that collection, and to keep client detail as title-only.
- Decision: revise all proposed paths to omit collection-root crumbs; client detail is explicitly breadcrumb-free. Apply the same parent-rooted convention to project, release, ticket, and hierarchy-aware forms.
- Evidence: first `plannotator annotate docs/milestones/m13-hierarchy-breadcrumbs.md --gate --json --require-approval` returned `decision: annotated`; the feedback was incorporated before resubmission.

### 2026-09-28 — Plan approved

- Fact: Plannotator returned `{"decision":"approved"}` for the revised milestone plan.
- Decision: M13 scope is approved, including title-only client detail and parent-rooted project/release/ticket trails.
- Evidence: second `plannotator annotate docs/milestones/m13-hierarchy-breadcrumbs.md --gate --json --require-approval` returned approval.
- Evidence: inspected the relevant page templates, `server/api/releases/index.get.ts`, `server/api/releases/[id].get.ts`, `server/api/projects/[id].get.ts`, `server/api/tickets/[id].get.ts`, ADRs 0015/0018/0022/0025, and E2E navigation tests. `rg -n -i 'breadcrumb|breadcrumbs' app tests` found no named component or existing breadcrumb test. Working tree was clean before planning; no application code had been changed.

### 2026-09-28 — Implementation

- Fact: added the presentational `HierarchyBreadcrumbs.vue` component. Project, release, and ticket detail pages now render parent-rooted trails with entity icons, linked ancestors, a non-link current `h1`/`aria-current="page"`, and responsive wrapping. Client detail is title-only with its Clients collection link removed. Hierarchy-aware project/release/ticket edit pages include the entity path plus their current edit page; create forms show parent context dynamically and retain their previous fallback when unselected.
- Fact: release list/detail read responses now include client ID/name for breadcrumb construction. No endpoint ownership, archive, stored-data, schema, or authentication rules changed. Ancestor paths use `archived=true` when an archived entity/ancestor would otherwise hide the destination.
- Fact: added authenticated browser coverage for detail paths, no collection-root crumb, title-only client detail, edit paths, dynamic create selection, API context metadata, keyboard navigation, archived ancestors, and desktop/mobile overflow. Updated existing client-detail and ticket-detail regression assertions for the changed navigation.
- Decision: use the established muted-to-primary link styling (ADR 0018) for ancestor links; keep item mapping and archive-aware destinations page-owned.
- Deviation: the first full E2E run exposed one stale `ticket-status-moves.test.ts` assertion expecting the release link in ticket metadata. Updated it to assert the release breadcrumb link, which is the approved new location; the focused test then passed.
- Evidence: manual visual inspection of temporary screenshots at 1440×900 and 390×844 confirmed title-only client detail, readable client/project/release/ticket trails, edit/create heading composition, wrapped mobile breadcrumbs, and no page-level horizontal overflow. Temporary screenshots and screenshot hooks were removed after inspection.
- Evidence: `pnpm format:check` passed (230 files); `pnpm lint`, `pnpm typecheck`, and `pnpm typecheck:tsgo` passed; `pnpm test` passed (12 files/67 tests); `pnpm exec playwright test --workers=1` passed all 22 tests; `pnpm build` completed with only the informational Vite `PLUGIN_TIMINGS` warning; `pnpm check:workflow` and `git diff --check` passed.
- Fact: an initial focused browser run timed out because form selects were used before hydration; adding `networkidle` waits fixed the test. A later full run exposed the stale ticket-status test assertion recorded above; after updating it, the full suite passed. No application behavior was changed to accommodate test-only assumptions.

### 2026-09-28 — Human code review

- Fact: Plannotator returned `{"decision":"approved","message":"Code review completed — no changes requested."}` for the complete uncommitted diff.
- Decision: accept the implementation review and ADR 0026.
- Evidence: `plannotator review --git --diff-type uncommitted --json` returned approval.

### 2026-09-28 — M13 completion declared

- Fact: the human declared, “i hereby declare this milestone complete.”
- Decision: M13 is complete; the approved scope, verification evidence, and accepted human code review are recorded above.
- Evidence: completion declared directly in chat on 2026-09-28.

## Verification

Planning artifact:

- [x] `node scripts/check-workflow-docs.mjs` — passed (`Workflow documentation structure looks complete.`).
- [x] `pnpm exec oxfmt --check docs/milestones/m13-hierarchy-breadcrumbs.md` — passed.
- [x] `plannotator annotate docs/milestones/m13-hierarchy-breadcrumbs.md --gate --json --require-approval` — approved after the initial annotation was incorporated.

Implementation (after plan approval):

- [x] Focused Playwright coverage passes for breadcrumb structure, entity routes, current-page semantics, project/release/ticket create/edit parent context, title-only client detail, archived ancestors, keyboard access, and mobile overflow.
- [x] `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test`, full Playwright, `pnpm build`, `pnpm check:workflow`, and `git diff --check` pass; record exact results and any known non-failing advisories.
- [x] Manually inspect client/project/release/ticket detail and representative create/edit pages at desktop and mobile widths; verify readable wrapping, one visible heading, working breadcrumb links, and no page-level horizontal overflow.

Evidence: full Playwright passed all 22 tests. Formatting, lint, Nuxt typecheck, tsgo typecheck, unit tests (12 files/67 tests), production build, workflow-doc check, and `git diff --check` passed. The build reports the existing informational Vite `PLUGIN_TIMINGS` advisory from `vite-plugin-checker`; it does not fail the build.

## Review status

- Plan review: Approved via Plannotator on 2026-09-28.
- Code review: Accepted via Plannotator on 2026-09-28; no changes requested.
- ADR 0026: Accepted via code review on 2026-09-28.
- Milestone completion declaration: Declared by the human in chat on 2026-09-28.

## Follow-ups

- None identified. If route context for a page cannot be supplied from existing read data without broadening the approved additive release metadata, record it as a proposed scope change and ask before changing an API boundary.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred.
- [x] Verification evidence recorded.
- [x] Human code review accepted.
- [x] Human completion declaration recorded in the journal and review status.
