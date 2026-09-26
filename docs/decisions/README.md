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

| ADR                                                    | Status     | Title                                                |
| ------------------------------------------------------ | ---------- | ---------------------------------------------------- |
| [0001](0001-llm-assisted-development-workflow.md)      | Accepted   | LLM-assisted development workflow                    |
| [0002](0002-m0-bootstrap-baseline.md)                  | Accepted   | M0 bootstrap baseline                                |
| [0003](0003-m1-authentication-and-database.md)         | Accepted   | M1 authentication and Better Auth database baseline  |
| [0004](0004-m2-core-data-model.md)                     | Accepted   | M2 work hierarchy and archive lifecycle              |
| [0005](0005-m2-domain-validation-and-ui-polish.md)     | Accepted   | M2 domain validation and hierarchy UI polish         |
| [0006](0006-uuidv7-identifiers.md)                     | Accepted   | UUIDv7 identifiers across auth and domain data       |
| [0007](0007-m3-ticket-model-and-relations.md)          | Accepted   | M3 ticket model and relations                        |
| [0008](0008-ticket-estimates-and-board-layout.md)      | Accepted   | Human-readable estimates and responsive ticket board |
| [0009](0009-desktop-only-drag-and-drop.md)             | Superseded | Desktop-only drag-and-drop interactions              |
| [0010](0010-board-drag-and-compact-ticket-metadata.md) | Accepted   | Full-card board drag and compact ticket metadata     |
