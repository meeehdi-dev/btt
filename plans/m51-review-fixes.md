# M51 review fixes

## Context and references

- Input review: `/Users/mehdi/code/btt/reviews/m51-remove-estimates-relations-and-agenda-hours-20261123T083824Z.md` (findings M51-R1 to M51-R6). Preserved, not edited.
- Original plan: `/Users/mehdi/code/btt/plans/m51-remove-estimates-relations-and-agenda-hours.md`; milestone `docs/milestones/m51-remove-estimates-relations-and-agenda-hours.md`; ADR 0067.
- Human instruction (2026-11-23, chat): write this corrective plan, build the fixes directly, then run a focused review. That instruction approves this plan.

Each finding was checked against the current code. M51-R4 is confirmed: `app/pages/agenda.vue:656-657` puts the separator and `TicketCreateModal` inside the `Agenda filters` group. M51-R1, R2, R3, R5 and R6 were confirmed from the line references in the report.

## Requirements and acceptance criteria

- F1 (M51-R1): ADRs 0012 and 0029 state that day progress and hours use the filtered entries, and that visible hours still never hide work. Each gets a 2026-11-23 Revisions line linking ADR 0067.
- F2 (M51-R2): ADRs 0017, 0031, 0040 and 0048 no longer describe estimates or related tickets as current, and each gets a Revisions line. Once F1–F3 are done, `rg -in "estimate|related|relation" docs/decisions` hits only:
  - the `Estimate` status;
  - Superseded ADRs;
  - ADR 0067;
  - Revisions and history lines.
- F3 (M51-R3): the estimate content is folded out of ADRs 0008 and 0020, with no strikethrough and no partial supersession.
  - Retitle each ADR to its surviving goal and give it a plain `Accepted` status.
  - Remove the estimate Context and Alternatives text.
  - Remove the strikethrough in ADR 0061.
  - Update the titles in the `docs/decisions/README.md` index to match.
- F4 (M51-R4): in `app/pages/agenda.vue`, the separator and `TicketCreateModal` sit after the `Agenda filters` group, as siblings in the toolbar row, like `app/pages/tickets/index.vue:426-432`. `TicketCreateModal.vue` is unchanged.
- F5 (M51-R6): the per-date sum moves into a small helper in `app/utils/agenda-week.ts`, next to `formatHours`. `WeeklyAgenda.vue` calls it with `props.rows`. A unit test covers two dates and a date with no entries.
- F6 (M51-R5): the milestone file and the original plan are updated.
  - In the milestone file, remove "(S1+S2 only)", update the handoff to Review / human code review, and add a journal entry and verification evidence for these fixes.
  - In the original plan, record "Human plan approval: approved in chat 2026-11-23".

## Non-goals

- No behaviour change beyond the F4 markup move and the F5 refactor, which keeps results identical.
- No schema or dependency changes, and no other ADRs.

## Approach and steps

Two builders run in parallel, on disjoint files:

- [ ] Builder A (docs): F1, F2, F3 and F6. Files: `docs/decisions/{0008,0012,0017,0020,0029,0031,0040,0048,0061}-*.md`, `docs/decisions/README.md`, the milestone file, and the original plan's approval line.
- [ ] Builder B (code): F4 and F5. Files: `app/pages/agenda.vue`, `app/components/WeeklyAgenda.vue`, `app/utils/agenda-week.ts`, `tests/unit/agenda-week.test.ts`.

Builder B reports its check results to the parent, and Builder A records them in the milestone. Alternatively, the parent appends them after both builders finish.

## Verification

Run on the final worktree:

- `pnpm format:check`, `lint`, `check:duplicates`, `check:unused`, `typecheck`, `typecheck:tsgo`, `test`, `build`, `check:workflow` and `git diff --check`.
- The `rg` check from F2.

These manual checks are pending and belong to the human:

- The Agenda toolbar looks unchanged, apart from the button now sitting outside the filter group.
- The filtered hours still update when filters change.

After the fixes, a focused `reviewer` pass covers only F1–F6. It saves a new timestamped report in `reviews/`.

## Risks and stop conditions

- Rewording ADR goals must not change any other decision. If unsure, keep the original wording and add a Revisions line.
- Stop if F4 visibly changes the toolbar layout in a way that conflicts with D4.

## Finding disposition

| ID     | Disposition         | Fix |
| ------ | ------------------- | --- |
| M51-R1 | Confirmed           | F1  |
| M51-R2 | Confirmed           | F2  |
| M51-R3 | Confirmed           | F3  |
| M51-R4 | Confirmed           | F4  |
| M51-R5 | Confirmed           | F6  |
| M51-R6 | Confirmed, optional | F5  |

## Approval and fresh-session handoff

- Human plan approval: approved in chat, 2026-11-23 ("write a corrective plan first, then directly start the builders to fix, and do a focused review").
- Next mode: Build (two parallel builders), then a focused Review.
- Absolute input: `/Users/mehdi/code/btt/plans/m51-review-fixes.md`.
