# M48 — Remove E2E tests

## Context

The human will test application behavior manually and requested removal of all E2E tests and their supporting tooling.

## Approved scope

[Focused plan](../../plans/remove-e2e-tests.md), approved by the human in Plannotator `pn-471e98`. Approval authorizes implementation, not code acceptance or completion.

## Out of scope

Application behavior, runtime safeguards, schema, remaining quality gates, production deployment, remote CI, and unrelated M45/M47 work. No replacement browser framework.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`.
- Approved focused plan; ADRs 0041, 0050, 0062; completed M47 journal.

## Approach

Delete the browser suite and its exclusive tooling; keep unit/component tests and shared auth/database fixtures. Replace current browser-verification requirements with human-owned manual testing while retaining automated non-browser checks.

## Files to modify

Exact inventory is in the approved plan: E2E directory/config, dependencies/lockfile, CI, obsolete exclusions, current guidance/templates, ADR metadata/index, roadmap, and this journal.

## Reuse

Retain Vitest, Better Auth Test Utils, disposable PostgreSQL verification, existing quality commands, and human approval gates.

## Decisions and ADR links

[ADR 0064](../decisions/0064-manual-application-testing.md) records the human-approved policy, superseding browser-specific requirements of ADRs 0041, 0050 and 0062 while preserving their history.

## Implementation checklist

- [x] Human plan approval.
- [x] Remove E2E tests, tooling, dependencies, CI steps and obsolete configuration.
- [x] Update current guidance and durable decision without rewriting history.
- [x] Run final-worktree checks and record outcomes/limitations.
- [x] Human code review.
- [ ] Human completion declaration.

## Journal

### Build — 2026-10-27

- Authority: human approved the saved plan in `pn-471e98`.
- Initial Git state: only `plans/remove-e2e-tests.md` untracked; no tracked modifications. No Git writes or user-service management.
- Confirmed `server/utils/auth-test.ts` has a retained unit-test caller; keep it and PostgreSQL CI support. No runtime application change is needed.
- `.jscpd-baseline.json` contains opaque fingerprint counts, no file paths. Preserve it rather than regenerate/guess which surviving fingerprints to remove.
- Shell has no global `pnpm`; use the installed `node_modules/.bin/pnpm` (12.8.1) via a PATH prefix. Node is v26.12.1, within the declared Node >=24 range.

### Implementation evidence

- Removed all 39 tracked E2E files (10,805 lines) and `playwright.config.ts`; removed direct `@playwright/test`/`playwright` dependencies, the E2E script, Chromium installation/execution/diagnostics from CI, Vitest's obsolete E2E exclusion, and browser-artifact ignores. No changes to `app/`, `server/`, `shared/`, unit/component tests, or the duplication baseline.
- Used pinned pnpm 12.8.1 to remove dependencies. Lockfile diff contains only removal of the direct dependencies and three browser packages (`@playwright/test`, `playwright`, `playwright-core`), with no version upgrades.
- Preserved inherited ignored browser artifacts by moving `playwright-report/` and `test-results/` to `/tmp/btt-m48-verify/inherited-playwright-report/` and `/tmp/btt-m48-verify/inherited-test-results/` before removing ignores. No historical evidence was deleted.
- Updated current agent/workflow/milestone/template/README guidance and roadmap. ADR 0064 records the human-approved policy; ADR 0041/0050 status metadata and ADR 0062's narrow supersession metadata point to it. Historical decision bodies, milestone evidence, plans and reviews remain unchanged. M45/M47 status and ADR 0063 acceptance are untouched.
- Search of live source/config (`app server shared scripts tests .github package.json vitest.config.ts knip.json .gitignore .dockerignore .oxlintrc.json`) finds no Playwright imports, environment variables, deleted-suite paths or E2E command. Lockfile retains only Vitest's optional `@vitest/browser-playwright` peer declaration/metadata, not an installed Playwright package; do not hand-edit dependency metadata.
- No broader runtime simplification is justified: retained Knip gate passes and the shared auth fixture has a live unit-test caller.

## Verification

Logs: `/tmp/btt-m48-verify/`. New agent-owned container `btt-m48-verification` uses installed `postgres:18`, loopback port 55448 and isolated database `btt_m48`. Explicit `DATABASE_URL` targets only this disposable database; auth environment uses test-only values. Existing user databases on 5432/5433 and application servers were not used or managed. No app server was started.

All approved checks passed on the implementation worktree, without retries or timeout changes:

- `pnpm install --frozen-lockfile` — exit 0; lockfile up to date, no resolution changes.
- `pnpm db:migrate` — exit 0; committed migrations apply to the isolated database.
- `pnpm format:check`, `pnpm lint`, `pnpm check:duplicates`, `pnpm check:unused` — exit 0. Duplication scan retains 38 baseline clones; baseline unchanged.
- `pnpm typecheck`, `pnpm typecheck:tsgo` — exit 0.
- `pnpm test` — exit 0, 20 files / 109 tests passed, including retained database-backed auth coverage.
- `pnpm build` — exit 0. Non-fatal Rolldown plugin-timing warnings report JavaScript callback cost; no build failure.
- `pnpm check:workflow`, `git diff --check` — exit 0.

Each command log is named after the command with spaces/colons replaced by hyphens. No E2E, remote CI or manual application testing was run; human manual results remain pending. Final verification rerun and disposable database release are recorded below.

### Final rerun and handoff

- Repeated all twelve approved commands above after the evidence update: all exit 0; final Vitest remains 20 files / 109 tests. Logs use `final-` prefixes. No required checks failed in either run.
- After all checks passed, stopped only `btt-m48-verification` with `docker stop` (retained, not removed). `lsof -nP -iTCP:55448 -sTCP:LISTEN` reports no listener; disposable database port released. User services untouched.
- Comparison scope for human review: all unstaged changes plus the three new files (approved plan, ADR 0064 and M48 journal) against HEAD `e6757a8993e573ba519a302274deb380a5865f10`. No staged changes or Git writes. This is Build self-inspection/check evidence, not an independent Review report.
- Human code review, manual application testing and milestone completion remain pending. No application behavior change or manual result is claimed.

### Finalize

- Human approved the cleanup diff in Plannotator `pn-161b56`: code review completed, no changes requested.
- Human replied **“yes”** to skipping optional UI review and finalizing bookkeeping. This authorizes recording those decisions, not a milestone completion declaration or manual test results.
- Recorded human code acceptance and optional UI skip; updated the roadmap status. ADR 0064 remains Accepted based on the approved policy plan. No application changes, Git writes, server management or application checks rerun during Finalize.
- Finalize documentation checks: `pnpm format:check`, `node scripts/check-workflow-docs.mjs`, and `git diff --check` pass. Manual application testing and an explicit human milestone completion declaration remain pending. Prior Build verification evidence above is unchanged; no independent Review report is claimed.

## Review status

- Plan review: Approved in `pn-471e98`.
- Independent review: Not performed; no report claimed.
- Human code review: Approved in `pn-161b56`, no changes requested.
- Optional UI: Skipped by human direction.
- Milestone completion declaration: Pending.

## Follow-ups

Human manual smoke testing: authentication, navigation/search, hierarchy/ticket lifecycle and status/priority, Agenda gestures/correction/delete, Reports, Settings, and keyboard/modal behavior. No results are claimed. Browser regressions will no longer be covered by CI.

## Closeout checklist

- [x] Approved implementation scope complete.
- [x] Verification evidence recorded.
- [x] Human code review accepted.
- [ ] Human completion declaration recorded.
