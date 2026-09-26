<script setup lang="ts">
import { formatTicketEstimate } from '~/utils/ticket-estimate'

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
  externalLinks: { id: string; label: string; url: string }[]
}
const props = defineProps<{ row: Row }>()
const spacious = computed(() => props.row.entry.durationMinutes >= 60)
const emit = defineEmits<{
  filter: [kind: 'client' | 'project' | 'release' | 'ticket' | 'status', id: string]
  edit: []
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
function clock(minute: number) {
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
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
const badges = computed(() => [
  {
    kind: 'client' as const,
    id: props.row.clientId,
    name: props.row.clientName,
    icon: 'clients' as const,
    to: `/clients/${props.row.clientId}${props.row.clientArchivedAt ? '?archived=true' : ''}`,
  },
  {
    kind: 'project' as const,
    id: props.row.projectId,
    name: props.row.projectName,
    icon: 'projects' as const,
    to: `/projects/${props.row.projectId}${props.row.clientArchivedAt || props.row.projectArchivedAt ? '?archived=true' : ''}`,
  },
  {
    kind: 'release' as const,
    id: props.row.releaseId,
    name: props.row.releaseName,
    icon: 'releases' as const,
    to: `/releases/${props.row.releaseId}${props.row.clientArchivedAt || props.row.projectArchivedAt || props.row.releaseArchivedAt ? '?archived=true' : ''}`,
  },
  { kind: 'status' as const, id: props.row.status, name: props.row.status, icon: null, to: '' },
])
</script>
<template>
  <article
    :data-agenda-ticket-id="row.ticketId"
    class="flex h-full min-w-0 flex-col justify-between gap-1 overflow-hidden rounded-lg border border-default bg-elevated p-1.5 text-xs md:p-2"
    :style="{ borderLeftColor: row.projectColor, borderLeftWidth: '4px' }"
    @dblclick="onDoubleClick"
  >
    <div class="flex min-w-0 items-center gap-2 whitespace-nowrap">
      <NuxtLink
        :to="ticketUrl"
        class="inline-flex min-w-0 shrink items-center gap-1 font-medium text-highlighted hover:text-primary"
      >
        <EntityIcon kind="tickets" /><span class="truncate">{{ row.ticketTitle }}</span>
      </NuxtLink>
      <span class="inline-flex shrink-0 items-center gap-1 text-muted">
        <UIcon name="lucide:clock-3" class="size-4" aria-hidden="true" />{{
          clock(row.entry.startMinute)
        }}–{{ clock(row.entry.startMinute + row.entry.durationMinutes) }} ·
        {{ formatTicketEstimate(row.entry.durationMinutes) }}
      </span>
      <span
        v-if="row.entry.description && !spacious"
        class="inline-flex min-w-0 items-center gap-1 truncate text-muted"
        :title="row.entry.description"
        ><UIcon name="lucide:align-left" class="size-4 shrink-0" aria-hidden="true" /><span
          class="truncate"
          >{{ row.entry.description }}</span
        ></span
      >
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
    <div class="flex min-w-0 shrink-0 gap-1 overflow-x-auto" aria-label="Entry context">
      <UPopover
        v-for="badge in badges"
        :key="badge.kind"
        :content="{ side: 'top', avoidCollisions: false }"
      >
        <UButton
          size="xs"
          color="neutral"
          variant="soft"
          :aria-label="`${badge.kind}: ${badge.name}; actions`"
        >
          <EntityIcon v-if="badge.icon" :kind="badge.icon" /><UIcon
            v-else
            name="lucide:circle-dot"
            class="size-4"
            aria-hidden="true"
          />{{ badge.name }}
        </UButton>
        <template #content
          ><div class="flex min-w-36 flex-col gap-1 p-2">
            <UButton
              size="xs"
              variant="ghost"
              color="neutral"
              icon="lucide:filter"
              :label="`Filter by ${badge.name}`"
              @click="emit('filter', badge.kind, badge.id)"
            />
            <UButton
              v-if="badge.to"
              size="xs"
              variant="ghost"
              color="neutral"
              :to="badge.to"
              icon="lucide:external-link"
              :label="`Open ${badge.name}`"
            /></div
        ></template>
      </UPopover>
      <UPopover :content="{ side: 'top', avoidCollisions: false }">
        <UButton
          size="xs"
          color="neutral"
          variant="soft"
          :aria-label="`ticket: ${row.ticketTitle}; actions`"
          ><EntityIcon kind="tickets" />{{ row.ticketTitle }}</UButton
        >
        <template #content
          ><div class="flex min-w-36 flex-col gap-1 p-2">
            <UButton
              size="xs"
              variant="ghost"
              color="neutral"
              icon="lucide:filter"
              :label="`Filter by ${row.ticketTitle}`"
              @click="emit('filter', 'ticket', row.ticketId)"
            />
            <UButton
              size="xs"
              variant="ghost"
              color="neutral"
              :to="ticketUrl"
              icon="lucide:external-link"
              :label="`Open ${row.ticketTitle}`"
            /></div
        ></template>
      </UPopover>
      <TicketContextPopovers
        :related-tickets="row.relatedTickets"
        :external-links="row.externalLinks"
      />
    </div>
  </article>
</template>
