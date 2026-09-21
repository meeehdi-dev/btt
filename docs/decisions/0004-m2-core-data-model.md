# ADR 0004: M2 work hierarchy and archive lifecycle

- Status: Accepted
- Date: 2026-09-21
- Supersedes: None
- Superseded by: None

## Context

M2 introduces the authenticated product hierarchy required by tickets: clients contain projects, and projects contain releases. Records must disappear from normal work views without losing recoverability, while allowing intentional database cleanup.

## Decision

- Store `client`, `project`, and `release` rows in PostgreSQL through Drizzle.
- Scope clients to the Better Auth user; resolve project and release ownership through their parent joins.
- Use nullable `archived_at` timestamps. Archiving a parent changes only that row; descendants retain their own archive state but are hidden while an ancestor is archived.
- Archived records remain editable and restorable. Normal lists/selectors show active records; archive filters expose archived records where the parent hierarchy is visible.
- Permanent deletion is a separate explicit operation allowed only after the record is archived. Parent deletion is child-first and never cascades automatically.
- Store project colors as validated six-digit hex values; the UI provides 16 presets and a custom hex picker.
- Use restrictive child foreign keys so accidental parent deletion cannot bypass cleanup.

## Consequences

The UI and API must distinguish archive/restore from permanent deletion. Users must delete releases before projects and projects before clients. Parent archival can temporarily hide otherwise active descendants without mutating them; restoring the parent reveals descendants that are not independently archived.

## Links

- `PLAN.md`
- `plans/m2-core-data-model.md`
- `docs/milestones/m2-core-data-model.md`
