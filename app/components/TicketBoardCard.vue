<script setup lang="ts">
import type { TicketPriorityValue } from '#shared/ticket-priority'
import type { TicketStatus } from '#shared/ticket-status'
import type { Ticket } from '../../server/db/schema'

type BoardTicket = Pick<
  Ticket,
  'id' | 'title' | 'description' | 'status' | 'priority' | 'releaseId'
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
    externalLinks: { id: string; label: string | null; url: string }[]
  }
  changing: boolean
  busy: boolean
  priorityBusy: boolean
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
  'change-status': [id: string, status: TicketStatus]
  'change-priority': [id: string, priority: TicketPriorityValue]
  filter: [kind: 'client' | 'project' | 'release', id: string]
}>()
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
        usage-text-size="xs"
        usage-placement="header"
        header-class="flex min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap"
        title-class="inline-flex min-w-0 items-center gap-1 font-medium text-highlighted hover:text-primary"
        title-text-class="truncate"
        header-usage-class="flex shrink-0 items-center"
      >
        <template #status-icon-action>
          <TicketStatusMenu
            :ticket-title="item.ticket.title"
            :status="item.ticket.status"
            :busy="busy"
            :disabled="!!item.ticket.archivedAt"
            :item-disabled="!!item.ticket.archivedAt"
            :busy-indicator="changing"
            compact
            @change="emit('change-status', item.ticket.id, $event)"
          />
        </template>
        <template #title-trailing>
          <UBadge v-if="item.ticket.archivedAt" color="neutral">Archived</UBadge>
          <UBadge v-else-if="changing" color="primary" variant="subtle">Moving…</UBadge>
        </template>
      </TicketWorkItem>
    </template>
    <template #context>
      <div class="flex min-w-0 flex-wrap items-center gap-1" aria-label="Ticket context">
        <TicketPriorityMenu
          :ticket-title="item.ticket.title"
          :priority="item.ticket.priority"
          :busy="priorityBusy"
          :disabled="!!item.ticket.archivedAt"
          compact
          @change="emit('change-priority', item.ticket.id, $event)"
        />
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
            <TicketContextPopovers class="shrink-0" :external-links="item.externalLinks" compact />
          </template>
        </TicketHierarchyBadges>
      </div>
    </template>
  </EntityCard>
</template>
