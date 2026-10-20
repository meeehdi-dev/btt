# M47 human review question

## References

- Plan: `/Users/mehdi/code/btt/plans/release-done-tickets-bottom.md`
- Independent review: `/Users/mehdi/code/btt/reviews/release-done-tickets-bottom-20261020T170744Z.md`
- Plannotator session: `pn-83979c`, changes requested, comparison all changes since `b442581575ebba538a7e481c3779dc11ebd428e3`, including untracked files.

## Submitted input and verdict

F1 — `app/pages/releases/[id]/index.vue:196–205`: human asks “what's this?” about focus recovery.

**Verdict: Intended.** Newly introduced by M47, deliberately addressing approved requirement R5. Moving a card between the separately keyed unfinished/Done grids destroys its old DOM element, which can lose keyboard focus. After pending state is cleared and Vue finishes rendering (`nextTick`), the code checks that the requested change crosses the Done boundary and focus is on `document.body`. Only then does it focus the matching ticket's replacement status combobox. If another element has focus, it leaves that focus alone. The grouping browser regression asserts focus after both boundary transitions.

This is a request for explanation, not evidence of a defect. No source changes made; acceptance and any requested adjustment remain pending discussion. No further issues were reviewed or checks rerun for this incoming question.

## Fresh Plan context if later requested

Revalidate any subsequent human adjustment against R5 and actual focus behavior; do not remove focus recovery solely because the human asked what it does. Preserve the plan and original review. No corrective implementation is authorized by this question.
