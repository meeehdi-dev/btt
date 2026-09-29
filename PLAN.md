# Life/Work Organizer Feature Plan

## Context

The product direction has been narrowed to a work-only app: a re-implementation/evolution of `tt` with a lightweight Linear-style ticket system for projects, tickets, estimates, and tracked time.

The MVP should focus on:

- Time tracking inspired by `../tt`.
- A day-agenda-first workflow for adding and reviewing completed work.
- Client → project → release/milestone → ticket organization.
- Lightweight tickets with fixed workflow statuses and time estimates.
- Mandatory linking between tracked time and tickets so estimate usage is visible.

No personal tasks, habits, streaks, broad tag system, billable flag, calendar sync, or reporting/export features are needed for the MVP.

## Approach

Create a concise product plan for a work-only tool that combines:

1. **Modern `tt` replacement**
   - Manual time entries.
   - Desktop drag-and-drop calendar blocks; non-drag controls for mobile.
   - Client → project → release/milestone → ticket organization.
   - Customizable agenda hours, e.g. 8am–8pm by default.
   - Mobile-friendly today agenda as the primary MVP UI.

2. **Lite Linear-style tickets**
   - Fixed statuses for MVP: Idea, Estimate, Develop, Review, Test, Deploy, Done.
   - Clients can have multiple projects.
   - Projects can have multiple releases/milestones.
   - Releases can have an optional target date.
   - Tickets must belong to a release.
   - Tickets can have a time estimate.
   - Tickets can have generic external links with only `label` and `url`.
   - Tickets can link to other tickets/items without parent-child hierarchy.

3. **Estimate-aware time tracking**
   - Time entries must link to a ticket.
   - When a ticket has an estimate, show tracked time as a percentage of the estimate.
   - Show tracked time and estimate together when available, with ratio colors: blue below 80%, green from 80% to below 100%, orange from 100% through 120%, and red above 120%.

4. **Technical foundation**
   - Use `../tt` as inspiration, not as a direct technical base.
   - Target a bleeding-edge stack: latest Nuxt/Nuxt UI, Effect v4 RC, latest TypeScript, VoidZero/OXC tooling, Vitest, Better Auth GitHub login, PostgreSQL, and Drizzle.

## Technical direction

Define the technical baseline before starting MVP milestones so every milestone is built on the same quality foundation.

### Version snapshot at planning

Checked via npm on 2026-09-20:

- **Node:** 24.18.0 locally; use Node 24+ in CI unless bootstrap chooses newer.
- **pnpm:** 10.33.2 locally at the snapshot date; M21 later set the exact current package-manager pin to 12.8.1 (ADR 0034). Recheck versions before future implementation.
- **Nuxt:** 4.5.2.
- **Nuxt UI:** 4.11.1.
- **TypeScript:** 7.0.2.
- **tsgo/native TypeScript preview:** `@typescript/native-preview` 7.0.0-dev.20260707.2, exposes `tsgo`.
- **Effect:** stable latest is 3.22.2, but use **Effect v4 RC**: 4.0.0-rc.116.
- **oxlint:** 1.83.0.
- **oxfmt:** 0.68.0.
- **Vitest:** 5.0.1.
- **Better Auth:** 1.7.5.
- **Drizzle ORM:** 0.45.2.

### Skills to install/use before implementation

Current local Pi skill scan only found:

- `/Users/mehdi/.pi/agent/npm/node_modules/@plannotator/pi-extension/skills/plannotator/SKILL.md`

No local Nuxt, Nuxt UI, or Effect TS skill is currently installed in the scanned Pi skill locations. Before implementation starts:

- Search for skills for every tool used, not only Nuxt/UI and Effect. Trust skills maintained by the tool's own maintainers; consider third-party exceptions only with evidence of substantial popularity/maintenance and explicit human approval. Record sources, version compatibility, and searches with no suitable result.
- Fetch/install a Nuxt UI skill if available.
- Check again for a Nuxt-specific skill and install/use it if available.
- Fetch/install an Effect TS skill and use it before Effect-heavy architecture work.
- Store reviewed project-local skills under the harness-neutral `.agents/skills/` directory and link them from `AGENTS.md`; do not rely on harness-specific auto-discovery. If no suitable public skill exists, create small project-local skills there for Nuxt UI and Effect v4 conventions before coding substantial features.

### Proposed stack

- **Framework:** Nuxt 4.5.2 or newer latest stable at implementation time.
- **UI:** Nuxt UI 4.11.1 or newer latest stable, with Tailwind through Nuxt UI conventions.
- **Language:** TypeScript 7.0.2 or newer, strict mode.
- **Typechecking:** keep Nuxt/Vue typecheck as the source of truth; evaluate `tsgo` from `@typescript/native-preview` in M0 and use it where compatible, but do not let it replace Nuxt/Vue typechecking unless SFC/Nuxt compatibility is proven.
- **Functional/domain layer:** Effect v4 RC, currently 4.0.0-rc.116, for typed service boundaries, domain validation flows, and error modeling where it adds clarity.
- **Database:** PostgreSQL.
- **ORM/migrations:** Drizzle ORM 0.45.2 or newer is a good default, inspired by `tt`, unless a technical spike finds a better fit with Effect v4.
- **Auth:** Better Auth 1.7.5 or newer with GitHub login.
- **Validation:** prefer schema-first validation at API boundaries; decide between Effect Schema and Zod during the technical spike.
- **Lint/format:** VoidZero/OXC toolchain where practical: `oxlint` 1.83.0+, `oxfmt` 0.68.0+, and related tools.
- **Testing:** Vitest 5.0.1+ from M0, with tests added for each milestone.
- **Package manager:** pnpm.

### CI, release, and deploy

Follow the existing `../tt` GitHub workflow shape unless a later implementation spike finds a clearly better replacement:

- Dependabot enabled for npm, Docker, and GitHub Actions with grouped minor/patch updates.
- Push/PR checks for lint, format, typecheck, tests, and build.
- CI should use Node 24+ or the latest supported runtime chosen at bootstrap.
- Add Vitest to CI from M0, not later.
- M0 automation scope is quality checks and Dependabot only.
- Keep release-please for release automation, GHCR Docker image publishing, and Coolify deployment triggered from the release workflow as the intended direction, but defer their implementation to a separately approved follow-up after M0.
- Potential improvement to consider later: combine repeated install/setup steps with reusable workflows or a matrix, but keep clarity over cleverness.

Relevant `tt` references:

- `../tt/.github/workflows/check.yml` — lint/format/typecheck/build on push and PR.
- `../tt/.github/workflows/release-please.yml` — release-please and deploy trigger.
- `../tt/.github/workflows/deploy.yml` — GHCR build/push and Coolify API deployment.
- `../tt/.github/dependabot.yml` — grouped dependency updates.

### Architecture principles

- Build vertical slices, not broad unfinished layers.
- Keep each milestone small enough to review fully.
- Prefer boring CRUD first, then interaction-heavy agenda work.
- Keep domain rules server-side: ticket requires release, time entry requires ticket, release belongs to project, project belongs to client.
- Keep client UI state local/composable until a real need for heavier state management appears.
- Use `../tt` for UX lessons, especially agenda interactions, but do not copy its internals blindly.

### Initial domain model draft

- `User`
- `Client`
  - `id`, `userId`, `name`, timestamps
- `Project`
  - `id`, `clientId`, `name`, `color`, timestamps
- `Release`
  - `id`, `projectId`, `name`, optional `targetDate`, timestamps
- `Ticket`
  - `id`, `releaseId`, `title`, `description`, `status`, optional `estimateMinutes`, timestamps
  - Status changes are available through the ticket edit form, Today status badge, Release detail status selector, and desktop board drag-and-drop; no dedicated next-status action is added to ticket detail, and the board control policy remains unchanged.
- `TicketLink`
  - `id`, `ticketId`, optional `label`, `url`
- `TicketRelation`
  - `id`, `fromTicketId`, `toTicketId`
- `TimeEntry`
  - `id`, `ticketId`, `date`, `startMinute`, `durationMinutes`, `description`, timestamps
  - This matches `tt` conceptually: `tt` stores `date`, `start`, and `end`; this plan stores `startMinute` plus `durationMinutes`, which can derive `endMinute = startMinute + durationMinutes`. Keep this shape unless drag/resize implementation proves `startMinute` + `endMinute` is simpler.
- `UserSettings`
  - `id`, `userId`, `visibleStartMinute`, `visibleEndMinute`, `startOfWeekDay`, `workDayDurationMinutes`
  - Inspired by `tt` settings: start of week, start/end of visible day, and work day duration.
  - `workDayDurationMinutes` powers a day progress/overtime bar at the bottom of the agenda so the user can see under/over target time.

## MVP milestone roadmap

The implementation should intentionally be split into small, reviewable milestones. Each milestone should leave the app in a working state and avoid large one-shot code drops.

Before any milestone starts, agents must follow `AGENTS.md` and `docs/llm-workflow.md`. Each milestone must have a human-readable file in `docs/milestones/`, created from `docs/templates/milestone-template.md`, approved by the human before implementation, and updated with verification evidence before code review.

### M-1 — LLM-assisted workflow setup

Goal: establish the collaboration process future agents must follow before M0 begins.

- Root agent instructions in `AGENTS.md`.
- Canonical workflow in `docs/llm-workflow.md`.
- ADR convention and initial workflow ADR in `docs/decisions/`.
- Milestone lifecycle convention in `docs/milestones/README.md`.
- Reusable templates in `docs/templates/`.
- Lightweight compliance checks documented or scripted where useful.

Acceptance:

- A future agent can identify mandatory reading, approval gates, artifact locations, and evidence requirements.
- Human plan review and code review are explicit gates for milestones.
- M0 has a defined workflow to follow before any bootstrap implementation begins.

### M0 — Project bootstrap and quality baseline

Goal: create the smallest possible app shell with the chosen technical foundation.

- Bootstrap with the current version snapshot from the Technical direction section, updating to newer latest versions only if they are available when implementation starts.
- Install/use Nuxt UI and Effect TS skills first if available; otherwise create small project-local skills before substantial UI/Effect work.
- Use TypeScript strict mode with Nuxt/Vue typecheck as source of truth; evaluate `tsgo` from `@typescript/native-preview` during bootstrap.
- Use Effect v4 RC deliberately for domain/server logic, not sprinkled everywhere.
- VoidZero/OXC toolchain where practical: `oxlint`, `oxfmt`, and related tooling for fast lint/format checks.
- Vitest installed from bootstrap with minimal smoke/unit tests.
- Formatting, linting, typecheck, tests, basic CI scripts, and Dependabot wired before feature work. Release-please, GHCR publishing, and Coolify deployment are deferred to a separately approved follow-up after M0.
- Minimal layout with an authenticated/unauthenticated split using development/test-only mock login. Production protected routes remain inaccessible until real authentication in M1.

Acceptance:

- App runs locally.
- Lint, format, typecheck, and tests pass.
- One empty protected dashboard route exists.
- Minimal bootstrap tests exist, e.g. app renders/smoke test and one domain utility test.

### M1 — Authentication and protected shell

Goal: make the app usable by one solo user.

- Login page.
- Better Auth with GitHub login.
- Session handling.
- Protected app layout.
- Basic navigation shell: Today, Clients, Tickets, Settings.
- Empty states for core pages.

Acceptance:

- Unauthenticated users land on login.
- Authenticated users can access the protected app shell.
- Navigation works on desktop and mobile.

### M2 — Core data model: clients, projects, releases

Goal: establish the work hierarchy before tickets/time tracking.

- Clients CRUD.
- Projects CRUD under clients, with color.
- Releases/milestones CRUD under projects, with optional target date.
- Simple list/detail pages for each level.

Acceptance:

- A user can create a client, add projects, and add releases.
- Detail pages clearly show the hierarchy.

### M2.5 — UUIDv7 identifier migration

Status: Complete. See [`docs/milestones/m2.5-uuidv7-identifier-migration.md`](docs/milestones/m2.5-uuidv7-identifier-migration.md).

Goal: establish one time-ordered identifier strategy before adding more product tables.

- Use UUIDv7 for generated Better Auth and domain IDs, backed by native PostgreSQL UUID columns.
- Use the shared UUIDv7 generator across auth and domain creation paths.
- Verify local auth/domain fixtures, sessions, hierarchy foreign keys, and ownership/archive behavior after migration.

Acceptance: new auth/domain records use UUIDv7 consistently; session fixtures, ownership checks, hierarchy foreign keys, and archive flows pass.

Deployment caveat: M2.5 was completed before production deployment using a local database reset. It did not implement production backfill, cutover, or rollback procedures. Before deploying against data that must be preserved, assess the target database and plan the migration and rollback separately.

### M3 — Tickets MVP

Goal: add the lightweight Linear-style layer after the identifier strategy is settled.

- Ticket CRUD.
- Required release association.
- Fixed statuses: Idea, Estimate, Develop, Review, Test, Deploy, Done.
- Status can be changed in the edit form; desktop board drag-and-drop provides the primary workflow interaction.
- Estimate field in minutes/hours.
- Generic external links with a required URL and an optional custom label.
- Linked tickets/items without parent-child hierarchy.
- Board/list grouped by status.

Acceptance:

- A ticket cannot exist without a release.
- Ticket status can be changed.
- Tickets can show estimate, links, and related tickets.

### M4 — Manual time entries

Goal: track completed work without calendar drag/drop yet.

- Manual time entry form with date, start time, duration, mandatory ticket, and description.
- Time entries visible on ticket detail.
- Estimate usage percentage computed from linked time entries.
- Ratio colors: normal under 80%, warning at 80%+, red at 100%+.

Acceptance:

- A time entry cannot be saved without a ticket.
- Ticket estimate usage updates after time entries are added/edited/deleted.

### M5 — Today agenda MVP

Goal: make Today the primary working surface.

- Day agenda with customizable visible hours, default 8am–8pm.
- Existing manual time entries rendered as blocks.
- Quick add completed work from the day view.
- Mobile-friendly layout first; desktop should still be pleasant.
- Filters by client, project, release, ticket, and status.
- Badge-click contextual popover, especially for release badges: choose whether to filter by that client/project/release/status or navigate to its detail page.

Acceptance:

- A user can review and add today’s work from the agenda.
- Filtering the agenda is fast and obvious.

### M6 — Drag/drop time blocks

Goal: reintroduce the core `tt` interaction carefully.

- Create blocks by desktop click-dragging on the agenda.
- Support both start-to-finish and finish-to-start desktop drag creation.
- Edit, resize, and move blocks; provide non-drag creation/editing controls on mobile.
- Overlap prevention or clear overlap warning.
- Persist blocks as mandatory-ticket time entries.

Acceptance:

- Drag-created blocks require selecting/linking a ticket before save.
- Moving/resizing respects overlap rules.

### M7 — Search and compact UI polish

Status: Complete. See [`docs/milestones/m7-search-and-ui-polish.md`](docs/milestones/m7-search-and-ui-polish.md).

Goal: make the MVP fast to navigate and compact for daily work without losing existing interactions.

- Universal owner-scoped search across clients, projects, releases, tickets, and time entries, with grouped results and keyboard-friendly focus/navigation (including `/` and Ctrl/⌘K).
- Replace the horizontal dashboard navigation with a persistent-state desktop left sidebar (collapsed to icons by default; menu/icons above, user and settings at the bottom) and a top search bar. On mobile, use a top-bar menu button opening a full-screen navigation menu with search; preserve accessible labels, focus handling, and sign-out.
- Remove decorative page introductions and redundant heading/description blocks on list, Today, and Settings pages; keep compact entity titles/breadcrumbs and essential actions on detail/edit pages for orientation.
- Today: one compact control row with date/calendar navigation, unfiltered workday progress (about half the available desktop width), and Add time entry spaced across the row on wider screens, stacking in that order as a column on mobile; remove its Settings shortcut (Settings remains in the avatar menu). Remove repetitive filter heading, match-count message, and drag instructions; keep desktop double-click correction but remove per-entry Edit button. The mobile direct same-day correction alternative is a follow-up; ticket detail editing remains. Apply the desktop-spaced-row/mobile-column rule to other touched action rows.
- Client-detail project cards: whole-card navigation with the nested client control taking click precedence. Project release/milestone list: whole-row/card navigation with its mark-done control taking precedence.
- Ticket board, release ticket cards, and Today ticket entries: always show icon-triggered popovers for related tickets and external links, including a single item. Keep triggers icon-only regardless of item count, without count overlays. Related tickets remain internal links with board highlight/locate behavior where possible; external destinations remain native safe links. Preserve desktop drag and mobile collapsibles.
- Center the Settings form; use compact icon-leading filter inputs with tooltip labels in Today and Tickets, with one-line desktop filter bars and mobile columns, and icon-only Clear. Combine tracked time/estimate on release ticket cards without a percentage badge; keep tracked time/estimate/percentage together on ticket board cards; color tracked time with the approved semantic ratio bands and keep estimates/targets muted. Apply the same tracked-vs-target color distinction to Today workday progress; align metadata and remove the redundant grouped-tickets button. Use semantic Nuxt UI surfaces for list/card contrast. Add matching icons to app buttons and Nuxt UI tooltips to icon-only buttons instead of native `title` tooltips; preserve `title` for truncated content hints. Align client/project/release breadcrumbs inline with their headings. Remove ticket-detail next-status button; status remains editable in the form and movable on the board. Install the local Lucide icon collection (`@iconify-json/lucide`) to avoid icon availability warnings. Polish keyboard/touch interactions and final empty/loading/error states without changing stored domain rules.

Acceptance:

- Search finds only the signed-in user's eligible records, including time entries, and navigates to useful context by keyboard or pointer.
- Desktop navigation starts as an icon rail, expansion persists across visits; mobile navigation is a full-screen menu. Both remain usable with keyboard, touch, and assistive names.
- Today and other touched spaced control rows stack vertically on mobile; list pages are compact, nested controls do not trigger parent navigation, ticket relation hover/highlight/locate still works, relation/link popovers remain usable without count chips, board/release usage separates tracked time from estimate, and workday progress distinguishes worked time from target while remaining based on all entries for the selected day.
- Existing create/edit/status/drag/archive workflows and empty/loading/error states continue to work.

### M8 — Polish and shared ticket work items

Status: Complete (2026-09-27); implementation and verification are complete, and human code review is accepted.

Goal: polish Today, board, and release ticket/time presentations without changing stored time, status, ownership, archive, or estimate rules.

- Reuse ticket/time-entry presentation across Today, the board, and release cards while preserving wrapper interactions. Following human-approved code-review feedback, align Today/board card content order, placement, spacing, colors, and hierarchy-badge appearance while retaining per-entry versus aggregate time semantics. At M8 completion, board client/project/release badges were direct links; M12 later revised them to offer filter/open actions (ADR 0025). Board status changes remain absent per ADR 0013. On ticket board and release detail, show tracked time/estimate without a visible percentage badge; keep hierarchy/status/links below the release ticket title.
- Color tracked-time values with the existing usage ratio bands; distinguish Today progress from its target and show capped orange overtime without a separate suffix.
- M8 added a Today-only status-change submenu while retaining status filtering and existing status rules. M14 extends status changes to Release detail ticket badges through a direct selector; the board status policy remains unchanged (ADR 0013).
- Make all existing Today/Tickets board select-menu filters searchable. Keep archive toggles and form selects unchanged.
- Show active project/release/ticket counts on client cards, active release/ticket counts on project cards, and active ticket count plus accessible Done/total progress on release cards. Exclude archived descendants and descendants under archived ancestors; archived parent cards omit child metrics. Use the two-row ProjectCard under client detail, with project color/title above and client link plus release/ticket counts below; M19 removes the separate Projects collection page.
- Keep relation/link popover triggers as accessible icons without count chips, even when there are multiple items. Show release client/project/release quick links and the Clients heading; remove redundant explanatory subtitles from client list cards, client detail, and client-detail project cards.
- Add release-detail `Mark release as done` using the existing archive action. Warn and confirm when any tickets are unfinished, including an empty release, then navigate to the parent project after success. Allow deleting the selected time entry from the Today correction modal using the existing DELETE endpoint and confirmation prompt.
- Use explicit entity edit labels on client/project/release details, and keep Edit before New in responsive action order.
- Make external-link labels optional. Preserve custom labels, store missing labels as `NULL`, and display the URL hostname (including subdomains) when absent.

Acceptance:

- Existing time-entry geometry, overlap and persistence rules, estimate calculations, status rules, ownership, archive behavior, and interactions remain unchanged.
- Missing labels persist as `NULL` without rewriting existing custom labels; blank forms normalize to an absent label.
- Today and board share visual card layout, hierarchy badge styling/placement, and colors while retaining distinct actions and time semantics; release cards retain their shared presentation. Project cards use the two-row layout under client detail. Searchable filters, hierarchy counts, release progress, and icon-only relation/link popovers remain accessible and usable across desktop and mobile.

### M9 — Shared card composition and hierarchy filters

Status: Complete (2026-09-27). See [`docs/milestones/m9-shared-card-composition.md`](docs/milestones/m9-shared-card-composition.md).

- Standardized shared entity-card presentation, hierarchy metrics/progress, and Today/Tickets hierarchy filters while preserving page/card interaction ownership.

### M10 — Effect for server-side fallible operations

Status: Complete (2026-09-27). See [`docs/milestones/m10-server-effect-reliability.md`](docs/milestones/m10-server-effect-reliability.md) and ADR 0023.

- Added typed failures for fallible server work and a shared HTTP boundary for expected and unexpected errors.

### M11 — Effect for client-side fallible workflows

Status: Complete (2026-09-27). See [`docs/milestones/m11-client-effect-workflows.md`](docs/milestones/m11-client-effect-workflows.md) and ADR 0024.

- Added Effect-aware client requests and accessible, cause-safe read/mutation failure handling while preserving Nuxt SSR and hydration.

### M12 — Ticket board hierarchy badge actions

Status: Complete (2026-09-27). See [`docs/milestones/m12-ticket-board-hierarchy-actions.md`](docs/milestones/m12-ticket-board-hierarchy-actions.md) and ADR 0025.

- Board client/project/release badges offer filter-or-open actions using existing hierarchy filters.

### M13 — Hierarchy breadcrumb consistency

Status: Complete (2026-09-28). See [`docs/milestones/m13-hierarchy-breadcrumbs.md`](docs/milestones/m13-hierarchy-breadcrumbs.md) and ADR 0026.

- Added reusable, archive-aware hierarchy breadcrumbs to entity details and hierarchy-aware create/edit pages.

### M14 — Release ticket status badge actions

Status: Complete (2026-09-28). See [`docs/milestones/m14-release-ticket-status-actions.md`](docs/milestones/m14-release-ticket-status-actions.md) and ADR 0027.

- Release detail ticket badges directly select a fixed status and refresh through the existing ticket API.

### M15 — API item ordering

Status: Complete (2026-09-28). See [`docs/milestones/m15-api-item-ordering.md`](docs/milestones/m15-api-item-ordering.md) and ADR 0028.

- Established deterministic collection and nested-item ordering; global search intentionally retains update-recency ordering.

### M16 — Weekly agenda and cross-day moves

Status: Complete. Full-diff human code review and completion declaration recorded on 2026-09-29. See `docs/milestones/m16-weekly-agenda.md`.

Goal: add a localized, responsive weekly agenda alongside the existing day view.

- Add a Day/Week switch and configurable first weekday (Sunday `0` through Saturday `6`, Monday by default).
- Show seven localized date headings and independent daily progress without a weekly progress total.
- Support per-day creation, desktop create/move/resize interactions, cross-date moves, and mobile date-picker correction while keeping every entry on one date.
- Render invalid moves at the attempted position in red and reject invalid drops without persistence.

Acceptance:

- Day behavior remains available; week boundaries and localized dates follow the user's setting and browser locale.
- Per-day progress includes filtered-out and out-of-window work; the week API remains owner-scoped and returns no weekly tracked-time aggregate.
- Desktop and narrow-screen layouts remain usable without page-level horizontal overflow. Existing overlap, archival, ownership, and date-only rules remain authoritative.

### M17 — Agenda UI refinements

Status: Complete. Plan approval, full-diff code review, and completion declaration recorded on 2026-09-29. See `docs/milestones/m17-agenda-ui-refinements.md`.

Goal: refine the new weekly day headers and agenda-card context controls while preserving existing date/filter semantics.

- Put each weekly day’s Add action beside its date heading, with the daily tracked/target text and progress bar together below.
- Remove horizontal scrolling from hierarchy-badge groups in Ticket Board cards, Project cards, project-detail release cards, release-detail ticket cards, and natural-height Today/Week entries; allow wrapping and preserve unrelated title/usage overflow behavior. M18 adds a narrow exception for fixed-height desktop timeline entries: wrap only when vertical space allows, otherwise use a horizontally scrollable hierarchy row.
- Persist Day/Week selection in browser `localStorage` (default Day); do not persist the selected date or week.
- Label the current-date action “Today” in Day view and “This week” in Week view while retaining its anchor-date behavior.
- Add an accessible, title-adjacent per-ticket filter action to time-entry cards using the existing ticket filter.

Acceptance:

- Desktop and narrow weekly day headers show date and Add on the first row and daily progress below.
- Today/Week, Ticket Board, Project, project-detail release, and release-detail ticket hierarchy badges wrap without horizontal badge scrolling or page-level overflow.
- Day/Week selection survives navigation away from and back to `/today` in the same browser; first visit and invalid stored values default to Day, and date selection is not persisted.
- The current-date action is labeled for the active view; the ticket shortcut filters the selected ticket without triggering title navigation.
- No agenda date, overlap, ownership, archive, or API behavior changes.

### M18 — Agenda card fit and weekly add-entry date

Status: Complete. Plan approval, implementation authorization, full-diff code review, and completion declaration recorded on 2026-09-29. See `docs/milestones/m18-agenda-layout-and-weekly-add.md`.

Goal: remove weekly-header spacing and agenda-card clipping, and make the Week-mode page-level Add action support any date in the displayed week.

- Remove the forced minimum height from the desktop weekly day heading.
- Preserve time-block geometry; reduce agenda-card padding and compact hierarchy, title-filter, status, and relation/link controls in fixed-height desktop Day/Week blocks. Center compact icon controls. Wrap hierarchy badges only when vertical space permits; otherwise keep them on one line with horizontal scrolling. Natural-height mobile and out-of-window cards continue to wrap. This is a narrow M18 exception to M17's general wrapping behavior.
- In Week mode, allow the page-level Add modal to choose any of the seven dates in the displayed configured week, defaulting to the anchor date. Keep Day Add, per-day Add, and drag-create date/time behavior unchanged; do not persist the selected date.

Acceptance:

- All hierarchy actions remain accessible and are not clipped in 30-minute Day/Week desktop blocks; horizontally adjacent scheduled entries remain visually distinct and aligned to their unchanged time intervals.
- Badge wrapping is used only when the block has enough height; otherwise horizontal scrolling is confined to the hierarchy group. Narrow stacked and natural-height cards remain wrapped and readable.
- The Week-mode page-level Add modal defaults to the anchor date, permits choosing any date in the displayed configured week, and prevents choosing dates outside it. Saving creates the entry on the selected date without changing the page anchor or persisting the selection.
- Day-mode Add, per-day Week Add, drag-create, ownership, overlap, archive, and API behavior remain unchanged.

### M19 — Client-led project navigation

Status: Complete — implementation, verification, code review, and human completion declaration recorded. Execution evidence and review status: `docs/milestones/m19-client-led-project-navigation.md`.

Goal: make Clients the only top-level entry point for discovering and setting up projects while preserving individual project routes and hierarchy behavior.

- Remove Projects from desktop/mobile navigation and remove its `g`-then-`p` shortcut.
- Remove the all-projects collection route at `/projects` with no compatibility redirect; retain individual project detail/create/edit routes and project search results.
- Keep project cards and the New project action on client detail as the normal discovery/setup path.
- Route stale collection-return and prerequisite actions to Clients or the relevant parent client/project; preserve archive context.

Acceptance:

- The shell has no Projects collection link or shortcut; `/projects` returns 404.
- Projects remain discoverable and manageable from client detail, and individual project search results still navigate to project details.
- Create/edit/delete return paths work without the collection page; ownership, archive, hierarchy, and API behavior are unchanged.

### M20 — Login and ticket board toolbar polish

Status: Complete — implementation, verification, human code review, and completion declaration recorded. See `docs/milestones/m20-login-and-ticket-board-toolbar-polish.md`.

Goal: correct login-card alignment and make the ticket-board filters and primary actions a single responsive toolbar.

- Horizontally center the login card while preserving vertical centering, current sizing, and authentication/redirect behavior.
- At desktop widths where the controls fit, place the client/project/release/ticket filters and Clear filters on the same toolbar line as Show/Hide archived and New ticket. Keep filters flexible on the left and archive/New ticket actions on the right.
- Stack the same controls in a usable order at narrow widths; do not introduce page-level horizontal overflow.
- Preserve filter search/cascade/reset semantics, archive behavior, New ticket routes (including release context), accessible names, and all board interactions.

Acceptance:

- Login card is horizontally centered in the viewport on desktop and mobile; its existing vertical alignment and auth flow remain unchanged.
- All ticket-board filters, Clear filters, archive toggle, and New ticket action share one line at a sufficiently wide desktop viewport.
- Narrow layouts remain stacked and usable without horizontal page overflow; filter, archive, and ticket-create behavior is unchanged.

### M21 — pnpm v12 upgrade

Status: Complete — implementation, verification, human code review, and completion declaration recorded on 2026-09-29. See `docs/milestones/m21-pnpm-v12-upgrade.md`.

Goal: adopt pnpm v12 as the project package manager without broadening the upgrade to application dependencies or runtime/tooling changes.

- Pin the exact latest stable pnpm v12 release consistently in `package.json#packageManager` and `.github/workflows/check.yml`.
- Keep Node 24, the current GitHub Actions, CI shape, frozen install, and application dependency declarations unchanged.
- Update the lockfile only if pnpm 12 requires it; inspect any resolver changes and do not accept unrelated dependency upgrades.
- Allow install scripts only for the exact esbuild and vue-demi versions reported by pnpm 12; keep strict handling for all other unreviewed scripts.
- Record the package-manager baseline and approved build-script permissions in an ADR.

Acceptance:

- Local and CI use the same exact pnpm 12 version and the frozen install succeeds.
- The existing format, lint, typecheck, unit, browser, build, and workflow checks pass.
- Only the human-approved package-version-specific install scripts run; other unreviewed build scripts remain blocked.
- No application source or test changes occur, and no unrelated dependency versions change.

### Later, post-MVP

- Weekly/monthly summaries by client/project/release/ticket.
- Time summaries and review pages.
- Templates for recurring project/client workflows.
- Notes/journal entries connected to projects/tickets.
- Command palette / quick switcher.
- Optional richer integrations via generic external links only; no calendar sync or Jira API sync planned for MVP.

## Feature inventory and delivery status

`[x]` means delivered as recorded in a completed milestone; `[ ]` means not delivered or explicitly deferred. Detailed scope, verification, and review evidence remain in the linked milestone records.

### Core foundations

- [x] Work-only solo workspace.
- [x] Client catalog.
- [x] Project catalog under clients, with names and colors (the top-level Projects collection was removed in M19).
- [x] Release/milestone catalog under projects, with optional target date.
- [x] Universal owner-scoped search across clients, projects, releases, tickets, and time entries, with keyboard access.
- [x] Desktop keyboard-friendly interactions, including search focus/results navigation and accessible icon-rail navigation.
- [x] Persistent collapsed-by-default desktop sidebar and full-screen mobile navigation menu, with account/settings actions.
- [x] Mobile-friendly touch interactions for the Today/Week agenda, using non-drag controls.

### Time tracking

- [x] Day agenda as the primary work surface, with a weekly view.
- [x] Customizable visible hours, defaulting to 8am–8pm.
- [x] Configurable first day of the week, defaulting to Monday.
- [x] Configurable workday duration used for daily progress/overtime.
- [x] Daily progress indicator showing worked time against the configured workday target (positioned in the agenda controls, not at the bottom of the day).
- [x] Manual ticket-linked time entries with date, start time, duration, and description.
- [x] Date and time pickers for entry creation/correction.
- [x] Create, edit, resize, and move agenda entries with desktop drag interactions and non-drag mobile/keyboard controls.
- [x] Desktop click-drag creation in both start-to-finish and finish-to-start directions.
- [x] Overlap prevention and invalid-move feedback.
- [x] Agenda filters by client, project, release, ticket, and status.
- [x] Today and ticket-board hierarchy badges offer filter/open actions; status changes remain surface-specific.

### Projects and tickets

- [x] Client list and client-scoped project discovery.
- [x] Projects under clients, with color and basic metadata; there is no top-level Projects collection.
- [x] Release/milestone lists under projects, with optional target dates.
- [x] Ticket board grouped by the fixed statuses: Idea, Estimate, Develop, Review, Test, Deploy, Done.
- [x] Change ticket status through the edit form, Today status action, Release detail selector, or desktop board drag-and-drop; no ticket-detail next-status action.
- [x] Ticket title/description, required release association (with client/project context), status, estimate, external links, and related tickets.
- [x] External links require a URL, allow an optional custom label, and display the hostname when unlabeled.
- [x] Ticket time estimates only; no complexity or ticket-level target date.
- [x] Ticket relations without parent-child hierarchy.
- [ ] Comments/activity timeline; project/ticket notes are deferred to post-MVP.
- [x] Every tracked time entry requires a ticket.
- [x] Tracked time is shown with estimates when available; board/release cards omit the percentage badge while ticket detail retains it.
- [x] Estimate usage uses blue below 80%, green from 80% to below 100%, orange from 100% through 120%, and red above 120%.

### Unified views

- [x] Today agenda for recorded work, with quick add/correction, filters, and daily progress/overtime; there is no separate scheduled-work state or active timer.
- [x] Client detail for projects.
- [ ] Recent tracked-time summary on client detail (not implemented).
- [x] Project detail for releases and hierarchy navigation.
- [ ] Project-wide ticket/time summaries; ticket and tracked-usage details are available through the associated release/ticket views instead.
- [x] Release detail for tickets, target date, completion progress, status changes, and ticket-linked tracked-time/estimate usage.
- [x] Ticket detail for status, required release, estimate, linked time, estimate usage, external links, and related tickets.
- [x] Ticket board grouped by status, with related-ticket/external-link popovers, no duplicate card status, and highlight/locate behavior.
- [x] Weekly planning view with per-day progress and cross-day moves.

### Later ideas, not MVP

- [ ] Weekly/monthly summaries and review pages by client/project/release/ticket.
- [ ] Templates for recurring client/project workflows.
- [ ] Notes/journal entries connected to projects/tickets.
- [ ] Command palette / quick switcher.
- [ ] Optional richer integrations through generic external links only; no calendar sync or Jira API sync is planned.

## Roadmap ownership

`PLAN.md` records product scope and milestone sequencing. Each milestone's file under `docs/milestones/` is the source for its approved implementation scope, verification evidence, review, completion status, and follow-ups. This roadmap does not authorize implementation; future work requires a separately reviewed milestone plan.

## Reuse

Use `../tt` as product inspiration for the agenda/time-blocking experience already described above. Technical implementation should be reconsidered later with the latest Nuxt, Nuxt UI, and Effect TS rather than directly copying `tt` internals.

Specific findings already folded into this plan:

- `../tt/app/composables/use-date.ts` tracks start of week, visible day start/end, and work day duration.
- `../tt/app/components/day-progress.vue` and `../tt/app/components/day-progress-bar.vue` show worked time and overtime progress.
- `../tt` CI uses Dependabot, push/PR checks, release-please, GHCR images, and Coolify deployment.

## Steps

- [x] Confirm narrowed work-only scope.
- [x] Remove personal tasks, habits, streaks, and generic tags from MVP.
- [x] Confirm re-implementation of `tt` plus lite Linear-style tickets.
- [x] Confirm fixed MVP ticket statuses, not customizable.
- [x] Confirm manual generic external links only: label and URL.
- [x] Confirm time estimates only on tickets, no complexity or ticket-level target date.
- [x] Confirm releases/milestones may have optional target dates.
- [x] Confirm tickets must be linked to releases.
- [x] Confirm tracked time must be linked to tickets.
- [x] Confirm estimate usage colors instead of warning notifications.
- [x] Confirm today-dashboard-first, mobile-friendly MVP direction.
- [x] Confirm agenda-style day view, no active timer for MVP.
- [x] Confirm time tracking through manual entries and desktop drag-and-drop calendar blocks; mobile uses non-drag controls.
- [x] Confirm customizable agenda hours.
- [x] Confirm start time + duration manual entries and desktop bidirectional drag creation.
- [x] Convert this product plan into an implementation plan when ready.
- [x] Define the LLM-assisted workflow before M0.
- [x] Create and approve the M0 milestone file from `docs/templates/milestone-template.md` before bootstrap implementation.

## Planning history

- [x] Confirmed the narrowed work-only scope and excluded personal tasks, habits, streaks, and generic tags from MVP.
- [x] Confirmed the `tt`-inspired time-tracking direction, lightweight tickets/releases, fixed ticket statuses, ticket-linked time entries, estimate-only tickets, optional release target dates, and estimate-usage colors.
- [x] Converted the product direction into incremental milestones and established the LLM-assisted workflow before M0.
- [x] Created and approved the M0 milestone plan before bootstrap implementation; see `docs/milestones/m0-project-bootstrap.md`.

## Status and verification

The product direction is implemented incrementally and reviewed through the milestone lifecycle. This roadmap is not a substitute for milestone verification: delivered items are marked in the feature inventory above, and each milestone file records its actual checks, review, completion declaration, and outstanding follow-ups. The initial planning questions are historical and are no longer open approval gates.
