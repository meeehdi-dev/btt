# Decision Records

This directory stores architectural/product/workflow decisions that future agents should treat as durable context.

## Format

Use `docs/templates/adr-template.md` for new records.

Filename format:

```text
NNNN-short-descriptive-slug.md
```

- `NNNN` is a four-digit sequential number.
- The slug should be lowercase kebab-case.
- Do not renumber existing ADRs.

## Status values

- `Proposed` — drafted but not approved.
- `Accepted` — approved and currently authoritative.
- `Superseded` — replaced by a newer ADR. Link the superseding ADR.
- `Deprecated` — no longer recommended, but not directly replaced.

## Rules

- Add an ADR for durable decisions about product behavior, data model, auth/security, architecture principles, deployment, or workflow. Routine dependency upgrades and tooling swaps do not need an ADR.
- Lead with the **goal**: what we want and why. The goal is what binds future work.
- Keep implementation details (versions, libraries, file paths, config values, component names) out of the Goal and Decision, or put them under **Implementation notes (non-binding)**. Code and config are the source of truth for them.
- ADRs are living documents. When facts or details change, edit the ADR in place and add a dated line to **Revisions** saying what changed and why, so the reasoning stays in the file.
- Mark an ADR `Superseded` and write a new one only when its goal is replaced. Do not supersede individual clauses; fold the change into the surviving ADR instead.
- A change is blocked only if it contradicts an ADR's goal. When unsure, ask the human.
- Keep ADRs concise. Prefer facts and tradeoffs over persuasive prose.

## Index

| ADR                                                                    | Status     | Title                                                     |
| ---------------------------------------------------------------------- | ---------- | --------------------------------------------------------- |
| [0001](0001-llm-assisted-development-workflow.md)                      | Superseded | LLM-assisted development workflow                         |
| [0002](0002-m0-bootstrap-baseline.md)                                  | Superseded | M0 bootstrap baseline                                     |
| [0003](0003-m1-authentication-and-database.md)                         | Accepted   | Authentication and durable sessions                       |
| [0004](0004-m2-core-data-model.md)                                     | Accepted   | Work hierarchy and archive lifecycle                      |
| [0005](0005-m2-domain-validation-and-ui-polish.md)                     | Superseded | M2 domain validation and hierarchy UI polish              |
| [0006](0006-uuidv7-identifiers.md)                                     | Accepted   | Time-ordered UUID identifiers                             |
| [0007](0007-m3-ticket-model-and-relations.md)                          | Accepted   | Ticket model and relations                                |
| [0008](0008-ticket-estimates-and-board-layout.md)                      | Accepted   | Human-readable ticket estimates and Board lanes           |
| [0009](0009-desktop-only-drag-and-drop.md)                             | Superseded | Desktop-only drag-and-drop interactions                   |
| [0010](0010-board-drag-and-compact-ticket-metadata.md)                 | Superseded | Full-card desktop board drag and compact ticket metadata  |
| [0011](0011-manual-time-entry-history-and-slots.md)                    | Accepted   | Manual time entry history and slots                       |
| [0012](0012-today-agenda-settings-and-history.md)                      | Accepted   | Agenda settings and historical work                       |
| [0013](0013-board-status-control-removal.md)                           | Superseded | Remove next-status control from ticket board              |
| [0014](0014-agenda-drag-interactions.md)                               | Accepted   | Agenda drag interactions                                  |
| [0015](0015-compact-navigation-and-mobile-columns.md)                  | Superseded | Compact navigation and mobile control columns             |
| [0016](0016-agenda-correction-control-and-board-filters.md)            | Accepted   | Agenda entry correction and Board hierarchy filters       |
| [0017](0017-release-usage-and-ticket-detail-polish.md)                 | Accepted   | Release ticket usage and ticket-detail polish             |
| [0018](0018-ticket-context-and-application-ui-consistency.md)          | Accepted   | Consistent ticket context and icon controls               |
| [0019](0019-ticket-usage-contrast-and-context-count-badges.md)         | Superseded | Ticket usage contrast and context count badges            |
| [0020](0020-m8-polish-decisions.md)                                    | Accepted   | Usage colors, link labels and hierarchy metrics           |
| [0021](0021-effect-for-fallible-operations.md)                         | Accepted   | Typed errors for meaningful fallible operations           |
| [0022](0022-shared-entity-card-presentation.md)                        | Superseded | Shared entity-card presentation shell                     |
| [0023](0023-server-effect-http-boundary.md)                            | Accepted   | Server error boundary and HTTP failure mapping            |
| [0024](0024-effect-aware-client-fetch-boundary.md)                     | Accepted   | Safe client read and write boundary                       |
| [0025](0025-ticket-board-hierarchy-actions.md)                         | Accepted   | Ticket board hierarchy badge actions                      |
| [0026](0026-hierarchical-breadcrumb-navigation.md)                     | Accepted   | Hierarchical breadcrumb navigation                        |
| [0027](0027-release-ticket-status-actions.md)                          | Accepted   | Release detail ticket status and release completion       |
| [0028](0028-api-item-ordering.md)                                      | Accepted   | Stable collection ordering                                |
| [0029](0029-weekly-agenda-and-conflict-previews.md)                    | Accepted   | Weekly Agenda and attempted-position conflict previews    |
| [0030](0030-agenda-view-preference.md)                                 | Superseded | Browser-local agenda view preference                      |
| [0031](0031-hierarchy-badge-wrapping.md)                               | Accepted   | Wrap hierarchy badge groups in cards                      |
| [0032](0032-client-led-project-navigation.md)                          | Superseded | Client-led project navigation                             |
| [0033](0033-no-compatibility-route-for-project-collection.md)          | Accepted   | Client-led project discovery; removed routes return 404   |
| [0034](0034-pnpm-v12-package-manager.md)                               | Superseded | pnpm v12 package-manager baseline                         |
| [0035](0035-three-block-header-navigation.md)                          | Accepted   | Single header navigation                                  |
| [0036](0036-coolify-source-build-deployment.md)                        | Accepted   | Source-build deployment                                   |
| [0037](0037-searchable-data-backed-selectors.md)                       | Accepted   | Searchable selectors for user-managed data                |
| [0038](0038-today-agenda-status-badge-flow.md)                         | Superseded | Ordered status badge flow in Today agenda entries         |
| [0039](0039-today-agenda-context-control-flow.md)                      | Accepted   | Keep Agenda entry context controls in one flow            |
| [0040](0040-ticket-detail-inline-editing.md)                           | Accepted   | Ticket detail is the normal edit surface                  |
| [0041](0041-ci-e2e-failure-diagnostics.md)                             | Superseded | Keep CI E2E failures visible and diagnosable              |
| [0042](0042-desktop-only-ui-and-spacing.md)                            | Accepted   | Desktop-only UI and compact spacing                       |
| [0043](0043-release-completion-action-location.md)                     | Superseded | Keep release completion on release detail                 |
| [0044](0044-week-only-agenda-and-status-selector.md)                   | Accepted   | Week-only Agenda and direct status selector               |
| [0045](0045-btt-project-name-and-header.md)                            | Accepted   | btt product name, no header branding                      |
| [0046](0046-quiet-done-ticket-board-visibility.md)                     | Accepted   | Hide quiet Done tickets from the active Ticket Board      |
| [0047](0047-muted-tracked-time-without-estimate.md)                    | Superseded | Muted tracked time without an estimate                    |
| [0048](0048-agenda-and-board-status-icon-menus.md)                     | Accepted   | Status icon menus and Board interactions                  |
| [0049](0049-nuxt-ui-semantic-color-theme.md)                           | Accepted   | Semantic color roles and contrast                         |
| [0050](0050-e2e-verification-and-server-handoff.md)                    | Superseded | Require complete local verification before server handoff |
| [0051](0051-same-tab-api-data-invalidation.md)                         | Accepted   | Same-tab API data invalidation                            |
| [0052](0052-jscpd-knip-quality-gates.md)                               | Accepted   | Code-quality gates for duplication and unused code        |
| [0053](0053-ticket-priorities.md)                                      | Accepted   | Ticket priorities and Board ordering                      |
| [0054](0054-ticket-priority-icon-presentation.md)                      | Superseded | Ticket priority icon presentation                         |
| [0055](0055-on-hold-ticket-status.md)                                  | Accepted   | On hold ticket status                                     |
| [0056](0056-entity-modal-creation-inline-editing-and-action-toasts.md) | Accepted   | Modal creation, inline editing, and action toasts         |
| [0057](0057-sibling-ui-consistency-and-shared-presentation.md)         | Accepted   | Sibling UI consistency and shared presentation            |
| [0058](0058-settings-in-shell-modal.md)                                | Accepted   | Settings in a shell modal                                 |
| [0059](0059-modal-action-placement-and-keyboard-shortcuts.md)          | Accepted   | Modal action placement and form shortcuts                 |
| [0060](0060-pnpm-dependabot-tracking.md)                               | Superseded | Track pnpm as a Dependabot dependency                     |
| [0061](0061-reports-time-allocation.md)                                | Accepted   | Reports time allocation                                   |
| [0062](0062-pi-workflow-modes-and-artifact-locations.md)               | Accepted   | Workflow artifact homes, approval gates, and handoff      |
| [0063](0063-release-done-ticket-sections.md)                           | Accepted   | Release Done ticket sections                              |
| [0064](0064-manual-application-testing.md)                             | Accepted   | Human manual application testing instead of E2E           |
| [0065](0065-node-26-and-release-cooldown.md)                           | Superseded | Node 26 baseline and 7-day release cooldown               |
| [0066](0066-latest-node-lts-with-mise.md)                              | Accepted   | Runtime and dependency freshness                          |

Superseded ADRs are history, not rules; follow their "Superseded by" link for current intent.
