# ADR 0057: Sibling UI consistency and shared presentation

- Status: Accepted
- Date: 2026-10-14
- Supersedes: None
- Superseded by: None

## Context

Similar routes and components drift when a UI change lands on one surface or when presentation structure is copied page by page. Examples: attached-card padding changed on detail pages but not on the `/clients` list, and the same field-grid/divider structure was repeated across three detail pages. Client, Project, Release, and Ticket cards also had separately built heading and context rows, though their interaction ownership intentionally differs (whole-card navigation with nested controls versus draggable board cards that navigate through the title). Some differences, such as compact Board density, are deliberate.

## Goal

Analogous UI surfaces look and behave alike where they should, and intentional differences stay explicit.

## Decision

- For a UI change touching one of several analogous routes or components, inspect the sibling surfaces and their tests first.
- Where rendering should match, share one presentation component or style owner, and extend parity tests across the siblings.
- Entity data, navigation, actions, drag behavior, and nested-control precedence stay with the entity-specific page or wrapper; shared presentation components do not fetch data or impose navigation.
- Entity cards share a heading row and context row with common surface, border, hover, and focus treatment. Hierarchy metadata is left-aligned and wraps (ADR 0031). Project and Client title colors do not change on hover.
- Release completion on a card is shown as a small accessible ring beside the ticket icon with a done/total fraction, without a visible "done" word or percentage; the progress value text still describes it, including an empty active release.
- Document deliberate exceptions and verify they stay unchanged (for example, Board cards use compact padding).

## Consequences

Agents audit analogous surfaces when scoping visual changes. Shared presentation reduces drift and repeated markup; behavior stays with owners. Parity tests assert shared invariants and name the exceptions.

## Implementation notes (non-binding)

`EntityCard` is the slot-based shell and owns standard 8px padding; the Board opts into 4px. Client, Project, and Release detail pages share a field-grid/feedback/divider presentation. The ring is a small SVG, no chart dependency.

## Alternatives considered

- Update only the reported page: rejected; drift goes unnoticed.
- Duplicate markup per route: rejected; copies diverge.
- One generic entity page or card with all domain modes: rejected; behavior differs.
- Make Board cards fully clickable: rejected; it would change title navigation and drag.
- Replace the ticket icon and progress with a ring and percentage: rejected; fraction stays, percentage goes.

## Revisions

- 2026-11-21: Rewritten to goal-level form; absorbed ADR 0022 (shared entity-card shell and release progress ring); padding values and component names moved to notes.
