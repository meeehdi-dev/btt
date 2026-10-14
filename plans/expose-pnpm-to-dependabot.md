# Expose pnpm to Dependabot

## Context

`package.json` pins pnpm as `packageManager: pnpm@12.8.1`, but does not declare pnpm as an npm dependency. Dependabot's weekly npm minor/patch configuration is enabled; the sibling `../ccvavocats` repository also declares pnpm as an exact devDependency, and its grouped update PR included a pnpm update. The user requested making pnpm discoverable for future Dependabot updates.

This is a focused package-manifest change. The current pnpm pin remains `12.8.1`; no pnpm upgrade is part of this task.

Verification found a second narrow blocker: `pnpm check:unused` reports the intentionally declarative `pnpm` devDependency as unused because no source imports it. The proposed plan amendment was to add only `pnpm` to Knip's existing `ignoreDependencies` list; no broader suppression was proposed. The user approved this narrow amendment through Plannotator session `pn-9e32e7`.

Implementation found a package-install policy blocker: `pnpm add --save-dev --save-exact pnpm@12.8.1` wrote the manifest and lockfile changes, then exited with `ERR_PNPM_IGNORED_BUILDS`. pnpm 12.8.1 declares `preinstall` and `postinstall`, both invoking `node install.js`. Neither script ran. The existing `pnpm-workspace.yaml` build allowlist did not include pnpm; M21 requires explicit human approval for additional package/version build scripts. The user approved allowing exactly `pnpm@12.8.1` scripts through Plannotator session `pn-cf4fcb`.

## Approach

Add `pnpm` as an exact devDependency at `12.8.1`, matching the existing `packageManager` pin, and update the lockfile using the repository's pinned pnpm. Add only `pnpm@12.8.1: true` to `pnpm-workspace.yaml`; the user approved this exact-version build-script allowance through Plannotator session `pn-cf4fcb`. Keep strict build handling for all other packages/versions. Add only `pnpm` to Knip's existing `ignoreDependencies`, since the dependency exists for Dependabot detection and is not imported by app code; this amendment was approved through Plannotator session `pn-9e32e7`. Leave the Dependabot schedule/configuration, CI workflow, and existing pnpm pins unchanged. Record the durable dependency-tracking, Knip exception, and exact script approval in accepted ADR 0060. Future pnpm update PRs will still need review to keep `package.json#packageManager` and the explicit pnpm version in `.github/workflows/check.yml` synchronized.

## Files to modify

- `package.json` — add exact `pnpm@12.8.1` devDependency.
- `pnpm-lock.yaml` — record the new direct dependency without unrelated resolution changes.
- `pnpm-workspace.yaml` — add only the human-approved exact-version `pnpm@12.8.1` build-script allowance.
- `knip.json` — add the exact user-approved `pnpm` unused-dependency exception.
- `docs/decisions/0060-pnpm-dependabot-tracking.md` and `docs/decisions/README.md` — record and index the accepted durable decision; supersede ADR 0034 only for its build-script allowlist.
- `plans/expose-pnpm-to-dependabot.md` — record implementation and verification evidence.

## Reuse

- Preserve the exact pnpm version and strict frozen-install policy from [ADR 0034](../docs/decisions/0034-pnpm-v12-package-manager.md) and [M21](../docs/milestones/m21-pnpm-v12-upgrade.md).
- Reuse the existing weekly npm minor/patch Dependabot group in `.github/dependabot.yml`; no config change is needed.

## Steps

- [x] Obtain human approval of the initial plan before implementation.
- [x] Obtain explicit human approval for the exact-version `pnpm@12.8.1` build scripts via Plannotator session `pn-cf4fcb`; no broader allowlist is approved.
- [x] Add the exact pnpm devDependency and update the lockfile with pnpm 12.8.1; the frozen install passes after the approved script allowance.
- [x] Add the exact `pnpm@12.8.1` allowlist entry; accept ADR 0060 after human code review and update ADR 0034's partial supersession metadata.
- [x] Obtain human approval for the narrow Knip exception amendment via Plannotator session `pn-9e32e7`; no broad suppression is authorized.
- [x] Inspect the diff for unrelated lockfile or dependency changes; only pnpm 12.8.1 and its platform-specific optional packages were added.
- [x] Run the approved local quality checks against the implementation worktree; record outcomes below.
- [x] Submit the final diff for human code review; Plannotator session `pn-d94e60` approved with no requested changes. Do not push or merge.

## Verification

- Confirm `pnpm --version` is `12.8.1` and the manifest's `packageManager` and `devDependencies.pnpm` pins match.
- Run `pnpm install --frozen-lockfile` with only the approved exact-version build-script allowance.
- Run the repository's approved checks: format, lint, both typechecks, duplicate/unused checks, database migration, unit tests, full Playwright E2E, build, workflow check, and workflow-document check.
- Record any first failure; do not hide or suppress it without an approved narrow fix.
- Run `git diff --check` and inspect the full manifest/lockfile diff.

## Implementation journal

### 2026-10-14 — Add pnpm for Dependabot

- Fact: `pnpm add --save-dev --save-exact pnpm@12.8.1` updated `package.json` and `pnpm-lock.yaml`, then exited with `ERR_PNPM_IGNORED_BUILDS`; no pnpm lifecycle script ran during that attempt.
- Fact: pnpm 12.8.1 declares `preinstall` and `postinstall`, both invoking `node install.js`. The package's installer places/relinks its bundled native executable.
- Decision: the user approved running lifecycle scripts only for `pnpm@12.8.1` via Plannotator session `pn-cf4fcb`.
- Fact: added the exact-version `pnpm@12.8.1: true` allowBuilds entry. `pnpm install --frozen-lockfile` then passed; both pnpm lifecycle scripts completed. No other package scripts were newly authorized.
- Decision: after human code review approved the final diff with no requested changes via Plannotator session `pn-d94e60`, ADR 0060 was accepted and ADR 0034 superseded only for its exact-version build-script allowlist; its other package-manager decisions remain authoritative.
- Fact: initial migration, formatting, lint, and duplicate checks passed. `pnpm check:unused` first reported only the intentionally declared `pnpm` devDependency as unused at `package.json:50`.
- Decision: the user approved the narrow `pnpm` entry in `knip.json#ignoreDependencies` via Plannotator session `pn-9e32e7`; it documents a direct dependency that exists only for Dependabot tracking.
- Fact: final `pnpm install --frozen-lockfile`, `pnpm db:migrate`, `pnpm format:check`, `pnpm lint`, `pnpm check:duplicates`, `pnpm check:unused`, `pnpm typecheck`, `pnpm typecheck:tsgo`, `pnpm test`, `pnpm build`, `pnpm check:workflow`, `node scripts/check-workflow-docs.mjs`, and `git diff --check` all passed. Package-manager verification confirmed both pnpm CLI invocations reported 12.8.1 and the manifest pins match. Unit tests passed (16 files, 79 tests). Lint emitted two non-blocking `unicorn/consistent-function-scoping` warnings; the build emitted the existing informational `PLUGIN_TIMINGS` advisory. The duplicate check reported 96 baseline clones with no new clones.
- Fact: first full E2E attempt omitted `BETTER_AUTH_SECRET` from the Playwright process while it was set on the app server, causing API 401s (3 passed / 49 failed). After matching the CI auth environment in both processes, a focused hierarchy test passed 3/3. The next full run passed 51/52; one modal-alignment assertion measured a 5.13px difference against a 4px threshold. The focused test passed 1/1 on a manual diagnostic run, then the full suite passed 52/52 on a final no-retry run. No test/assertion/timeout changes or automatic retries were made.
- Fact: the final no-retry browser run, `CI=true` with matching auth/database variables and `pnpm test:e2e --workers=1 --retries=0 --reporter=line`, passed all 52 tests in 3.5 minutes.
- Fact: the agent-owned Nuxt server and isolated PostgreSQL 17 container remained available during failure investigation and all checks. After checks passed, sent SIGINT to the identified server process group; port 3000 was confirmed released. Stopped only the agent-owned `btt-pnpm-dependabot-20261014` container; port 55433 no longer accepted connections.

### 2026-10-14 — Human completion declaration

- Decision: the user declared, “i declare this milestone complete.”
- Status: implementation, verification, and Plannotator code review are complete. ADR 0060 is accepted; there are no follow-ups. No push or merge was performed.

## Open questions

- None. The approved Knip exception is limited to the exact `pnpm` package; the CI/workflow pin synchronization concern for future pnpm update PRs is documented above, and changing that workflow is outside this plan.

## Closeout

- Human completion declaration: recorded on 2026-10-14.
- Human code review: accepted via Plannotator session `pn-d94e60`, with no changes requested.
- Status: Complete. No follow-ups; not pushed or merged.
