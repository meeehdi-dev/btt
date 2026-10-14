# ADR 0057: Sibling UI consistency and shared presentation

- Status: Accepted
- Date: 2026-10-14
- Supersedes: None
- Superseded by: None

## Context

Similar routes and components can drift when a UI change is implemented on only one surface or when repeated presentation structure is copied page-by-page. M44 exposed this with 8px attached-card padding on Client/Project/Release detail pages while the `/clients` collection retained 4px padding, and with the same detail field-grid/divider structure repeated across three pages. Some presentation differences are intentional, such as the compact Ticket Board card density, so consistency must not erase interaction or density choices that are part of the design.

## Decision

For UI changes affecting one of several analogous routes or components, agents inspect sibling surfaces and their tests before implementation. When the intended rendering or layout is shared, prefer a common presentation component or shared style ownership and extend parity tests to cover the sibling surfaces. Keep entity-specific data, interactions, and behavior in the appropriate page/component owners. Preserve intentional differences explicitly and verify that those exceptions remain unchanged.

For the M44 hierarchy-card refinement, `EntityCard` owns the standard 8px entity-card padding; the Ticket Board opts into compact 4px padding explicitly. Client, Project, and Release detail pages share their repeated field-grid/feedback/divider/items presentation without moving domain behavior into the shared component.

## Consequences

- Agents must audit analogous UI surfaces and relevant tests when scoping visual or layout changes.
- Shared presentation is preferred where it represents a real invariant, reducing visual drift and repeated layout markup.
- Shared components remain presentation-focused; entity behavior and intentionally different density/interactions remain explicit at their owners.
- Parity tests should assert shared layout invariants and document deliberate exceptions.

## Alternatives considered

- Update only the reported page: not chosen because similar routes can retain unnoticed visual drift.
- Duplicate the same layout and classes across each route: not chosen because repeated structure can diverge during later edits.
- Move all similar pages and behaviors into one generic entity page: not chosen because their domain actions, data, and interaction semantics differ.

## Links

- Related plan/milestone/docs: [M44 consistency amendment](../../plans/hierarchy-detail-presentation-consistency.md), [M44 milestone](../milestones/m44-entity-modals-inline-editing-and-action-toasts.md), [ADR 0022](0022-shared-entity-card-presentation.md), [ADR 0042](0042-desktop-only-ui-and-spacing.md), [LLM workflow](../llm-workflow.md)
