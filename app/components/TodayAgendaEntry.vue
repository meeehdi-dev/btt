<script setup lang="ts">
import type { AgendaTicketFields } from '#shared/agenda'
import type { TicketPriorityValue } from '#shared/ticket-priority'
import type { TicketStatus } from '#shared/ticket-status'
import { formatTicketEstimate } from '~/utils/ticket-estimate'

type Row = AgendaTicketFields & {
  entry: {
    id: string
    date?: string
    startMinute: number
    durationMinutes: number
    description: string
  }
}
const props = defineProps<{
  row: Row
  statusBusy?: boolean
  priorityBusy?: boolean
  compactTimeline?: boolean
}>()
const spacious = computed(() => props.row.entry.durationMinutes >= 60)
// The Week timeline has less height per minute, so use a conservative shared threshold.
const minimumHierarchyWrapDurationMinutes = 90
const hierarchyCanWrap = computed(
  () => props.row.entry.durationMinutes >= minimumHierarchyWrapDurationMinutes,
)
const emit = defineEmits<{
  filter: [kind: 'client' | 'project' | 'release' | 'ticket', id: string]
  edit: []
  'change-status': [id: string, status: TicketStatus]
  'change-priority': [id: string, priority: TicketPriorityValue]
}>()
function onDoubleClick(event: MouseEvent) {
  if (
    event.target instanceof Element &&
    event.target.closest('a,button,input,select,textarea,[role="button"],[role="combobox"]')
  )
    return
  event.stopPropagation()
  emit('edit')
}
const archived = computed(
  () =>
    !!(
      props.row.clientArchivedAt ||
      props.row.projectArchivedAt ||
      props.row.releaseArchivedAt ||
      props.row.ticketArchivedAt
    ),
)
const ticketUrl = computed(
  () => `/tickets/${props.row.ticketId}${archived.value ? '?archived=true' : ''}`,
)
const timeLabel = computed(() => formatTicketEstimate(props.row.entry.durationMinutes))
const hierarchyItems = computed(() => [
  {
    kind: 'client' as const,
    id: props.row.clientId,
    name: props.row.clientName,
    to: `/clients/${props.row.clientId}${props.row.clientArchivedAt ? '?archived=true' : ''}`,
  },
  {
    kind: 'project' as const,
    id: props.row.projectId,
    name: props.row.projectName,
    to: `/projects/${props.row.projectId}${props.row.clientArchivedAt || props.row.projectArchivedAt ? '?archived=true' : ''}`,
  },
  {
    kind: 'release' as const,
    id: props.row.releaseId,
    name: props.row.releaseName,
    to: `/releases/${props.row.releaseId}${props.row.clientArchivedAt || props.row.projectArchivedAt || props.row.releaseArchivedAt ? '?archived=true' : ''}`,
  },
])
</script>
<template>
  <article
    :data-agenda-ticket-id="row.ticketId"
    class="flex h-full min-w-0 flex-col justify-between overflow-hidden rounded-lg border border-accented/50 bg-elevated text-xs"
    :class="[
      compactTimeline
        ? 'agenda-entry-draggable gap-1 p-1 cursor-grab active:cursor-grabbing transition-colors hover:border-primary/50 focus-within:border-primary/50'
        : 'gap-1 p-2',
    ]"
    @dblclick="onDoubleClick"
  >
    <div class="flex min-w-0 items-center justify-between gap-1">
      <TicketWorkItem
        mode="entry"
        :to="ticketUrl"
        :title="row.ticketTitle"
        :status="row.status"
        :title-hint="row.ticketTitle"
        :time-label="timeLabel"
        class="min-w-0 flex-1"
      >
        <template #status-icon-action>
          <TicketStatusMenu
            :ticket-title="row.ticketTitle"
            :status="row.status"
            :busy="statusBusy || priorityBusy"
            :loading="statusBusy"
            :item-disabled="archived"
            :busy-indicator="statusBusy || priorityBusy"
            :compact="compactTimeline"
            @change="emit('change-status', row.ticketId, $event)"
          />
        </template>
        <template #entry-title-action>
          <UTooltip :text="`Filter by ${row.ticketTitle}`">
            <UButton
              size="xs"
              square
              color="neutral"
              variant="soft"
              icon="lucide:filter"
              :ui="compactTimeline ? { leadingIcon: '!size-3' } : undefined"
              :aria-label="`Filter by ${row.ticketTitle}`"
              :class="[
                '!bg-default !text-muted hover:!text-default',
                compactTimeline ? '!h-5 !min-h-5 !w-5 !min-w-5 !p-0 !justify-center' : '',
              ]"
              @click.stop="emit('filter', 'ticket', row.ticketId)"
            />
          </UTooltip>
        </template>
        <template #entry-trailing>
          <span
            v-if="row.entry.description && !spacious"
            class="inline-flex min-w-0 items-center gap-1 truncate text-muted"
            :title="row.entry.description"
            ><UIcon name="lucide:align-left" class="size-4 shrink-0" aria-hidden="true" /><span
              class="truncate"
              >{{ row.entry.description }}</span
            ></span
          >
        </template>
      </TicketWorkItem>
    </div>
    <p
      v-if="spacious && row.entry.description"
      class="min-h-0 flex-1 overflow-auto whitespace-pre-wrap break-words text-muted"
    >
      <UIcon
        name="lucide:align-left"
        class="mr-1 inline-flex size-4 align-middle"
        aria-hidden="true"
      />{{ row.entry.description }}
    </p>
    <div v-else-if="spacious" class="flex-1" aria-hidden="true" />
    <div
      class="flex min-w-0 shrink-0 gap-1"
      :class="compactTimeline && !hierarchyCanWrap ? 'flex-nowrap' : 'flex-wrap'"
      aria-label="Entry context"
    >
      <TicketPriorityMenu
        :ticket-title="row.ticketTitle"
        :priority="row.priority"
        :busy="priorityBusy || statusBusy"
        :disabled="archived"
        :compact="compactTimeline"
        @change="(priority) => emit('change-priority', row.ticketId, priority)"
      />
      <TicketHierarchyBadges
        mode="filter-actions"
        truncate-labels
        aria-label="Entry hierarchy and ticket links"
        :compact="compactTimeline"
        :scroll="compactTimeline && !hierarchyCanWrap"
        :items="hierarchyItems"
        @filter="(kind, id) => emit('filter', kind, id)"
      >
        <template #trailing>
          <TicketContextPopovers
            :related-tickets="row.relatedTickets"
            :external-links="row.externalLinks"
            :compact="compactTimeline"
          />
        </template>
      </TicketHierarchyBadges>
    </div>
  </article>
</template>

<style scoped>
.agenda-entry-draggable :deep(a),
.agenda-entry-draggable :deep(button),
.agenda-entry-draggable :deep([role='button']),
.agenda-entry-draggable :deep([role='combobox']) {
  cursor: pointer;
}
</style>
