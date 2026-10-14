# M44 discussion record — Entity modals, inline editing, and action toasts

> **Status: Discussion decisions incorporated; formal M44 milestone plan approved via Plannotator session `pn-4d4d72` on 2026-10-13. Implementation, local verification, and Plannotator code review are complete; the human completion declaration is pending.** This file preserves the research and decisions gathered before drafting `docs/milestones/m44-entity-modals-inline-editing-and-action-toasts.md`; evidence is recorded in the milestone journal.

## Context and observed facts

- Standalone create forms currently exist at `app/pages/clients/new.vue`, `app/pages/projects/new.vue`, `app/pages/releases/new.vue`, and `app/pages/tickets/new.vue`; successful creation currently navigates to the new detail page.
- Standalone edit routes exist for clients, projects, and releases. Their forms include metadata, archive state, and archived-only permanent deletion. Ticket edit route `/tickets/:id/edit` was retired in M25.
- Existing create CTAs are on Clients, client detail, project detail, release detail, Ticket Board, and the Agenda's empty-ticket prompt. The Agenda's **Create a ticket** CTA is inside Add completed work when no active tickets exist; it currently navigates to `/tickets/new`. Parent query parameters preselect a client/project/release but leave the selector changeable.
- Ticket detail already owns direct field editing plus title-only, external-link, and relation modals (M25 / ADR 0040). Search results and hierarchy badges navigate to full entity detail pages.
- `app/app.vue` wraps the app in Nuxt UI `UApp`, which provides a bottom-right toaster by default. The installed `useToast()` supports action buttons. No app code currently uses it.
- Mutations use `runClientRequest`/`patchTicket` and `useAppDataInvalidation`. ADRs 0024 and 0051 govern error/partial-success behavior and targeted same-tab invalidation.

## Decisions from Plannotator

### Session `pn-f8b317`

- Retire standalone create and client/project/release edit routes with 404s. Modal state is local, not URL-backed.
- Convert every existing create CTA. Preserve parent preselection while allowing users to change it.
- If a ticket needs a release, open Release creation and resume ticket creation after success.
- Toast explicit domain mutations, but keep direct drag/resize and description autosave quiet at that point in discussion.
- Deliver the work as one combined milestone.

### Session `pn-34ffc3`

- Client/project/release detail pages must be directly editable, with no edit modal. This supersedes the earlier answer about retaining archive/delete inside an edit modal.
- Keep description blur-autosave notifications.
- Toast link/relation changes too; additions remain modal-based and do not have an **Open** action.
- Use partial-success toast plus existing retry UI when a write succeeds but refresh fails; no failure toasts. Creation toasts last about 10 seconds; other toasts about 5 seconds.
- When ticket creation lacks client/project/release parents, preserve the ticket draft through a client → project → release creation-modal chain, then resume ticket creation.

### Session `pn-a29a9d`

- Client, project, and release fields save independently on change/blur with field-level pending/error feedback. Archive/Restore and archived-only Delete are separate detail actions.
- New-ticket link/relation additions use nested add-link/add-relation modals too.

### Session `pn-d33675`

- Remove the Agenda Add completed work modal's **Create a ticket** action when there are no active tickets. Keep ticket creation available from Ticket Board and Release detail; do not preserve/resume the time-entry modal for this state.

## Proposed combined M44 scope

The formal milestone plan at [`docs/milestones/m44-entity-modals-inline-editing-and-action-toasts.md`](../docs/milestones/m44-entity-modals-inline-editing-and-action-toasts.md) proposes:

- Convert all create forms into local modals; no post-create redirect. Each successful entity creation shows an approximately 10-second toast with an **Open [entity]** action.
- Preserve editable parent selectors and convert current creation entry points to modals except the Agenda Add completed work modal's no-active-ticket **Create a ticket** action, which is removed. If a ticket needs missing hierarchy, guide through client → project → release modals, preserve the ticket draft, then resume it with the new release selected.
- Retire all standalone create routes and client/project/release edit routes with 404s.
- Make client/project/release detail fields independently editable and saved on change/blur. Keep Archive/Restore and archived-only Delete as separate detail actions, preserving hierarchy/archive route behavior.
- Keep ticket detail as the normal editable page; only ticket creation becomes a modal. Ticket creation's staged links/relations are entered in nested modals, then included in the ticket-creation request.
- Add approximately 5-second success toasts for entity updates/lifecycle, ticket field/status/priority changes including description blur saves, link/relation add/remove, explicit time-entry create/correction/delete, Release completion, and Settings saves. Direct Agenda drag/resize writes remain quiet. Link/relation toasts have no **Open** action; entity-creation toasts do.
- Do not show failure toasts. For confirmed writes followed by refresh failure, show a partial-success toast and preserve the existing actionable retry UI.
- Preserve APIs, schema, auth, validation, ownership, and data rules; no dependency changes are planned.

The formal M44 plan contains exact implementation files, reuse, acceptance criteria, verification, and review gates. It was approved via Plannotator session `pn-4d4d72`; implementation evidence is tracked in the milestone journal.

## Research/reuse references

- Required reading: `AGENTS.md`, `docs/llm-workflow.md`, `PLAN.md`, `docs/milestones/README.md`, and `docs/templates/milestone-template.md`.
- Relevant decisions: ADR 0024 (client Effect and partial-success feedback), ADR 0040 (ticket detail editing and link/relation modals), ADR 0050 (E2E/server handoff), and ADR 0051 (same-tab invalidation).
- Relevant milestones: M25 ticket detail overhaul and M38 same-tab API invalidation.
- Existing forms/details: `app/pages/{clients,projects,releases,tickets}/{new.vue,[id]/edit.vue,[id]/index.vue}`, `app/pages/clients/index.vue`, `app/pages/tickets/index.vue`, `app/pages/agenda.vue`.
- Existing reusable patterns: `UModal`, `useToast`, `runClientRequest`, `patchTicket`, `useAppDataInvalidation`, ticket-detail field-scoped writes, existing archived-context routes, and current retry/error feedback.

## Journal

### 2026-10-13 — Research and discussion

- Read project workflow/roadmap/ADR and milestone guidance; inspected current create/edit/detail forms, launch CTAs, toast runtime types, and mutation call sites.
- `pn-f8b317`, `pn-34ffc3`, `pn-a29a9d`, and `pn-f62ec7` captured the core decisions above. The final answers specify independent field saves, header placement for archive/delete, nested link/relation modals in ticket creation, and one ticket-created toast (with no draft-only toast).
- Session `pn-a31786` asked whether New ticket can be opened from the Agenda time-entry flow. Code inspection confirms the current Add completed work modal has a **Create a ticket** CTA when there are no active tickets; today it navigates to `/tickets/new`.
- Session `pn-d33675` decided to remove that no-active-ticket CTA; ticket creation remains available from Ticket Board and Release detail.
- At the end of planning, no application code, `PLAN.md`, or ADR had changed. The M44 milestone plan was approved via `pn-4d4d72` on 2026-10-13 before implementation began.
- Formatting and workflow-document checks passed on earlier draft iterations; rerun them on both final planning artifacts before plan approval.

## Status

- Core discussion decisions: incorporated.
- Agenda no-active-ticket create action: remove, as decided in Plannotator.
- Formal M44 plan: Approved via Plannotator session `pn-4d4d72` on 2026-10-13.
- Implementation, local verification, and code review: complete; the human completion declaration remains pending. See the M44 milestone journal.
