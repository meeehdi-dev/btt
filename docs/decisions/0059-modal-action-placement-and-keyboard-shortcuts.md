# ADR 0059: Modal action placement and form keyboard shortcuts

- Status: Accepted
- Date: 2026-10-14
- Supersedes: None
- Superseded by: None

## Context

Modal actions are inconsistent across the app, and form dialogs do not share keyboard submit behavior. The M44 amendment seeks one predictable footer convention and keyboard access without bypassing existing validation, pending guards, or nested-modal focus behavior.

## Decision

- Align modal footer/action groups to the trailing edge (right in this LTR app). Put secondary/cancel actions before the primary action; the primary action is the far-right button. Put a single footer action at the right edge. Destructive secondary actions precede Cancel and the primary action.
- Escape dismisses the topmost active modal when its pending-operation policy allows dismissal. It must not dismiss a parent modal while a nested modal is active. Outside-click dismissal remains controlled by each modal's existing policy.
- Meta+Enter (Command+Enter) submits the active modal form, with Ctrl+Enter as its non-Mac equivalent. The shortcut uses the existing form submit/validation path and respects disabled/pending submit actions. It does not activate action-only confirmation dialogs or forms outside a modal.
- Preserve existing button behavior, validation, API semantics, and action meanings.

## Consequences

- Modal action placement is consistent and the primary action has a stable position.
- Form shortcuts run the same validation and mutation logic as the primary submit button; invalid forms remain open and do not commit.
- Nested-modal Escape dismisses only the current dialog. Modals without a form do not respond to Command/Ctrl+Enter.
- No dependency, API, auth, or schema changes are required.

## Alternatives considered

- Align primary actions at the left or use platform-specific button order: rejected for this web app in favor of the Carbon/Apple trailing-primary convention and the user's requested far-right primary.
- Listen globally for Command+Enter: rejected because parent forms or non-modal forms could submit while a nested/current modal is active.
- Bind Command+Enter to confirmation-only actions: rejected because those dialogs have no form to validate and the shortcut could trigger consequential actions.

## Links

- Approved plan: [`plans/modal-actions-and-keyboard-shortcuts-amendment.md`](../../plans/modal-actions-and-keyboard-shortcuts-amendment.md), approved via Plannotator session `pn-5c524e`.
- M44 implementation evidence: [`docs/milestones/m44-entity-modals-inline-editing-and-action-toasts.md`](../milestones/m44-entity-modals-inline-editing-and-action-toasts.md).
- Carbon Design System: [Modal guidelines](https://www.carbondesignsystem.com/building-blocks/core/components/modal/guidelines).
- Apple Human Interface Guidelines: [Alerts](https://developer.apple.com/design/human-interface-guidelines/alerts).
- Related: [ADR 0042](0042-desktop-only-ui-and-spacing.md), [ADR 0050](0050-e2e-verification-and-server-handoff.md), [ADR 0056](0056-entity-modal-creation-inline-editing-and-action-toasts.md), and [ADR 0058](0058-settings-in-shell-modal.md).
