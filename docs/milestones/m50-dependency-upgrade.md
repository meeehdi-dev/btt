# M50 — Dependency upgrade (November 2026)

Status: Implementation and automated verification complete. Human code review, manual application testing, and the completion declaration are pending.

## Context

The user asked to upgrade all dependencies. This follows the Node 26 / cooldown upgrade (`30071fc`, [ADR 0065](../decisions/0065-node-26-and-release-cooldown.md)).

## Approved scope

[Focused plan](../../plans/dependency-upgrade-2026-11.md), approved by the human in Plannotator `pn-bf45c7` with no annotations. It upgrades direct dependencies to the newest version that is at least 7 days old and refreshes transitive dependencies. Effect 4.1 is included. `@nuxt/ui` 4.13.0 and `@vue/test-utils` 2.6.0 are left to Dependabot because they are still in cooldown.

## Out of scope

h3 2.x and TypeScript 7 (held by ADR 0065), versions still in cooldown, Node/Docker base image/Dependabot/Actions changes, new or removed dependencies, and app behavior changes.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`.
- ADRs [0034](../decisions/0034-pnpm-v12-package-manager.md), [0060](../decisions/0060-pnpm-dependabot-tracking.md), [0064](../decisions/0064-manual-application-testing.md), [0065](../decisions/0065-node-26-and-release-cooldown.md).

## Requirements and acceptance criteria

See R1–R5 in the approved plan: targets applied with exact pins, lockfile refreshed under the cooldown, pnpm version aligned everywhere, all retained checks pass, and no behavior change.

## Risks and stop conditions

From the plan: Effect 4.1 API changes, Better Auth schema/auth changes, vue-tsc regressions, oxlint/oxfmt churn, new build-script approvals. None of these happened (see journal).

## Approach

Applied in the plan's five groups, running checks after each one. Exact versions were installed with `pnpm add -E`; the transitive refresh used `pnpm update` without `--latest`.

## Files to modify

`package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.github/workflows/check.yml`, `Dockerfile`, this file, `PLAN.md`, and the approved plan's status.

## Reuse

Existing scripts and the CI contract; ADR 0060's exact-version `allowBuilds` entry.

## Decisions and ADR links

No new ADR. The existing ADR 0065 holds and cooldown apply unchanged.

## Implementation checklist

- [x] Human plan approval (`pn-bf45c7`).
- [x] Re-check target ages at Build time (2026-11-20 ~20:50Z): unchanged from the plan.
- [x] Group 1: pnpm 12.16.1 → 12.20.0 in `devDependencies`, `packageManager`, CI, both Dockerfile lines, and `allowBuilds`.
- [x] Group 2: oxlint 1.93.0, oxfmt 0.78.0, knip 6.45.1, jscpd 5.4.3, vue-tsc 3.3.14, @types/node 26.6.6, @iconify-json/lucide ^1.2.154.
- [x] Group 3: nuxt 4.6.4, vue 3.5.45, vue-router 5.5.1, vite 8.3.8, @vitejs/plugin-vue 6.0.11, vitest 5.1.0.
- [x] Group 4: effect 4.1.4; better-auth and @better-auth/drizzle-adapter 1.7.22.
- [x] Group 5: `pnpm update` transitive refresh; `package.json` unchanged by it.
- [x] Review the lockfile diff.
- [x] Final retained checks.

## Journal

### Implementation

- Fact: no source file changes were needed. oxfmt 0.78.0 made no formatting changes, oxlint 1.93.0 reported no new warnings, and vue-tsc 3.3.14 typechecks cleanly.
- Effect 4.0.7 → 4.1.4: read the `packages/effect/CHANGELOG.md` entries for 4.0.8–4.1.4. The breaking changes affect `KeyValueStore`, `McpServer`, `FileSystem`, `ChildProcess`, AI modules, `Schema.TaggedUnion.match` type arguments, `ConfigProvider` env snapshotting and codegen. The app imports only from the `effect` root, and none of those APIs is referenced in `app`, `server`, `shared` or `tests` (grep). Typechecks and tests passed.
- Better Auth 1.7.14 → 1.7.22: read the release notes for v1.7.15–v1.7.22. They contain no schema migration. The behavior changes are in plugins and options this app does not use (admin, organization, OAuth provider, SCIM, MongoDB, `sendVerificationEmail`, `discoveryHeaders`, passkeys). The app uses only the Drizzle adapter plus GitHub social sign-in (`server/utils/auth.ts`). Relevant fixes include revoked-session handling, cookie expiry on revoke, and a Nuxt `deferSessionRefresh` 415 fix.
- Lockfile review: `allowBuilds` packages are unchanged apart from pnpm (esbuild 0.18.20/0.25.12/0.27.7/0.28.2, vue-demi 0.14.10). No new build-script approvals were requested. New package names include platform optional binaries (`@pnpm/exe.netbsd-x64`, `@rolldown/binding-wasm32-wasi`, `@rollup/rollup-android-x64`) and transitive `@volar/language-service`, `vscode-languageserver-*`, `bare-buffer`, `@isaacs/nonrecursive-glob-match`. `pnpm update` warns about the existing deprecated `@esbuild-kit/*` subdependencies, which were already in the lockfile before this change.

## Verification

Final worktree, 2026-11-20. Logs are in `/tmp/btt-final-*.log`.

- `pnpm install --frozen-lockfile` — passed.
- Disposable DB: container `btt-m50-verify` (`postgres:17`, `--rm`, loopback port 55432, database `nxmr`). `DATABASE_URL=postgres://postgres:postgres@localhost:55432/nxmr` was set for every command below.
- `pnpm db:migrate`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm check:duplicates`, `pnpm check:unused`, `pnpm test` (21 files, 127 tests), `pnpm build`, `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs` — all exit 0. The build emitted the existing non-fatal `PLUGIN_TIMINGS` warning. The duplication baseline is unchanged.
- `git diff --check` — passed.
- Cleanup: `docker stop btt-m50-verify` (removed through `--rm`), and `lsof -iTCP:55432 -sTCP:LISTEN` shows no listener. The user's existing containers were not touched, and no app server was started.
- Not run: `docker build .` for the Dockerfile pnpm line (optional in the plan). CI will exercise the CI pin.

Human manual application testing: pending. Suggested cases from the plan: GitHub sign-in/sign-out and session persistence; board, ticket detail, agenda drag, and reports load and save; CI run on the PR passes.

## Review status

- Plan review: Approved (`pn-bf45c7`).
- Human code review: Pending.
- Milestone completion declaration: Pending.

## Fresh-session handoff

- Approved input: `/Users/mehdi/code/btt/plans/dependency-upgrade-2026-11.md`.
- Next: human diff review (or independent Review), then manual testing. Git writes remain human-owned.

## Follow-ups

- `@nuxt/ui` 4.13.0 and `@vue/test-utils` 2.6.0, plus the newer patches still in cooldown, are left to Dependabot.
- h3 2.x and TypeScript 7 remain held by ADR 0065.

## Closeout checklist

- [x] Approved checklist complete.
- [x] Final verification evidence recorded and disposable database cleaned up.
- [ ] Human code review accepted.
- [ ] Human completion declaration recorded.
