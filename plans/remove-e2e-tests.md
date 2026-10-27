# Remove E2E tests and use human manual application testing

## Status and authority

Plan pending human approval. The human requests removal of all E2E tests and their supporting machinery, with manual application testing from now on. This changes dependency, CI, and workflow policy; implementation starts only after this plan is approved.

## Facts and sources

- Read `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`, ADRs 0041, 0050 and 0062, and the latest completed milestone journal M47. Git worktree is clean.
- `tests/e2e/` contains 39 test/helper files. `playwright.config.ts` and the `test:e2e` script configure execution; `package.json` declares both `@playwright/test` and `playwright`.
- `.github/workflows/check.yml` installs Chromium, runs E2E, and uploads browser diagnostics. Other checks include migration, format, lint, duplication, unused code, both typechecks, Vitest, build, and workflow docs.
- `vitest.config.ts` excludes E2E. `.gitignore`, `.dockerignore`, and `.oxlintrc.json` contain browser-artifact entries.
- `server/utils/auth-test.ts` is also used by `tests/unit/auth-session.test.ts`: keep it and Better Auth Test Utils. Do not remove PostgreSQL CI provisioning or migrations required by retained tests.
- Current workflow, templates, and milestone guidance mandate automated browser checks; ADR 0041 and ADR 0050 establish that policy, and ADR 0062 carries it forward.

## Requirements and acceptance

1. Delete all tracked E2E tests/helpers and Playwright configuration. Remove direct Playwright dependencies, the E2E script, and their now-unused lockfile entries without unrelated upgrades.
2. Remove Chromium installation, E2E execution, and browser diagnostic upload from CI. Keep all remaining quality gates and their needed database/auth environment.
3. Remove E2E-only config and artifact exclusions; inspect the duplication baseline and remove entries that belong exclusively to deleted files if needed, without resetting surviving fingerprints or weakening checks.
4. Simplify only code/config made unnecessary by E2E removal. Preserve shared auth fixtures, unit/component tests, runtime behavior, validation, security, accessibility, and existing application interactions.
5. Establish human manual application testing in current guidance. Agents continue running remaining automated checks, report manual coverage as pending unless the human supplies results, and never infer acceptance/completion. No agent-run browser suite or mandatory verification app server remains. Preserve user-owned server protection and optional UI's user-managed server rules.
6. Record the decision in a new ADR (next available number, currently 0064), superseding ADRs 0041/0050 and only the browser-verification clauses of ADR 0062. Update ADR status/index metadata while preserving historical decision text. Keep historical plans, reports, milestone evidence and commands intact; add a clear current-policy note rather than rewriting their past requirements.
7. Add M48 maintenance scope/evidence and a current-policy/roadmap entry. Do not close or otherwise change M45 or retroactively change M47 evidence/ADR acceptance.

## Approach and affected files

- Delete `tests/e2e/**` and `playwright.config.ts`.
- Edit `package.json`, `pnpm-lock.yaml`, `.github/workflows/check.yml`, `vitest.config.ts`, `.gitignore`, `.dockerignore`, `.oxlintrc.json`; inspect `.jscpd-baseline.json` for deleted-file records.
- Update `README.md`, `AGENTS.md`, `docs/llm-workflow.md`, `docs/milestones/README.md`, `docs/templates/plan-template.md`, `docs/templates/milestone-template.md`, `PLAN.md`, ADR index/status metadata, new ADR 0064 and `docs/milestones/m48-remove-e2e-tests.md`.
- Search all remaining live code/config for E2E-only references and imports. Delete additional code only if demonstrably exclusive to the removed suite; stop for approval if broader runtime changes are indicated.

## Ordered implementation

1. Record plan approval and create M48 journal.
2. Remove tests/config/dependencies and CI browser steps; regenerate lockfile with the pinned pnpm, without upgrades.
3. Remove obsolete exclusions and proven E2E-only support; retain shared auth/database support and all non-E2E tests.
4. Update current guidance and durable decision, explicitly separating automated checks from human manual testing.
5. Run final-worktree checks, record exact results and limitations in M48, and prepare human diff review. Do not commit, declare completion, or claim manual acceptance.

## Verification

- `pnpm install --frozen-lockfile`.
- Against an agent-owned disposable PostgreSQL database, run `pnpm db:migrate`, `pnpm format:check`, `pnpm lint`, `pnpm check:duplicates`, `pnpm check:unused`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test`, `pnpm build`, `pnpm check:workflow`, and `git diff --check` on the final worktree.
- Search live source/config for Playwright imports, commands, env vars and deleted-suite references. Historical documentation and unavoidable transitive/optional lockfile references are not active E2E tooling; explain any retained matches.
- Inspect the lockfile for unrelated changes and confirm retained tests still execute. Stop/release only disposable agent-owned verification resources after checks; do not start/stop the human's application server.
- No E2E execution: removing it is the purpose of this change. Human manual testing remains pending: GitHub sign-in/sign-out, navigation/search, hierarchy and ticket CRUD/status/priority, Agenda create/move/resize/correction/delete, Reports filters/periods, Settings, and keyboard/modal behavior. These are recommended smoke areas, not claimed results or a new automated suite.

## Risks, non-goals and stop conditions

- Deliberate tradeoff: CI will no longer catch browser integration, routing, gesture, accessibility, or visual regressions; human manual testing owns those checks. Unit/component coverage remains.
- No replacement browser framework, new dependency, generic refactor, domain/API/schema change, production deployment or remote CI run.
- Preserve database-backed unit authentication tests and their security boundaries. Ask before removing any runtime code or any remaining quality gate.
- Historical references to deleted tests are retained as evidence, not current instructions. No mass historical-doc cleanup.

## Planning evidence

Repository inspection and plan creation only; no application changes, dependency installation, test execution or server lifecycle operations performed. `node scripts/check-workflow-docs.mjs` and `git diff --check` pass. Plan approval and implementation verification are pending.
