# M2 — Core data model: clients, projects, releases

## Context

M2 is the first product-domain milestone after M1 authentication and the PostgreSQL/Drizzle foundation. It should establish the client → project → release hierarchy needed by M3 tickets and later time tracking, while leaving the authenticated shell working.

## Approach

- [x] Inspect the existing Better Auth/Drizzle schema, server API conventions, protected shell, and test helpers.
- [x] Define the M2 domain schema and ownership/authorization rules without adding ticket or time-entry tables.
- [x] Implement authenticated CRUD vertically for clients, projects, and releases, reusing shared validation and UI patterns.
- [x] Add responsive list/detail pages and focused unit/API/browser coverage.
- [x] Record any durable schema/API decisions in an ADR and update the M2 milestone journal with evidence.

Use one consistent authenticated server helper to obtain the current session through `auth.api.getSession({ headers: event.headers })`. Add route handlers for nested resources, validate request bodies at the boundary, and make archive/restore explicit mutations. List endpoints default to active records, accept an `includeArchived`/archive filter, and suppress descendants whose ancestors are archived. Dedicated pages should make hierarchy obvious: clients list/detail, client projects, project releases, and release detail; use breadcrumbs and links rather than introducing a separate global state layer.

## Findings

- `server/db/schema.ts` currently contains only Better Auth tables; product-domain tables and foreign-key conventions do not exist yet.
- `server/db/index.ts` exports a shared Drizzle PostgreSQL client with a single-connection pool; `drizzle.config.ts` targets `server/db/schema.ts` and committed SQL migrations.
- M1 protects pages with `app/middleware/auth.ts`, exposes `/projects` as an authenticated placeholder, and has Better Auth Test Utils helpers in `server/utils/auth-test.ts` used by Playwright.
- There are no existing product CRUD APIs or reusable domain form components to extend.
- Nuxt UI is already configured through `UApp`/`@nuxt/ui`; M2 should follow semantic colors and existing shell styling.

## Files to modify

- `server/db/schema.ts` — add client, project, and release tables/types, archive fields, ownership and foreign keys.
- `drizzle/XXXX_*.sql` — generated migration for the M2 tables/indexes.
- `server/api/clients/**`, `server/api/projects/**`, `server/api/releases/**` — authenticated CRUD endpoints, or an equivalent clearly separated server route structure.
- `server/utils/**` — shared session/ownership lookup and validation only where reuse is needed.
- `app/pages/projects.vue` and new `app/pages/clients/**`, `app/pages/projects/**`, `app/pages/releases/**` — dedicated list/detail/create/edit pages.
- `app/components/**` or `app/composables/**` — reusable entity forms, archive filters, and color palette/picker only where duplication warrants it.
- `tests/unit/**`, `tests/nuxt/**`, `tests/e2e/**` — schema/validation/API/UI coverage.
- `docs/milestones/m2-core-data-model.md` — milestone plan, journal, evidence, and closeout.
- `docs/decisions/0004-m2-core-data-model.md` — durable archive/schema decisions if confirmed.

## Reuse

- M1 Better Auth session and protected route patterns from `server/utils/auth.ts`, `app/middleware/auth.ts`, and `app/layouts/dashboard.vue`.
- Existing Drizzle schema/migration conventions from `server/db/schema.ts`, `drizzle.config.ts`, and `drizzle/0000_better-auth.sql`.
- Better Auth Test Utils setup from `server/utils/auth-test.ts` and `tests/e2e/auth-shell.test.ts`.
- Existing Nuxt UI shell and semantic styling from `app/layouts/dashboard.vue` and placeholder pages.
- Nuxt UI `UColorPicker` with `format="hex"` and `swatches` for the 16 presets plus custom color entry, per the v4 component guidance.

## Research references

- Better Auth server session lookup: <https://better-auth.com/docs/basic-usage>
- Nuxt UI v4 color picker: <https://ui.nuxt.com/docs/components/color-picker>

## Steps

- [x] Step 1: Confirm archive visibility and archived-parent selector behavior; finalize the domain contract.
- [x] Step 2: Add the approved domain schema, indexes, constraints, and migration.
- [x] Step 3: Implement authenticated server CRUD with ownership checks, archive/restore operations, archived filters, guarded permanent deletion, and validation.
- [x] Step 4: Implement dedicated client/project/release list, detail, create, and edit pages, including archive filters and the project color palette/custom picker.
- [x] Step 5: Add focused unit/API/browser coverage, run quality gates, and update milestone/ADR documentation.

## Verification

Automated coverage should include:

- schema/domain validation for names, optional target dates, archived timestamps, and hex colors;
- authenticated CRUD success paths and unauthenticated rejection;
- ownership isolation between two authenticated users;
- archive filters, parent-hidden descendant behavior, restore visibility, editable archived records, archive-before-delete enforcement, and parent deletion conflicts;
- browser coverage for dedicated CRUD pages, hierarchy navigation, project preset/custom colors, target-date optionality, and archive/restore controls.

Run:

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `pnpm check:workflow`

Manual check: create a client, add a project with a preset and custom color, add releases with and without target dates, inspect hierarchy, archive a parent without changing child archive fields, verify descendants disappear, restore the parent, edit archived records, confirm active records cannot be permanently deleted, permanently delete archived releases/projects in child-first order, and confirm another authenticated user cannot access them.

## Confirmed decisions

- Archiving is mandatory before permanent deletion for clients, projects, and releases; list views need an archived-items filter and archived records expose a permanent-delete action.
- Archiving a parent persists only that parent’s archived state. Descendants remain unchanged in the database.
- An archived parent hides its descendants in UI listings, detail navigation, and normal selectors. Restoring the parent makes descendants visible again unless they are independently archived.
- There is no cascade restore operation.
- Archived records remain editable and restorable.
- Permanent deletion is explicit and irreversible. A parent can be permanently deleted only when all descendants have already been permanently deleted; no automatic hard-delete cascade is introduced.
- Project colors use a mixed approach: approximately 16 default palette choices plus a custom color picker with validated values.
- Use dedicated CRUD pages for now rather than modal/inline CRUD.

## Proposed technical contract

- Use nullable `archivedAt` timestamps rather than a separate archive table; permanent deletion removes the row after the archive prerequisite is met.
- Scope clients directly to the authenticated Better Auth user; resolve project/release ownership through their parent relationships.
- Keep child foreign keys restrictive so parent deletion cannot bypass descendant cleanup; API conflicts explain which descendants must be deleted first.
- Server list/detail queries enforce both explicit archive filters and ancestor visibility; archived descendants are not returned while any ancestor is archived.
- CRUD endpoints require an authenticated session and return authorization-safe not-found responses for records outside the current user’s hierarchy.
- Archive and permanent-delete mutations are separate operations; permanent-delete rejects active records and parents with remaining children.
- Project color is stored as a validated CSS hex value; the UI offers 16 preset hex colors plus a native custom color input.

## Status

Plan draft — repository exploration in progress.
