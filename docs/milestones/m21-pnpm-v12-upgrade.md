# M21 — pnpm v12 upgrade

> **Status:** Complete — implementation, verification, human code review, and completion declaration recorded on 2026-09-29.

## Context

M20 is complete. The user requested that the next milestone be limited to upgrading pnpm to v12.

Initial facts:

- `package.json` pinned `packageManager` to `pnpm@10.33.2`; `.github/workflows/check.yml` separately installed pnpm `10.33.2` with `pnpm/action-setup@v4`.
- CI used Node 24 and `pnpm install --frozen-lockfile`.
- `pnpm-lock.yaml` declared lockfile version `9.0`.
- Initial repository inspection found no `pnpm` configuration in `package.json`, `.npmrc`, or `pnpm-workspace.yaml`; there was no target for the v10-to-v11 configuration codemod.
- Local versions at planning time were Node `v24.18.0` and pnpm `10.33.2`.
- pnpm's release page and the npm registry showed v12.8.1 as the latest stable v12 version at implementation time. The official `pnpm/action-setup` README documents v12 support.
- Official pnpm migration guidance says v12 retains the configuration changes introduced in v11.

## Approved scope

**Plan approved via Plannotator on 2026-09-29; amended by direct human approval on 2026-09-29.**

- Pin the exact latest stable pnpm 12.x version consistently in `package.json#packageManager` and `.github/workflows/check.yml`. The selected pin is `12.8.1`.
- Keep Node 24, `pnpm/action-setup@v4`, `actions/setup-node@v4`, frozen CI installs, and the existing workflow shape unchanged.
- Allow install scripts only for the exact versions `esbuild@0.18.20`, `esbuild@0.25.12`, `esbuild@0.27.7`, `esbuild@0.28.2`, and `vue-demi@0.14.10`, using `allowBuilds` in `pnpm-workspace.yaml`. Do not allow other packages or future versions; unreviewed scripts must continue to fail.
- Change `pnpm-lock.yaml` only as required by pnpm 12. Review all lockfile changes and do not intentionally upgrade application dependencies.
- Record the package-manager baseline and approved build-script permissions in an ADR. Supersede only the pnpm-version clause of ADR 0002; its other M0 decisions remain authoritative.
- Update the roadmap with M21's goal and acceptance criteria.

## Out of scope

- Upgrading or adding application dependencies, changing dependency declarations, or changing application source/tests.
- Changing Node, GitHub Actions versions, the CI job shape, or Dependabot.
- Allowing build scripts beyond the five exact package versions approved above, or weakening pnpm's strict handling of any other unreviewed scripts.
- Accepting unrelated dependency-version changes in the lockfile. If pnpm 12 requires material unrelated resolution changes, stop and request direction.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`
- `docs/milestones/m20-login-and-ticket-board-toolbar-polish.md` — immediately prior completed milestone
- `docs/decisions/0001-llm-assisted-development-workflow.md` — approval and review gates
- `docs/decisions/0002-m0-bootstrap-baseline.md` — original pnpm 10 baseline
- `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.github/workflows/check.yml`
- [pnpm migration guide](https://github.com/pnpm/pnpm.io/blob/main/docs/migration.md)
- [pnpm build settings](https://pnpm.io/settings/build#strictdepbuilds)
- [pnpm v12 releases](https://github.com/pnpm/pnpm/releases)
- [pnpm/action-setup README](https://github.com/pnpm/action-setup)

## Approach

1. Verify the latest stable pnpm 12.x version and inspect migration/config applicability; no codemod was needed because the initial repository had no pnpm config to migrate.
2. Set `package.json#packageManager` and the CI action's `version` input to the same exact pnpm 12 patch. Retain all other CI/runtime settings.
3. Add exact-version `allowBuilds` entries for the five package versions approved by the human. Keep strict failure for every other unreviewed build script.
4. Run `pnpm install --frozen-lockfile` under pnpm 12 and inspect the complete lockfile diff for unintended package-version or dependency-graph changes.
5. Add ADR 0034 for the pnpm 12 baseline and approved script permissions. After code review accepts the ADR, update ADR 0002's supersession metadata and the ADR index. This is now recorded below.
6. Run the complete existing quality and browser-test suite, inspect the final diff, and submit it for human code review.

## Files to modify

- `package.json` — exact pnpm `packageManager` pin.
- `.github/workflows/check.yml` — matching exact pnpm action version.
- `pnpm-lock.yaml` — pnpm 12 package-manager metadata; no application dependency upgrades.
- `pnpm-workspace.yaml` — exact-version build-script approvals approved by the human.
- `PLAN.md` — M21 goal and acceptance criteria/status.
- `docs/decisions/0002-m0-bootstrap-baseline.md` — supersession metadata for the pnpm 10 pin after ADR acceptance.
- `docs/decisions/0034-pnpm-v12-package-manager.md` — proposed durable package-manager and build-script decision.
- `docs/decisions/README.md` — index ADR 0034 and its relationship to ADR 0002.
- `docs/milestones/m21-pnpm-v12-upgrade.md` — this plan and execution journal.

No application source, test, or other dependency manifest changes are planned.

## Reuse

- Preserve the exact-version `packageManager` pin, `pnpm/action-setup@v4`, and frozen CI installation pattern established by M0 (`docs/decisions/0002-m0-bootstrap-baseline.md`).
- Use the existing quality scripts in `package.json` and the existing CI job in `.github/workflows/check.yml`; do not create a parallel workflow.
- The pnpm 10-to-11 codemod had no target in the initial repository state. The new workspace file contains only the approved `allowBuilds` entries.

## Decisions and ADR links

- ADR 0001 governs the milestone approval and code-review gates.
- ADR 0034 was accepted through human code review on 2026-09-29. ADR 0002 is superseded only for its pnpm 10 version pin; its other M0 decisions remain authoritative.
- By direct human approval, ADR 0034 documents exact-version `allowBuilds` permissions for the five packages listed above. Other packages/versions remain unapproved under `strictDepBuilds`.

## Implementation checklist

- [x] Human approves the milestone plan before implementation.
- [x] Reconfirm exact latest stable pnpm 12.x version and migration/config applicability.
- [x] Align `package.json#packageManager` and the CI pnpm version; retain Node 24 and current action versions.
- [x] Add the exact-version `allowBuilds` entries explicitly approved by the human and retain strict checking for other scripts.
- [x] Make only pnpm-required lockfile changes; confirm no unrelated dependency upgrades.
- [x] Update `PLAN.md`; record implementation evidence and the approved scope amendment here.
- [x] Run the complete local verification suite.
- [x] Submit the full diff for human code review; ADR 0034 is accepted and ADR 0002's scoped supersession metadata/index are updated.
- [x] Wait for and record the human completion declaration before closing M21.

## Journal

### 2026-09-29 — Planning research

- Fact: the repository pinned pnpm 10.33.2 in both `package.json` and `.github/workflows/check.yml`, used Node 24 in CI, and installed with `--frozen-lockfile`. The lockfile header was version 9.0.
- Fact: initial inspection found no `package.json#pnpm` configuration, `.npmrc`, or `pnpm-workspace.yaml`; no v10-to-v11 config codemod was applicable.
- Fact: pnpm v12.8.1 was the latest stable v12 version at implementation time.
- Decision proposed by the user: make the next milestone only a pnpm v12 upgrade. The plan kept application dependencies, source, Node, and CI structure unchanged.
- Hypothesis: the current lockfile could be consumed as-is by pnpm 12; verify using a frozen install.
- Evidence: read the package manifest, lockfile header, CI workflow, M0 baseline ADR/milestone, completed M20 milestone, workflow instructions and milestone template; checked local Node/pnpm versions and official pnpm documentation. No application or dependency files changed during planning.

### 2026-09-29 — Plan approved

- Fact: Plannotator returned `{"decision":"approved"}` for this plan.
- Decision: implementation was authorized only within the approved scope; the pnpm 12 patch was rechecked and pinned exactly.
- Evidence: `plannotator annotate docs/milestones/m21-pnpm-v12-upgrade.md --gate --json --require-approval` returned approval. Workflow, formatting, and whitespace checks passed before submission.

### 2026-09-29 — Initial install blocker

- Fact: `npm view pnpm@12 version --json` confirmed `12.8.1` was the latest stable v12 version; `npx --yes --package=pnpm@12.8.1 pnpm --version` returned `12.8.1`.
- Fact: the first `npx --yes --package=pnpm@12.8.1 -- pnpm install --frozen-lockfile` resolved the dependency lockfile as up to date, then exited with `ERR_PNPM_IGNORED_BUILDS`, listing `esbuild@0.18.20`, `esbuild@0.25.12`, `esbuild@0.27.7`, `esbuild@0.28.2`, and `vue-demi@0.14.10`.
- Fact: pnpm's official docs state `strictDepBuilds: true` by default and require explicit `allowBuilds` decisions in `pnpm-workspace.yaml`; the migration guide identifies this build-policy migration.
- Fact: the lockfile change adds a YAML document recording pnpm 12.8.1 as the package manager; pnpm reported that dependency resolution was skipped. No application dependency versions changed.
- Decision at that point: pause before changing build policy or running the full suite, and request human direction because script permissions are a security decision.
- Evidence: [pnpm build settings](https://pnpm.io/settings/build#strictdepbuilds), [pnpm migration guide](https://github.com/pnpm/pnpm.io/blob/main/docs/migration.md), and the command output above.

### 2026-09-29 — Human-approved build-script scope amendment

- Fact: the human instructed, “2) allow the scripts”.
- Decision: allow scripts for exactly `esbuild@0.18.20`, `esbuild@0.25.12`, `esbuild@0.27.7`, `esbuild@0.28.2`, and `vue-demi@0.14.10`. No wildcard or future-version approval is implied. Other unreviewed scripts remain blocked by pnpm's strict default.
- Evidence: direct human approval in chat on 2026-09-29; exact-version permissions are recorded in `pnpm-workspace.yaml` and ADR 0034.

### 2026-09-29 — Implementation and verification

- Fact: the install log confirms all five approved scripts ran successfully; no other build scripts were approved.
- Evidence: `npx --yes --package=pnpm@12.8.1 -- pnpm install --frozen-lockfile` passed with “Lockfile is up to date, resolution step is skipped”; pnpm completed using v12.8.1. `pnpm --version` also reports `12.8.1`; Node remains `v24.18.0`.
- Evidence: `pnpm format:check` passed on 257 files; `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, and `pnpm check:workflow` passed. `pnpm test` passed 13 files / 72 tests. Full Playwright passed 27 tests. `pnpm build` passed with a non-fatal Vite `PLUGIN_TIMINGS` advisory.
- Fact: the lockfile only adds pnpm 12.8.1 package-manager metadata; application dependency resolutions and manifest versions are unchanged. No application source/tests or CI/runtime shape changed. CI retains Node 24, `pnpm/action-setup@v4`, and frozen installs.
- Deviation: the exact-version build-script allowlist was added after the human explicitly approved that scope amendment; no other deviations.
- Follow-up: remote GitHub CI was not run. Human code review and the completion declaration remain pending.

### 2026-09-29 — Human code review

- Fact: Plannotator reviewed the complete uncommitted diff and returned `{"decision":"approved","message":"# Code Review\n\nCode review completed — no changes requested."}`.
- Decision: human code review accepted. ADR 0034 is Accepted; ADR 0002 is marked Superseded for the pnpm version pin only. The milestone remains open until the human completion declaration is recorded.
- Evidence: `plannotator review --git --diff-type uncommitted --no-git-remote-check --json` returned approval.

### 2026-09-29 — Final full-diff code review

- Fact: Plannotator reviewed the complete final uncommitted diff, including the ADR acceptance/supersession metadata and milestone closeout updates, and returned `{"decision":"approved","message":"# Code Review\n\nCode review completed — no changes requested."}`.
- Decision: the final diff is accepted by human code review with no requested changes. The milestone remains open until the human completion declaration is recorded.
- Evidence: `plannotator review --git --diff-type uncommitted --no-git-remote-check --json` returned approval on the final diff.

### 2026-09-29 — Milestone completion declaration

- Fact: the human declared, “i declare this milestone complete”.
- Decision: M21 is complete. Implementation, verification, and human code review are recorded above; the known remote-CI limitation and future build-script approval boundary remain documented follow-ups.
- Evidence: completion declaration received directly in chat on 2026-09-29.

## Verification

Planning artifact checks before approval:

- [x] `node scripts/check-workflow-docs.mjs` — passed.
- [x] `pnpm exec oxfmt --check PLAN.md docs/milestones/m21-pnpm-v12-upgrade.md` — passed before plan approval.
- [x] `git diff --check` and no-index new-file whitespace checks — passed before plan approval.
- [x] Plannotator plan gate — approved on 2026-09-29.

Implementation verification:

- [x] `pnpm --version` — `12.8.1`; Node — `v24.18.0`.
- [x] `npx --yes --package=pnpm@12.8.1 -- pnpm install --frozen-lockfile` — passed after adding the approved exact-version allowlist; lockfile resolution was skipped.
- [x] `pnpm format:check` — passed (257 files); `pnpm lint`, `pnpm typecheck`, `pnpm typecheck:tsgo`, and `pnpm check:workflow` — passed.
- [x] `pnpm test` — passed, 13 files / 72 tests.
- [x] `pnpm exec playwright test --workers=1 --timeout=60000` — passed, 27 tests.
- [x] `pnpm build` — passed; emitted a non-fatal Vite `PLUGIN_TIMINGS` advisory.
- [x] Inspected the changed paths: no application dependency declarations or application source/test files changed; the lockfile change records pnpm 12.8.1 only.
- [x] Local workflow, formatting, and whitespace checks passed. Remote GitHub CI was not run.

## Review status

- Plan review: Approved via Plannotator on 2026-09-29; the exact build-script scope amendment was approved directly in chat.
- Code review: Accepted via Plannotator on 2026-09-29; no changes requested.
- Milestone completion declaration: Declared by the human in chat on 2026-09-29.

## Follow-ups

- Remote GitHub CI was not run.
- Any future build-script package/version not listed in `pnpm-workspace.yaml` remains unapproved and should fail pnpm's strict install until reviewed.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred.
- [x] Verification evidence recorded.
- [x] Human code review accepted.
- [x] Human completion declaration recorded in the journal and review status.
