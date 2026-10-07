# ADR 0030: Browser-local agenda view preference

- Status: Superseded
- Date: 2026-09-29
- Supersedes: M16's explicit exclusion of a persisted Day/Week view preference (implementation scope only)
- Superseded by: ADR 0044

## Context

M16 added Day and Week views but kept the selection in component-local memory and explicitly excluded a persisted view mode. The user clarified that remembering the view in local storage was intended but omitted from the original milestone plan. This follow-up adds that preference without changing per-user settings or persisting the selected date.

## Decision

- Store only the selected `day` or `week` view in this browser's `localStorage`.
- Default to Day when the key is absent or invalid; ignore and remove invalid values.
- Do not persist the anchor date/week or synchronize the preference across browsers/devices.
- Keep the page usable with Day as its fallback if browser storage is unavailable.

## Consequences

The same browser restores the user's last Day/Week choice after route navigation or reload. New browsers and cleared storage begin in Day mode. Preference storage is client-local and introduces no schema, API, or dependency changes.

## Alternatives considered

- Persist the view in server-side user settings: rejected for this small browser-specific display preference; it would add settings/API scope.
- Persist the selected date/week alongside the view: rejected; only the view choice was requested.
- Keep Day as a fresh default every visit: rejected after the user's clarification that they intended the view selection to persist.

## Links

- `docs/milestones/m17-agenda-ui-refinements.md`
- `docs/milestones/m16-weekly-agenda.md`
