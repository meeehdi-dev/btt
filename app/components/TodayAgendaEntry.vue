<script setup lang="ts">
import { ticketStatuses } from '#shared/ticket-status'
import { formatTicketEstimate } from '~/utils/ticket-estimate'

type TicketStatus = (typeof ticketStatuses)[number]

type Row = {
  entry: {
    id: string
    date?: string
    startMinute: number
    durationMinutes: number
    description: string
  }
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
const props = defineProps<{
  row: Row
  statusBusy?: boolean
  compactTimeline?: boolean
}>()
const spacious = computed(() => props.row.entry.durationMinutes >= 60)
// The Week timeline has less height per minute, so use a conservative shared threshold.
const minimumHierarchyWrapDurationMinutes = 90
const hierarchyCanWrap = computed(
  () => props.row.entry.durationMinutes >= minimumHierarchyWrapDurationMinutes,
)
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
    class="flex h-full min-w-0 flex-col justify-between overflow-hidden rounded-lg border border-default bg-elevated text-xs"
    :class="compactTimeline ? 'gap-1 p-1' : 'gap-1 p-2'"
    :style="{ borderLeftColor: row.projectColor, borderLeftWidth: '4px' }"
    @dblclick="onDoubleClick"
  >
    <div class="flex min-w-0 items-center justify-between gap-1">
      <TicketWorkItem
        mode="entry"
        :to="ticketUrl"
        :title="row.ticketTitle"
        :title-hint="row.ticketTitle"
        :time-label="timeLabel"
        class="min-w-0 flex-1"
      >
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
      <TicketHierarchyBadges
        mode="filter-actions"
        truncate-labels
        aria-label="Entry hierarchy, status, and ticket links"
        :compact="compactTimeline"
        :scroll="compactTimeline && !hierarchyCanWrap"
        :items="hierarchyItems"
        @filter="(kind, id) => emit('filter', kind, id)"
      >
        <template #trailing>
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
              :class="[
                'shrink-0 !bg-default !text-muted hover:!text-default',
                compactTimeline ? '!h-5 !min-h-5 !px-1 !text-[10px]' : '',
              ]"
            >
              <UIcon
                name="lucide:circle-dot"
                :class="compactTimeline ? 'size-3' : 'size-4'"
                aria-hidden="true"
              />{{ row.status }}
            </UButton>
          </UDropdownMenu>
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
