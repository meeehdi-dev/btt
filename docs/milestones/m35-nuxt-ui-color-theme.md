# M35 — Nuxt UI semantic color theme

> **Status: Complete by the user's declaration on 2026-10-08. Code review was accepted; browser checks were explicitly deferred and are not claimed as passing.**

## Context

The user requests Nuxt UI `neutral: zinc` and `primary: amber`, and asks whether `secondary: blue` is used and whether its contrast is appropriate. The user also asks for recommendations on other colors in use.

### Observed facts

- `app/app.config.ts` currently customizes card spacing, but does not set semantic colors. The installed Nuxt UI 4.11.3 defaults are primary green, secondary blue, info blue, success green, warning yellow, error red, and neutral slate.
- `secondary` is used in `app/components/TicketHierarchyBadges.vue` for the compact client/project/release hierarchy controls. The compact controls use a soft secondary surface and explicit `text-secondary-700 dark:text-secondary-300` on their icons and labels; blue is a distinct cool accent beside the proposed warm amber primary.
- Primary is used for links, focus/selection treatments, and action styling across the app, so its contrast matters beyond solid buttons.
- `info`, `success`, `warning`, and `error` are used for tracked-time ratio bands and feedback. ADR 0020 defines the bands as info below 80%, success from 80% to below 100%, warning from 100% through 120%, and error above 120%; the product roadmap describes these as blue, green, orange, and red.
- Client/project colors are separate user-managed entity colors. `ColorSelector.vue`, the client/project defaults, and existing persisted values do not use Nuxt UI semantic color aliases.
- Nuxt UI documents light/dark semantic shade overrides through `--ui-primary`-style variables. The default semantic shade is 500 in light mode and 400 in dark mode. Local WCAG contrast calculations using the installed Tailwind CSS 4.3.3 OKLCH palette show amber-500 on white at 1.95:1, while amber-800 on white is 5.73:1 and amber-200 on zinc-900 is 12.41:1. Thus, choosing the amber palette alone does not make the default primary text/button treatment sufficiently contrasted.

## Approved scope

**Approved via Plannotator on 2026-10-08 after incorporating all three first-pass answers.** The choices below record the approved scope.

- Set Nuxt UI semantic palettes explicitly: primary amber, neutral zinc, and secondary blue. Keep info blue, success green, and error red. Set warning orange to align the existing 100–120% tracked-time band with the product's documented orange meaning.
- Override semantic shade tokens in the existing global stylesheet for contrast: use primary amber-800 in light mode and amber-200 in dark mode; use shade 800 for other semantic foreground/action colors in light mode and shade 300 in dark mode. Confirm the resulting actual component foreground/background contrast in the browser rather than relying only on palette names.
- Preserve the secondary-blue hierarchy badge use and its existing compact treatment, as selected in the first Plannotator review.
- Keep ratio boundaries, status meanings, project/client custom colors, existing stored color values, UI structure, and behavior unchanged.
- Add focused theme/contrast regression coverage and perform a supported-width live visual review.
- The approved M35 roadmap entry and ADR 0049 record the semantic palette and contrast policy. ADR 0049 was accepted after Plannotator code review on 2026-10-08.

## Out of scope

- Changing client/project color values, their defaults, the preset/custom color picker, or stored data.
- Changing estimate-usage thresholds, domain/status rules, APIs, database/schema, authentication, dependencies, deployment, or supported viewport sizes.
- A broad redesign, typography/spacing changes, or a complete application accessibility audit unrelated to the selected semantic palette.
- Implementation before this plan is approved.

## Source references

- `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`
- `docs/milestones/README.md`, `docs/templates/milestone-template.md`
- `docs/milestones/m32-ticket-board-status-icons-cards-and-done-visibility.md` — current semantic usage colors and compact secondary hierarchy badges
- `docs/milestones/m34-agenda-board-status-icon-menus.md` — latest completed UI milestone and workflow state
- ADR 0020 — tracked-time ratio colors; ADR 0047 — muted tracked time without estimates; ADR 0048 — current Agenda/Board presentation policy
- `.agents/skills/nuxt-ui/SKILL.md` and the pinned Nuxt UI maintainer [design-system guidance](https://github.com/nuxt/ui/blob/187c34f0234a769da2c7c344f93d6c603d0bb514/skills/nuxt-ui/references/guidelines/design-system.md)
- `app/app.config.ts`, `app/assets/css/main.css`, `app/components/TicketHierarchyBadges.vue`, `app/components/TicketTrackedUsage.vue`, `app/components/ColorSelector.vue`, `shared/time-entry.ts`
- `tests/e2e/ticket-context-popovers.test.ts` and existing Agenda/Ticket Board browser coverage

## Approach

1. **Set semantic roles explicitly:** configure `primary: 'amber'`, `neutral: 'zinc'`, and recommended `secondary: 'blue'`. Preserve `info: 'blue'`, `success: 'green'`, and `error: 'red'`; propose `warning: 'orange'` so the warning semantic matches its existing ratio-band meaning.
2. **Use contrast-aware semantic shades:** in `app/assets/css/main.css`, set `--ui-primary` to amber-800 for light mode and amber-200 for dark mode. Set secondary/info/success/warning/error foreground/action tokens to shade 800 in light mode and shade 300 in dark mode. These values keep the requested palette names while avoiding the low-contrast default amber-500/green-500/orange-500 foregrounds. Keep neutral surface/text tokens controlled by Nuxt UI's zinc palette unless browser checks reveal a regression.
3. **Test actual rendered roles:** add a focused Playwright test that checks primary link and solid-button contrast, soft secondary hierarchy badge text/surface, and representative info/success/warning/error usage treatments in light mode and with the dark class. Use computed colors and WCAG contrast calculations; target at least 4.5:1 for normal text and 3:1 for large text/non-text indicators where applicable. Preserve keyboard focus visibility and check for any new contrast regression in focused states.
4. **Review the UI in context:** inspect the Agenda, Ticket Board, hierarchy badges, primary links/actions, and tracked-time ratio bands at 1280 CSS px. Confirm amber is visibly the primary accent without masking the distinct semantic blue/green/orange/red meanings; inspect both supported theme classes where practical.
5. **Record the decision and evidence:** M35 is listed in `PLAN.md`, and Proposed ADR 0049 is indexed. Run focused browser checks and project quality gates; record actual contrast results, visual checks, deviations, and review status here. Keep ADR 0049 Proposed until human code review accepts the implementation.

## Files to modify

- `app/app.config.ts` — explicit Nuxt UI semantic palette names.
- `app/assets/css/main.css` — light/dark semantic shade overrides; retain existing imports and page color-scheme behavior.
- `tests/e2e/color-theme.test.ts` — computed-color/contrast coverage for primary, secondary, and the usage ratio semantics.
- `PLAN.md` — add the approved M35 summary after plan approval.
- `docs/decisions/0049-nuxt-ui-semantic-color-theme.md` and `docs/decisions/README.md` — ADR 0049 and its status index, updated after human code review.
- `docs/milestones/m35-nuxt-ui-color-theme.md` — this plan, implementation journal, verification evidence, code review, and closeout.

No other files are expected unless focused test setup requires a narrow, justified addition.

## Reuse

- Reuse the current Nuxt UI v4 `ui.colors` semantic mapping and CSS variable shade customization described in the pinned maintainer design-system guidance.
- Reuse `TicketHierarchyBadges.vue`'s existing secondary-colored compact hierarchy actions and `shared/time-entry.ts`'s `usageColor` mapping; do not fork or change the ratio logic.
- Reuse `TicketTrackedUsage.vue` and existing Agenda/Board pages as realistic rendered surfaces for contrast checks.
- Preserve `ColorSelector.vue` and its entity-specific color values unchanged.

## Decisions and ADR links

- User direction: primary amber and neutral zinc.
- Plannotator selected secondary blue for hierarchy badges, warning orange, and amber-800/light plus amber-200/dark for primary text/buttons. The revised M35 plan was explicitly approved on 2026-10-08.
- Existing ADR 0020 and ADR 0047 remain authoritative for usage-color thresholds and unestimated tracked-time treatment. No data or behavior decision is proposed.
- ADR 0049 records the approved semantic palette and contrast shades; its status is Accepted after human code review.

## Implementation checklist

- [x] Receive Plannotator approval; incorporate its answers/annotations before implementation.
- [x] Set explicit semantic palette names in `app/app.config.ts` within the approved choices.
- [x] Add contrast-aware light/dark semantic shade overrides in `app/assets/css/main.css` within the approved choices.
- [x] Add focused browser assertions for actual semantic text/background contrast and preserve existing hierarchy, ratio, and theme behavior.
- [x] After plan approval, add the M35 roadmap entry and ADR 0049, indexed in `docs/decisions/README.md`; ADR 0049 is now Accepted after human code review.
- [x] Run local non-browser quality checks/build and record exact outcomes; focused/full browser execution and live review are explicitly deferred below.
- [x] Defer focused/full Playwright execution and the 1280 CSS px visual/keyboard-focus review by the user's completion declaration; these checks were not run and are not claimed as passing.
- [x] Submit the full implementation diff for human code review; accept ADR 0049 only after review.
- [x] Record the user's completion declaration before closing M35.

## Journal

### 2026-10-08 — Planning research

- Fact: the app does not define `ui.colors` in source; the installed Nuxt UI defaults are primary green, secondary blue, info blue, success green, warning yellow, error red, and neutral slate. The app's custom `ui` config is limited to card spacing.
- Fact: `secondary` is used by the compact hierarchy badge controls in `TicketHierarchyBadges.vue`; their labels/icons explicitly use secondary shade 700 in light mode and shade 300 in dark mode.
- Fact: primary is used for application links and active/focus styling. Semantic info/success/warning/error tokens drive ticket usage colors and feedback; warning currently resolves through Nuxt UI's yellow default even though the ratio band is described as orange.
- Fact: client/project color data and selector presets are independent from Nuxt UI semantic palette roles.
- Fact: upstream Nuxt UI design-system guidance documents `ui.colors` and semantic shade overrides. Installed Tailwind CSS 4.3.3 palette contrast calculations gave amber-500/white 1.95:1, amber-800/white 5.73:1, amber-200/zinc-900 12.41:1, blue-700/white 5.69:1, and blue-300/zinc-900 9.05:1. Additional semantic shade calculations informed the recommended orange/green/red contrast treatment.
- Decision proposed: configure the requested amber/zinc roles explicitly, keep blue as secondary, align warning with orange, and use contrast-aware shades without changing ratio meanings or entity color data.
- Evidence: read required project workflow/roadmap, M32/M34 records, ADR 0020/0047/0048, app theme and color-use files, the pinned Nuxt UI maintainer design-system guidance, Nuxt UI generated defaults/themes, and Tailwind CSS 4.3.3 palette tokens. `git status --short --branch` was clean on `main` before writing this plan. No app source, roadmap, or ADR has been changed.

### 2026-10-08 — First Plannotator review

- Fact: Plannotator answered all three questions but returned `decision: annotated`, not plan approval.
- Decision incorporated: keep secondary blue for hierarchy badges; map warning to orange; use amber-800 in light mode and amber-200 in dark mode for primary semantic text/buttons. These choices are recorded in the proposed scope and Decisions section.
- Status: explicit plan approval remained pending. No implementation had begun.
- Evidence: `plannotator annotate docs/milestones/m35-nuxt-ui-color-theme.md --gate --json --require-approval` returned `decision: annotated` with 3/3 answers; the exact choices are recorded above.

### 2026-10-08 — Revised plan approved

- Decision: Plannotator approved M35 with the requested primary amber and neutral zinc, secondary blue for compact hierarchy badges, warning orange, and contrast-aware primary shades amber-800/light and amber-200/dark. The approved scope preserves the info/success/error meanings and existing entity-color data.
- Evidence: after incorporating the first-round answers, `plannotator annotate docs/milestones/m35-nuxt-ui-color-theme.md --gate --json --require-approval` returned `{"decision":"approved"}`. The workflow documentation check, Oxfmt check, and whitespace check passed on the revised plan.
- Status: plan approved. Implementation is authorized only within the approved scope.

### 2026-10-08 — Roadmap and proposed ADR

- Fact: the approved roadmap and ADR updates describe only the semantic palette and contrast policy; client/project color data remains out of scope.
- Decision: added M35 to `PLAN.md` and drafted/indexed Proposed ADR 0049. ADR 0049 will remain Proposed until implementation code review is accepted.
- Evidence: M35 is now linked from the roadmap and ADR index. No application source had been changed at this stage.

### 2026-10-08 — Theme implementation and local verification

- Fact: `app/app.config.ts` now explicitly maps primary amber, secondary/info blue, success green, warning orange, error red, and neutral zinc. `app/assets/css/main.css` uses primary shade 800 in light mode and 200 in dark mode; other semantic accents use shade 800/light and shade 300/dark.
- Fact: added `tests/e2e/color-theme.test.ts` with computed contrast assertions for the login primary text/solid button, real secondary hierarchy badges, and usage text for info/success/warning/error in light and dark contexts. Its seed values exercise 60%, 90%, 120%, and 150% estimate usage. The test has not executed in a browser yet.
- Fact: Nuxt UI's generated runtime bundle contains the explicit app palette; its color plugin builds the `--ui-color-*-<shade>` variables from `useAppConfig`. No user-managed entity color defaults or stored values were changed.
- Evidence: installed Tailwind CSS 4.3.3 palette calculations show primary amber-800 at 5.73:1 against white and 6.48:1 against zinc-100; amber-200 at 12.41:1 against zinc-900 and 11.95:1 against zinc-800. Other semantic text shades at 800/light and 300/dark exceed 4.5:1 against their zinc surface; secondary badge label blue-700/dark blue-300 calculations against their blended soft surfaces are 5.54:1 and 7.34:1. These are palette calculations, not browser measurements.
- Verification: `./node_modules/.bin/oxfmt --check` passed for changed files; `./node_modules/.bin/oxlint .` passed; `./node_modules/.bin/nuxt typecheck` passed; `./node_modules/.bin/tsgo --project tsconfig.tsgo.json --noEmit` passed; `./node_modules/.bin/vitest run` passed (14 files, 75 tests); `./node_modules/.bin/nuxt build` completed; workflow-doc validation and `git diff --check` passed. Build emitted non-fatal Rolldown/Vite plugin-timing warnings.
- Browser limitation: `PLAYWRIGHT_SKIP_DEV_SERVER=1 ./node_modules/.bin/playwright test --list tests/e2e/color-theme.test.ts` discovered 1 test but did not execute it. `curl -fsS --max-time 2 http://127.0.0.1:3000/api/health` failed because no server was listening. Per the user's existing request recorded in M34, the agent did not start the dev server; focused/full Playwright and the 1280 CSS px visual review remain pending.

### 2026-10-08 — Human code review

- Decision: Plannotator code review completed with no changes requested; human code review is accepted. ADR 0049 is now Accepted and indexed accordingly.
- Evidence: `plannotator review --git --no-git-remote-check` returned “Code review completed — no changes requested.”

### 2026-10-08 — Completion declaration

- Decision: the user declared M35 complete: “i declare this milestone complete.”
- Deferral: the focused color-theme Playwright test, full Playwright suite, and live 1280 CSS px visual/keyboard-focus review were not run. Following the user's declaration after the pending checks were reported, these items are explicitly deferred, not recorded as passing.
- Status: M35 Complete by user declaration; no browser-measured contrast results are claimed.

## Verification

Planning artifact checks:

- [x] `node scripts/check-workflow-docs.mjs` — passed: “Workflow documentation structure looks complete.”
- [x] `./node_modules/.bin/oxfmt --check docs/milestones/m35-nuxt-ui-color-theme.md` — passed.
- [x] `git diff --no-index --check /dev/null docs/milestones/m35-nuxt-ui-color-theme.md` — no whitespace diagnostics; normalized the expected untracked-file exit code.
- [x] First Plannotator decision and answers recorded above; the revised plan was explicitly approved via Plannotator on 2026-10-08.

Implementation verification (after approval):

- [x] `./node_modules/.bin/oxfmt --check` on changed files — passed.
- [x] `./node_modules/.bin/oxlint .` — passed.
- [x] `./node_modules/.bin/nuxt typecheck` and `./node_modules/.bin/tsgo --project tsconfig.tsgo.json --noEmit` — passed.
- [x] `./node_modules/.bin/vitest run` — 14 files, 75 tests passed.
- [x] `./node_modules/.bin/nuxt build` — completed; non-fatal Vite/Rolldown plugin-timing warnings emitted.
- [x] `node scripts/check-workflow-docs.mjs` and `git diff --check` — passed.
- [x] `PLAYWRIGHT_SKIP_DEV_SERVER=1 ./node_modules/.bin/playwright test --list tests/e2e/color-theme.test.ts` — discovered 1 test; listing does not execute a browser test.
- [x] Focused `PLAYWRIGHT_SKIP_DEV_SERVER=1 ./node_modules/.bin/playwright test tests/e2e/color-theme.test.ts --workers=1` — explicitly deferred by the user's completion declaration; not run because no server was listening on port 3000, and not claimed as passing.
- [x] Full Playwright regression suite — explicitly deferred by the user's completion declaration; not run and not claimed as passing.
- [x] Manual 1280 CSS px visual and keyboard-focus review of Agenda, Ticket Board, primary actions/links, hierarchy badges, and each tracked-time ratio band — explicitly deferred by the user's completion declaration; not performed and not claimed as passing.

## Review status

- Plan review: Approved via Plannotator on 2026-10-08 after incorporating the three first-pass answers.
- Code review: Accepted via Plannotator on 2026-10-08; no changes requested.
- Milestone completion declaration: Received from the user on 2026-10-08; M35 Complete. Outstanding browser and visual checks are explicitly deferred, not passed.

## Follow-ups

- Focused/full browser checks and the 1280 CSS px live review were explicitly deferred by the user's completion declaration. The local app server was stopped per the user's existing request that they run it themselves; these checks are not claimed as passed.
- Broader accessibility findings outside semantic color/focus behavior should be proposed separately.

## Closeout checklist

- [x] Approved checklist complete or explicitly deferred.
- [x] Verification evidence recorded.
- [x] Human code review accepted.
- [x] Human completion declaration recorded in the journal and review status.
