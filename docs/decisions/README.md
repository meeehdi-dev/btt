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

- Add an ADR for decisions that affect architecture, data model, auth/security, dependency strategy, deployment, workflow, or product scope.
- Keep ADRs concise: context, decision, consequences, alternatives considered, links.
- Link ADRs from milestone files and relevant docs.
- If a decision changes, create a new ADR and mark the old one as `Superseded`; do not rewrite history except for typo/link fixes.
- Prefer facts and tradeoffs over persuasive prose.

## Index

| ADR                                                            | Status     | Title                                                      |
| -------------------------------------------------------------- | ---------- | ---------------------------------------------------------- |
| [0001](0001-llm-assisted-development-workflow.md)              | Accepted   | LLM-assisted development workflow                          |
| [0002](0002-m0-bootstrap-baseline.md)                          | Accepted   | M0 bootstrap baseline                                      |
| [0003](0003-m1-authentication-and-database.md)                 | Accepted   | M1 authentication and Better Auth database baseline        |
| [0004](0004-m2-core-data-model.md)                             | Accepted   | M2 work hierarchy and archive lifecycle                    |
| [0005](0005-m2-domain-validation-and-ui-polish.md)             | Accepted   | M2 domain validation and hierarchy UI polish               |
| [0006](0006-uuidv7-identifiers.md)                             | Accepted   | UUIDv7 identifiers across auth and domain data             |
| [0007](0007-m3-ticket-model-and-relations.md)                  | Superseded | M3 ticket model and relations                              |
| [0008](0008-ticket-estimates-and-board-layout.md)              | Accepted   | Human-readable estimates and responsive ticket board       |
| [0009](0009-desktop-only-drag-and-drop.md)                     | Superseded | Desktop-only drag-and-drop interactions                    |
| [0010](0010-board-drag-and-compact-ticket-metadata.md)         | Superseded | Full-card board drag and compact ticket metadata           |
| [0011](0011-manual-time-entry-history-and-slots.md)            | Accepted   | Manual time entry history and slots                        |
| [0012](0012-today-agenda-settings-and-history.md)              | Accepted   | Today agenda settings and historical work                  |
| [0013](0013-board-status-control-removal.md)                   | Accepted   | Remove next-status control from ticket board               |
| [0014](0014-agenda-drag-interactions.md)                       | Superseded | Single-day agenda drag interactions                        |
| [0015](0015-compact-navigation-and-mobile-columns.md)          | Accepted   | Compact navigation and mobile control columns              |
| [0016](0016-agenda-correction-control-and-board-filters.md)    | Accepted   | Agenda correction control and compact hierarchy filters    |
| [0017](0017-release-usage-and-ticket-detail-polish.md)         | Accepted   | Release usage and ticket-detail navigation polish          |
| [0018](0018-ticket-context-and-application-ui-consistency.md)  | Accepted   | Ticket context and application UI consistency              |
| [0019](0019-ticket-usage-contrast-and-context-count-badges.md) | Accepted   | Ticket usage contrast and context count badges             |
| [0020](0020-m8-polish-decisions.md)                            | Accepted   | M8 polish and shared-work decisions                        |
| [0021](0021-effect-for-fallible-operations.md)                 | Accepted   | Effect for meaningful fallible operations                  |
| [0022](0022-shared-entity-card-presentation.md)                | Accepted   | Shared entity-card presentation shell                      |
| [0023](0023-server-effect-http-boundary.md)                    | Accepted   | Server Effect boundary and HTTP failure mapping            |
| [0024](0024-effect-aware-client-fetch-boundary.md)             | Accepted   | Effect-aware client fetch boundary                         |
| [0025](0025-ticket-board-hierarchy-actions.md)                 | Accepted   | Ticket board hierarchy badge actions                       |
| [0026](0026-hierarchical-breadcrumb-navigation.md)             | Accepted   | Hierarchical breadcrumb navigation                         |
| [0027](0027-release-ticket-status-actions.md)                  | Accepted   | Release ticket status badge actions                        |
| [0028](0028-api-item-ordering.md)                              | Accepted   | Stable API item ordering                                   |
| [0029](0029-weekly-agenda-and-conflict-previews.md)            | Accepted   | Weekly agenda and attempted-position conflict previews     |
| [0030](0030-agenda-view-preference.md)                         | Accepted   | Browser-local agenda view preference                       |
| [0031](0031-hierarchy-badge-wrapping.md)                       | Accepted   | Wrap hierarchy badge groups in cards                       |
| [0032](0032-client-led-project-navigation.md)                  | Superseded | Client-led project navigation                              |
| [0033](0033-no-compatibility-route-for-project-collection.md)  | Accepted   | No compatibility route for the removed Projects collection |
