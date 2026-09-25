# M3 follow-up — related-ticket shortcuts and entity navigation icons (approved)

## Context

The M3 board currently shows client/project/release names as plain text (`app/components/TicketBoardCard.vue`) and does not reveal related tickets there. Users cannot navigate directly from a card to its client, project or release. Entity labels elsewhere use text without a consistent icon language. M3 is reviewed but not yet declared complete; this is a separately approved UI/API read-model follow-up, not a new milestone.

## Approach

- **Ticket cards:** keep the ticket title linked to its detail page. Add compact clickable client, project and release **names**, each preceded by a consistent type icon (client: `lucide:building-2`; project: `lucide:folder-kanban`; release: `lucide:flag`; ticket: `lucide:ticket`; related: `lucide:link-2`; Today: `lucide:calendar-days`; Settings: `lucide:settings-2`). Replace generic type words/separators where they occupy space, **not** the actual entity names or accessible form labels. Use separate `NuxtLink`s, never nested links; all internal links use same-tab navigation. Keep archived/hidden parent behavior and existing responsive board.
- **Related-ticket shortcuts:** expose each visible, owned related ticket on its board card as an icon-only link with accessible name/tooltip containing its title. Hovering the icon gives the target card a soft, visible border highlight if it is on the board; mouseout restores any previously pinned highlight. Clicking a visible target pins the highlight (until another selection or navigation) and scrolls the board/viewport to that card; on mobile, first expand its collapsed status section, then scroll it into view. Use unobtrusive border color, not a full-card overlay or new tab. Modifier/middle-click still follows the real ticket-detail URL. If the target is not on the current board because a release filter excludes it, a normal click navigates to its detail page in the same tab rather than silently doing nothing. If no visible related tickets exist, omit the icon area. Do not expose titles of archived tickets or descendants of archived parents; the underlying relation remains and its shortcut reappears when the target is restored. Avoid per-card API calls by expanding `GET /api/tickets` in one batched read; include parent IDs and related target `{id,title}` records for the visible board tickets. Keep release filtering from hiding valid cross-release related targets; do not change relation write behavior or database schema.
- **Other surfaces:** use the same mapping for dashboard navigation, hierarchy list/detail headings and breadcrumbs, ticket detail hierarchy/related links, and release ticket links. Preserve visible text for accessible navigation and distinct names; icon-only controls get explicit accessible labels and tooltips. Do not replace prose, form field labels, or destructive action names with pictograms. Keep existing color dots, archive indicators and clock icon.
- No new icon package: use installed Nuxt Icon/Lucide conventions (`UIcon`, `UButton` icon props). Verify icon IDs and Nuxt UI tooltip/icon behavior before implementation. No auth, schema, dependency, or deployment change. Record evidence in M3 journal and request another human code review before completion.

## Files to modify

- `server/api/tickets/index.get.ts` — select client/project IDs and batch-query valid related ticket targets for board responses; `server/api/tickets/[id].get.ts` only if needed for consistent detail presentation.
- `app/components/TicketBoardCard.vue`, `app/pages/tickets/index.vue`, `app/pages/tickets/[id]/index.vue` — card hierarchy links, relation shortcuts, hovered/pinned highlight state, scrolling/mobile expansion, detail links and status display.
- `app/layouts/dashboard.vue`, `app/pages/clients/index.vue`, `app/pages/clients/[id]/index.vue`, `app/pages/projects/index.vue`, `app/pages/projects/[id]/index.vue`, `app/pages/releases/[id]/index.vue`; ticket create/edit and hierarchy create/edit breadcrumbs/headings where entity type is shown. Keep login as-is.
- Small shared icon mapping/component under `app/` if it meaningfully reduces duplication; `tests/e2e/tickets.test.ts` and targeted unit tests for mapping if added; `docs/milestones/m3-tickets-mvp.md`, this plan; ADR only if a durable navigation/visibility rule emerges.

## Reuse

- `server/api/tickets/[id].get.ts` already resolves related ticket titles and filters archived targets/parents; apply the same visibility rule without its per-relation/per-card query pattern.
- `server/api/tickets/index.get.ts` already joins client → project → release for owner/archival filtering; return IDs from those joins.
- `app/components/TicketBoardCard.vue` is reused by both desktop lanes and mobile collapsibles (`app/pages/tickets/index.vue`), so one card change covers both.
- `UIcon` with Lucide names and `NuxtLink` already appear in `app/components/TicketEstimate.vue`, `app/components/ReleaseTargetDate.vue` and existing hierarchy pages. Icon IDs were checked via Iconify SVG API; the existing Nuxt UI [Icon](https://ui.nuxt.com/docs/components/icon) and [Tooltip](https://ui.nuxt.com/docs/components/tooltip) references cover the proposed icon/tooltip primitives. No dependency needed.

## Decisions to validate in review

- Interpretation of “replace the text with the icon”: replace **type prefixes** with icons while keeping the client/project/release/ticket **names** as visible clickable links; navigation keeps icon + text, not unlabeled icon-only buttons. This preserves the requested clickable labels and accessibility. If icon-only navigation was intended, annotate this plan before approving.
- Show **one icon per visible related ticket** (tooltip/accessibility label has its title), not a single link to an arbitrary ticket. Clicking locates and pins a target already present in this board; clicking a target filtered out of this board navigates to its detail, and modifier/middle-click can always use the actual href. Pinning lasts until another relation shortcut is selected or the page is left. Archived/invisible related targets do not get shortcuts; the underlying relation remains and will reappear when the target is restored. The current API supports symmetric cross-release relations.

## Steps

- [x] Plan approved via Plannotator after incorporating hover/pinned highlight and scroll-to-target feedback; implementation started after approval.
- [x] Add parent IDs and batched, owned/visible relation targets to ticket list responses, with release-filter and archived-target coverage.
- [x] Introduce a small shared icon mapping; add navigable hierarchy labels and related-ticket icon shortcuts to the shared card, detail and authenticated navigation/hierarchy surfaces, with shared hover/pinned state and keyboard-accessible click behavior.
- [x] Add API and desktop/mobile browser tests for multiple/cross-release relations, no-relations/archived targets, hover/mouseout vs pinned border, off-screen scrollIntoView, mobile target-lane expansion, filtered-target fallback, parent links, keyboard/accessible icon labels and no page overflow.
- [x] Run formatting, lint, typecheck, unit/browser tests, build, workflow check; record evidence in the M3 journal and submit for human code review. Human code review was accepted and the separate M3 completion declaration recorded on 2026-09-25.

## Verification

- `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm exec playwright test --workers=1`, `pnpm build`, `pnpm check:workflow`; `git diff --check`.
- Manual/browser: from a card, clicking each client/project/release name reaches its owned detail in the same tab; relation icon hover highlights its target, mouseout removes hover-only highlight, click pins it and scrolls to an off-screen card (or expands and scrolls mobile), while filtered-out targets navigate to detail; empty relation area stays absent; an archived/hidden target does not leak its title/icon; seven-lane desktop and collapsed mobile boards retain layout; icon-only links have usable tooltips and accessible names.
