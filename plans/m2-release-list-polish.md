# M2 follow-up — release archive filtering, dates, ordering, and done action

## Context

The project detail release list currently requests archived releases unconditionally, renders target dates as plain text, and orders releases by update time. The archive filter control also does not visually distinguish its active state. This follow-up makes release status and scheduling information scannable without changing the existing archive model.

Requested behavior:

- Archive filter icons visibly distinguish inactive/active state.
- Release lists use the same active/archived filter behavior as clients/projects.
- Target dates use a calendar icon with a localized full-date tooltip and compact relative text such as `in 7 days`.
- Releases without target dates show no date icon/text.
- Releases sort first by no target date, then by target date ascending, including overdue releases before future releases with a colored late indicator.
- Each release has a Done action that archives it.

## Approach

### Archive filter state

- Update the reusable `ArchiveFilterButton` to use a distinct active visual state (`primary`/soft or equivalent) and an active tooltip/accessible label such as `Hide archived`; keep the inactive state neutral with `Show archived`.
- Add a `showArchived` state to the project detail release list and pass it as the API query rather than always requesting `archived=true`.
- Default release lists to active releases. When enabled, include archived releases and show their archived badge.
- Preserve parent visibility rules: releases under archived projects/clients remain hidden by the existing API hierarchy constraints.

### Target-date presentation

- Add a shared date-display component/composable for release cards/details.
- Render nothing when `targetDate` is absent.
- Render a calendar icon with an accessible label and tooltip containing a localized full date using `Intl.DateTimeFormat`.
- Render compact relative text using the current local date and `Intl.RelativeTimeFormat`, including `in N days`, `N days ago`, `tomorrow`, or `today` where appropriate.
- Mark overdue dates with a semantic error/warning color on the icon; future/today dates use normal semantic colors.
- Keep the raw `YYYY-MM-DD` value as the API/storage representation.

### Release ordering and Done action

- Sort releases in the project detail list by a deterministic client-side comparator or an API order contract: no target date first, then target date ascending, with overdue dates naturally first within dated releases. Use a stable tie-breaker such as name or updated timestamp.
- Add a compact Done button to each release card. It should stop propagation so it does not navigate to the release detail page, ask for no extra form flow, PATCH `{ archived: true }`, and refresh the list.
- Only show Done for active releases. Archived releases retain restore/edit behavior through the existing detail/edit flow.
- Add pending/error feedback so a failed Done request leaves the release visible and explains the failure.

## Files to modify

- `app/components/ArchiveFilterButton.vue`
- `app/components/ReleaseTargetDate.vue` or `app/composables/use-release-date.ts` (new shared date presentation)
- `app/pages/projects/[id]/index.vue`
- `app/pages/releases/[id]/index.vue` if the detail view should use the same target-date presentation
- `server/api/releases/index.get.ts` only if the API order/query contract is moved server-side
- `tests/unit/**` for date formatting/order helpers
- `tests/e2e/auth-shell.test.ts` or a focused release browser test for filter state, sorting, date display, and Done
- `docs/milestones/m2-core-data-model.md` with evidence and follow-ups

## Reuse

- Existing `ArchiveFilterButton` used by client/project lists.
- Existing `ReleaseUpdate` Effect schema and `PATCH /api/releases/:id` archive mutation.
- Existing release cards and archived badges in `app/pages/projects/[id]/index.vue`.
- Nuxt UI `UTooltip`, `UIcon`, `UButton`, and semantic colors.
- Existing stored `release.targetDate` ISO date string and M2 archive visibility API behavior.

## Decisions and constraints

- “Done” means archive the release; no new status column is introduced.
- No database migration is expected.
- Relative dates are based on the user’s local calendar day, not elapsed 24-hour durations.
- Full date tooltip uses the browser locale; tests should assert meaningful structure/accessible text without assuming one locale’s exact wording.
- Releases without target dates remain first, as requested, even though many project-management lists place undated items last.
- Do not change M2 parent archive or permanent-delete rules.

## Steps

- [ ] Step 1: Confirm date wording, overdue color, stable tie-breaker, and archive-filter active-state design against the current UI and locale behavior.
- [ ] Step 2: Implement active/inactive archive filter visuals and reactive release-list filtering.
- [ ] Step 3: Implement shared target-date formatting, tooltip/icon presentation, and overdue styling.
- [ ] Step 4: Implement release sorting and the active-release Done/archive action with pending/error handling.
- [ ] Step 5: Add unit/browser coverage, run quality gates, and update milestone evidence.

## Verification

- `pnpm format:check`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`
- `pnpm check:workflow`

Manual/browser checks:

- Toggle archive filtering on a project detail page and verify the icon changes appearance and accessible label.
- Verify active release lists exclude archived releases by default and include them when enabled.
- Verify undated releases appear first, followed by overdue, today/near-future, and later dated releases.
- Verify targetless releases have no date icon; dated releases show relative text and a localized full-date tooltip.
- Click Done on an active release and verify it leaves the default list, appears with archive filtering enabled, and can still be restored.
- Verify failed Done requests preserve the release and show an actionable error.
