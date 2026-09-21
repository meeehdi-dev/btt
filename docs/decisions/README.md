# Decision Records

This directory stores architectural/product/workflow decisions that future agents should treat as durable context.

## Format

Use `docs/templates/adr-template.md` for new records.

Filename format:

```text
NNNN-short-descriptive-slug.md
```

- `NNNN` is a four-digit sequential number.
- The slug should be lowercase kebab-case.
- Do not renumber existing ADRs.

## Status values

- `Proposed` — drafted but not approved.
- `Accepted` — approved and currently authoritative.
- `Superseded` — replaced by a newer ADR. Link the superseding ADR.
- `Deprecated` — no longer recommended, but not directly replaced.

## Rules

- Add an ADR for decisions that affect architecture, data model, auth/security, dependency strategy, deployment, workflow, or product scope.
- Keep ADRs concise: context, decision, consequences, alternatives considered, links.
- Link ADRs from milestone files and relevant docs.
- If a decision changes, create a new ADR and mark the old one as `Superseded`; do not rewrite history except for typo/link fixes.
- Prefer facts and tradeoffs over persuasive prose.

## Index

| ADR | Status | Title |
| --- | --- | --- |
| [0001](0001-llm-assisted-development-workflow.md) | Accepted | LLM-assisted development workflow |
