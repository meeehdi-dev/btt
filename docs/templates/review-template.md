# Review Notes

Save standalone Review reports and Review/UI human-feedback reports in `reviews/<topic>-<UTC timestamp>.md`. Explicit task paths win per artifact type; preserve input and earlier reports. Review assesses without fixing code or updating the implementation journal.

## Scope reviewed

- Created (UTC) / repository:
- Original plan/report and milestone:
- Branch / HEAD:
- Comparison: uncommitted staged/unstaged/untracked files, or exact branch/base range:
- Complete file set, exclusions, and scope recheck after verification:

## Findings

Use stable IDs; preserve IDs from input reports and distinguish new findings from resolved ones. Explain trigger, impact, precise location, evidence/confidence, and requirement affected.

| ID  | Severity             | File/lines | Finding and evidence | Possible remedy / regression check |
| --- | -------------------- | ---------- | -------------------- | ---------------------------------- |
| R1  | Blocking/Major/Minor | ...        | ...                  | ...                                |

State explicitly if no actionable findings were identified. Keep out-of-scope concerns and unresolved/approved deferrals separate.

## Verification reviewed

- Independently executed exact commands/manual checks and observed outcomes:
- Historical Build evidence inspected, not rerun:
- Gaps, evidence limitations, ownership, and side effects:

## Recommendation and fresh-session handoff

- [ ] No actionable findings; open human diff review with verified comparison scope.
- [ ] Findings; ask whether to revalidate in corrective Plan or explicitly proceed.
- Original plan/report reference, relevant code/tests, unresolved finding IDs, and remediation constraints:
- Next mode and absolute saved plan/report input (after human direction):

A recommendation is not human acceptance. After human diff review ask UI or Finalize. Optional UI uses a separately user-managed app URL and does not waive checks. Finalize cannot invent acceptance or a completion declaration.
