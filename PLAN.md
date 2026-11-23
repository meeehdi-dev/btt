# btt — Product Plan

`btt` is a work-only, single-user app: time tracking inspired by `../tt` plus a lightweight Linear-style ticket system, so tracked time is always tied to tickets.

This file holds product scope and direction. Current product rules live in the accepted ADRs (`docs/decisions/`), which bind by their goal. Current implementation details (versions, libraries, config) live in code and config. Milestone files are history.

## Product scope

- **Agenda first.** A week-only Agenda is the primary surface for recording and correcting completed work, with configurable visible hours, week start, and workday target. No active timer and no planned-work state.
- **Hierarchy.** Client → Project → Release → Ticket. Projects are reached from Clients. Releases have an optional target date. Archiving is reversible; deleting requires archiving first.
- **Tickets.** A ticket belongs to exactly one release and has a fixed ordered status set (On hold, Idea, Estimate, Develop, Review, Test, Deploy, Done). Each ticket can have an optional priority and external links (URL plus optional label). There are no parent-child tickets.
- **Time.** Every time entry belongs to a ticket. Entries never overlap within a day. The Agenda shows each day's worked hours (for the filtered entries) beside its progress bar.
- **Surfaces.** Agenda, Ticket Board (status lanes, drag to change status), Clients, Project and Release detail, Ticket detail (the normal place to edit a ticket), Reports (time allocation per week, month, or year), global search, and a Settings modal.
- **Platform.** Desktop only. GitHub sign-in. Self-hosted deployment built from source.

### Out of scope

Personal tasks, habits, streaks, generic tags, billable flags, calendar sync, Jira or API integrations, and exports.

### Later ideas

- Per-ticket period reports and an entry-level drill-down.
- Templates for recurring client or project workflows.
- Notes or journal entries attached to projects or tickets.
- Command palette or quick switcher.

## Technical direction

These are stack choices, not version pins. Track the latest stable releases, subject to the dependency policy in [ADR 0066](docs/decisions/0066-latest-node-lts-with-mise.md). Exact versions live in `package.json` and config.

- Nuxt and Nuxt UI, TypeScript in strict mode, with the Nuxt/Vue typecheck as the source of truth.
- Effect for meaningful fallible operations ([ADR 0021](docs/decisions/0021-effect-for-fallible-operations.md)).
- PostgreSQL with Drizzle. Better Auth with GitHub login.
- OXC tooling (oxlint, oxfmt), Vitest, duplication and unused-code gates ([ADR 0052](docs/decisions/0052-jscpd-knip-quality-gates.md)). Application testing is manual ([ADR 0064](docs/decisions/0064-manual-application-testing.md)).
- GitHub Actions as the quality gate and Dependabot for updates. Deployment builds the repository Dockerfile on the host ([ADR 0036](docs/decisions/0036-coolify-source-build-deployment.md)).
- Project-local maintainer skills live in `.agents/skills/`.

## Architecture principles

- Build vertical slices that leave the app working. Keep each milestone small enough to review in full.
- Keep domain rules on the server: a ticket requires a release, a time entry requires a ticket, a release belongs to a project, and a project belongs to a client.
- Keep client UI state local until a real need for heavier state management appears.
- Use `../tt` for UX lessons, not its internals.

## Milestone history

Work proceeds through milestones (see `docs/milestones/README.md`). Each file records the approved scope, evidence, and review for its milestone. They are history, not current rules. This roadmap does not authorize work; each new milestone needs its own approved plan.

- M0 — [Project bootstrap and quality baseline](docs/milestones/m0-project-bootstrap.md)
- M1 — [Authentication and protected shell](docs/milestones/m1-authentication-shell.md)
- M2 — [Core data model: clients, projects, releases](docs/milestones/m2-core-data-model.md)
- M2.5 — [UUIDv7 identifier migration](docs/milestones/m2.5-uuidv7-identifier-migration.md)
- M3 — [Tickets MVP](docs/milestones/m3-tickets-mvp.md)
- M3.5 — [Ticket board status moves](docs/milestones/m3.5-ticket-board-status-moves.md)
- M4 — [Manual time entries](docs/milestones/m4-manual-time-entries.md)
- M5 — [Today agenda MVP](docs/milestones/m5-today-agenda.md)
- M6 — [Drag/drop time blocks](docs/milestones/m6-agenda-drag-blocks.md)
- M7 — [Search and compact UI polish](docs/milestones/m7-search-and-ui-polish.md)
- M8 — [Polish and shared ticket work items](docs/milestones/m8-polish-and-shared-ticket-work-items.md)
- M9 — [Shared card composition and hierarchy filters](docs/milestones/m9-shared-card-composition.md)
- M10 — [Effect for server-side fallible operations](docs/milestones/m10-server-effect-reliability.md)
- M11 — [Effect for client-side fallible workflows](docs/milestones/m11-client-effect-workflows.md)
- M12 — [Ticket board hierarchy badge actions](docs/milestones/m12-ticket-board-hierarchy-actions.md)
- M13 — [Hierarchy breadcrumb consistency](docs/milestones/m13-hierarchy-breadcrumbs.md)
- M14 — [Release ticket status badge actions](docs/milestones/m14-release-ticket-status-actions.md)
- M15 — [API item ordering](docs/milestones/m15-api-item-ordering.md)
- M16 — [Weekly agenda and cross-day moves](docs/milestones/m16-weekly-agenda.md)
- M17 — [Agenda UI refinements](docs/milestones/m17-agenda-ui-refinements.md)
- M18 — [Agenda card fit and weekly add-entry date](docs/milestones/m18-agenda-layout-and-weekly-add.md)
- M19 — [Client-led project navigation](docs/milestones/m19-client-led-project-navigation.md)
- M20 — [Login and ticket board toolbar polish](docs/milestones/m20-login-and-ticket-board-toolbar-polish.md)
- M21 — [pnpm v12 upgrade](docs/milestones/m21-pnpm-v12-upgrade.md)
- M22 — [Roadmap and documentation reconciliation](docs/milestones/m22-documentation-reconciliation.md)
- M23 — [Three-block header navigation](docs/milestones/m23-three-block-header-navigation.md)
- M24 — [First production deployment via Coolify](docs/milestones/m24-first-release-deployment.md)
- M25 — [Ticket detail page overhaul](docs/milestones/m25-ticket-detail-overhaul.md)
- M26 — [Today current-day and current-time indicators](docs/milestones/m26-today-current-day-and-time-indicators.md)
- M27 — [CI browser-test reliability and diagnostics](docs/milestones/m27-ci-browser-test-reliability.md)
- M28 — [Desktop-only UI cleanup and spacing harmonization](docs/milestones/m28-desktop-only-ui-cleanup.md)
- M29 — [Week-only Agenda route and UI polish](docs/milestones/m29-today-week-only-ui-polish.md)
- M30 — [Agenda toolbar and timeline polish](docs/milestones/m30-agenda-toolbar-and-timeline-polish.md)
- M31 — [Project name and header navigation](docs/milestones/m31-project-name-and-header-navigation.md)
- M32 — [Ticket Board status icons, card sizing, and quiet Done visibility](docs/milestones/m32-ticket-board-status-icons-cards-and-done-visibility.md)
- M33 — [Agenda card drag affordance and initial loading](docs/milestones/m33-agenda-card-hover-and-initial-load.md)
- M34 — [Agenda and Ticket Board status icon menus](docs/milestones/m34-agenda-board-status-icon-menus.md)
- M35 — [Nuxt UI semantic color theme](docs/milestones/m35-nuxt-ui-color-theme.md)
- M36 — [E2E verification and server handoff](docs/milestones/m36-e2e-verification-and-server-handoff.md)
- M38 — [Same-tab API data invalidation](docs/milestones/m38-same-tab-api-data-invalidation.md)
- M39 — [jscpd and Knip code-quality gates](docs/milestones/m39-jscpd-knip-code-checks.md)
- M40 — [Ticket Board card title and tracked-time alignment](docs/milestones/m40-ticket-board-card-title-time-alignment.md)
- M41 — [Agenda time-entry ticket autofocus](docs/milestones/m41-agenda-time-entry-ticket-autofocus.md)
- M42 — [Ticket priorities on Board, Agenda, and ticket forms](docs/milestones/m42-ticket-priorities.md)
- M43 — [On hold ticket status](docs/milestones/m43-on-hold-ticket-status.md)
- M44 — [Entity modals, inline editing, and action toasts](docs/milestones/m44-entity-modals-inline-editing-and-action-toasts.md)
- M45 — [Reports and time allocation](docs/milestones/m45-reports-time-allocation.md)
- M46 — [Pi workflow modes integration (maintenance)](docs/milestones/m46-workflow-modes-integration.md)
- M47 — [Release Done tickets at the bottom](docs/milestones/m47-release-done-tickets-bottom.md)
- M48 — [Remove E2E tests (maintenance)](docs/milestones/m48-remove-e2e-tests.md)
- M49 — [Modal primary-field autofocus](docs/milestones/m49-modal-primary-field-autofocus.md)
- M50 — [Dependency upgrade (November 2026)](docs/milestones/m50-dependency-upgrade.md)
- M51 — [Remove estimates and related tickets; Agenda ticket creation and filtered day hours](docs/milestones/m51-remove-estimates-relations-and-agenda-hours.md)
