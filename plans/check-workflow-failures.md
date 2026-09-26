# Restore the `Check` workflow after recent commit failures

## Context

- Request: before M5, inspect recent commits' GitHub Actions with `gh` and identify why the checks fail.
- Fact: `gh run list --limit 12` reports failed `Check` push runs for `1502d07` (run 36231715273), `f8b2c05` (36224856569), `02f8927` (36181499818), and `631b73e` (35640426665). The working tree was clean before writing this plan. M4 is declared complete in `docs/milestones/m4-manual-time-entries.md`.
- Fact: `.github/workflows/check.yml` runs install, Playwright browser setup, migration, format/lint/typecheck/tests/E2E/build/workflow checks on Ubuntu/Node 24 with PostgreSQL 17.
- Fact: `gh run view 36231715273 --log-failed` reports failure at `pnpm typecheck:tsgo` with `TS2345` in `tests/unit/tickets.test.ts:14`: an Effect with decoding services `S["DecodingServices"]` is passed where `never` services are expected. The preceding install, browser setup, migration, format, lint and Nuxt typecheck steps passed; tests/E2E/build were skipped, not passed. Runs [36224856569](https://github.com/meeehdi-dev/nxmr/actions/runs/36224856569) and [36181499818](https://github.com/meeehdi-dev/nxmr/actions/runs/36181499818) show the same error. Older push run [35640426665](https://github.com/meeehdi-dev/nxmr/actions/runs/35640426665) failed earlier at `pnpm format:check` on `docs/decisions/README.md`, a distinct issue. No successful `Check` run appears in `gh run list --workflow Check --limit 25`.
- Fact: `tests/unit/tickets.test.ts:13–14` defines `decode<S extends Schema.Top>` then calls `Effect.runPromise(Schema.decodeUnknownEffect(schema)(input))`. For arbitrary `Schema.Top`, v4 exposes potentially non-`never` `DecodingServices`, while `runPromise` requires no unresolved services; the actual `Ticket*` schemas in `server/domain/schemas.ts` are plain structs/checks with no external services. In contrast, `tests/unit/domain-schemas.test.ts` calls `runPromise` on concrete schemas. `server/domain/decode.ts` currently casts the generic decode to an Effect with `never` services; avoid copying that unchecked assertion without need.
- Fact: local `pnpm typecheck:tsgo` reproduces the identical TS2345 at line 14. Pinned Effect `node_modules/effect/dist/Schema.d.ts` declares `Schema.decodeUnknownPromise<S extends ConstraintDecoder<unknown>>` and `ConstraintDecoder<T, RD = never>`, so the Promise decoder is constrained to schemas with no required decoding services; `tests/unit/tickets.test.ts` only needs a promise for Vitest `resolves`/`rejects`. Official v4 docs list the Promise decoder and recommend Effect decoder + `runPromise` for async operations: [Schema basics](https://effect.website/docs/v4/schema/getting-started), [Running Effects](https://effect.website/docs/v4/getting-started/running-effects).
- Decision (human): propose a fix for Plannotator review; do not implement until approval. Open: CI steps after `tsgo` were skipped, so a second failure may emerge once they run. The Node 20 action deprecation warning at cleanup is not the failed step; a separate action-version upgrade is out of scope.

## Approach

- Replace the test-only helper's `Effect.runPromise(Schema.decodeUnknownEffect(...))` with the pinned Effect v4 `Schema.decodeUnknownPromise` constrained to service-free schemas (`S extends Schema.ConstraintDecoder<unknown>`); remove the now-unused `Effect` import. Suggested helper: `const decode = <S extends Schema.ConstraintDecoder<unknown>>(schema: S, input: unknown) => Schema.decodeUnknownPromise(schema)(input)`. Vitest `resolves`/`rejects` assertions stay unchanged. Do not cast away required services, disable `tsgo`, or weaken CI.
- Retain all existing CI gates. Add a short post-closeout CI-fix/evidence entry to the latest M4 milestone journal without reopening M4 or changing its acceptance; submit code for human review. No code or workflow changes during planning.

## Files to modify

- `tests/unit/tickets.test.ts` — fix the test-only decoder helper and drop unused `Effect` import.
- `docs/milestones/m4-manual-time-entries.md` — append a clearly labeled post-closeout CI maintenance note with the run URLs, cause, verification results and any remaining failures; keep milestone status unchanged.
- `plans/check-workflow-failures.md` — reviewed plan/diagnosis. `.github/workflows/check.yml`, `package.json`, production code and ADRs unchanged.

## Reuse

- Existing `.github/workflows/check.yml`, `package.json` `typecheck:tsgo` script and `tests/unit/domain-schemas.test.ts` concrete-decode examples. Do not weaken checks, add dependencies, or copy `server/domain/decode.ts`'s unchecked cast into tests.

## Steps

- [x] Inspect recent `Check` runs and failed job logs using `gh`.
- [x] Compare repeated failure against existing Effect/schema patterns and reproduce locally; propose a test-only Promise decoder that requires `never` decoding services.
- [x] After Plannotator approval, make the test-only edit, verify existing checks without skipping gates, and record evidence in M4 post-closeout note.
- [x] Human approved the uncommitted diff via Plannotator (no changes requested). A fresh `Check` run still requires a human-authorized push/PR; no push or dispatch was performed.

## Verification

- Cite run URLs, failing job/step, and error excerpt; distinguish observed cause from inference.
- After approval: run `pnpm typecheck:tsgo`, `pnpm typecheck`, `pnpm exec vitest run tests/unit/tickets.test.ts`, and, if local environment permits, remaining CI gates (`pnpm format:check`, `pnpm lint`, `pnpm test`, `pnpm test:e2e`, `pnpm build`, `pnpm check:workflow`) with test DB/Playwright configured; record blockers rather than marking skipped steps passed. `git diff --check` before code review.
- GitHub's `Check` run is only verifiable after a human-authorized push or PR; do not push, dispatch, or rerun historical failures without authorization. Caveat: the latest three runs never reached tests/E2E/build, so there may be additional latent failures.
- Planning checks: `pnpm typecheck:tsgo` failed locally with the same TS2345 as CI (expected before fix); `pnpm exec oxfmt --check plans/check-workflow-failures.md` and `node scripts/check-workflow-docs.mjs` passed. No application changes were made.
