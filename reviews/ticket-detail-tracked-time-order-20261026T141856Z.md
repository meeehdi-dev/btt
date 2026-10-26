# Ticket detail tracked-time ordering — independent Review

What this change does: Moves the existing Tracked time card below the External links and Related tickets row on ticket detail. Adds empty/populated layout checks to the existing browser test without changing time-entry behavior.

## Scope reviewed

- Created UTC: 2026-10-26T14:18:56Z. Repository: `/Users/mehdi/code/btt`.
- Reference: `/Users/mehdi/code/btt/plans/ticket-detail-tracked-time-order.md` (read completely). Evidence: `docs/milestones/m25-ticket-detail-overhaul.md`.
- Branch: `main`; HEAD/base: `ad75a9b622799f438a93e6c7adf974d92ed599d4`.
- Comparison: all current uncommitted changes against HEAD. No staged changes. Three modified tracked files: `app/pages/tickets/[id]/index.vue`, `tests/e2e/ticket-detail-overhaul.test.ts`, `docs/milestones/m25-ticket-detail-overhaul.md`. Read the pre-existing untracked plan as input, not as a defect. No branch-history review.
- Connected code: complete ticket detail page, `TicketTimeEntries.vue`, existing time-entry browser coverage, installed Nuxt UI Card DOM, Playwright configuration, unit-test configuration/setup, and relevant sibling layout sections. Relevant governance/ADRs 0040, 0057, and 0062 inspected.
- Assumed load: the roadmap's solo work workspace; this is a markup relocation with no changed query, mutation, or concurrency behavior.
- Scope rechecked after checks: same three modified files and untracked plan; no unexpected tracked changes. This report is the only Review-authored artifact. No source/config/journal edits or Git writes.

## Findings

No actionable findings within the reviewed scope.

### Plan compliance

- The unchanged component invocation now follows the two-column links/relations grid and stays outside it, preserving full width and all three props. Description, cards, actions, and styles are otherwise unchanged.
- The existing test explicitly uses 1280 × 900. It measures card containers via the installed Card component's actual `data-slot="body"` parent structure, not heading positions alone.
- Retrying checks cover Description above both cards, same-row/non-overlapping links and relations, and tracked-time top/width/alignment below both. They run before and after link/relation creation, with both modals explicitly absent for the latter check.
- Existing history/correction/deletion/archive coverage remains intact. No new fixtures, dependencies, or shared abstractions were introduced.
- M25 records evidence and the human-directed browser deferral without claiming browser success or changing historical acceptance.

### Deferrals and separate concerns

- The saved plan's initial pending-approval wording is historical; M25 records subsequent approval and Build authorization. It is not evidence of missing approval by itself.
- Browser execution and visual inspection were explicitly deferred by the human for this task. This is not a passing result and does not alter standing workflow policy.
- Lint emits two existing warnings in unchanged `tests/e2e/ticket-context-popovers.test.ts:254,257`; no errors. No actionable change-specific concern established.

## Verification reviewed

Independently executed, all successful (exit 0), against this worktree:

- `pnpm format:check` — all matched files formatted.
- `pnpm lint` — no errors; two unrelated warnings noted above.
- `pnpm typecheck` — Nuxt/Vue typecheck passed.
- `pnpm typecheck:tsgo` — supplemental TypeScript check passed.
- `pnpm test` — 20 files / 109 tests passed; this command excludes browser tests.
- `pnpm check:workflow` — structural documentation check passed; script inspected first (read-only existence/heading validation).
- `git diff --check` — passed.
- `git status --short`, `git diff --numstat` — scope unchanged after checks.
- `lsof -nP -iTCP:3018 -sTCP:LISTEN` and `lsof -nP -iTCP:55439 -sTCP:LISTEN` — no listeners (expected exit 1 for each). No services started or stopped by Review.

Historical Build evidence, not independently rerun: isolated migration, duplication/unused-code checks, and production build. M25 reports their success; inspected available migration/build/unit log evidence under `/tmp/btt-tracked-order-verify/`. No database or migration was needed for the independent static/unit checks above.

Read `/tmp/btt-tracked-order-verify/focused.log`: all three selected browser tests failed before their bodies ran because Chromium headless shell revision 1243 is absent. This verifies the reported environment blocker, not the UI. Per the explicit task-specific human deferral, Review did not install browsers, rerun focused/full E2E, or inspect a live app/screenshot. The screenshot call has not executed. Runtime locator correctness, final browser geometry, and visual appearance therefore remain unverified.

## Recommendation and fresh-session handoff

Verdict: Ship, subject to human code review and the explicitly accepted verification gap. This is a recommendation, not human acceptance or milestone completion.

Open human diff review for uncommitted changes against the exact HEAD above. Ask the human to verify the comparison is Uncommitted, not branch history; saved UI preferences must not silently broaden it. This report and the input plan are workflow artifacts, not additional application changes.

After an explicit human review decision, ask UI (optional, using a separately user-managed app) or Finalize. Route either with original plan `/Users/mehdi/code/btt/plans/ticket-detail-tracked-time-order.md` and preserve the browser/visual limitation. A corrective Plan, if requested, must revalidate feedback rather than assume a defect. No automatic Build or acceptance is authorized.

Not checked: focused/full browser execution and desktop visual inspection (human-directed deferral); build/migration/duplicate/unused checks were not independently rerun.
