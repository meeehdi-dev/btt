# M19 — Client-led project navigation

> **Status:** Complete — implementation, verification, code review, and human completion declaration recorded.

## Context

The product hierarchy is Client → Project → Release → Ticket, but the shell currently exposes both Clients and Projects as top-level navigation destinations. `/projects` renders an all-projects collection page, while each client detail already lists its own projects and offers a contextual **New project** action.

Observed facts:

- `app/layouts/dashboard.vue` includes Projects in desktop/mobile navigation and in the `g`-then-letter shortcuts.
- `app/pages/projects/index.vue` is the all-projects collection page.
- `app/pages/clients/[id]/index.vue` already renders the client's project cards and links to `/projects/new?client=<id>`.
- Individual project detail, create, and edit routes are also under `/projects`; project search results and hierarchy links navigate to those entity routes, not to the collection page.
- A small number of create/delete flows still return to the `/projects` collection route and need a useful destination if that page is removed.
- At planning time, no task-specific approved plan existed. M18 is recorded complete; no M19 application changes had been made when this plan was submitted.

The user requested removing the Projects menu and page, with project setup reached through Clients. This plan treats “Projects page” as the all-projects collection screen, not individual project detail/create/edit routes or the project domain itself.

## Approved scope

**Approved via Plannotator on 2026-09-29; scope amended by explicit human instruction after code review on 2026-09-29.**

- Remove Projects from desktop and mobile app-shell navigation. Remove its `g`-then-`p` navigation shortcut and update the mobile shortcut hint; do not assign a replacement shortcut.
- Remove the all-projects collection UI and `/projects` index route entirely. The bare `/projects` path returns the normal 404; do not add a compatibility redirect or alias.
- Make Clients the sole top-level collection entry point for projects. Retain the project cards and **New project** action on each client detail page; this is the normal setup path.
- Update remaining application links that point to the `/projects` collection to return to Clients or to the relevant parent client/project context. In particular:
  - Project creation with a selected client returns to that client; an uncontextualized create-form cancel/back action returns to `/clients`.
  - When creating a release, the no-project prerequisite action guides the user to Clients; cancel returns to the selected project when there is one, otherwise to Clients.
  - Successful permanent project deletion returns to its parent client, and successful permanent release deletion returns to its parent project, preserving archived-parent query context where required.
- Keep individual project detail/create/edit routes, project cards on client detail, project APIs, project search results, project hierarchy breadcrumbs, and all existing ownership/archive rules. The project creation form and its current client selector remain unchanged apart from contextual return/navigation destinations.
- Update the product roadmap and add a durable ADR for the client-led project collection/navigation decision after this plan is approved.

## Out of scope

- Removing projects as a domain entity, removing project detail/create/edit routes, or changing release/ticket hierarchy.
- Removing project results from global search or changing their direct links to project detail.
- Schema, API, authorization, ownership, archive/restore, data migration, or dependency changes.
- Locking the project creation form to the client from which it was opened, removing its client selector, or embedding the project form directly in client detail.
- Broader navigation redesign or changes to project cards/detail presentation beyond keeping them accessible from Clients.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`
- `docs/milestones/m1-authentication-shell.md` — historical shell/navigation destination decision
- `docs/milestones/m2-core-data-model.md` — client/project hierarchy and CRUD entry points
- `docs/milestones/m7-search-and-ui-polish.md` — compact shell and keyboard navigation
- `docs/milestones/m8-polish-and-shared-ticket-work-items.md` — shared ProjectCard on project list and client detail
- `docs/milestones/m13-hierarchy-breadcrumbs.md` — hierarchy routes and collection navigation
- `docs/decisions/0004-m2-core-data-model.md` — Client → Project → Release hierarchy and archive lifecycle
- `docs/decisions/0015-compact-navigation-and-mobile-columns.md` — desktop/mobile navigation conventions
- `docs/decisions/0022-shared-entity-card-presentation.md` — ProjectCard interaction ownership
- `docs/decisions/0026-hierarchical-breadcrumb-navigation.md` — no collection-root breadcrumb; hierarchy details remain directly navigable

## Approach

1. Remove the Projects entry from the shell's shared navigation array. This removes it from both desktop/mobile menus and from shortcut dispatch; update the visible shortcut legend accordingly.
2. Remove the `/projects` index route so the bare path returns Nuxt's normal 404. Preserve `/projects/:id`, `/projects/new`, and `/projects/:id/edit` routes.
3. Repoint stale collection-return actions to the most relevant existing parent page. Preserve archived context in return URLs so archived projects/releases remain visible under the current archive rules.
4. Retain the existing client-detail project list and creation action as the user-facing way to find and set up projects. Preserve individual project results in Global Search.
5. Update focused browser coverage for desktop/mobile navigation, shortcut behavior, the `/projects` 404, client-led project discovery, search-to-project navigation, archive visibility, and contextual create/delete returns.
6. After approval, update `PLAN.md`, add ADR 0032 and its index entry, and maintain this M19 journal with verification and review evidence. Following code review, ADR 0033 supersedes ADR 0032 to record the human-approved removal of the compatibility route.

## Files to modify

- `app/layouts/dashboard.vue` — remove Projects navigation and shortcut hint.
- `app/pages/projects/index.vue` — delete the collection page and route; do not add a redirect or alias.
- `app/pages/projects/new.vue` — make back/cancel destinations client-contextual or `/clients`.
- `app/pages/projects/[id]/edit.vue` — return to the parent client after permanent deletion.
- `app/pages/releases/new.vue` — direct project prerequisites and collection-return actions through Clients or the selected project.
- `app/pages/releases/[id]/edit.vue` — return to the parent project after permanent deletion.
- `tests/e2e/auth-shell.test.ts`, `tests/e2e/search.test.ts`, and `tests/e2e/hierarchy-card-metrics.test.ts` — update collection-page assumptions and cover navigation, the bare-route 404, and project detail/search/archive behavior.
- `PLAN.md` — record the client-led collection entry and this bounded M19 change.
- `docs/decisions/0032-client-led-project-navigation.md`, `docs/decisions/0033-no-compatibility-route-for-project-collection.md`, and `docs/decisions/README.md` — retain the superseded decision and index its accepted replacement.
- `docs/milestones/m19-client-led-project-navigation.md` — implementation journal, verification, review, and closeout.

No server, schema, API, migration, or dependency changes are planned.

## Reuse

- `app/pages/clients/[id]/index.vue` already loads the client's projects (including archived rows) and renders `ProjectCard` with the **New project** action.
- `app/components/ProjectCard.vue` already owns individual-project navigation and nested client-link behavior.
- `app/layouts/dashboard.vue` derives desktop/mobile navigation and shortcut dispatch from one array; its displayed mobile shortcut hint should stay aligned with that source.
- Existing `/projects/:id` pages and `HierarchyBreadcrumbs` provide project detail and archived-parent navigation; keep these routes intact.
- `app/components/GlobalSearch.vue` links project hits directly to `/projects/:id` and should remain unchanged.
- `docs/decisions/0004-m2-core-data-model.md` and the existing API archive behavior remain authoritative for parent visibility.

## Decisions and ADR links

- Existing durable rule retained: projects belong to clients (ADR 0004); project details remain in the hierarchy and do not need a Projects collection-root breadcrumb (ADR 0026).
- Human-approved review change: Clients is the only top-level project collection entry point and the bare `/projects` collection route is removed without a compatibility redirect; individual project entity routes and project search remain.
- ADR 0033 supersedes ADR 0032 and records the no-compatibility-route decision. The original approved redirect decision remains documented as superseded; M1/M2 milestone notes remain historical records.

## Implementation checklist

- [x] Human approves this plan via Plannotator before implementation.
- [x] Remove Projects from desktop/mobile shell navigation and the `g`-then-`p` shortcut hint/dispatch.
- [x] Remove the `/projects` collection route (bare path returns 404); preserve individual project routes.
- [x] Repoint stale collection-return/prerequisite actions to Clients or the relevant parent context.
- [x] Preserve project discovery/creation on client detail and direct project navigation from global search.
- [x] Add/update E2E assertions for desktop/mobile navigation, shortcut behavior, bare-route 404, client project cards, project search, archive visibility, and contextual return paths.
- [x] Update `PLAN.md`; add ADR 0032 and ADR 0033, supersede/index the revised decision.
- [x] Run and record agreed checks, manual checks, deviations, and follow-ups.
- [x] Submit the diff for human code review; Plannotator accepted it with no changes requested. Close only after the human completion declaration, recorded below.

## Journal

### 2026-09-29 — Planning research

- Fact: inspected shell navigation, route inventory, client/project/release pages, search behavior, and E2E coverage. The Projects collection route is separate from project entity routes; Client detail already lists projects and exposes contextual creation.
- Fact: project results in Global Search and hierarchy breadcrumbs point to individual project detail routes and do not depend on the collection page.
- Decision (proposed): retain `/projects` as a redirect to `/clients` rather than making old links/bookmarks return 404; rehome in-app collection-return links to their relevant parent context.
- Decision: the human approved the recommendation to preserve the existing `/projects/new` form and client selector; client detail remains the normal project-setup entry point. No forced client-detail context or form redesign is included.
- Evidence: `plannotator annotate docs/milestones/m19-client-led-project-navigation.md --gate --json --require-approval` returned `{"decision":"approved"}`. `node scripts/check-workflow-docs.mjs` passed and `git diff --check` passed before submission. No application source, roadmap, or ADR had changed at plan submission.

### 2026-09-29 — Implementation and verification

- Fact: removed Projects from the shared desktop/mobile navigation array and from the shortcut legend/dispatch. The initial implementation redirected `/projects` to `/clients`; following the human-directed code-review change below, that collection route is removed. Project detail/create/edit and Global Search links remain.
- Fact: project creation/cancellation uses its client context; release setup routes uncontextualized prerequisite/cancel actions through Clients and contextual cancellation to the selected project. Permanent project/release deletion returns to the parent, preserving archived query context.
- Fact: client-led project creation exposed a timing issue in the existing form watcher: a valid `?client=<id>` selection could be cleared while the client-list request was still pending. The watcher now validates after loading completes; the selector and user-selected client behavior are unchanged. E2E verifies the preselected client and successful create.
- Decision: retain the approved product scope; no project API, ownership/archive rule, schema, dependency, or authentication change was needed.
- Verification discovery: the first focused E2E run interacted with the form before hydration and did not wait for agenda data. Added `networkidle` synchronization to the affected test interactions; a transient empty client-list state was also guarded as above. An attempt to run separate Playwright suites concurrently raced Nuxt's single dev-server lock; serial focused and full runs passed.
- Evidence: before the code-review route change, focused E2E passed all 4 tests and the full suite passed all 27 tests. After the route change, auth-shell E2E passed both tests and the full suite passed all 27 tests. Format, lint, both typechecks, unit tests, build, workflow check, and diff check also passed; see Verification. The final full E2E run logged nonfatal ResizeObserver messages from Vite during agenda tests; no test failed. Production build logged a nonfatal Rolldown plugin-timings warning.
- Manual check: inspected temporary screenshots of the desktop collapsed rail, mobile full-screen menu, and mobile client detail. The Projects item is absent and client project cards/New project remain visible; temporary screenshots were not tracked.
- Status at entry: implementation and verification were complete after the human-directed route revision; code review was accepted, and the completion declaration was recorded in the final journal entry below.

### 2026-09-29 — Human-directed code-review revision

- Review finding: Plannotator noted that an MVP does not need a 302 compatibility route for `/projects` and requested cleanup of any similar old-navigation handling.
- Verdict: confirmed. `app/pages/projects/index.vue` was introduced by this change solely to redirect the removed collection. The user explicitly approved removing it and allowing `/projects` to return 404; this supersedes the earlier plan decision and ADR 0032.
- Inspection: no other legacy Projects alias or collection fallback exists. `/` → `/today` is the canonical landing route, and the login return redirect is part of active authentication; both remain. Current project create/delete and parent links are contextual application navigation, not compatibility paths.
- Change: deleted `app/pages/projects/index.vue`; E2E now asserts the bare path returns HTTP 404. ADR 0032 is marked superseded and ADR 0033 records the no-compatibility-route decision.
- Evidence: post-change auth-shell E2E passed both tests, the full suite passed all 27 tests, and static checks passed; see Verification.

### 2026-09-29 — Second code review

- Evidence: `plannotator review --git --diff-type uncommitted --no-git-remote-check --json` returned `{"decision":"approved","message":"Code review completed — no changes requested."}`.
- Status: code review is accepted. M19 remains open until the human completion declaration is recorded.

### 2026-09-29 — Milestone completion declaration

- Human declared M19 complete in the conversation after implementation, verification, and code review were accepted.
- Status: M19 is complete; all closeout checks are recorded below.

## Verification

- [x] `node scripts/check-workflow-docs.mjs` and `git diff --check` — passed after implementation and the code-review route revision.
- [x] Pre-review focused E2E — `pnpm exec playwright test tests/e2e/auth-shell.test.ts tests/e2e/search.test.ts tests/e2e/hierarchy-card-metrics.test.ts --workers=1 --timeout=60000` — 4 tests passed with the then-approved redirect behavior.
- [x] Post-review focused auth-shell E2E — `pnpm exec playwright test tests/e2e/auth-shell.test.ts --workers=1 --timeout=60000` — 2 tests passed, including `/projects` returning HTTP 404.
- [x] Post-review full E2E — `pnpm exec playwright test --workers=1 --timeout=60000` — all 27 tests passed. Vite logged nonfatal ResizeObserver errors during agenda tests; no test failed.
- [x] Post-review `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (13 files / 72 tests), `pnpm build`, `pnpm check:workflow`, and `git diff --check` — passed. Build emitted a nonfatal Rolldown plugin-timings warning.
- [x] Manual screenshot inspection — desktop collapsed rail shows Today, Clients, Tickets with no Projects item; mobile full-screen menu has the same three links and updated shortcut hint; mobile client detail retains its project card and New project action. Temporary screenshots in `/tmp` were not added to the repository.

## Review status

- Plan review: Approved via Plannotator on 2026-09-29; the redirect behavior was explicitly amended by the human after code review on 2026-09-29.
- Code review: Accepted via Plannotator on 2026-09-29; no changes requested. The human-directed removal of the compatibility route was included.
- Milestone completion declaration: Declared by the user on 2026-09-29.

## Follow-ups

- None. M19 is complete; no implementation follow-ups are currently identified.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred.
- [x] Verification evidence recorded.
- [x] Human code review accepted.
- [x] Human completion declaration recorded in the journal and review status.
