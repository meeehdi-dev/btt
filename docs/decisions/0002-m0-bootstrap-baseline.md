# ADR 0002: M0 bootstrap baseline

- Status: Accepted
- Date: 2026-09-21
- Supersedes: None
- Superseded by: None

## Context

M0 needs a reproducible application and quality baseline before product work. The repository is documentation-only, and the roadmap specifies Nuxt, Nuxt UI, Effect v4 RC, TypeScript, Oxc, and Vitest.

## Decision

- Bootstrap with Nuxt 4.5.2, Nuxt UI 4.11.1, Effect 4.0.0-rc.117, TypeScript 6.0.3, Vitest 5.0.1, oxlint 1.83.0, and oxfmt 0.68.0. TypeScript 6.0.3 is the approved compatibility adjustment from the roadmap's TypeScript 7 snapshot because vue-tsc 3.3.11 cannot run against TypeScript 7.
- Use Node 24 and pnpm 10, with a committed lockfile and frozen CI installs.
- Keep canonical Nuxt/Vue typechecking mandatory. Evaluate native TypeScript separately; it cannot replace SFC/Nuxt checks.
- Use Oxc checks where supported and document any Vue/SFC limitations.
- M0 uses development/test-only mock authentication and fails closed in production. Real GitHub authentication belongs to M1.
- M0 CI is quality checks and Dependabot only; release/deployment automation is deferred.
- Project-local guidance lives in `.agents/skills/`; only tool-maintainer sources are trusted by default. No third-party skill is used.

## Consequences

M0 remains small and reviewable, but browser tests add Playwright setup and the bleeding-edge baseline may expose compatibility issues. The standalone Vue render test uses Vue Test Utils because the attempted Nuxt test-utils transform path failed under the selected Vite/Rolldown combination; real Nuxt behavior is covered by Playwright. Mock authentication is not a security boundary and must not protect real data.

## Alternatives considered

- Use stable Effect v3: rejected because the approved roadmap explicitly targets Effect v4 RC.
- Add Better Auth or a database now: rejected; both belong to M1 or later feature milestones.
- Add release publishing and deployment workflows: deferred to keep M0 secret-free and focused.

## Links

- `PLAN.md`
- `docs/milestones/m0-project-bootstrap.md`
- `docs/decisions/0001-llm-assisted-development-workflow.md`
