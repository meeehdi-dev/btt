# M44 amendment plan — Consistent hierarchy detail presentation

> **Status: Approved via Plannotator session `pn-880e5d` on 2026-10-14.** This amendment follows M44's detail-page spacing refinement and remains within the current open M44 milestone. Implementation, verification, and code-review evidence are recorded in the M44 journal.

## Context

The prior M44 detail-page refinement set 8px padding on attached Project, Release, and Ticket cards on the three detail routes, but the `/clients` collection still renders `ClientCard` with `EntityCard`'s compact 4px default. The same desired presentation was applied page-by-page, allowing siblings to drift. The detail pages also repeat the same field-grid and divider layout.

Relevant facts:

- `ClientCard`, `ProjectCard`, Release cards, and Release-detail Ticket cards use the shared `EntityCard` shell (`app/components/EntityCard.vue`, ADR 0022).
- `EntityCard` currently defaults to `padding="compact"`; `TicketBoardCard` explicitly passes `padding="compact"` and should remain compact under ADR 0042.
- Client/project/release detail pages repeat the same 2-column field grid and separator, while their field behavior, errors, and attached-item content are page-specific.
- M44 is still open pending the human completion declaration. Its existing implementation and code reviews are complete.

## Approved scope

1. Standardize the hierarchy card surfaces at 8px padding through the existing shared `EntityCard` component:
   - Make standard padding the default for entity/hierarchy cards, so `/clients`, client detail, project detail, and release detail use the same 8px inset.
   - Preserve compact padding for Ticket Board cards through their existing explicit `padding="compact"` setting. Do not alter their content density or interactions.
   - Remove now-redundant per-page `padding="standard"` overrides and the optional padding plumbing on `ProjectCard` if the shared default makes it unnecessary.
2. Add shared detail-section components for client/project/release details. They will own the repeated field-grid dimensions, divider and feedback/items slot ordering, plus the common Client/Project name-color field presentation. Keep draft state, mutations, page-specific errors/dialogs, and attached-card content in their existing page owners.
3. Add durable agent workflow guidance in `AGENTS.md` and `docs/llm-workflow.md`: for UI changes on one of several similar surfaces, inspect sibling surfaces, determine whether rendering should match, prefer a shared presentation component for genuinely repeated structure, and verify parity with tests. Avoid forcing common behavior where interaction/domain semantics differ.
4. Record the approved amendment and evidence in M44. Add ADR 0057 for the durable cross-sibling UI consistency workflow, keeping it Proposed until code review and accepting it after approval.
5. Add browser assertions that `/clients` Client cards and the client/project/release detail attached-card surfaces all render at 8px, while Ticket Board cards remain at 4px; retain assertions for the shared detail grid/divider and existing behaviors.

## Out of scope

- Changing ticket board card density, Agenda/time-entry cards, ticket content, card navigation/action ownership, or any domain behavior.
- Changing API, schema, authentication, ownership, validation, dependencies, or deployment.
- Broadly consolidating entity-specific card content or mutation logic into a generic page component.
- Rewriting unrelated historical milestone scopes or changing the M44 human-completion gate.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, and `PLAN.md`
- Current M44 plan and journal: `docs/milestones/m44-entity-modals-inline-editing-and-action-toasts.md`
- ADR 0022 — shared entity-card presentation shell
- ADR 0042 — desktop-only UI and compact spacing system
- ADR 0056 — entity modal creation, inline editing, and action toasts
- `docs/templates/milestone-template.md` and `docs/templates/adr-template.md`

## Approach

1. Make `EntityCard` the single source for standard 8px entity-card padding and preserve compact padding as an explicit presentation choice for the Ticket Board.
2. Extract the repeated detail-page section layout into focused slot-based components, including the Client/Project name-color fields. Keep business logic, draft state, page-specific async states, and interaction semantics in each page.
3. Add the sibling-surface audit/shared-component principle to the concise root agent instructions and the canonical workflow, and write ADR 0057 documenting its scope and exception for intentionally different interactions.
4. Extend existing E2E coverage for card padding and detail-section parity, then run every approved M44 check including the full browser suite and the 1280 CSS px visual review.
5. Update the M44 journal and submit the full amended worktree for Plannotator code review. Do not declare M44 complete without the human completion declaration.

## Files to modify

- `app/components/EntityCard.vue`
- `app/components/HierarchyDetailSections.vue`
- `app/components/HierarchyNameColorDetailSections.vue`
- `app/pages/clients/index.vue`
- `app/pages/clients/[id]/index.vue`
- `app/pages/projects/[id]/index.vue`
- `app/pages/releases/[id]/index.vue`
- `tests/e2e/hierarchy-card-metrics.test.ts`
- `tests/e2e/auth-shell.test.ts`
- `AGENTS.md` and `docs/llm-workflow.md`
- New `docs/decisions/0057-sibling-ui-consistency-and-shared-presentation.md` and `docs/decisions/README.md`
- `docs/milestones/m44-entity-modals-inline-editing-and-action-toasts.md`

No server/API/schema/migration/dependency changes are expected.

## Reuse

- `EntityCard` as the presentational entity-card shell (ADR 0022).
- Explicit compact Ticket Board card padding from `TicketBoardCard.vue`.
- Existing 1280px browser fixtures and hierarchy card assertions in `tests/e2e/hierarchy-card-metrics.test.ts` and `tests/e2e/auth-shell.test.ts`.
- Existing M44 local check sequence and agent-owned server handoff procedure.

## Decisions and ADR links

- User instruction: fix the missed `/clients` card padding and prevent rendering drift among similar hierarchy/detail surfaces through shared components and workflow guidance.
- Existing durable card ownership remains governed by ADR 0022; the shared shell must not absorb entity data or interaction semantics.
- Existing spacing targets and compact Ticket Board exception remain governed by ADR 0042.
- Accepted ADR 0057 defines the sibling-surface audit and shared-presentation rule without requiring identical rendering where interactions intentionally differ.

## Implementation checklist

- [x] Obtain human approval of this amendment before implementation via Plannotator session `pn-880e5d` on 2026-10-14.
- [x] Standardize hierarchy entity-card padding at 8px through `EntityCard`; retain explicit 4px Ticket Board padding.
- [x] Extract the repeated hierarchy detail field-grid/divider/items layout and Client/Project name-color editor into shared presentation components; keep page-specific state and behavior local.
- [x] Update `/clients` and all related detail pages to use the common presentations.
- [x] Update workflow guidance; propose/index ADR 0057 and accept it after code review.
- [x] Add browser assertions for consistent 8px entity-card padding, reuse the existing compact Ticket Board assertion, and verify detail layout parity.
- [x] Run all approved M44 non-browser checks, focused E2E, full Playwright, visual review, and workflow-document checks on the final worktree.
- [x] Record implementation and verification results in the M44 milestone.
- [x] Submit the amended final worktree for human code review; Plannotator session `pn-a396bd` approved with no changes requested.
- [ ] Keep M44 open until the human completion declaration.

## Journal

### 2026-10-14 — Amendment approved, implemented, and verified

- Fact: the prior refinement changed attached-card padding on the three detail routes but left the `/clients` collection on `EntityCard`'s compact default.
- User direction: sibling surfaces should render consistently, use common components to avoid duplication, and the workflow should require checking similar pages.
- Decision: use the shared `EntityCard` standard 8px default, retain explicit compact Ticket Board padding, and share the hierarchy detail field/divider/items layout. Client/Project name-color field rendering is also shared; page-owned draft state, saves, errors, and interactions stay in the detail pages.
- The human approved this amendment through Plannotator session `pn-880e5d` on 2026-10-14.
- Fact: an early duplicate check flagged repeated Client/Project field markup; the final shared component extraction removed the new clone. Final `pnpm check:duplicates` reports only 98 baseline clones and no new clones.
- Fact: the first focused E2E attempt against a dev server started without sourcing ignored `.env.development.local` failed with 401s. Re-starting the agent-owned verification server with `loadEnv('development')` made the correct local DB/auth configuration available; focused and full E2E then passed. No application auth/data code changed for this environment correction.
- Manual review: at 1280×900, inspected `/clients`, client detail, project detail, and release detail screenshots. The client list card uses 8px padding, attached hierarchy cards use the same 8px inset, fields align, dividers separate editors/items, and the surfaces fit without horizontal overflow. Temporary screenshots: `/tmp/m44-clients-consistency-1280.png`, `/tmp/m44-client-detail-consistency-1280.png`, `/tmp/m44-project-detail-consistency-1280.png`, and `/tmp/m44-release-detail-consistency-1280.png`.
- The final non-browser and full browser suites passed, and agent-owned app ports 3000–3003 are released. The isolated Postgres container on port 55432 remains running for `.env.development.local`.
- Plannotator code review session `pn-a396bd` approved the amended worktree on 2026-10-14 with no changes requested. ADR 0057 is Accepted.
- M44 remains open pending the human completion declaration.

## Verification

- [x] `pnpm format:check` — passed.
- [x] `pnpm lint` — passed with two existing warnings.
- [x] `pnpm typecheck` and `pnpm typecheck:tsgo` — passed.
- [x] `pnpm check:duplicates` and `pnpm check:unused` — passed; 98 baseline clones and no new clones.
- [x] `pnpm test` and `pnpm build` — 16 files / 79 unit tests passed; production build passed.
- [x] `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and `git diff --check` — passed.
- [x] Focused card/detail E2E tests (6 passed) and full `PLAYWRIGHT_SKIP_DEV_SERVER=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3002 pnpm test:e2e --workers=1 --retries=0` (52 passed; no retries or timeout increases).
- [x] 1280 CSS px visual review of `/clients`, client detail, project detail, and release detail; verified Ticket Board's compact card remains unchanged.
- [x] Stopped only agent-owned app servers after all checks passed and verified ports 3000–3003 were released; retained the isolated Postgres container on port 55432.

## Review status

- Plan review: Approved via Plannotator session `pn-880e5d` on 2026-10-14.
- Code review: Accepted via Plannotator session `pn-a396bd` on 2026-10-14; no changes requested.
- M44 completion declaration: Pending

## Follow-ups

- None proposed.
