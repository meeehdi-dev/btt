# M24 — First production deployment via Coolify

> **Status:** Repository implementation and local verification complete; code review accepted. Production Coolify/database confirmation remains pending.

## Context

M22 named first-release deployment as the next planning task. M0 deferred release-please, GHCR publishing, and Coolify deployment automation to a separately approved follow-up. This plan recommends replacing the roadmap's earlier GHCR release flow with a direct Git-to-Coolify deployment.

### Facts

- `PLAN.md` currently describes release-please creating a release, GHCR publishing, then Coolify deployment from that release workflow.
- `../tt/.github/workflows/release-please.yml` calls `deploy.yml` only after a release. `deploy.yml` builds and pushes a tagged image to GHCR, then calls the Coolify API to select that image tag and deploy it.
- This repository currently has no Dockerfile, Compose file, GHCR publishing workflow, or Coolify deployment configuration. GitHub Actions currently run quality checks; `package.json` pins `pnpm@12.8.1`, requires Node `>=24`, and builds Nuxt/Nitro for a Node server.
- Production configuration currently requires `DATABASE_URL`, `BETTER_AUTH_SECRET` (32+ characters), `BETTER_AUTH_URL`, `GITHUB_CLIENT_ID`, and `GITHUB_CLIENT_SECRET`. The documented production host is `https://nxmr.meeehdi.dev`, with GitHub callback `https://nxmr.meeehdi.dev/api/auth/callback/github`.
- The committed Drizzle migrations are `drizzle/0000_better-auth.sql` through `drizzle/0009_burly_mysterio.sql`. M2.5 documents that its UUIDv7 migration was applied after resetting the undeployed local database; it does not provide production data backfill or rollback procedures.
- There is no current health endpoint under `server/`. `server/db/index.ts` currently configures a PostgreSQL pool with `max: 1`.

### Recommendation

Use Coolify's **GitHub App source + Dockerfile build method**. Coolify should check out the selected commit and build the Docker image directly on the Coolify host from a `Dockerfile` committed in this repository. Deploy from `main`; do not publish an image to GHCR, run release-please for deployment, or call Coolify's API from a release workflow.

Keep GitHub Actions as the quality gate. Prefer required PR checks and no direct pushes to `main`, then let Coolify auto-deploy successful merges. If branch protection is not being used, turn off auto-deploy and use Coolify's manual Deploy action after checks pass. Avoid adding a webhook workflow unless automatic CI-gated deployment is specifically needed.

Use a Dockerfile for this app, but not because buildpacks are inherently bad. Coolify's buildpack (for example, Nixpacks) also builds a container image and is a reasonable simpler option for a conventional Node app. A repository Dockerfile is my preference here because it makes the Node 24/pnpm 12 build, Nuxt/Nitro server command, runtime environment, health check, and migration-before-start behavior explicit and reviewable. It avoids relying on framework detection/overrides. The trade-off is maintaining the Dockerfile and periodically updating its base image. No GHCR or other registry is needed for this approach.

For a low-operations first deployment, use a Coolify-managed PostgreSQL resource connected to the app over Coolify's private network, with persistent storage and no public PostgreSQL port. Configure scheduled backups and an off-server S3-compatible copy, and verify a restore. This is simple but still leaves the app and database dependent on the Coolify host; choose external managed PostgreSQL instead if host loss must not take the service and database down together.

Run committed database migrations before the new app starts serving traffic, not as a Docker build step or a post-deployment hook. A startup migration wrapper is a candidate for the initial single-instance deployment, provided the production image contains a small, auditable migration runner and migration files. Keep future schema changes compatible with the old app while Coolify replaces the container; use an explicit maintenance/rollback procedure for destructive changes. Take a backup before applying migrations. Coolify's documented pre-deployment command runs in the current container (and is skipped on first deploy), while its post-deployment command runs after deployment is marked complete, so neither should be assumed to provide a safe migration gate for a new image.

Before migration or deployment, confirm whether production will use a new empty database. If existing local data must be preserved/imported, stop and plan a separate backup/export/import and recovery path; do not treat the local reset history as a production migration strategy.

## Approved scope

**Approved in Plannotator on 2026-09-30.** The following scope is approved, subject to confirming the production database state and hosting expectations before any production migration or deployment.

- Replace the roadmap's GHCR/release-workflow deployment direction with direct Git-to-Coolify Dockerfile builds.
- Add a production Dockerfile and `.dockerignore` for Nuxt/Nitro on Node 24, using the exact pnpm version already pinned by the project.
- Make the production container run migrations before starting the Nuxt server, using a minimal migration runner and the committed migrations; do not add a dependency or widen production permissions without pausing for approval.
- Add a minimal non-sensitive health endpoint and configure a Coolify health check.
- Document Coolify Git/source/build settings, domain and port, runtime-only secrets, GitHub OAuth callback, database connection, first deployment, migrations, backups, restore checks, and redeploy/rollback limitations.
- Update `PLAN.md` and add an ADR for the approved deployment and release strategy. Keep the existing quality-check workflow; do not add release-please, image publishing, registry credentials, or a Coolify API deployment token.

## Out of scope

- GHCR or any other image registry, release-please, image tags/releases as deployment triggers, and GitHub Actions image publishing.
- Multi-region/HA deployment, horizontal app scaling, Kubernetes, or a broad observability platform.
- Application feature work unrelated to deploy/readiness.
- Importing user data or production migration/backfill of an existing database. If required, pause for an explicit data-preservation plan.
- Committing secrets, OAuth credentials, database credentials, or production `.env` values.
- Database, authentication, or domain-schema changes unless a separate approved plan is needed.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/m22-documentation-reconciliation.md` — deployment follow-up
- `docs/milestones/m0-project-bootstrap.md` — release/deployment deferral
- `docs/milestones/m2.5-uuidv7-identifier-migration.md` and `docs/decisions/0006-uuidv7-identifiers.md` — production data-migration caveat
- `docs/milestones/m1-authentication-shell.md` and `docs/decisions/0003-m1-authentication-and-database.md` — production auth/database configuration
- `package.json`, `.env.example`, `README.md`, `nuxt.config.ts`, `drizzle.config.ts`, `server/db/index.ts`, `server/utils/auth.ts`, `.github/workflows/check.yml`
- `../tt/.github/workflows/{release-please,deploy}.yml` — current workflow being deliberately replaced
- Coolify docs: [Choose a deployment method](https://coolify.io/docs/applications/choose-deployment-method), [Dockerfile](https://coolify.io/docs/applications/builds/dockerfile), [Nixpacks overview](https://coolify.io/docs/applications/builds/nixpacks/overview), [GitHub auto-deploy](https://coolify.io/docs/applications/sources/github/auto-deploy), [database backups](https://coolify.io/docs/databases/backups)

## Approach

1. Before provisioning, migration, or production deployment, confirm the production database will be empty/fresh or stop to scope data preservation separately. Confirm whether app and PostgreSQL can share the Coolify host and whether off-server backups are available. Local image implementation and testing may proceed independently.
2. Add a focused multi-stage Dockerfile and `.dockerignore`. Explicitly build Nuxt's Node-server output; run it on the configured internal port, bind to the container interface, and run as a non-root user. Pin the Node major and the existing pnpm version; keep runtime secrets out of build args and image layers.
3. Research and implement a minimal migration-before-server entrypoint using the existing Drizzle migration format and existing runtime packages, if practical. Do not put production DB credentials into the image build. Test fresh-database migration and failure behavior. If this requires a dependency change or a materially different deployment mechanism, pause for approval.
4. Add a small health endpoint that exposes no credentials or user data, and configure Coolify's HTTP health check against it.
5. Update the README with the actual one-time Coolify setup and operational runbook. Configure the private repository through Coolify's GitHub App, select `main` and the repository Dockerfile, set the app domain and internal port, and configure the GitHub OAuth callback.
6. Keep secrets in Coolify runtime environment variables. Configure PostgreSQL on a private network with a persistent volume, scheduled backups to an off-server destination, and a tested restore procedure.
7. Update the technical direction in `PLAN.md` and record the durable deployment decision in a new ADR only after plan approval.
8. Verify the Docker image locally where Docker is available; run it against a disposable PostgreSQL database; verify startup migration, health, login/session behavior, and persisted records. Then manually verify the first Coolify deployment, domain/TLS, backups, and a restore before relying on production data.

## Files to modify

- `Dockerfile`, `.dockerignore`
- `server/api/health.get.ts`, with `tests/e2e/health.test.ts`
- `scripts/migrate.mjs`, a small production Drizzle migration entrypoint using existing runtime packages
- `README.md` — update the pnpm requirement and add a Coolify deployment/runbook section
- `PLAN.md` — replace the GHCR/release-deploy target with the approved direct Coolify source-build approach
- `docs/decisions/0036-coolify-source-build-deployment.md` and `docs/decisions/README.md`
- `docs/milestones/m24-first-release-deployment.md` — implementation evidence, review, follow-ups, and closeout

No production secrets or server-specific credentials will be added to the repository. No GitHub workflow changes are planned unless review chooses a CI-gated Coolify webhook instead of the recommended main-branch auto-deploy/manual fallback.

## Reuse

- Reuse `pnpm build` and the existing Nuxt/Nitro Node-server output; do not convert the app to a static site.
- Reuse the existing Drizzle migrations and `pnpm db:migrate` semantics; do not generate a new production schema baseline or reset the deployment database.
- Reuse `.github/workflows/check.yml` for quality checks; do not duplicate tests in a release workflow.
- Reuse the documented production auth variables and callback in `README.md` / `.env.example`; keep actual values in Coolify.

## Decisions and ADR links

- Existing historical decision: M0 deferred release/deployment automation; this did not approve GHCR as a permanent requirement.
- Accepted in ADR 0036: direct Git source → Dockerfile build on Coolify, no published image/registry and no release-please deployment automation.
- Proposed operational decision: one app instance and Coolify-managed PostgreSQL with off-host backups for the initial deployment. Confirm the production hosting and failure-tolerance expectations before provisioning.

## Implementation checklist

Plan approval is recorded. Before any production migration or deployment, resolve the database-state and hosting questions above.

- [x] Confirm the existing production database is empty and requires no data import.
- [ ] Confirm database hosting/failure-tolerance expectations and backup destination.
- [x] Add Dockerfile and `.dockerignore`; verify the runtime image excludes build placeholders and runs as non-root.
- [x] Implement and test migration-before-server behavior without build-time DB access or new dependencies; a failed migration exits before the server starts.
- [x] Add a non-sensitive health endpoint and Docker health check.
- [x] Update README and `PLAN.md`; add accepted ADR 0036 and index it.
- [x] Run formatting, lint, typecheck, unit/E2E, Nuxt build, workflow check, and Docker build/runtime checks.
- [ ] After production data/hosting are confirmed, perform manual Coolify setup and verify domain/TLS, OAuth login, fresh database migrations, persistence, backup, and restore before recording production readiness.
- [x] Record verification/deviations and submit the implementation diff for human code review.
- [ ] Complete production Coolify/database checks and close only after the human completion declaration.

## Journal

### 2026-09-30 — Planning research

- Fact: read the canonical workflow, product roadmap, M0/M1/M2.5/M22 deployment context, current auth/database configuration, and milestone template.
- Fact: `git status --short --branch` showed a clean `main` branch at `origin/main` before drafting this plan.
- Fact: inspected `../tt`'s release/deploy workflows. It uses release-please, publishes a tagged and `latest` image to GHCR, updates the Coolify app image tag through its API, then starts deployment.
- Fact: inspected current Coolify documentation. Git-based Dockerfile deployment builds from the repository without requiring a registry image; Coolify also supports a generated Nixpacks build method. GitHub App auto-deploy can deploy pushes to a chosen branch. Coolify database backups can be copied to S3-compatible storage.
- Fact: Coolify documents pre-deployment commands as running in the old/current container and being skipped for the first deployment; post-deployment commands run after deployment is marked complete.
- Decision (proposed): prefer direct Git + Dockerfile build on Coolify to avoid GHCR, release-please deployment coupling, and registry credentials. Keep quality CI, use protected `main` and Coolify auto-deploy; manual deploy remains the fallback if branch protection is not in place.
- Hypothesis: a single app instance and Coolify-managed PostgreSQL with private networking and off-host backups are a suitable low-operations first deployment. Confirm hosting/failure-tolerance expectations before implementation.
- Open question: confirm that the production database is fresh/empty and no local data needs export/import; otherwise stop to plan preservation and restore separately.
- Open question: prove a small, dependency-minimal Drizzle migration runner can execute committed migrations before Nuxt starts in the production image. Do not assume the existing `drizzle-kit` CLI is available in a slim runtime image.
- Evidence: Coolify official docs listed under Source references; no application/deployment files have been changed.

### 2026-09-30 — Plan review

- Fact: Plannotator returned `{"decision":"approved"}` with no annotations.
- Decision: plan review is approved. The proposed scope is cleared for implementation, but the production database's empty-vs-preserved state and database-host failure-tolerance expectations must still be confirmed before migration or production deployment.
- Evidence: `plannotator annotate docs/milestones/m24-first-release-deployment.md --gate --json --require-approval --result-file /tmp/nxmr-m24-plan-review-20260930.json`.

### 2026-09-30 — Implementation authorization

- Fact: after the plan review, the human said “go”.
- Decision: proceed with the approved implementation scope. Production provisioning, data migration, and live Coolify deployment remain blocked on confirming the production database state and hosting/failure-tolerance expectations.
- Evidence: direct user instruction in chat.

### 2026-09-30 — Implementation and local verification

- Fact: added a multi-stage Node 24 Dockerfile. It pins pnpm 12.8.1, performs frozen installs, builds Nuxt/Nitro with non-secret placeholders, installs only production dependencies in the final image, runs as the `node` user, and exposes port 3000 with a health check.
- Fact: added `scripts/migrate.mjs` using the existing `drizzle-orm` and `pg` dependencies. It applies the committed migrations before the Nuxt server starts and closes its pool; it adds no dependency and does not connect during image build.
- Fact: added public non-sensitive `GET /api/health` returning `{ status: 'ok' }` and an E2E assertion.
- Fact: updated the README runbook and technical direction in `PLAN.md`; added and indexed accepted ADR 0036. No GHCR, release-please, publishing workflow, registry credentials, Coolify API token, or production secret was added.
- Fact: the first Docker build failed because `pnpm-workspace.yaml` (which contains the approved exact-version pnpm build-script allowlist) was omitted from dependency stages. Added it to both dependency stages; the rebuild succeeded and ran only the already-approved exact-version install scripts.
- Evidence: Docker build `nxmr:m24-local` passed using the available legacy Docker builder. The build emitted non-failing Vite `PLUGIN_TIMINGS` and esbuild BigInt-target advisories. The final image was 167,111,827 bytes, runs as `node`, resolves Drizzle ORM/pg, excludes `drizzle-kit`, and contained no build-placeholder strings or build-time environment secrets.
- Evidence: started an isolated temporary PostgreSQL 17 container and applied all 10 committed migrations through the image startup command. The app container reached `healthy`; `/api/health` returned `{"status":"ok"}`. Restart reapplied migrations without duplication (still 10). Against an unreachable test database, migration exited with code 1 and the app container did not start.
- Evidence: production-image Playwright smoke tests for health and rejection of a forged M0 cookie passed (2/2). Full development Playwright suite passed (28/28); Nuxt dev logs also reported repeated non-fatal `ResizeObserver loop completed with undelivered notifications` messages.
- Evidence: `pnpm db:migrate` passed against the same disposable database; repository format, lint, typecheck, tsgo, unit tests, and local production build passed. The local build emitted the non-fatal Vite `PLUGIN_TIMINGS` advisory.
- Fact: removed only the temporary M24 test containers, Docker network, and local image after verification; pre-existing PostgreSQL containers were left untouched.
- Scope note: no production database was touched and no Coolify resource was configured. The database-state and hosting/failure-tolerance questions remain open; Coolify/TLS/OAuth/backup/restore verification is pending target-environment access and confirmation. Remote GitHub CI has not been run.

### 2026-09-30 — Human code review

- Fact: Plannotator returned `{"decision":"approved","message":"# Code Review\n\nCode review completed — no changes requested."}` for the uncommitted M24 diff.
- Decision: human code review accepted with no requested changes. M24 remains open for target database/hosting confirmation and manual Coolify deployment/backup verification.
- Evidence: `plannotator review --git --diff-type uncommitted --no-git-remote-check --json`.

### 2026-09-30 — Production database confirmation

- Fact: the human reports the database already exists in Coolify but has no data or tables, and production environment variables have been set in Coolify.
- Decision: treat production as a fresh-schema deployment; the container's startup migrator will apply the committed migrations. Do not import or backfill local data.
- Scope: the human will handle Coolify configuration. No connection to the production database was made, and no deployment or migration was run against it.
- Follow-up: verify the deployment becomes healthy, migrations are present, OAuth works, and backups/restores are configured in Coolify.

## Verification

Planning checks:

- [x] `node scripts/check-workflow-docs.mjs` — passed: `Workflow documentation structure looks complete.`
- [x] `pnpm exec oxfmt --check docs/milestones/m24-first-release-deployment.md` — passed.
- [x] Human reviewed and approved this recommendation/plan in Plannotator. Confirm the listed production database and hosting questions before migration/deployment.

Implementation checks:

- [x] `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, and `pnpm test` passed (13 files / 72 tests).
- [x] Full Playwright suite passed against the isolated disposable PostgreSQL 17 database (28 tests). The health test passed against both the dev server and production image; the production forged-cookie smoke test also passed.
- [x] `pnpm build` and `docker build --tag nxmr:m24-local .` passed. Docker emits non-failing Vite `PLUGIN_TIMINGS`/esbuild BigInt-target advisories; the local Docker client also reports its legacy builder is deprecated.
- [x] `pnpm db:migrate` and production-image startup migration passed against a fresh disposable database (10 migrations). Restart remained healthy with 10 applied migrations; an unreachable database made the migration container exit before app startup.
- [x] Runtime image is non-root, uses only production dependencies, contains no build placeholders, binds to port 3000, and passes the built-in `/api/health` health check.
- [x] `node scripts/check-workflow-docs.mjs` and `pnpm exec oxfmt --check` on all changed supported files passed.
- [ ] Coolify app can reach the chosen PostgreSQL service privately; PostgreSQL is not exposed publicly; GitHub OAuth callback, HTTPS, session login/logout, and production data persistence work.
- [ ] A scheduled off-host database backup succeeds and a restore into a disposable database is verified.
- [ ] Record actual Coolify UI checks after target database/hosting choices are confirmed; local Docker checks do not constitute a production deployment.

## Review status

- Plan review: Approved in Plannotator on 2026-09-30; production data-state and hosting confirmations remain required before deployment.
- Code review: Accepted via Plannotator on 2026-09-30; no changes requested.
- Milestone completion declaration: Pending production Coolify/database verification and human declaration.

## Follow-ups

- If the production database is not empty, produce a separate data-preservation/backfill/rollback plan before migration.
- If auto-deploy without CI gating is unacceptable, add only a successful-check-to-Coolify webhook (no build/push or registry); revisit scope and approval first.
- Consider an external managed PostgreSQL service if a Coolify-host failure must not also take the database offline.
- Remote GitHub CI and actual target-Coolify configuration remain unverified.
- The current Dependabot configuration does not yet monitor the new Dockerfile base image; add Docker-ecosystem update coverage as a separately reviewed maintenance change if desired.

## Closeout checklist

- [ ] Approved scope complete or explicitly deferred.
- [ ] Verification evidence recorded.
- [ ] Human code review accepted.
- [ ] Human completion declaration recorded in the journal and review status.
