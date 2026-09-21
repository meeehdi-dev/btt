# M0 — Project bootstrap and quality baseline

## Context

Role: planner/researcher. Readiness assessment complete enough to submit the bootstrap plan; implementation awaits plan approval.

Facts from initial inspection:

- The repository contains workflow/product documentation and `scripts/check-workflow-docs.mjs`, but no application, package manifest, lockfile, or CI configuration.
- `PLAN.md` defines M0 acceptance: a runnable Nuxt shell, strict typechecking, lint/format/tests, and an empty protected dashboard using mocked auth if needed.
- ADR 0001 is accepted. The previous workflow plan has completed checkboxes; human code-review acceptance is not explicitly recorded there.
- No M0 plan existed before this draft. The initial working tree was clean (`git status --short`).

## Approved scope

Pending human approval. Proposed scope:

- Minimal Nuxt/Nuxt UI application with an explicitly mocked authenticated/unauthenticated split.
- Strict TypeScript, Nuxt/Vue typecheck, a documented tsgo compatibility evaluation, OXC formatting/linting, Vitest, and push/PR quality checks.
- Validate dependency versions and compatibility rather than assume the roadmap snapshot remains current.
- Search for skills for every tool used in M0, not just Nuxt/UI and Effect. Trust upstream-maintainer skills by default; consider a third-party skill only with documented substantial adoption and explicit human approval.
- A small, deliberate Effect v4 server/domain example and test, without premature service architecture.

## Out of scope

Real GitHub authentication (M1), database/schema work, product CRUD, agenda features, release-please, GHCR publishing, and Coolify deployment. Automation deferral is human-confirmed.

## Source references

- `AGENTS.md`
- `docs/llm-workflow.md`
- `PLAN.md`
- `docs/decisions/0001-llm-assisted-development-workflow.md`
- `docs/templates/milestone-template.md`
- `plans/llm-assisted-workflow.md`

## Approach

Bootstrap boundaries are confirmed. Runtime tooling and reference CI are available, and registry metadata supports the proposed baseline. Implement in the six reviewable steps below after approval. Installation/build compatibility remains an implementation verification gate, not an established fact.

1. Inventory every tool used in M0 and search its upstream-maintained repositories/documentation for skills before using it: Nuxt/Nitro, Nuxt UI, Vue/router, Tailwind, Effect, TypeScript/native-preview, vue-tsc, OXC lint/format, Vitest, Nuxt/Vue test-utils, happy-dom, Playwright, Node, pnpm, Git/GitHub Actions, Dependabot and Plannotator. Extend this inventory if implementation adds a tool. Record search URLs, publisher ownership, version applicability and outcome (including no suitable skill found) in the milestone journal. Prefer only skills published/maintained by the tool's own maintainers. A third-party exception requires documented substantial adoption and maintenance evidence plus explicit human approval; search ranking or self-description is insufficient. Review skill content before trusting it. Vendor suitable skills and only needed references under `.agents/skills/`, preserving license, source commit and provenance, and link them from `AGENTS.md`. The official Nuxt UI skill is already a candidate. Where no trusted compatible skill exists, use official version-specific documentation; write small clearly labeled project-authored markdown fallbacks only where needed, especially Nuxt/UI and Effect v4. Do not present these as upstream skills. Do not install executable skill tooling or change global agent configuration.
2. Create a Nuxt 4 shell using `UApp`, `NuxtLayout`, Nuxt UI and its Tailwind CSS imports. Use a plain public layout and a minimal dashboard layout; no M1 navigation or product pages. `/` redirects to `/dashboard`, whose guard sends unauthenticated visitors to `/login`.
3. Isolate demo session state in `useMockSession`, backed by a clearly named, non-sensitive demo cookie for reload/SSR consistency. Only `import.meta.dev` permits mock sign-in or accepts that cookie; tests exercise the development app. No runtime environment toggle can enable it in a production build. Login explicitly says demo access, logout clears state, and production `/login` explains that authentication is not yet available. The dashboard guard always denies production access, including direct navigation and forged demo cookies. This is not real authentication and protects no data/API in M0.
4. Add a single server-only duration-validation utility using Effect v4 typed success/failure: accept positive safe-integer minutes, reject zero, negative, fractional, non-finite and unsafe values. This is a tested domain primitive, not a new endpoint, persistence layer or product form. Avoid designing a general service architecture or committing to all future API validation choices.
5. Provide OXC format/lint scripts, canonical `nuxt typecheck`, Vitest unit and Nuxt render smoke tests, and browser-backed development/production route tests using Nuxt test-utils and Playwright. Keep test environments separate. Evaluate native-preview on plain TypeScript with a separate configuration; record limits and retain it only if useful. Do not equate plain-TS success with SFC compatibility.
6. Add push/PR checks, npm/GitHub Actions Dependabot updates, local setup documentation, and evidence. No deployment credentials or external publishing are needed.

Pin direct dependencies and pnpm in the approved bootstrap, commit the lockfile, and use frozen installs in CI. Proposed baseline matches the verified roadmap versions except Effect RC 117. Use Nuxt's generated TypeScript project conventions with strict checking. Evaluate tsgo separately on plain TypeScript; Vue/Nuxt checks remain mandatory. Do not add Better Auth, Drizzle, or database dependencies in M0.

Dependency allowance: framework-required Vue/router/Tailwind peers; TypeScript, vue-tsc, Node types; Vitest, Nuxt test-utils, Vue test-utils, happy-dom and Playwright for the stated tests; OXC and the native-preview evaluation. Resolve compatible current stable support-package versions and record exact pins in the lockfile/ADR. Stop and ask if the selected core baseline requires a downgrade, replacement toolchain, extra service, or broader dependencies. Verify Vue SFC lint/format support and document any OXC coverage limits rather than silently adding another linter.

## Files to modify

Planning now: this milestone file and `PLAN.md` to reflect the human-confirmed M0 boundaries.

Implementation paths:

- `package.json`, `pnpm-lock.yaml`, `nuxt.config.ts`, `tsconfig.json`, `.gitignore`, `.node-version`.
- `app/app.vue`, `app/assets/css/main.css`, `app/layouts/{default,dashboard}.vue`.
- `app/pages/{index,login,dashboard}.vue`, `app/composables/useMockSession.ts`, `app/middleware/auth.ts`.
- `server/utils/validate-duration.ts` — server-only Effect domain primitive.
- `tests/unit/validate-duration.test.ts`, `tests/nuxt/app.test.ts`, `tests/e2e/{mock-auth,production-access}.test.ts`.
- `vitest.config.ts`, `.oxlintrc.json`, `.oxfmtrc.json`, optional `tsconfig.tsgo.json` for the evaluation.
- `.github/workflows/check.yml`, `.github/dependabot.yml` — checks and dependency updates only.
- `README.md`, this milestone file, `PLAN.md` milestone status, `docs/decisions/0002-m0-bootstrap-baseline.md`, and `docs/decisions/README.md`.
- `.agents/skills/<skill-name>/SKILL.md` and relevant markdown references — proposed harness-neutral location for reviewed project-local skills, with source/version provenance. Do not assume automatic discovery by every harness; link these skills from `AGENTS.md`.
- `AGENTS.md` — explicit pointers to relevant project-local skills and when to read them.

## Reuse

- Reuse `scripts/check-workflow-docs.mjs` in quality checks.
- Use existing milestone and ADR templates rather than new workflow structure.
- Inspect `../tt/.github/workflows/{check,release-please,deploy}.yml` and `../tt/.github/dependabot.yml` as references, not blind copies.
- No application functions currently exist in this repository to reuse.

## Decisions and ADR links

- Accepted: ADR 0001 governs approval and evidence.
- Proposed: bootstrap stack/compatibility choices and mock-auth boundaries will be captured in a new ADR after approval.
- Confirmed by the human: the current workflow implementation is accepted; later changes remain possible through the approval process.
- Confirmed by the human: M0 automation is limited to quality checks and Dependabot. Release-please, GHCR publishing, and Coolify deployment are deferred to a separately approved follow-up.
- Confirmed by the human: mock sign-in is development/test-only. Production protected routes remain inaccessible until real authentication in M1.
- Confirmed by the human: canonical project skill location is `.agents/skills/`, explicitly linked from `AGENTS.md` so use does not depend on harness-specific auto-discovery.
- Plan-review feedback: search for skills for every tool used. Trust tool-maintainer sources by default; unusually popular third-party candidates require adoption evidence and human approval before use.

## Implementation checklist

Execute only after approval:

- [x] Complete the all-tools skill search/trust inventory, prepare reviewed project-local skills and bootstrap ADR; pin dependencies and verify installation compatibility. Core install completed after peer-pin corrections; frozen install remains to verify after implementation files are added.
- [x] Scaffold the strict Nuxt/Nuxt UI shell and server-only Effect duration validator.
- [x] Add development-only mock session, login/logout, and guarded empty dashboard with fail-closed production behavior.
- [x] Wire OXC checks, Nuxt/Vue typecheck, tsgo evaluation, unit/render tests and development/production navigation tests.
- [x] Add quality CI, npm/Actions Dependabot configuration and local development documentation.
- [x] Run verification, record outcomes/deviations/follow-ups, and submit the diff for human code review.

## Journal

### Initial readiness inspection

- Fact: mandatory workflow, roadmap, ADR, milestone convention/template, and prior workflow plan read.
- Evidence: repository listing and clean initial `git status --short`; no pre-existing M0 milestone file.
- Evidence: `node --version` → `v24.18.0`; `pnpm --version` → `10.33.2`; `node scripts/check-workflow-docs.mjs` → passed. `../tt` is available.
- Evidence: `git log -3 --oneline` shows a single initial commit (`323427d`); this does not establish human review acceptance.
- Fact: read `../tt/.github/workflows/check.yml` and `../tt/.github/dependabot.yml`. Reuse their push/PR checks and grouped minor/patch update patterns; add tests and workflow checks. Only npm and GitHub Actions ecosystems apply in M0 (no Dockerfile).
- Fact: read-only npm registry queries confirm Nuxt 4.5.2, Nuxt UI 4.11.1, TypeScript 7.0.2, Vitest 5.0.1, oxlint 1.83.0, oxfmt 0.68.0, and native-preview 7.0.0-dev.20260707.2. Effect's RC tag is now 4.0.0-rc.117 (stable latest remains v3; do not install that accidentally).
- Fact: Nuxt and Vitest engine ranges include local Node 24.18.0. `@nuxt/test-utils` 4.3.2 declares Vitest 5 compatibility; `vue-tsc` 3.3.11 declares TypeScript >=5 compatibility. Peer metadata is not proof of working SFC typechecking or a successful installation.
- Fact: scanned `/Users/mehdi/.agents/skills`, `/Users/mehdi/.pi/agent/skills`, and `.pi/skills` where present; only Plannotator skills were found. No installation performed.
- Fact: fetched/read official Nuxt UI skill at `https://raw.githubusercontent.com/nuxt/ui/v4/skills/nuxt-ui/SKILL.md`. It prescribes `UApp`, semantic colors, Tailwind CSS imports, and task-specific reference reading before coding.
- Fact: maintainer skill inventory queried upstream repositories for every planned tool. Maintainer skills found and reviewed for Nuxt UI, Effect, Oxc, TypeScript, Playwright, pnpm and Plannotator; no suitable maintainer skills were found for Nuxt/Nitro, Vue/router, Tailwind, vue-tsc, Vitest/test-utils, happy-dom, Node, GitHub Actions or Dependabot. No third-party skills were used.
- Fact: vendored provenance pointers are in `.agents/skills/{nuxt-ui,effect-development,oxc}/SKILL.md`; full upstream content remains at the pinned URLs/commits. `AGENTS.md` links the directory.
- Fact: `pnpm install` initially reported Vite and happy-dom peer mismatches; pins were corrected to Vite 7.3.6 and happy-dom 20.0.11, then install completed without peer warnings. pnpm still reported one deprecated transitive package and ignored build scripts.
- Fact: adding direct Vue 3.5.43, Vue Router 5.3.1 and `@vitejs/plugin-vue` 6.0.9 was required for the standalone Vitest Vue render smoke test. `@nuxt/test-utils` was not used in the final test config because its Nuxt transform path failed under the selected Vite/Rolldown combination; the smoke test uses Vue Test Utils with explicit Nuxt component stubs, while browser tests cover the actual Nuxt app.
- Fact: development mock navigation uses native links and an explicit development-only `?demo=1` route handshake; logout uses a shell link with `?logout=1`. Production ignores both and the auth middleware fails closed.
- Research limitation: no suitable maintainer skills were found for several remaining tools; official docs will be used directly. No third-party exception was requested or approved.

### Implementation compatibility blocker

- Fact: Nuxt config generation required adding the root `tsconfig.json` expected by `nuxt typecheck`.
- Fact: with TypeScript 7.0.2, `pnpm typecheck` fails before project diagnostics: `ERR_PACKAGE_PATH_NOT_EXPORTED` from vue-tsc 3.3.11 resolving `typescript/lib/tsc`.
- Decision approved by the human: use latest TypeScript v6, pinned to 6.0.3, so vue-tsc compatibility is restored. Keep `@typescript/native-preview` 7.0.0-dev.20260707.2 as a separate evaluation only.

### Human scope confirmation

- Decision: current workflow accepted for now; changes may be proposed later.
- Decision: M0 includes quality CI and Dependabot, not release-please/GHCR/Coolify. Updated the technical direction and M0 scope in `PLAN.md` accordingly.
- Decision: mock login is development/test-only, with production dashboard access disabled until M1.

## Verification

- [x] Run existing workflow checker and record outcome: passed during readiness inspection.
- [x] Skill inventory covers every tool actually used; each entry records trusted source/provenance and compatibility, or a documented search with no suitable result. Any third-party exception has adoption evidence and explicit approval.
- [x] Record resolved versions/peers and `pnpm install --frozen-lockfile` outcome: passed with pnpm 10.33.2 after the approved TypeScript 6.0.3 compatibility adjustment; one deprecated transitive package and ignored build-script notices remain documented.
- [x] `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm build`, and `node scripts/check-workflow-docs.mjs` pass locally. CI includes browser installation and the same gates; no remote CI run was available, so remote CI remains pending.
- [x] Temporary intentional TS/SFC errors are caught by canonical typecheck, then removed. Confirm representative Vue formatting and lint behavior; record coverage limits.
- [x] Resolve TypeScript compatibility decision: human approved TypeScript 6.0.3 after TypeScript 7.0.2 failed vue-tsc compatibility. `pnpm typecheck` now passes.
- [x] Production smoke started `.output/server/index.mjs`; Playwright with a forged `nxmr-demo-session` cookie still redirected `/dashboard` to `/login`. The production e2e test passed separately; the normal dev e2e command intentionally skips it. Human visual inspection at mobile/desktop widths remains a follow-up.
- [x] Playwright development smoke passed: unauthenticated redirect, demo entry, dashboard rendering and logout redirect. The native-link/full-request handshake covers reload behavior.
- [x] Verify production cannot enable development mock access accidentally.
- [x] Unit test the minimal domain/Effect example, including its failure case.
- [x] Record tsgo evaluation separately; it must not displace canonical Vue/Nuxt checks without demonstrated compatibility.

## Review status

- Plan review: Approved.
- Code review: Accepted by the human; M0 is declared complete.
- Implementation verification: Local gates pass; remote CI and human visual/manual review remain documented follow-ups.
- Milestone completion declaration: Recorded from the human’s M1 planning instruction confirming M0 completion.

## Closeout

- Human completion declaration: The human confirmed M0 is considered completed while beginning M1 planning.
- Closeout note: the workflow now requires an explicit human completion declaration in addition to implementation evidence and code review.

## Follow-ups

- Real authentication and session protection belong to M1.
- Release-please, GHCR publishing, and Coolify deployment require a separately approved follow-up; they are not M0 deliverables.
- `@nuxt/test-utils` remains available for future Nuxt-specific tests, but its attempted transform path was not retained in M0 after the observed Vite/Rolldown failure.
- Human follow-up: inspect the dev shell at mobile and desktop widths, keyboard access, and demo warning copy; review the generated `.nuxtrc` file before acceptance.
