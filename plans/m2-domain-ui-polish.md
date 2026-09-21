# M2 follow-up — client colors, color presets, resilient forms, and Effect boundaries

## Context

Follow-up improvements were identified during review of the M2 CRUD experience:

- Clients need a stored color so future client badges can use it.
- The current `UColorPicker` does not render presets because Nuxt UI v4 does not expose a `swatches` prop; the project form passes an unsupported prop.
- The project form needs explicit empty/loading/error handling when no active clients exist.
- Archive visibility should be a minimal icon-only control rather than a full text row.
- Existing M2 validation and API handling use plain exceptions/imperative branches; use Effect v4 RC more deliberately so validation, authorization, not-found, conflict, and persistence outcomes are explicit and harder to omit.

This is a focused M2 follow-up. It does not start M3 tickets or change archive semantics.

## Approach

1. **Client color data**
   - Add a required validated hex `color` column to `client`, with a migration-safe default for existing rows.
   - Extend client create/edit API payloads and forms.
   - Render the selected client color in client cards/details so the stored value is visibly exercised and ready for future badges.

2. **Reusable color selection**
   - Replace the unsupported `UColorPicker :swatches` usage with a shared color selector component.
   - Render the 16 presets as explicit accessible swatch buttons, then provide `UColorPicker format="hex"` for arbitrary custom colors, likely inside a Nuxt UI popover.
   - Reuse the component for both client and project forms; keep one canonical preset list and hex validation.
   - Ensure the chosen color is visible, keyboard reachable, and announced with an accessible label/value.

3. **Resilient project creation**
   - Model loading, request failure, empty active-option state, invalid preselected option, and successful submission separately for every client/project/release picker in the affected forms.
   - Disable submission until a valid active option is selected for each required picker.
   - Give every empty picker a clear contextual state and a relevant create link (for example, no clients → create client; no projects → create project); never render a dead blank select.
   - Preserve intended form state when navigating back, exclude archived options, and handle stale query selections safely.

4. **Minimal archive filter control**
   - Replace the text-labelled `Show archived` checkbox rows on clients/projects (and any equivalent hierarchy list) with an icon-only accessible control near the page header.
   - Use a tooltip and `aria-label`/screen-reader text to preserve discoverability and accessibility.
   - Keep the filter state behavior and active/archived query semantics unchanged.

5. **Effect v4 domain boundaries**
   - Introduce Effect v4 RC schemas for client/project/release request payloads and shared color/name/date values, using `Schema.decodeUnknownEffect` at untrusted API boundaries.
   - Introduce typed tagged domain errors for validation, unauthenticated access, not-found, and deletion conflicts; map them centrally to HTTP responses without losing useful messages.
   - Move the repeated ownership/visibility and mutation decision flow into Effect-based domain services or helpers, so each endpoint makes success and failure outcomes explicit while continuing to use Drizzle for persistence.
   - Keep Nitro handlers thin: decode input, run the Effect program, map its typed outcome, and serialize the response.
   - Confirm every Effect v4 API against the installed RC declarations and official v4 docs before implementation; do not copy v3 `Either`/`catchAll` patterns.

## Files to modify

- `server/db/schema.ts`
- `drizzle/0002_*.sql` and `drizzle/meta/0002_snapshot.json`
- `server/domain/` (new Effect schemas, errors, and hierarchy service/helpers)
- `server/utils/domain.ts` and/or API handlers to use the typed domain boundary
- `server/api/clients/**`, `server/api/projects/**`, `server/api/releases/**`
- `app/components/ColorSelector.vue` (new shared preset + custom picker)
- `app/components/ArchiveFilterButton.vue` (new accessible icon control, if reuse warrants it)
- `app/pages/clients/{index,new,[id]/index,[id]/edit}.vue`
- `app/pages/projects/{index,new,[id]/index,[id]/edit}.vue`
- `tests/unit/**` for Effect schemas/errors and color selection logic
- `tests/e2e/auth-shell.test.ts` or a focused M2 browser test for client colors, presets, every empty picker state, stale selections, and archive control
- `docs/decisions/0005-m2-domain-validation-and-ui-polish.md` if the Effect boundary becomes a durable architecture decision
- `docs/milestones/m2-core-data-model.md` with implementation and verification evidence

## Reuse

- Existing client/project CRUD and archive query behavior in `server/api/clients`, `server/api/projects`, and `server/api/releases`.
- Existing hex validation in `server/utils/domain-validation.ts`, migrated into Effect Schema/refined values rather than duplicated.
- Existing `UColorPicker` with `format="hex"`; Nuxt UI v4 docs show it supports format/modelValue but not the currently passed `swatches` prop.
- Existing Nuxt UI `UPopover`, `UButton`, `UTooltip`, `UCheckbox`, `UAlert`, `UFormField`, and `USelect` conventions.
- Better Auth session lookup and ownership relationships established in M2.

## Decisions and constraints

- Preserve M2 archive semantics: parent archive hides descendants without changing descendant rows.
- Client and project colors remain six-digit hex values; no new color format or theme system.
- Presets are explicit UI controls, not an unsupported `UColorPicker` prop.
- No dependency upgrade or new validation library; use the installed Effect v4 RC.
- Do not make clients/projects selectable when archived or unavailable.
- Keep hard deletion rules unchanged.

## Steps

- [ ] Step 1: Confirm the exact client color default/backfill and inspect installed Effect v4 Schema/error APIs and Nuxt UI component APIs.
- [ ] Step 2: Add the client color schema/migration and Effect domain schemas/errors/services with unit coverage.
- [ ] Step 3: Refactor client/project/release API boundaries to use typed Effect outcomes and add client color support.
- [ ] Step 4: Build the shared preset/custom color selector and update client/project create/edit forms.
- [ ] Step 5: Add resilient no-client/stale-selection states and replace archive text rows with accessible icon controls.
- [ ] Step 6: Run focused/full verification, update milestone evidence/ADR if needed, and prepare for human code review.

## Verification

- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `pnpm check:workflow`

Manual/browser checks:

- Create and edit a client with each preset and a custom hex color; confirm the color is persisted and shown in the client UI.
- Create a project with preset/custom colors; confirm the selector visibly renders all 16 presets.
- With zero active clients/projects, confirm every affected picker explains its prerequisite and links to the relevant creation page without offering a dead submit path.
- With stale/archived query selections, confirm every affected form remains usable and requires a valid active selection.
- Verify archive filtering uses an icon-only control with tooltip and accessible name on clients/projects.
- Verify validation, unauthenticated, not-found, conflict, and database failure paths produce intentional typed outcomes and stable HTTP responses.
