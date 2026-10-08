# M31 — Project name and header navigation

> **Status: Complete — implementation and verification passed, Plannotator code review accepted, and the human declared M31 complete on 2026-10-08.**

## Context

The current project/package name and visible sign-in/header wordmark are `nxmr`. The human requested renaming the project to `btt` and removing the `nxmr` branding from the authenticated header so the navigation menu appears first.

### Observed facts

- `package.json` identifies the package as `nxmr`; the README heading and sign-in page also show `nxmr`.
- `app/layouts/dashboard.vue` renders an `nxmr` home link immediately before the existing “Agenda, Tickets, Clients” navigation.
- The current package lock has no project-name entry under its root importer.
- `README.md`, `.env.example`, `Dockerfile`, `.github/workflows/check.yml`, auth defaults, and ADR 0003 document the deployed host, database names, or other existing `nxmr`-based operational identifiers.
- Accepted ADR 0035 records the prior `nxmr`-plus-navigation header decision. M23 and other completed records document historical implementation context.
- The working tree was clean when this plan was prepared.

## Approved scope

**Approved via Plannotator on 2026-10-08 with no annotations.**

- Adopt the lowercase project name `btt` in current, user-facing project identity: `package.json`, the README title, and the sign-in page label.
- Remove the `nxmr` home/brand link from the authenticated header. Keep the existing navigation as the first visible content in the left header block; preserve its destinations, order, keyboard shortcuts, accessible name, and the search/account blocks.
- Add a focused browser assertion that the header has no project wordmark and begins with the existing navigation; cover the updated sign-in label.
- Add a current-name note to `PLAN.md` without rewriting completed milestone descriptions that preserve historical context.
- Record the durable current-name/header decision in a new ADR 0045, mark ADR 0035 as superseded only for the left-block wordmark clause, and update the ADR index.
- Record implementation and verification evidence in this milestone file.

## Out of scope

- Renaming the GitHub repository, local checkout directory, production hostname, OAuth callback URL, Coolify configuration, or any external service.
- Changing database names/URLs, schema, migrations, auth/session behavior, secrets, CI service configuration, Docker runtime configuration, internal MIME types, test fixture identifiers, or legacy browser-storage keys.
- Replacing navigation/search/account behavior, changing page routes or keyboard shortcuts, or redesigning other parts of the header.
- Rewriting accepted milestone/ADR history or making a blanket search-and-replace of historical `nxmr` references.
- Dependency changes or lockfile edits unless package-manager verification demonstrates they are required; no dependency changes are expected.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`
- `docs/milestones/m23-three-block-header-navigation.md` — accepted three-block shell behavior
- `docs/milestones/m30-agenda-toolbar-and-timeline-polish.md` — current shell/viewport context
- `docs/decisions/0035-three-block-header-navigation.md` — current header decision to partially supersede
- `docs/decisions/README.md` — ADR index and conventions
- `package.json`, `README.md`, `app/layouts/dashboard.vue`, `app/pages/login.vue`
- `tests/e2e/auth-shell.test.ts`

## Approach

1. Keep the change limited to the current product/package label and the requested removal of the header wordmark. Use the existing layout and navigation component; do not add a replacement logo or home link.
2. Update the package name, README title, and sign-in label to `btt`. Leave operational identifiers and deployed URLs unchanged unless the human approves a separate deployment/repository rename and supplies any needed new hostname/slug.
3. Remove only the wordmark link from the left header block. Keep the navigation list as the first content in that block and preserve the search and account blocks unchanged.
4. Extend `auth-shell.test.ts` to assert the wordmark is absent and navigation is present as the left block's first content. Assert the sign-in page identifies the project as `btt`.
5. After plan approval, add the concise current-name note to `PLAN.md`, create ADR 0045, mark only ADR 0035's wordmark clause superseded, and update the index.
6. Run focused and project quality checks; inspect the authenticated header and sign-in screen at the supported 1280px desktop width. Record exact outcomes here.

## Files to modify

- `package.json` — rename package metadata to `btt`.
- `README.md` — update the project heading; retain the existing production host/callback documentation.
- `app/pages/login.vue` — show `btt` as the sign-in page identity.
- `app/layouts/dashboard.vue` — remove the wordmark link and let the menu appear first.
- `tests/e2e/auth-shell.test.ts` — cover the login identity and wordmark-free header/menu placement.
- `PLAN.md` — note the current project name without altering historical milestone descriptions.
- `docs/decisions/0035-three-block-header-navigation.md` — record partial supersession of the wordmark clause only.
- `docs/decisions/0045-btt-project-name-and-header.md` — new durable naming/header decision.
- `docs/decisions/README.md` — index ADR 0045 and update ADR 0035's status.
- `docs/milestones/m31-project-name-and-header-navigation.md` — implementation journal and closeout evidence.

No API, server, schema, migration, deployment, or dependency files are planned.

## Reuse

- Reuse the existing `navigation` data, `<nav aria-label="Main navigation">`, and three-block header in `app/layouts/dashboard.vue`; remove only the adjacent wordmark link.
- Reuse the existing authenticated-shell fixture and responsive geometry assertions in `tests/e2e/auth-shell.test.ts`.
- Preserve ADR 0035's search, account-control, shortcut, and logout decisions; only the brand-link clause is proposed for supersession.

## Decisions and ADR links

- Human direction: use `btt` instead of `nxmr` and show the header menu directly without the `nxmr` brand.
- Decision: update active project/package identity while retaining existing deployment/repository/database identifiers and completed historical records. No new production domain or external infrastructure changes were assumed.
- ADR 0045 is Accepted and establishes `btt` as the current product/package name and the authenticated header's navigation-first, wordmark-free left block. ADR 0035 remains authoritative for all unaffected header behavior.

## Open questions and tradeoffs

- This plan does not change `https://nxmr.meeehdi.dev`, its GitHub OAuth callback, or the GitHub repository slug. If “rename the project” is also intended to rename production/repository identifiers, approve that separately and provide the desired new hostname/repository slug before any such changes.
- Historical `nxmr` references remain in accepted milestone/ADR records by design; those references describe what was approved and implemented at the time.

## Implementation checklist

- [x] Human reviews and approves this plan before implementation (Plannotator, 2026-10-08).
- [x] Rename the current package/readme/sign-in identity to `btt`.
- [x] Remove the header wordmark and show the existing navigation first without changing destinations, order, shortcuts, search, or account controls.
- [x] Add focused browser assertions for sign-in identity and the wordmark-free header.
- [x] Update `PLAN.md` and ADR records within approved scope.
- [x] Run and record project checks and visually inspect at 1280px.
- [x] Submit the full diff for human code review and address feedback (Plannotator approved with no changes requested on 2026-10-08).
- [x] Record the human completion declaration before marking M31 complete.

## Journal

### 2026-10-08 — Plan preparation

- Fact: `package.json`, the README heading, the sign-in page, and authenticated header currently use `nxmr`; the authenticated header's navigation is rendered immediately after a separate `nxmr` home link.
- Fact: existing production hostname/OAuth, local database defaults, CI/Docker database names, internal identifiers, and completed history also contain `nxmr` references.
- Human direction: rename the project to `btt` and remove the header brand so the menu is shown directly.
- Proposed decision: update active product/package identity and remove only the header wordmark; preserve operational identifiers and historical records unless the human separately approves changes to those external/deployed identities.
- Evidence: read the workflow, roadmap, ADR 0035, M23/M30 milestone records, relevant package/readme/layout/login/test files, and ADR conventions. `git status --short --branch` reported a clean `main` worktree before this plan was created. No application code or roadmap/ADR records have been changed.

### 2026-10-08 — Plan review and approval

- Fact: Plannotator returned `{"decision":"approved","annotationCount":0}` for this milestone plan.
- Decision: M31 is approved within the scope above.
- Evidence: opened `docs/milestones/m31-project-name-and-header-navigation.md` with `plannotator annotate docs/milestones/m31-project-name-and-header-navigation.md --gate --json`.

### 2026-10-08 — Implementation and verification

- Fact: changed `package.json`, the README heading, and sign-in label to lowercase `btt`; removed the `nxmr` home link so Main navigation is the sole direct child/content of the authenticated header's left block. Search/account controls, navigation destinations/order, shortcuts, auth, and logout remain unchanged.
- Fact: added E2E assertions for the sign-in name, no `nxmr` wordmark, and navigation-first header. Updated `PLAN.md`, accepted ADR 0045, indexed it, and recorded ADR 0035's partial supersession for the wordmark clause only.
- Fact: no lockfile, deployment hostname/OAuth callback, repository slug, database, auth, schema, or dependency changes were made.
- Verification: focused auth-shell Playwright suite — 4/4 passed. Full E2E — 38/38 passed on both runs; the final post-review rerun emitted no browser-console warning. The initial full run logged a non-fatal Vite `ResizeObserver loop completed with undelivered notifications` message during an Agenda test. `pnpm format:check`, `pnpm lint`, both typechecks, `pnpm test` (13 files / 72 tests), `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and `git diff --check` passed. `pnpm build` passed with the existing non-fatal Rolldown `PLUGIN_TIMINGS` advisory.
- Manual visual check: inspected `/tmp/btt-header-review.png`, captured from the authenticated app at 1280×900. Main navigation appears first with no wordmark; centered search and direct account controls remain. The Agenda content was still in its loading state at capture time, so the review was limited to the header. The temporary screenshot is outside the repository.
- Implementation deviation: none. Code review was accepted below; the human completion declaration is recorded below.

### 2026-10-08 — Code review

- Fact: Plannotator returned `{"decision":"approved","message":"# Code Review\\n\\nCode review completed — no changes requested."}` for the full uncommitted diff.
- Decision: code review is accepted with no changes requested. M31 remains open until the human completion declaration is recorded.
- Evidence: `plannotator review --git --diff-type uncommitted --no-git-remote-check --json`.

### 2026-10-08 — Completion declaration

- Human completion declaration: “i declare this milestone complete.”
- Decision: M31 is complete; the approved scope, verification, and human code review are recorded above.
- Evidence: the human completion declaration in this conversation.

## Verification

Planning checks:

- [x] `node scripts/check-workflow-docs.mjs` — passed after plan creation and again after implementation.
- [x] Human plan review via Plannotator — approved on 2026-10-08 with no annotations.

Implementation checks (after approval):

- [x] `pnpm exec playwright test tests/e2e/auth-shell.test.ts --workers=1 --timeout=60000` — 4/4 passed; covers the sign-in identity and menu-first header.
- [x] `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test` (13 files / 72 tests), `pnpm test:e2e --workers=1 --timeout=60000` (38/38), `pnpm build`, `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and `git diff --check` — passed. E2E logged a non-fatal Vite ResizeObserver loop message during an Agenda test; build logged the non-fatal Rolldown `PLUGIN_TIMINGS` advisory.
- [x] Manual visual inspection at 1280×900: `/tmp/btt-header-review.png` confirms no header wordmark, the navigation menu appears first, and search/account controls remain. The Agenda content was loading at capture time; only the header was evaluated. The test assertion verifies sign-in displays `btt`.
- [x] Final `pnpm format:check`, `pnpm lint`, `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and tracked/untracked whitespace checks — passed after recording the implementation evidence.

## Review status

- Plan review: Approved via Plannotator on 2026-10-08 with no annotations.
- Code review: Approved via Plannotator on 2026-10-08; no changes requested.
- Milestone completion declaration: Recorded on 2026-10-08; M31 complete.

## Follow-ups

- Production hostname/repository rename, if desired, requires a separately approved plan with the new external identifiers.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred.
- [x] Verification evidence recorded.
- [x] Human code review accepted.
- [x] Human completion declaration recorded in the journal and review status.
