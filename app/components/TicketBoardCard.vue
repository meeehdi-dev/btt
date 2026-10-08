<script setup lang="ts">
import { ticketStatusIcon, ticketStatuses, type TicketStatus } from '#shared/ticket-status'
import type { Ticket } from '../../server/db/schema'

type BoardTicket = Pick<
  Ticket,
  'id' | 'title' | 'description' | 'status' | 'estimateMinutes' | 'releaseId'
> & {
  archivedAt: string | null
}

const props = defineProps<{
  item: {
    ticket: BoardTicket
    trackedMinutes: number
    clientId: string
    clientName: string
    projectId: string
    projectName: string
    releaseName: string
    relatedTickets: { id: string; title: string }[]
    externalLinks: { id: string; label: string | null; url: string }[]
  }
  changing: boolean
  busy: boolean
  highlighted: boolean
}>()
const hierarchyItems = computed(() => [
  {
    kind: 'client' as const,
    id: props.item.clientId,
    name: props.item.clientName,
    to: `/clients/${props.item.clientId}`,
  },
  {
    kind: 'project' as const,
    id: props.item.projectId,
    name: props.item.projectName,
    to: `/projects/${props.item.projectId}`,
  },
  {
    kind: 'release' as const,
    id: props.item.ticket.releaseId,
    name: props.item.releaseName,
    to: `/releases/${props.item.ticket.releaseId}`,
  },
])
const emit = defineEmits<{
  'drag-start': [event: DragEvent]
  'drag-end': []
  'related-hover': [id: string | null]
  'related-click': [event: MouseEvent, id: string]
  'change-status': [id: string, status: TicketStatus]
  filter: [kind: 'client' | 'project' | 'release', id: string]
}>()
const statusMenuItems = computed(() =>
  ticketStatuses.map((status) => ({
    label: status,
    icon: ticketStatusIcon(status),
    current: props.item.ticket.status === status,
    disabled: props.busy || !!props.item.ticket.archivedAt || props.item.ticket.status === status,
    onSelect: () => emit('change-status', props.item.ticket.id, status),
  })),
)

let startedOnControl = false
const interactive = 'a, button, input, select, textarea, [role="button"], [role="combobox"]'
function pointerDown(event: PointerEvent) {
  startedOnControl = event.target instanceof Element && !!event.target.closest(interactive)
}
function dragStart(event: DragEvent) {
  if (startedOnControl || (event.target instanceof Element && event.target.closest(interactive))) {
    event.preventDefault()
    return
  }
  emit('drag-start', event)
}
function dragEnd() {
  startedOnControl = false
  emit('drag-end')
}
</script>

<template>
  <EntityCard
    padding="compact"
    border-tone="subtle"
    hover-border-tone="subtle"
    content-spacing="compact"
    :data-board-ticket-id="item.ticket.id"
    :aria-busy="changing"
    :draggable="!item.ticket.archivedAt && !busy"
    content-interactive
    :class="[
      'text-xs',
      highlighted ? 'border-primary/50' : '',
      !item.ticket.archivedAt && !busy ? 'cursor-grab active:cursor-grabbing' : '',
    ]"
    @pointerdown="pointerDown"
    @pointerup="startedOnControl = false"
    @pointercancel="startedOnControl = false"
    @dragstart="dragStart"
    @dragend="dragEnd"
  >
    <template #heading>
      <TicketWorkItem
        mode="ticket-summary"
        :to="`/tickets/${item.ticket.id}${item.ticket.archivedAt ? '?archived=true' : ''}`"
        :title="item.ticket.title"
        :status="item.ticket.status"
        :title-hint="item.ticket.title"
        :tracked-minutes="item.trackedMinutes"
        :estimate-minutes="item.ticket.estimateMinutes"
        :show-percentage="false"
        usage-text-size="xs"
        usage-placement="header"
        header-class="flex min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap"
        title-class="inline-flex min-w-0 items-center gap-1 font-medium text-highlighted hover:text-primary"
        title-text-class="truncate"
        header-usage-class="shrink-0"
      >
        <template #status-icon-action>
          <UTooltip :text="`Change status for ${item.ticket.title}`">
            <UDropdownMenu
              :items="statusMenuItems"
              :content="{ side: 'top', avoidCollisions: false }"
              size="xs"
            >
              <template #item-trailing="{ item }">
                <UIcon
                  v-if="item.current"
                  name="lucide:check"
                  data-slot="ticketStatusCurrentIcon"
                  class="size-4 shrink-0"
                  aria-hidden="true"
                />
              </template>
              <UButton
                size="xs"
                square
                color="neutral"
                variant="ghost"
                :disabled="busy || !!item.ticket.archivedAt"
                :aria-busy="changing || undefined"
                :aria-label="`Change status for ${item.ticket.title} from ${item.ticket.status}`"
                data-ticket-status-trigger
                class="!h-5 !min-h-5 !w-5 !min-w-5 !p-0 !justify-center !text-muted hover:!text-default"
              >
                <UIcon
                  :name="ticketStatusIcon(item.ticket.status)"
                  :data-ticket-status-icon="item.ticket.status"
                  class="size-4 shrink-0"
                  aria-hidden="true"
                />
              </UButton>
            </UDropdownMenu>
          </UTooltip>
        </template>
        <template #title-trailing>
          <UBadge v-if="item.ticket.archivedAt" color="neutral">Archived</UBadge>
          <UBadge v-else-if="changing" color="primary" variant="subtle">Moving…</UBadge>
        </template>
      </TicketWorkItem>
    </template>
    <template #context>
      <div class="flex min-w-0 flex-wrap items-center gap-1" aria-label="Ticket context">
        <TicketHierarchyBadges
          mode="filter-actions"
          truncate-labels
          compact
          scroll
          :items="hierarchyItems"
          class="max-w-full"
          aria-label="Ticket hierarchy"
          @filter="(kind, id) => emit('filter', kind, id)"
        >
          <template #trailing>
            <TicketContextPopovers
              class="shrink-0"
              :related-tickets="item.relatedTickets"
              :external-links="item.externalLinks"
              compact
              @related-hover="emit('related-hover', $event)"
              @related-click="(event, id) => emit('related-click', event, id)"
            />
          </template>
        </TicketHierarchyBadges>
      </div>
    </template>
  </EntityCard>
</template>
