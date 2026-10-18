# Reviews and human feedback

## Artifact convention

- Save standalone independent Review reports and Review/UI human-feedback reports here as `<topic>-<UTC timestamp>.md`, for example `workflow-modes-20261018T104016Z.md`. Use `docs/templates/review-template.md` for independent reviews.
- Focused plans and Plan-produced feedback belong in `plans/<topic>.md`; milestone plan/log/evidence belongs in `docs/milestones/`. Root `PLAN.md` remains the roadmap. Explicit task paths win per artifact type, not for every output.
- Preserve input reports and earlier reports. Never overwrite a review with its corrective plan. Existing historical basenames and timestamps remain their identity, even when recorded creation times differ. No manual report index is required.

## Evidence and handoff

Reports must stand alone: original plan/report reference, exact Git comparison and files/exclusions, stable finding IDs and precise locations, observed evidence, independent checks separated from historical Build results, limitations, and next-step context. Revalidate findings in corrective Plan rather than treating historical reports as current defects. Reference repairs or relocation notes must not rewrite findings, hashes, commands/results, dates, verdicts, or approval history; embedded historical hashes are not current-file checksums.

Review does not fix code or maintain the implementation journal. Findings require human direction for corrective planning or explicitly proceeding; no-findings opens human diff review, not automatic acceptance. Verify Plannotator comparison scope. Tell the human to reply in chat if closing without deciding; silence/closure/failure is not approval.

After human diff review ask UI or Finalize. Optional UI uses an already-running, separately user-managed app without server lifecycle changes; it does not replace required automated browser tests/manual acceptance. Finalize records only actual human decisions and instructed bookkeeping. Human code acceptance and milestone completion declarations remain separate.

See [canonical workflow](../docs/llm-workflow.md#pi-workflow-modes-integration) and [ADR 0062](../docs/decisions/0062-pi-workflow-modes-and-artifact-locations.md).
