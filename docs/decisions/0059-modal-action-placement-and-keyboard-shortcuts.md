# ADR 0059: Modal action placement and form shortcuts

- Status: Accepted
- Date: 2026-10-14
- Supersedes: None
- Superseded by: None

## Context

Modal actions were placed inconsistently and form dialogs lacked shared keyboard behavior. One footer convention and keyboard access are wanted without bypassing validation, pending guards, or nested-modal focus.

## Goal

Every modal has predictable action placement and keyboard behavior that never bypasses normal validation.

## Decision

- Footer actions align to the trailing (right) edge. Secondary actions come before the primary; the primary is the far-right button, and a single action sits at the right edge. A destructive secondary action precedes Cancel and the primary.
- Escape closes only the topmost modal, when its pending-operation policy allows dismissal; it never closes a parent while a nested modal is open. Outside-click behavior follows each modal's existing policy.
- Cmd+Enter (Ctrl+Enter elsewhere) submits the active modal's form through the normal submit and validation path, respecting disabled/pending actions. It does nothing in confirmation-only dialogs or outside modals.
- Button behavior, validation, API semantics, and action meanings are unchanged.

## Consequences

The primary action has a stable position. Invalid forms stay open. Modals without a form ignore the shortcut. No API or schema change.

## Alternatives considered

- Primary at left or platform-specific order: rejected in favor of the trailing-primary convention.
- A global Cmd+Enter listener: rejected; parent or non-modal forms could submit.
- Cmd+Enter for confirmation-only dialogs: rejected; no form to validate, and it could trigger consequential actions.

## Revisions

- 2026-11-21: Rewritten to goal-level form; external design-reference links and session ids dropped.
