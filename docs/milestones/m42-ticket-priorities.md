# M42 — Ticket priorities on Board, Agenda, and ticket forms

> **Status: Complete — the user declared M42 complete on 2026-10-12. Verification and Plannotator code review passed; the user approved the final Board/Agenda visual preview.**

## Context

The Ticket Board currently groups tickets into fixed status lanes and exposes status changes from each card's status icon. The Week Agenda also exposes ticket status changes from each entry. Ticket detail is the normal edit surface (ADR 0040/M25), and `/tickets/new` is the create form. The user requests optional ticket priority, changeable from Board cards, Agenda entries, and both create/edit surfaces, with priority ordering on the Board and compact icon-only presentation on Board/Agenda.

### Confirmed facts

- `server/db/schema.ts` stores ticket status as a PostgreSQL enum and has no priority field. Existing tickets therefore need a nullable additive schema change; `NULL` can represent no priority without rewriting existing rows.
- `server/domain/schemas.ts`, `server/api/tickets/index.post.ts`, and `server/api/tickets/[id].patch.ts` define ticket create/update validation and persistence. Ticket PATCH responses and list/detail reads include the selected ticket row.
- `server/api/tickets/index.get.ts` currently orders all ticket lists with estimated tickets first, then `createdAt DESC`, then `id DESC` (ADR 0028). The Ticket Board groups that response by status while retaining the response order within each lane.
- `app/components/TicketBoardCard.vue` renders its context row with the hierarchy badges at the left. `TodayAgendaEntry.vue` renders a context row with Agenda hierarchy badges. Both can place an icon-only priority action immediately before those badges without changing the title/status row.
- `server/domain/agenda.ts` loads ticket status into the shared Agenda entry response; both Agenda API routes use this loader. `TodayAgendaEntry.vue` and `WeeklyAgenda.vue` pass status changes to `app/pages/agenda.vue`, which owns ticket writes and invalidation.
- `app/pages/tickets/new.vue` creates tickets through the existing POST API. `app/pages/tickets/[id]/index.vue` is the current detail/edit surface, with independently persisted status, estimate, and release fields; the retired `/tickets/:id/edit` route is not the normal edit surface.
- The local Lucide collection contains `signal-zero`, `signal-low`, `signal-medium`, and `signal-high`. The app supports light/dark styling.
- The worktree was clean on `main` before this planning artifact was created.

### User direction captured for review

- Priority is optional with only **Low, Mid, and High** levels. The user explicitly removed “On hold”; no such value is planned.
- No-priority tickets sort last, following High → Mid → Low → None. The user selected this order in Plannotator session `pn-ef22f6`; the existing ticket order is the tie-break.
- Use the Lucide `signal-*` family from zero through high. Priority icons are neutral for now; the user asked to defer priority-specific colors.
- Priority must be changeable from Ticket Board cards, Agenda entries, the ticket creation form, and ticket detail's inline fields. The Ticket Board and Agenda controls belong in the bottom context row immediately before their hierarchy badges (Agenda placement selected in Plannotator session `pn-4a1a33`).
- Show only the icon on Board/Agenda cards and entries, not a visible priority label. When a priority menu opens, its options show both the signal icon and the priority label, like the existing status menu. The create/detail form fields also show readable labels and icons.

## Approved scope

**Approved via Plannotator session `pn-0a93c6` on 2026-10-12.** Implemented scope:

**Visual amendment:** The later plan [`m42-priority-control-visual-refinement.md`](../../plans/m42-priority-control-visual-refinement.md) was approved via Plannotator session `pn-e73224` after user feedback in `pn-9f9eeb`. It supersedes only the original icon/trigger presentation choice; see Accepted ADR 0054.

- Add a nullable `priority` field to tickets with the fixed values `low`, `mid`, and `high`. `NULL` means no priority; existing tickets remain `NULL` after migration. No “on hold” value is included.
- Validate priority in ticket create/update APIs. Omitted priority leaves the existing value unchanged on PATCH; explicit `null` clears it. New tickets default to no priority unless selected in the create form.
- Add icon-only priority menus to Ticket Board cards and Agenda entries, each immediately before the hierarchy badges in its bottom context row. The card/entry display and closed trigger show only the neutral icon. When opened, the menu shows each signal icon alongside its label (`No priority`, `Low`, `Mid`, or `High`), like the existing status menu. Give triggers descriptive accessible names and retain keyboard, focus, busy, error, and retry behavior consistent with the existing status controls.
- Add an optional Priority field to `/tickets/new` and to the Ticket fields on `/tickets/:id`, the normal inline edit surface. These form selectors show readable option labels plus the matching icons, include an explicit No priority choice, and persist through the existing create/PATCH endpoints. Do not restore the retired `/tickets/:id/edit` route.
- Use these Lucide icons, all verified in the installed local collection:

  | State | Icon                   |
  | ----- | ---------------------- |
  | None  | `lucide:signal-zero`   |
  | Low   | `lucide:signal-low`    |
  | Mid   | `lucide:signal-medium` |
  | High  | `lucide:signal-high`   |

  Keep the icons neutral regardless of priority; do not add priority-specific colors in M42.

- Sort tickets **within each existing status lane** by priority, then preserve the current ticket order for equal priorities (estimated first, then newest `createdAt`, then descending ID). The approved rank is High → Mid → Low → None. Keep non-board ticket-list ordering and Agenda entry chronology unchanged.
- Add priority to the shared Agenda entry data returned from `server/domain/agenda.ts`, so Agenda entries can render and update the current ticket priority. The Agenda continues to represent historical time entries; priority itself remains a current ticket property, not a time-entry snapshot.
- Keep status controls, status lanes, drag-and-drop, archive/quiet-Done behavior, hierarchy actions, estimates, and tracked-time behavior unchanged.
- After plan approval, update `PLAN.md`, add/index a Proposed ADR 0053 for the durable priority model and Board ordering/presentation policy, and accept the ADR only after human code review. Record implementation and verification evidence here.

## Out of scope

- Any “On hold” priority, additional/customizable priorities, priority-specific workflows, or priority-specific color mapping. All priority icons remain neutral for now.
- Adding a visible priority label beside the icon on Board/Agenda cards or entries; labels remain visible inside the opened priority menu and in the create/detail form fields. Changing the existing status icon/menu, hierarchy badge, or time-entry presentation is also out of scope.
- Priority selectors on Release detail cards or global search. Ticket detail and the ticket create form are explicitly in scope; do not restore `/tickets/:id/edit`.
- Changes to ticket statuses, status transitions, API ownership/auth rules, archive lifecycle, quiet-Done visibility, time-entry/estimate behavior, dependencies, deployment, or CI policy.
- Persisted drag/manual ordering or priority-based ordering of other ticket collections or Agenda entries.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`, `docs/templates/adr-template.md`
- `docs/milestones/m25-ticket-detail-overhaul.md` and ADR 0040 — ticket detail is the normal edit surface; `/tickets/:id/edit` is retired
- `docs/milestones/m32-ticket-board-status-icons-cards-and-done-visibility.md` — compact Ticket Board card layout and supported-width expectations
- `docs/milestones/m34-agenda-board-status-icon-menus.md` — Board/Agenda status-icon menus, mutation, and accessibility patterns
- `docs/milestones/m35-nuxt-ui-color-theme.md` — existing semantic color policy; priority-specific colors are deferred
- `docs/milestones/m40-ticket-board-card-title-time-alignment.md`, `docs/milestones/m41-agenda-time-entry-ticket-autofocus.md` — recent Board/Agenda work and verification approach
- ADR 0028 (current ticket sort), ADR 0048 (Board/Agenda status icon menus), ADR 0050 (full E2E/server handoff), ADR 0051 (same-tab API invalidation)
- `docs/decisions/README.md`
- `server/db/schema.ts`, `server/domain/schemas.ts`, `server/domain/agenda.ts`, `server/api/tickets/index.get.ts`, `server/api/tickets/index.post.ts`, `server/api/tickets/[id].patch.ts`
- `shared/ticket-status.ts`, `shared/ticket-priority.ts`, `app/pages/tickets/index.vue`, `app/pages/tickets/new.vue`, `app/pages/tickets/[id]/index.vue`, `app/components/TicketBoardCard.vue`, `app/components/TicketPriorityMenu.vue`, `app/components/TicketStatusMenu.vue`, `app/components/TodayAgendaEntry.vue`, `app/components/WeeklyAgenda.vue`, `app/pages/agenda.vue`
- `tests/unit/domain-schemas.test.ts`, `tests/unit/tickets.test.ts`, `tests/e2e/tickets.test.ts`, `tests/e2e/ticket-detail-overhaul.test.ts`, `tests/e2e/ticket-status-moves.test.ts`, `tests/e2e/agenda-status.test.ts`, `tests/e2e/agenda-week.test.ts`

## Approach

1. Add a shared typed priority definition for `low`, `mid`, and `high`, the four display states including `None`, icon helpers, and the priority sort rank. Keep the nullable API/database value separate from its display label and icon.
2. Add a reusable `TicketPriorityMenu` for the Board and Agenda controls. Keep the card/entry display and closed trigger icon-only and neutral; when opened, show each priority's label and matching `signal-*` icon, like the status menu. Place it immediately before hierarchy badges on both surfaces, retaining compact Week entry geometry.
3. Add an optional Priority selector to the ticket creation form and the Ticket fields on ticket detail. Use readable option labels and signal icons, include No priority, default new forms to `NULL`, and persist independent field updates without changing the existing title/status/estimate/release semantics.
4. Add a nullable PostgreSQL ticket-priority enum/column and generate one additive Drizzle migration. Extend Effect request schemas and ticket create/PATCH persistence so only the three values or `null` are accepted. Preserve omitted PATCH fields and default new tickets to `NULL`.
5. Add the priority menu to `TicketBoardCard.vue` and `TodayAgendaEntry.vue`. Extend `server/domain/agenda.ts` and Agenda row types with ticket priority; forward priority-change events through `WeeklyAgenda.vue` to a new page handler in `app/pages/agenda.vue`. Persist changes through the existing ticket PATCH endpoint and refresh affected same-tab data using `invalidateMutation('ticket')`.
6. Sort within each Ticket Board status group by priority rank while preserving the API's existing order for ties. Do not change `/api/tickets` ordering used by other pages or the Agenda's chronological time-entry ordering.
7. Add unit/API/browser coverage for enum validation, `NULL` behavior and migration, create/detail form selection, priority writes and clearing from Board and Agenda, icon/menu contents, icon-only display, placement, keyboard access, failure/retry and cache refresh, Board ordering/tie order, compact Week entry fit, and retained status/drag/archive behavior.
8. After approval, update the roadmap and add/index ADR 0053. Run the approved full local verification set, including full Playwright against an agent-owned server and isolated database, then record outcomes and handoff evidence here.

## Files to modify

- `shared/ticket-priority.ts` — typed priority values, labels, icons, and sort order.
- `server/db/schema.ts`, generated `drizzle/*.sql` and `drizzle/meta/*` — nullable priority enum/column and migration metadata.
- `server/domain/schemas.ts`, `server/domain/agenda.ts`, `server/api/tickets/index.post.ts`, `server/api/tickets/[id].patch.ts` — request validation, persistence, and Agenda entry projection.
- `app/components/TicketPriorityMenu.vue` (new) — shared accessible icon-only Board/Agenda selector/menu.
- `app/components/TicketStatusMenu.vue` (new) — behavior-preserving extraction of the existing Board/Agenda status menu to avoid duplicated control markup while priority controls were added.
- `app/pages/tickets/index.vue`, `app/components/TicketBoardCard.vue` — within-lane sorting, Board update/error/refresh handling, and the card selector.
- `app/pages/agenda.vue`, `app/components/WeeklyAgenda.vue`, `app/components/TodayAgendaEntry.vue` — Agenda mutation/event flow, priority data, and entry selector.
- `app/pages/tickets/new.vue` — optional priority selection on ticket creation.
- `app/pages/tickets/[id]/index.vue` — optional priority field on the normal inline ticket edit surface.
- `tests/unit/ticket-priority.test.ts` (new), `tests/unit/domain-schemas.test.ts`, `tests/unit/tickets.test.ts` — priority mapping, ordering, and validation coverage.
- `app/utils/ticket-patch.ts` (new) — shared typed client PATCH helper used by Board and Agenda priority actions.
- `tests/e2e/ticket-priority.test.ts` (new), `tests/e2e/agenda-status.test.ts`, `tests/e2e/ticket-detail-overhaul.test.ts`, and focused updates to existing ticket Board/API E2E coverage — persistence, menu, forms, sort, placement, and regressions.
- `PLAN.md`, `docs/decisions/README.md`, new `docs/decisions/0053-ticket-priorities.md`, and this milestone file.

Release detail and global search are not planned to change.

## Reuse

- Reuse the existing ticket `POST /api/tickets` and `PATCH /api/tickets/:id` endpoints and Effect schemas; add no endpoint or cache mechanism.
- Reuse the ticket create-form patterns in `app/pages/tickets/new.vue` and the field-scoped write/error/retry pattern in `app/pages/tickets/[id]/index.vue` for priority form fields.
- Reuse the icon-only `UDropdownMenu` and current-status/checkmark behavior from the Board/Agenda status controls; centralize priority options and signal icons in the shared menu and form option data.
- Reuse `loadAgendaEntries` in `server/domain/agenda.ts` for both Agenda API routes, adding the ticket priority to its existing joined projection.
- Preserve the response order from `server/api/tickets/index.get.ts`; stable sorting within each status group ensures the existing estimate/creation/ID ordering is the tie-break.
- Reuse existing Week Agenda compact sizing and card interaction guards; preserve the supported 1280 CSS px floor and fixed time-grid geometry.
- Reuse the isolated migration, authenticated Playwright fixtures, local quality gates, and agent-owned server handoff policy from M40/M41 and ADR 0050.

## Decisions and ADR links

- User direction: optional Low/Mid/High priorities only; no “On hold” value. The user selected High → Mid → Low → None for Ticket Board ordering in Plannotator session `pn-ef22f6`.
- User direction: priority is changeable from Board cards, Agenda entries, ticket creation, and ticket detail. Agenda priority control belongs in the bottom context row before hierarchy badges, selected in Plannotator session `pn-4a1a33`.
- User direction: use `signal-zero`, `signal-low`, `signal-medium`, and `signal-high` for None/Low/Mid/High. The user deferred state-specific colors; all priority icons stay neutral in M42. Board/Agenda card displays and closed triggers are icon-only; opened menu choices show the label and icon like the status menu.
- Implemented schema: nullable `ticket_priority` enum, with `NULL` for no priority and no backfill. The additive SQL is in `drizzle/0010_cultured_spacker_dave.sql` and was applied to the isolated M42 database.
- Approved scope: priority display/control on Board, Agenda, ticket creation, and ticket detail only; Release detail and global search remain unchanged.
- Durable product/model, edit-surface, and ordering policy was initially recorded in ADR 0053. Accepted ADR 0054 supersedes its icon/trigger choice only and reaffirms the other M42 decisions. Existing ticket ordering from ADR 0028 remains the tie-break and remains authoritative outside the Board.

## Implementation checklist

- [x] Incorporate all first-, second-, and third-round Plannotator feedback and obtain explicit approval of the revised plan before implementation (`pn-0a93c6`).
- [x] After approval, update `PLAN.md` and add/index Proposed ADR 0053.
- [x] Add the nullable priority model/migration and validated create/PATCH behavior; verify existing tickets remain `NULL`.
- [x] Add the shared neutral icon selector to Board cards and Agenda entries in the approved locations; implement the approved visual amendment with minus/chevron icons, a borderless ghost trigger, and no manual positioning.
- [x] Add optional priority controls to the ticket creation form and the detail page's inline Ticket fields; support setting and clearing the priority.
- [x] Sort within status lanes High → Mid → Low → None and preserve current order for ties.
- [x] Add unit, API, and browser regression coverage for values, null, ordering, accessibility, Board/Agenda/form updates, failures/retries, and existing interactions.
- [x] Run migration, focused and full E2E, all required local checks, and 1280 CSS px review; record exact commands/results below.
- [x] Stop agent-owned server/database and verify their ports are released before code review.
- [x] Submit the initial implementation for human code review and accept ADR 0053 after review.
- [x] Obtain approval of the priority icon visual-refinement plan and implement its approved icon/trigger revision.
- [x] Submit the user-requested visual refinement for final-diff human review; Plannotator approved with no changes.
- [x] Record the user's completion declaration before closing M42.

## Journal

- Fact: the ticket table has no priority column; ticket create/update Effect schemas currently accept status and estimate but not priority. A nullable enum addition can represent existing/new no-priority tickets without backfilling values.
- Fact: the shared ticket GET ordering is estimated-first, then `createdAt DESC`, then `id DESC`; Board lane grouping preserves that order. Priority sorting can remain Board-only by sorting each lane and using the existing order as the tie-break.
- Fact: the Board card context starts with hierarchy badges. `loadAgendaEntries` joins ticket status for both Agenda routes; `TodayAgendaEntry` renders each entry's status action and `WeeklyAgenda` forwards it to the Agenda page's write handler.
- Fact: `/tickets/new` posts through `TicketCreate`. Ticket detail is the normal edit surface and applies field-scoped PATCH updates; its fields currently include status, estimate, and release.
- Fact: verified the local Lucide collection contains `signal-zero`, `signal-low`, `signal-medium`, and `signal-high`. No UI code or data model currently assigns priority colors.
- Evidence: read the required workflow, roadmap, relevant decisions/milestones, schema, APIs, Board/Agenda components, ticket creation/detail pages, tests, ADR/milestone templates, and project instructions. `git status --short --branch` was clean before writing this file. No source code, database, roadmap, or ADR was changed.

### 2026-10-12 — First Plannotator review feedback

- Decision: incorporated the user's direction to make priority changeable from Agenda entries as well as Ticket Board cards.
- Decision: replaced the proposed arrow/equal icons with the verified Lucide signal family: zero, low, medium, high.
- Decision: removed priority-specific colors from this milestone; priority icons will use neutral styling. Color design is deferred.
- Decision: the user answered the first plan's ordering question: High → Mid → Low → None. That answer is incorporated; no ordering question remains.
- Evidence: Plannotator session `pn-ef22f6` returned three annotations and the High → Mid → Low → None answer. The plan was revised before implementation; no application code changed.

### 2026-10-12 — Second Plannotator review feedback

- Decision: place the Agenda priority icon/menu in the bottom context row immediately before hierarchy badges, matching the Board placement.
- Decision: include priority controls in both the ticket creation form and ticket detail's inline Ticket fields, in addition to Board and Agenda. Ticket detail is the normal edit surface under ADR 0040/M25; do not restore the retired `/tickets/:id/edit` route.
- Evidence: Plannotator session `pn-4a1a33` answered the Agenda-placement question and annotated the plan to add creation and editing support.

### 2026-10-12 — Third Plannotator review feedback

- Clarification: Board/Agenda cards and entries display only the priority icon. Opening the selector shows each option's label alongside its signal icon, like the status menu; create/detail form selectors also show labels.
- Evidence: Plannotator session `pn-92f245` requested this distinction. The plan was revised before final approval; no application code had changed.

### 2026-10-12 — Final plan approval

- Decision: Plannotator approved M42's revised scope: optional Low/Mid/High priority; High → Mid → Low → None sort order; signal-zero/low/medium/high icons; neutral icons with no priority-specific color; Board, Agenda, create-form, and ticket-detail edit controls; icon-only Board/Agenda display with labels shown in the open menu; and the Agenda control before its hierarchy badges.
- Evidence: Plannotator session `pn-0a93c6` approved this file on 2026-10-12. Planning checks passed before submission. No application implementation had started at approval time.
- Status: implementation is authorized within this scope. No unresolved plan questions remain.

### 2026-10-12 — Approved scope documentation

- Fact: added the M42 roadmap summary to `PLAN.md` and drafted/indexed Proposed ADR 0053 as authorized by the approved plan.
- Evidence: the roadmap and ADR index now link to this milestone and the new proposed decision record. No application source or schema was changed in this documentation step.
- Status: implementation is beginning within the approved scope.

### 2026-10-12 — Implementation and verification

- Fact: added nullable PostgreSQL `ticket_priority` (`low`, `mid`, `high`), request validation, create/PATCH persistence, Agenda projection, shared menu/form helpers, Board-only stable priority sorting, and controls on Board, Agenda, ticket creation, and ticket detail. `NULL` remains the unset value; no “On hold” value or non-Board ordering changes were introduced.
- Evidence: generated migration `drizzle/0010_cultured_spacker_dave.sql` with `pnpm db:generate` and applied it with `pnpm db:migrate` to the agent-owned isolated PostgreSQL 17 database `btt_m42` on `127.0.0.1:55432`. Replayed the additive migration against a pre-priority ticket and confirmed the existing row retained `priority = NULL`.
- Evidence: Board ordering, including same-priority ties, is asserted against the API response order in `tests/e2e/ticket-priority.test.ts`. The test also covers create/PATCH validation and clearing, keyboard access, labels/icons, icon-only triggers, placement, Board mutation failure/retry, ticket create/detail fields, and Agenda mutation.
- Manual check: inspected Board and Week Agenda screenshots at a 1280 CSS px viewport (`1280 × 900`). High/Mid/Low/None ordering and existing tie order were correct; signal icons remained neutral; Board/Agenda controls preceded hierarchy badges; a compact 30-minute Week entry fit with priority and hierarchy controls visible.
- Deviation, implementation-only: extracted the existing status menu into `TicketStatusMenu.vue` without changing its behavior and consolidated duplicated early/late Agenda entry markup into one period loop. These small refactors preserved the approved status/Agenda behavior and prevented new clones after `pnpm check:duplicates` identified repeated event-forwarding markup.
- First-failure evidence: the first focused priority E2E run failed because `WeeklyAgenda.vue` did not forward the priority event through a generic `v-on` binding (`Expected: "mid", received null`). Replaced it with an explicit `@change-priority` handler and verified the fix with the focused E2E test and the complete suite. The duplicate check also caught one new clone from repeated early/late Agenda markup; consolidated those blocks into one period loop, after which `pnpm check:duplicates` passed with no new clones.
- Verification: `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm check:duplicates`, `pnpm check:unused`, `pnpm format:check`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and tracked/untracked whitespace checks all passed on the implementation. Unit tests: 16 files / 79 tests. Lint reported only the two existing `consistent-function-scoping` warnings at `tests/e2e/ticket-context-popovers.test.ts:254,257`; build completed with informational plugin-timing warnings.
- Browser verification: the focused priority Playwright test passed (1/1). The full suite passed (49/49, one worker, zero retries, 3.0 minutes) against the agent-owned server at `http://127.0.0.1:3000` and isolated `btt_m42` database. The server health endpoint returned `{"status":"ok"}` after production build.

### 2026-10-12 — Verification handoff

- Evidence: reran the full Playwright suite after the production build; all 49 tests passed with one worker and zero retries in 3.0 minutes.
- Evidence: after all checks passed, stopped agent-owned server launcher/listener PIDs `73747`, `73749`, and `73762`, and stopped container `btt-m42-postgres-20261012-pi`. Verified neither `127.0.0.1:3000` nor `127.0.0.1:55432` had a listener. No user-owned processes were stopped.
- Status: implementation verification and owned-process handoff are complete. Human code review and completion declaration remain pending.

### 2026-10-12 — Human code review

- Decision: Plannotator approved the implementation with non-blocking notes in session `pn-dc8ee0`. ADR 0053 was accepted and indexed after that review.
- Follow-up: the user wants to manually test the feature before declaring M42 complete or committing. The agent-owned test server and PostgreSQL container were stopped; the local development database must be migrated before starting `pnpm dev`.

### 2026-10-12 — User-requested priority-icon polish

- Decision: following the user's feedback that the bare priority icon looked odd, changed its Board/Agenda trigger to a compact, neutral outlined circle. It remains icon-only, uses the approved `signal-*` icons without priority colors, and stays before hierarchy badges.
- Scope: presentation-only; no data, API, ordering, or persistence behavior changed. The user explicitly requested this revision after the prior code review, so the revised diff will receive automated verification and another review before completion.
- Evidence: `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm format:check`, `pnpm lint`, `pnpm check:duplicates`, `pnpm check:unused`, and `pnpm test` all passed after this styling change. Unit suite: 16 files / 79 tests; lint retains the same two pre-existing warnings in `tests/e2e/ticket-context-popovers.test.ts:254,257`.
- Evidence: `pnpm build` passed with informational plugin-timing warnings. The focused priority E2E passed 1/1; the full Playwright suite passed 49/49 with one worker and zero retries in 5.3 minutes. `pnpm check:workflow`, workflow-doc structure, and whitespace checks passed.
- Manual visual check: inspected Board and Agenda at 1280 CSS px; the priority icon now has a visible neutral circular outline while remaining icon-only and fitting before hierarchy badges, including in the compact Week entry. The test now asserts the circular outline on both surfaces.
- Evidence: restarted the isolated M42 database and verified `pnpm db:migrate` succeeds, then stopped agent-owned server PIDs `85309`, `85310`, `85311`, `85324` and container `btt-m42-postgres-20261012-pi`. Confirmed `127.0.0.1:3000` and `127.0.0.1:55432` were released. Left the pre-existing BTT listener PID `84855` at `[::1]:3000` untouched.
- Status: automated verification is complete; final-diff human review and the user's manual test/completion declaration remain pending.

### 2026-10-12 — User screenshot: optical icon centering

- Fact: the user's screenshot showed that the `signal-zero` glyph was visibly low and left inside its circular trigger even though the button and icon viewport were flex-centered. The locally rendered Lucide signal glyphs are bottom-left anchored within a 24px viewBox, so centering the viewport did not center the visible mark.
- Decision/implementation: translate each closed-trigger glyph independently so its visible path bounds center within the circle (None/Low/Mid/High offsets are derived from the matching signal path geometry). The menu option icons and all persistence/data behavior are unchanged; Board/Agenda still show a neutral, icon-only control.
- Test: extended `tests/e2e/ticket-priority.test.ts` to verify the icon-state-specific translation for None, Low, Mid, and High, in addition to the circle/background and Board/Agenda placement assertions.
- First-failure evidence: the first revised browser assertion compared the translated icon span's bounding box with the button and correctly reported a 6.67px shift; that checks the CSS viewport, not the translated masked glyph. A subsequent attempt to inspect an SVG `<path>` found none because local Nuxt Icon renders the icons as CSS-mask `<span>` elements. Replaced those invalid assertions with per-state computed-transform and reconstructed visible-center checks. A final `pnpm check:duplicates` also caught duplicated center tables between the component and E2E test; expressed the test's four path centers as a compact progression formula, then reran the check successfully with no new clone.
- Manual visual check: inspected temporary Playwright screenshots of the Board and Week Agenda at 1280 × 900 CSS px. The None dot and signal bars appear centered in their outlined circles; the controls remain icon-only and fit before the hierarchy badges.
- Verification: `pnpm db:migrate`, formatting, lint, both typechecks, duplicate/unused checks, 16 unit files / 79 tests, build, workflow checks, and whitespace checks passed. Lint retained the two existing warnings at `tests/e2e/ticket-context-popovers.test.ts:254,257`; build emitted informational plugin-timing warnings. Focused priority E2E passed 1/1 and the latest full E2E suite passed 49/49 with one worker and zero retries (5.6 minutes).
- Handoff: after all checks passed, stopped only the agent-owned Nuxt server on `127.0.0.1:3001` and the isolated `btt-m42-postgres-20261012-pi` container. Confirmed ports 3001/55432 were released. Left the user-owned listener PID `93489` at `[::1]:3000` running.
- Status: final code review and the user's manual testing/completion declaration remain pending; no commit was made.

### 2026-10-12 — User direction: preserve the low signal baseline

- Decision: the user clarified that the signal glyph should not be vertically centered. Removed the vertical translation while retaining state-specific horizontal optical centering; Lucide's shared lower baseline now stays low within the circle.
- Test: `tests/e2e/ticket-priority.test.ts` checks horizontal path-center alignment within 0.5 CSS px, zero vertical translation, and a visible center below the button midpoint for None/Low/Mid/High on Board and Agenda.
- Manual visual check: inspected fresh 1280 × 900 CSS px Board and Week Agenda screenshots. The signal marks remain horizontally centered while visibly sitting below the circles' vertical midpoint.
- Verification: focused priority E2E passed 1/1; the full suite passed 49/49 with one worker and zero retries in 3.1 minutes. `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm build`, `pnpm test` (16 files / 79 tests), format/lint, duplicate/unused, workflow/documentation, and whitespace checks passed. Lint reported only the two pre-existing warnings; build reported informational plugin-timing warnings.
- Handoff: stopped only the agent-owned server at `127.0.0.1:3001` and isolated M42 database container after passing checks; verified both ports were released. The user-owned listener PID `93489` at `[::1]:3000` remained untouched.
- Status: final human review and user manual testing/completion declaration remain pending; no commit was made.

### 2026-10-12 — User-requested priority icon redesign

- Decision: replace the `signal-*` set with No priority `minus`, Low `chevron-down`, Mid `chevron-right`, and High `chevron-up`. Remove the outlined circular trigger and use a compact, neutral ghost button; add no glyph translations. The user selected the No priority and Mid glyphs in Plannotator feedback, then approved the complete plan in session `pn-e73224`.
- Implementation: updated the shared icon mapping used by menus/forms and removed all signal-path alignment math from `TicketPriorityMenu.vue`. Board/Agenda controls remain icon-only, accessible, and before hierarchy badges; menu/form labels and write behavior are unchanged.
- Tests: updated unit mapping assertions and browser checks for all four glyph names, no circular ring/border, and no computed transform. Existing persistence, ordering, keyboard, menu, form, and retry assertions remain.
- Manual visual check: inspected fresh Board and Week Agenda screenshots at 1280 × 900 CSS px. The plain icons remain visible, fit before hierarchy badges, and no longer have an outer circular outline. Screenshots: `/tmp/m42-priority-icons-board.png` and `/tmp/m42-priority-icons-agenda.png`.
- Verification: `pnpm db:migrate` passed; `pnpm format:check`, `pnpm lint` (two existing warnings at `tests/e2e/ticket-context-popovers.test.ts:254,257`), both typechecks, `pnpm test` (16 files / 79 tests), `pnpm build`, `pnpm check:duplicates` (baseline clones only), `pnpm check:unused`, workflow/documentation and whitespace checks passed. Build emitted informational plugin-timing warnings. Focused priority E2E passed 1/1; full E2E passed 49/49 with one worker and zero retries in 3.0 minutes.
- Decision record: after code-review approval, ADR 0054 is Accepted and supersedes ADR 0053's icon/trigger choice only; ADR 0053 remains as the historical record. Other M42 decisions are unchanged.
- User preview: the user reviewed the Board/Agenda screenshots in Plannotator session `pn-dea11f` and said they look good.
- Code review: final-diff review was approved with no changes requested in Plannotator session `pn-c212f0`.
- Handoff: after passing checks, stopped only the agent-owned server at `127.0.0.1:3001` and isolated M42 database; verified ports 3001/55432 were released. No user-owned process was signaled.
- Status: user manual app testing and completion declaration remain pending; no commit was made.

### 2026-10-12 — User completion declaration

- Decision: the user declared M42 complete in chat on 2026-10-12. This closes the previously pending manual-testing/completion gate; no separate local app/database test report was provided.
- Evidence: the user approved the final Board and Week Agenda screenshots in Plannotator preview session `pn-dea11f`; the final-diff code review was approved with no changes requested in session `pn-c212f0`; automated verification passed as recorded above.
- Status: M42 is complete. No commit was created; the user requested a commit message to commit/push the work themselves.
- Follow-up: apply `pnpm db:migrate` to any local development database that has not yet received the M42 migration before running `pnpm dev`.

## Verification

Planning artifact checks (before final review):

- [x] `node scripts/check-workflow-docs.mjs` — passed after the final plan revisions.
- [x] `pnpm exec oxfmt --check docs/milestones/m42-ticket-priorities.md` — passed after formatting.
- [x] `git diff --no-index --check /dev/null docs/milestones/m42-ticket-priorities.md` — no whitespace diagnostics.
- [x] Final Plannotator plan review — approved in session `pn-0a93c6` on 2026-10-12.

Implementation verification (after approval):

- [x] `pnpm db:generate` and `pnpm db:migrate`; inspect `drizzle/0010_cultured_spacker_dave.sql`. Replay the additive migration against a pre-priority ticket and confirm `priority = NULL` remains.
- [x] `pnpm format:check` — passed; `pnpm lint` — passed with two pre-existing warnings at `tests/e2e/ticket-context-popovers.test.ts:254,257`; `pnpm typecheck` — passed; `pnpm typecheck:tsgo` — passed.
- [x] `pnpm check:duplicates` — passed with no new clones; `pnpm check:unused` — passed; `pnpm test` — 16 files / 79 tests passed.
- [x] `pnpm build` — passed (informational plugin timing warnings only); `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, `git diff --check`, and untracked-file whitespace checks — passed.
- [x] After visual polish, focused priority Playwright — 1/1 passed. Full `pnpm test:e2e --workers=1 --retries=0 --reporter=line` — 49/49 passed in 5.3 minutes against the agent-owned app server and isolated `btt_m42` database.
- [x] Manually inspected the Board and Week Agenda at 1280 CSS px; confirmed signal icons, icon-only display, control placement before hierarchy badges, priority order/tie order, and compact 30-minute entry fit.
- [x] Stopped only the agent-owned Nuxt server and PostgreSQL container after all checks passed. Confirmed the agent-owned listeners on `127.0.0.1:3000` and `127.0.0.1:55432` were released. A pre-existing listener on `[::1]:3000` was left untouched.

## Review status

- Plan review: M42 approved via Plannotator session `pn-0a93c6`; the visual refinement plan was approved via `pn-e73224` after the user's icon mapping feedback in `pn-9f9eeb`.
- Code review: Prior implementation received non-blocking notes in Plannotator session `pn-dc8ee0`; latest final-diff review was approved with no changes requested in `pn-c212f0`.
- ADR 0053: Superseded by Accepted ADR 0054 for the icon/trigger choice only. All other M42 decisions are reaffirmed in ADR 0054.
- Automated verification of the simplified icon redesign: Passed (focused 1/1; latest full E2E 49/49).
- Final-diff human code review: Approved via Plannotator session `pn-c212f0` on 2026-10-12.
- User manual review: Approved final Board/Agenda screenshots in Plannotator session `pn-dea11f`; no separate local app/database test report was provided.
- Milestone completion declaration: Complete — the user declared M42 complete in chat on 2026-10-12.
- Commit: Not created; the user requested a one-line commit message to commit/push themselves.

## Follow-ups

- Apply `pnpm db:migrate` to any local development database that has not yet received the M42 migration before running `pnpm dev`.

## Closeout checklist

- [x] Approved checklist complete; the user explicitly declared the milestone complete.
- [x] Final verification evidence recorded for the simplified icon redesign.
- [x] Final human code review accepted.
- [x] Human completion declaration recorded in the journal and review status.
