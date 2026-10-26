# Ticket detail: tracked time after links and relations

## Status and scope

Plan pending human approval. Presentation-only follow-up to [M25](../docs/milestones/m25-ticket-detail-overhaul.md); implementation evidence will be appended there. No implementation has started.

Request: on `/tickets/:id`, place the Tracked time section below the External links and Related tickets cards.

## Findings and approach

- `app/pages/tickets/[id]/index.vue` currently renders Description, `TicketTimeEntries`, then a two-column grid containing External links and Related tickets.
- Move the existing `TicketTimeEntries` invocation immediately after that grid. Preserve its props, full-width presentation, and all history/edit/delete behavior. Leave the two cards side by side and all other content unchanged.
- Extend the existing authenticated field-edit/link/relation test in `tests/e2e/ticket-detail-overhaul.test.ts`; explicitly set its viewport to 1280 × 900 because `playwright.config.ts` uses Desktop Chrome defaults rather than the supported minimum width. Assert layout initially with empty links/relations, then again after the existing test adds a link and a relation and both modals have closed. Reuse that test's setup and cleanup; no new scenario or time-entry fixture is needed.
- Measure the actual card containers, not only their headings: Description ends above both cards; External links and Related tickets occupy the same row without overlapping horizontally; the tracked-time card starts below both card bottoms and retains the description card's full-width alignment. Wait for the Tracked time heading/data and use retrying geometry assertions to avoid measuring transient refresh/layout states. Prefer existing DOM structure for locating the cards; add no test-only wrappers or shared helpers.
- Inspected the analogous Release detail grid in `app/pages/releases/[id]/index.vue`, creation sections in `app/components/TicketCreateForm.vue`, and related browser coverage in `tests/e2e/release-ticket-status.test.ts` and `tests/e2e/time-entries.test.ts`. Release detail lists ticket cards; ticket creation contains draft links/relations but no time history. Neither shares this history layout or needs changes. No shared component refactor is warranted under ADR 0057.
- `TicketTimeEntries.vue` has only one caller, this ticket-detail page. `tests/e2e/time-entries.test.ts` already covers displayed history, usage, correction/deletion, no creation action, and archived history. Preserve that coverage rather than duplicate its fixtures in the layout test.

## Files and non-goals

Change only the ticket detail template, its existing browser coverage, and M25 evidence. No changes to `TicketTimeEntries.vue`, callers elsewhere, fixtures, APIs, schema, dependencies, exports, settings, or card styling. No new ADR is needed for this ordering change. Preserve ADR 0040's history and correction behavior and ADR 0062's review gates.

## Steps and acceptance

1. Obtain approval of this plan.
2. Move the component invocation and add the focused browser assertion.
3. Run verification and record exact outcomes in M25.
4. Present the verified diff for human review; do not infer acceptance or milestone completion.

Acceptance: Description remains above the links/relations row; both cards remain side by side; Tracked time is below both and retains its existing controls and data.

## Verification

After approval, configure an isolated test database and run `pnpm db:migrate` against it; use that same database for the verification app and database-backed tests. Do not migrate or clean a user-owned database. Run `pnpm format:check`, `pnpm lint`, `pnpm check:duplicates`, `pnpm check:unused`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test`, `pnpm build`, `pnpm check:workflow`, and `git diff --check`. Run `pnpm test:e2e tests/e2e/ticket-detail-overhaul.test.ts tests/e2e/time-entries.test.ts` followed by the full `pnpm test:e2e` suite against an agent-owned app server using `PLAYWRIGHT_SKIP_DEV_SERVER=1` and an explicit `PLAYWRIGHT_BASE_URL` on a free loopback port. Configure the app's auth/base URL consistently with that origin. Inspect the resulting desktop layout at 1280px. Keep that server running through failures; stop it only after all required checks pass and verify its port is released. Never stop a user-owned server.

## Risks and stop conditions

Low-risk markup relocation; no persisted data changes. Moving the component changes the natural keyboard traversal order to match the requested visual order; preserve every control's accessible name and behavior. The regression assertion must compare card boundaries, not only heading order. Stop and ask if achieving this requires behavior, dependency, or unrelated layout changes. Existing M25 human review/completion status remains unchanged.

## Planning review and Build handoff

Static inspection confirmed the proposed relocation and narrow file scope. The plan was clarified to require an explicit supported-width viewport, actual card-boundary assertions in empty and populated link/relation states, and reuse of existing time-history regression coverage. No application files were changed; no tests, migrations, builds, browser checks, or services were run during planning. Runtime layout remains to be verified after approval.

After explicit human approval, Build should read this plan at `/Users/mehdi/code/btt/plans/ticket-detail-tracked-time-order.md`, the current M25 journal, and applicable project skills; implement only the template relocation and the existing-test extension; run every verification gate above on the final worktree; append exact evidence and any failures/deviations to M25 without changing its historical acceptance status; then hand the same plan to independent Review. Leave all Git writes to the human. Stop for approval if unrelated changes become necessary.
