<script setup lang="ts">
import { ticketStatuses } from '#shared/ticket-status'
import { formatTicketEstimate } from '~/utils/ticket-estimate'

type TicketStatus = (typeof ticketStatuses)[number]

type Row = {
  entry: { id: string; startMinute: number; durationMinutes: number; description: string }
  ticketId: string
  ticketTitle: string
  ticketArchivedAt: string | null
  releaseId: string
  releaseName: string
  releaseArchivedAt: string | null
  projectId: string
  projectName: string
  projectColor: string
  projectArchivedAt: string | null
  clientId: string
  clientName: string
  clientArchivedAt: string | null
  status: string
  relatedTickets: { id: string; title: string; archived: boolean }[]
  externalLinks: { id: string; label: string | null; url: string }[]
}
const props = defineProps<{ row: Row; statusBusy?: boolean }>()
const spacious = computed(() => props.row.entry.durationMinutes >= 60)
const emit = defineEmits<{
  filter: [kind: 'client' | 'project' | 'release' | 'ticket' | 'status', id: string]
  edit: []
  'change-status': [id: string, status: TicketStatus]
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
const statusMenuItems = computed(() => [
  {
    label: `Filter by ${props.row.status}`,
    icon: 'lucide:filter',
    onSelect: () => emit('filter', 'status', props.row.status),
  },
  {
    label: 'Change',
    icon: 'lucide:arrow-right-left',
    disabled: archived.value || props.statusBusy,
    children: ticketStatuses.map((status) => ({
      label: status,
      icon: props.row.status === status ? 'lucide:check' : undefined,
      disabled: archived.value || props.statusBusy || props.row.status === status,
      onSelect: () => emit('change-status', props.row.ticketId, status),
    })),
  },
])
</script>
<template>
  <article
    :data-agenda-ticket-id="row.ticketId"
    class="flex h-full min-w-0 flex-col justify-between gap-1 overflow-hidden rounded-lg border border-default bg-elevated p-1.5 text-xs md:p-2"
    :style="{ borderLeftColor: row.projectColor, borderLeftWidth: '4px' }"
    @dblclick="onDoubleClick"
  >
    <TicketWorkItem
      mode="entry"
      :to="ticketUrl"
      :title="row.ticketTitle"
      :title-hint="row.ticketTitle"
      :time-label="timeLabel"
    >
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
    <div class="flex min-w-0 shrink-0 gap-1 overflow-x-auto" aria-label="Entry context">
      <TicketHierarchyBadges
        mode="filter-actions"
        :items="hierarchyItems"
        @filter="(kind, id) => emit('filter', kind, id)"
      />
      <UDropdownMenu
        :items="statusMenuItems"
        :content="{ side: 'top', avoidCollisions: false }"
        size="xs"
      >
        <UButton
          size="xs"
          color="neutral"
          variant="soft"
          :loading="statusBusy"
          :disabled="statusBusy"
          :aria-busy="statusBusy || undefined"
          :aria-label="`status: ${row.status}; actions`"
          class="!text-muted hover:!text-default"
        >
          <UIcon name="lucide:circle-dot" class="size-4" aria-hidden="true" />{{ row.status }}
        </UButton>
      </UDropdownMenu>
      <TicketContextPopovers
        :related-tickets="row.relatedTickets"
        :external-links="row.externalLinks"
      />
    </div>
  </article>
</template>
