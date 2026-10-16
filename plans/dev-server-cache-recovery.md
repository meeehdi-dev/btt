# Recover the BTT development server and remove old server processes

## Purpose and desired behavior

Restore the existing development command after a browser reported an internal server error loading an optimized Effect module from localhost port 3000. Remove the old BTT server processes that can serve the wrong project or compete over generated files. Verify one clean BTT development instance, then stop it so the user can run `pnpm dev` themselves on the released port.

This is local environment recovery, not an application bug fix or a new product milestone.

## Scope and non-goals

In scope:

- Gracefully stop the four identified old BTT development-server trees on ports 3000, 3001, 3002, and 3004, including their dedicated launchers and workers.
- Clear only the root checkout's generated `.nuxt/` and `node_modules/.cache/vite/` directories after their users have stopped.
- Verify clean development startup, fresh Effect delivery, browser hydration, and the existing required local checks.
- Append a focused recovery/evidence entry to `docs/milestones/m45-reports-time-allocation.md`, the active milestone journal.

Out of scope:

- Application, test, package-script, dependency, lockfile, Nuxt/Vite configuration, authentication, schema, deployment, or CI changes.
- Permanent server-management scripts, automatic cache clearing, optimizer overrides, dependency reinstalls, and upgrades.
- Stopping unrelated projects, deleting scratch source/log directories, pruning containers/volumes, changing existing databases, or editing local environment files.
- Closing M45, accepting ADR 0061, or reconciling unrelated historical documentation.

Preserve every existing tracked and untracked M45 change. The only expected tracked-content change is the appended recovery journal; this plan is the planning artifact. No new ADR is needed for an environment incident without a durable policy change.

## Inputs and current-state evidence

### User decisions

The user reported the same BTT error when trying another project on port 3000. After being told that old BTT instances occupied ports 3000 and 3001, the user explicitly authorized fixing all old servers. This plan includes all four verified old BTT instances, including the two historical scratch instances. It excludes the user's active unrelated project.

### Verified facts from planning

- `package.json` defines `dev` as `nuxt dev`, with Nuxt 4.5.2, Vite 8.3.2, Effect 4.0.0, pnpm 12.8.1, and Node 24 or newer. `nuxt.config.ts` has no custom Vite optimizer configuration.
- At approximately 2026-10-16 07:10 UTC, `GET http://127.0.0.1:3000/api/health` returned HTTP 200, but the exact reported Effect URL ending in `effect.js?v=d46156eb` returned HTTP 504 `Outdated Optimize Dep`. The user-visible 500 is therefore not the observed status of the dependency request itself.
- `node_modules/.cache/vite/client/deps/_metadata.json` had browser hash `c2951a8b`, listed only `errx` and `nostics` dependencies, and did not list Effect. The referenced `effect.js` file was absent.
- Installed `@nuxt/vite-builder` source explicitly uses `node_modules/.cache/vite/client` for its client dependency cache. Both planned cache directories are ignored generated directories in this checkout.
- Effect is intentionally imported by `app/composables/useApiFetch.ts`, `app/utils/client-effect.ts`, and `app/pages/agenda.vue`. Do not remove these imports or change the client boundary from ADR 0024.
- An earlier equivalent stale-URL recovery is recorded under the 2026-10-07 dev-server Vite cache recovery entry in `docs/milestones/m30-agenda-toolbar-and-timeline-polish.md`.

Process identities below are observations, not a reusable kill list. Build must revalidate PID, start time, working directory, command, ancestry, and listening socket immediately before signaling anything.

- Port 3000: listener 43818, dedicated launcher 43803, working directory `/Users/mehdi/code/btt`, started October 15 around 13:05 local time. Output goes to `/private/tmp/btt-m45-nuxt.log`.
- Port 3001: listener 44888, dedicated launcher 44871, same root checkout, started October 15 around 13:10. Output goes to `/private/tmp/btt-m45-nuxt-3001.log`. Its launcher explicitly bypasses the Nuxt lock, so leaving it running would retain a competing cache writer.
- Port 3002: listener 46814, dedicated outer launcher 46736, working directory `/private/tmp/btt-m45-isolated`, started October 15 around 13:18.
- Port 3004: listener 8926, dedicated launcher 8925, working directory `/private/tmp/btt-m45-range-nJjwGo/source`, started October 15 around 18:27. The M45 journal identifies this as a historical retained verification server.
- Protected unrelated project: listener 20958 on IPv6 loopback port 3003, working directory `/Users/mehdi/code/ccvavocats`, newly started October 16. Do not stop its process tree or touch its files.

### Inference and limitations

The requested optimized dependency URL is demonstrably stale, and old BTT processes demonstrably occupy the ports. Concurrent root-checkout servers and earlier shared-cache verification are plausible contributors, but planning did not prove the precise cache-overwrite sequence. This evidence does not establish a broken Effect installation or justify a dependency/configuration change.

Planning used file/process inspection and existing-server diagnostic GET requests only. No servers were stopped, caches cleared, application files changed, or test suites run.

### References

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`, and `docs/milestones/README.md`.
- ADR 0024, Effect-aware client fetch boundary; ADR 0050, complete local verification and server handoff.
- `docs/milestones/m30-agenda-toolbar-and-timeline-polish.md` and `docs/milestones/m45-reports-time-allocation.md`.
- `package.json`, `nuxt.config.ts`, `playwright.config.ts`, `vitest.config.ts`, `.gitignore`, and `server/utils/auth-test.ts`.
- [Vite dependency cache documentation](https://vite.dev/guide/dep-pre-bundling#caching): optimized dependencies have filesystem and strongly cached browser versions.
- [Nuxt cleanup documentation](https://nuxt.com/docs/4.x/api/commands/cleanup): cleanup removes additional output/cache directories. Prefer the two explicit incident-related paths here rather than the broader cleanup command.

## Decisions and rationale

- **D1 — Recover the environment first.** Stop the old processes and rebuild generated state without changing working application code or dependencies. Reject speculative optimizer exclusions, upgrades, and import rewrites.
- **D2 — Stop complete, verified server trees.** A remaining supervisor can respawn a listener; a remaining worker can retain a cache writer. Use graceful termination of only the four identified BTT trees, never a broad Node/Nuxt process-name kill.
- **D3 — Keep deletion bounded.** Remove only the two named generated directories in the root checkout. Do not run the broader Nuxt cleanup command, delete `node_modules`, or clean unrelated scratch caches.
- **D4 — Return the port to the user.** The verification server is temporary and agent-owned. Stop it only after required checks pass and verify port release; do not leave another background server after handoff.
- **D5 — Preserve verification policy.** Run existing checks and the full browser suite without new tests, retries, relaxed assertions, or raised timeouts. Use an isolated disposable test database, not the user's database.

## Requirements and acceptance criteria

- **R1 — Old servers removed:** the four verified old BTT trees have exited, their workers/launchers do not respawn them, and ports 3000, 3001, 3002, and 3004 have no listeners after final cleanup on any address family.
- **R2 — Unrelated services protected:** the project on port 3003 and every other unrelated process/database remain untouched. A process that changes identity between inspection and shutdown must not be signaled.
- **R3 — Generated state rebuilt safely:** only the named root cache directories are cleared, and clean development startup regenerates what it needs without reinstalls or tracked configuration changes.
- **R4 — Fresh client graph works:** the existing development script starts one instance on the requested port without silently moving elsewhere; health returns 200; a fresh browser loads and hydrates the app; the Effect URL referenced by that fresh graph returns 200 without the reported dynamic-import failure.
- **R5 — Existing behavior retained:** every approved existing local check, including the complete Playwright suite, passes. No application or test-source change is authorized by this plan.
- **R6 — Honest handoff:** the journal records exact shutdown/cache/check outcomes, intermediate failures, final port release, and limitations. The user is told to start `pnpm dev` themselves and hard-refresh existing tabs.

A request for the original stale dependency hash may still be rejected after recovery. Success is defined using the freshly generated import URL, not preserving obsolete cache URLs.

## Ordered implementation checklist

- [ ] **S1 — Revalidate the recovery targets and baseline.** Inspect Git status, unstaged/staged changes, and the four listeners using `lsof` and `ps`. Identify their dedicated supervisor/worker trees and real working directories, including `/tmp` versus `/private/tmp` aliases. Record the protected port-3003 identity. If a target is already gone, treat it as an idempotent no-op. If a different project now owns a target port, leave it alone and stop for clarification. Completion evidence: a current target inventory and preserved baseline.
- [ ] **S2 — Stop the four authorized old BTT trees.** After S1, gracefully terminate only the verified dedicated launchers, Nuxt supervisors, and their workers. Recheck process exit and all four ports, including IPv4 and IPv6, and confirm no supervisor respawns them. Do not use a broad process-name kill, terminate a shared shell/session, or escalate to force-killing an uncertain target. Completion evidence: exited target processes, released old-server ports, and the unrelated project still untouched.
- [ ] **S3 — Clear only the incident caches and prepare isolated verification.** After S2, recheck that `.nuxt/` and `node_modules/.cache/vite/` resolve inside this checkout and contain only generated state, then clear those directories. Preserve source, environment files, dependencies, `.output`, and scratch evidence. For checks, create a uniquely named disposable local PostgreSQL container from an already available PostgreSQL image, bound to an unused loopback port, with a dedicated test database and temporary credentials. Record its exact identity without disclosing secrets. Apply only committed migrations there. Do not alter any existing database/container or pull/install missing tools without approval. Completion evidence: bounded cache cleanup and an isolated verification database.
- [ ] **S4 — Run non-browser gates before launching the browser server.** On the preserved worktree, use the isolated test environment for `pnpm db:migrate`, `pnpm format:check`, `pnpm lint`, `pnpm check:duplicates`, `pnpm check:unused`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test`, `pnpm build`, `pnpm check:workflow`, and whitespace/diff checks. Generated preparation required by the existing Nuxt checks is allowed; repository configuration/dependency changes are not. Read the local Oxc skill before its tools. Historical M45 passes are not substitutes for this run. Completion evidence: exact commands and outcomes, including first failures.
- [ ] **S5 — Verify one clean development instance and the full browser suite.** After S4, start the existing `pnpm dev` script with explicit loopback host and port 3000, recording its owned supervisor/listener IDs and log path. Use the same isolated database and temporary auth environment for server and tests; do not edit `.env` files or enable the old lock bypass. Confirm the listener owns the requested port and health is ready. Inspect a fresh browser load and its current Effect request, then run the complete existing Playwright suite with `PLAYWRIGHT_SKIP_DEV_SERVER=1`, `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000`, one worker, and zero retries. Confirm authenticated pages hydrate and no stale Effect import prevents interaction. Keep this owned server running through failures. Completion evidence: fresh Effect HTTP 200, usable client rendering, and a green full suite, not merely test discovery or focused execution.
- [ ] **S6 — Release resources and record the recovery.** Only after required checks pass, stop the newly owned verification server and remove only the newly created disposable database container. Verify its port and all four old BTT ports are released, and recheck the protected project's identity without restarting it. Append concise evidence and any limitations to the active M45 journal; repeat relevant final documentation/format/diff checks after that entry. Preserve the approved plan unchanged. Hand back the existing `pnpm dev` command and hard-refresh guidance, then stop before Review.

## Validation

- **V1 — Process boundaries:** verify stale BTT launchers/workers exit without respawning, all four target ports are free at handoff, and the unrelated project has not been signaled or modified. Absence of one old listener is a no-op; changed process identity is a blocker, not permission to kill the new owner.
- **V2 — Actual incident regression:** inspect the fresh browser network graph and request the current optimized Effect URL. Health alone, an SSR redirect, successful unit tests, or another request to the obsolete hash does not prove recovery. Existing tabs may need a cache-disabled reload or a fresh browser context.
- **V3 — Project regression gates:** use the S4 script names verified in `package.json`; use `pnpm exec playwright test --workers=1 --retries=0` with the S5 environment for the full browser run. Keep existing timeout/retry/assertion policies unchanged. No new permanent test or helper is needed because no application logic is changing.
- **V4 — Data and resource safety:** migrations and browser fixtures use only the new disposable test database; no production/local user data is reset. Record cleanup by exact owned container identity and port. Do not prune historical resources or claim deletion of unrelated fixture data.

No remote CI, live GitHub OAuth, deployment, or production verification is required or claimed. If a required local tool, image, database environment, or browser is unavailable, report the blocker rather than silently skipping the gate.

## Risks and stop conditions

- Stopping the authorized old BTT trees interrupts their open browser sessions; hard refresh after a new startup is expected.
- PIDs and ports may change before Build. If an observed PID is reused, a target port belongs to another project, or ancestry is ambiguous, do not signal it; ask for clarification.
- Never clear a cache while another live process still uses the root checkout. Unexpected shared/symlinked cache ownership requires clarification before deletion.
- If graceful shutdown leaves an uncertain supervisor or a target repeatedly respawns, stop for a revised process-management decision rather than broadening the kill scope.
- If a clean single-server restart still fails on a fresh Effect graph, preserve the HTTP response and server log and return for a source/configuration remediation plan. This plan does not authorize changing dependencies, optimizer settings, imports, or application code.
- A failing required check is a blocker, not permission to fix unrelated M45 code/tests, edit immutable input plans, or weaken verification. Preserve first-failure evidence and keep any newly owned app server available while blocked, per repository policy.

## Fresh-session Build handoff

Implement only the authorized local recovery: stop the four revalidated old BTT process trees, reset the two root generated-cache directories, verify the existing application through all required checks and fresh client loading, and return the cleaned ports to the user. Preserve the active unrelated project and all existing source/dependency/environment contents. The only expected content edit is a recovery entry in the active M45 journal.

Do not edit this approved plan during Build. No blocking product decisions remain; runtime PIDs, available local verification image, temporary database port, and fresh optimizer hash must be rediscovered safely. Completion requires recorded checks and port-release evidence and stops before Review; it does not accept or close M45.
