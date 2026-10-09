<script setup lang="ts">
import { trackAppApiFetch, useAppDataInvalidation } from '~/composables/useAppDataInvalidation'
import { ticketStatusIcon, ticketStatuses } from '#shared/ticket-status'
import { useHierarchyFilters, type HierarchyFilterSource } from '~/composables/useHierarchyFilters'
import { entityIcons } from '~/utils/entity-icons'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const { invalidateMutation } = useAppDataInvalidation()
const route = useRoute()
const showArchived = ref(false)
const archiveFilterOptions = [
  { label: 'Active tickets', value: 'active' },
  { label: 'Include archived', value: 'all' },
]
const releaseId = computed(() =>
  typeof route.query.release === 'string' ? route.query.release : undefined,
)
const ticketsKey = computed(
  () =>
    `app-api:tickets:board:${releaseId.value ?? 'all'}:${showArchived.value ? 'archived' : 'active'}`,
)
const { data, pending, error } = await trackAppApiFetch(
  useApiFetch('/api/tickets', {
    key: ticketsKey,
    query: computed(() => ({
      releaseId: releaseId.value,
      archived: showArchived.value ? 'true' : undefined,
      board: 'true',
    })),
  }),
  { key: ticketsKey, resources: ['tickets', 'hierarchy', 'time-entries', 'search'] },
)
const tickets = computed(() => data.value?.tickets ?? [])
const filterSources = computed<HierarchyFilterSource[]>(() =>
  tickets.value.map((item) => ({
    clientId: item.clientId,
    clientName: item.clientName,
    projectId: item.projectId,
    projectName: item.projectName,
    releaseId: item.ticket.releaseId,
    releaseName: item.releaseName,
    ticketId: item.ticket.id,
    ticketName: item.ticket.title,
  })),
)
const {
  filters,
  options: filterOptions,
  applyFilter,
  clearFilters: clearHierarchyFilters,
  searchInputs: filterSearchInputs,
} = useHierarchyFilters(filterSources)
const visibleTickets = computed(() =>
  tickets.value.filter(
    (item) =>
      (!filters.client || item.clientId === filters.client) &&
      (!filters.project || item.projectId === filters.project) &&
      (!filters.release || item.ticket.releaseId === filters.release) &&
      (!filters.ticket || item.ticket.id === filters.ticket),
  ),
)
const groups = computed(() =>
  ticketStatuses.map((status) => ({
    status,
    items: visibleTickets.value.filter((item) => item.ticket.status === status),
  })),
)
function setArchiveFilter(value: string | null | undefined) {
  showArchived.value = value === 'all'
}
function clearAllFilters() {
  showArchived.value = false
  clearHierarchyFilters()
}
type TicketStatus = (typeof ticketStatuses)[number]
const changing = ref<string | null>(null)
const actionError = ref('')
const actionNeedsRefresh = ref(false)
const actionErrorTitle = ref('Could not update ticket')
const statusMessage = ref('')
const failedMove = ref<{ id: string; status: TicketStatus } | null>(null)
const board = ref<HTMLElement | null>(null)
const draggingId = ref<string | null>(null)
const overStatus = ref<TicketStatus | null>(null)
const scrollDirection = ref(0)
let scrollFrame = 0
const dragType = 'application/x-nxmr-ticket-status'

function clearDrag() {
  draggingId.value = null
  overStatus.value = null
  scrollDirection.value = 0
  if (scrollFrame) cancelAnimationFrame(scrollFrame)
  scrollFrame = 0
}

watch([releaseId, showArchived], () => {
  clearDrag()
  clearHierarchyFilters()
})
watch(filters, clearDrag)
watch(tickets, () => {
  if (
    draggingId.value &&
    !tickets.value.some(({ ticket }) => ticket.id === draggingId.value && !ticket.archivedAt)
  )
    clearDrag()
})
onBeforeUnmount(clearDrag)

async function retryTickets() {
  const result = await invalidateMutation('ticket')
  if (result._tag === 'Success' && actionNeedsRefresh.value) {
    actionNeedsRefresh.value = false
    actionError.value = ''
    actionErrorTitle.value = 'Could not update ticket'
  }
}

function scrollBoard() {
  if (!board.value || !draggingId.value || !scrollDirection.value) {
    scrollFrame = 0
    return
  }
  board.value.scrollLeft += scrollDirection.value * 18
  scrollFrame = requestAnimationFrame(scrollBoard)
}

function updateEdgeScroll(event: DragEvent) {
  if (!board.value || !draggingId.value) return
  const bounds = board.value.getBoundingClientRect()
  scrollDirection.value =
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom ||
    event.clientX < bounds.left ||
    event.clientX > bounds.right
      ? 0
      : event.clientX < bounds.left + 80
        ? -1
        : event.clientX > bounds.right - 80
          ? 1
          : 0
  if (scrollDirection.value && !scrollFrame) scrollFrame = requestAnimationFrame(scrollBoard)
}

function startDrag(event: DragEvent, id: string) {
  const source = tickets.value.find(({ ticket }) => ticket.id === id)
  if (changing.value || !source || source.ticket.archivedAt || !event.dataTransfer) {
    event.preventDefault()
    return
  }
  draggingId.value = id
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData(dragType, id)
  const card = event.currentTarget
  if (card instanceof HTMLElement) {
    const bounds = card.getBoundingClientRect()
    event.dataTransfer.setDragImage(card, event.clientX - bounds.left, event.clientY - bounds.top)
  }
}

function validDrag(event: DragEvent) {
  return (
    !!draggingId.value &&
    !changing.value &&
    !!event.dataTransfer?.types.includes(dragType) &&
    tickets.value.some(({ ticket }) => ticket.id === draggingId.value && !ticket.archivedAt)
  )
}

function overLane(event: DragEvent, status: TicketStatus) {
  if (!validDrag(event)) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  overStatus.value = status
}

function leaveLane(event: DragEvent, status: TicketStatus) {
  const lane = event.currentTarget
  if (
    lane instanceof HTMLElement &&
    event.relatedTarget instanceof Node &&
    lane.contains(event.relatedTarget)
  )
    return
  if (overStatus.value === status) overStatus.value = null
}

function leaveBoard(event: DragEvent) {
  if (
    board.value &&
    event.relatedTarget instanceof Node &&
    board.value.contains(event.relatedTarget)
  )
    return
  overStatus.value = null
  scrollDirection.value = 0
}

function dropOnLane(event: DragEvent, status: TicketStatus) {
  if (!validDrag(event) || event.dataTransfer?.getData(dragType) !== draggingId.value) return
  event.preventDefault()
  const id = draggingId.value
  clearDrag()
  if (id) void moveStatus(id, status, false)
}

async function retryMove() {
  if (failedMove.value) await moveStatus(failedMove.value.id, failedMove.value.status, false)
}

const hoveredTargetId = ref<string | null>(null)
const pinnedTargetId = ref<string | null>(null)
const highlightedId = computed(() => hoveredTargetId.value ?? pinnedTargetId.value)
async function locateRelated(event: MouseEvent, id: string) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  const target = visibleTickets.value.find((item) => item.ticket.id === id)
  if (!target) {
    await navigateTo(`/tickets/${id}`) // A release- or filter-hidden target is outside this board.
    return
  }
  pinnedTargetId.value = id
  await nextTick()
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  )
  const card = [...document.querySelectorAll<HTMLElement>('[data-board-ticket-id]')].find(
    (node) => node.dataset.boardTicketId === id && node.getClientRects().length > 0,
  )
  card?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
}

async function moveStatus(id: string, destination: TicketStatus, restoreFocus = true) {
  const source = tickets.value.find(({ ticket }) => ticket.id === id)
  if (
    !source ||
    source.ticket.archivedAt ||
    changing.value ||
    !ticketStatuses.includes(destination) ||
    source.ticket.status === destination
  )
    return
  changing.value = id
  actionError.value = ''
  actionErrorTitle.value = 'Could not update ticket'
  statusMessage.value = ''
  failedMove.value = null
  let refreshed = false
  try {
    const endpoint: string = '/api/tickets/' + id
    const result = await runClientRequest<unknown>((signal) =>
      $fetch<unknown>(endpoint, { method: 'PATCH', body: { status: destination }, signal }),
    )
    if (result._tag === 'Failure') {
      actionError.value = result.failure.userMessage
      failedMove.value = { id, status: destination }
      return
    }
    const refreshResult = await invalidateMutation('ticket')
    if (refreshResult._tag === 'Failure') {
      actionNeedsRefresh.value = true
      actionErrorTitle.value = 'Ticket updated; board refresh failed'
      actionError.value = `Ticket saved, but affected ticket data could not refresh. ${refreshResult.failure.userMessage}`
      return
    }
    statusMessage.value = `Moved ${source.ticket.title} to ${destination}.`
    refreshed = true
  } finally {
    changing.value = null
  }
  if (refreshed && restoreFocus) {
    await nextTick()
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    )
    const card = [...document.querySelectorAll<HTMLElement>('[data-board-ticket-id]')].find(
      (node) => node.dataset.boardTicketId === id && node.getClientRects().length > 0,
    )
    card?.querySelector<HTMLElement>('[data-ticket-status-trigger]')?.focus()
  }
}
</script>

<template>
  <div class="flex min-h-[calc(100dvh-5.5rem)] flex-col gap-2">
    <h1 class="sr-only">Tickets</h1>
    <div
      role="group"
      aria-label="Ticket board controls"
      class="flex h-8 min-w-0 items-center gap-2"
    >
      <div
        role="group"
        aria-label="Ticket filters"
        class="flex h-8 min-w-0 flex-1 items-center gap-1 rounded-md px-0.5"
      >
        <div class="grid h-full min-w-0 flex-1 grid-cols-5 gap-1">
          <div v-for="kind in ['client', 'project', 'release', 'ticket'] as const" :key="kind">
            <USelectMenu
              :model-value="filters[kind] || null"
              value-key="value"
              :items="filterOptions(kind)"
              :disabled="!filterOptions(kind).length"
              :search-input="filterSearchInputs[kind]"
              :clear="{ 'aria-label': `Clear ${kind} filter` }"
              :placeholder="`All ${kind}s`"
              class="w-full"
              :aria-label="`Filter ${kind}`"
              @update:model-value="applyFilter(kind, $event ?? '')"
            >
              <template #leading
                ><UTooltip :text="`Filter ${kind}`"
                  ><UIcon
                    :name="
                      entityIcons[`${kind}s` as 'clients' | 'projects' | 'releases' | 'tickets']
                    "
                    class="size-4"
                    :aria-label="`Filter ${kind}`" /></UTooltip
              ></template>
            </USelectMenu>
          </div>
          <USelectMenu
            :model-value="showArchived ? 'all' : 'active'"
            value-key="value"
            :items="archiveFilterOptions"
            class="w-full"
            aria-label="Filter archived tickets"
            @update:model-value="setArchiveFilter"
          >
            <template #leading>
              <UTooltip text="Filter archived tickets">
                <UIcon name="lucide:archive-restore" class="size-4" aria-hidden="true" />
              </UTooltip>
            </template>
          </USelectMenu>
        </div>
        <UTooltip text="Clear all filters">
          <UButton
            color="neutral"
            variant="ghost"
            icon="lucide:filter-x"
            aria-label="Clear filters"
            class="self-auto"
            @click="clearAllFilters"
          />
        </UTooltip>
      </div>
      <USeparator
        data-testid="ticket-board-toolbar-separator"
        orientation="vertical"
        decorative
        class="h-6 shrink-0"
      />
      <UButton
        :to="`/tickets/new${releaseId ? `?release=${releaseId}` : ''}`"
        icon="lucide:plus"
        label="New ticket"
      />
    </div>
    <UAlert
      v-if="error || actionError"
      role="alert"
      color="error"
      :title="actionError ? actionErrorTitle : 'Could not load tickets'"
      :description="actionError || clientFailureMessage(error)"
    />
    <UButton
      v-if="error || actionNeedsRefresh"
      color="neutral"
      variant="outline"
      icon="lucide:refresh-cw"
      label="Retry loading tickets"
      @click="retryTickets()"
    />
    <UButton
      v-else-if="failedMove"
      color="neutral"
      variant="outline"
      icon="lucide:refresh-cw"
      label="Retry status change"
      @click="retryMove"
    />
    <p class="sr-only" role="status" aria-live="polite">{{ statusMessage }}</p>
    <UCard v-if="pending && !data"><p class="text-muted">Loading tickets…</p></UCard>
    <template v-else-if="!error && !actionNeedsRefresh">
      <UCard v-if="!visibleTickets.length">
        <h2 class="font-medium text-highlighted">
          {{
            tickets.length
              ? 'No tickets match these filters'
              : `No ${showArchived ? '' : 'active '}tickets yet`
          }}
        </h2>
        <p v-if="!tickets.length" class="mt-2 text-muted">
          Create a ticket under a release to get started.
        </p>
      </UCard>
      <div
        ref="board"
        class="mt-2 flex min-h-fit w-full max-w-full flex-1 overflow-x-auto rounded-lg border border-default pb-3"
        role="region"
        aria-label="Ticket board"
        tabindex="0"
        @dragover.capture="updateEdgeScroll"
        @dragleave.self="leaveBoard"
      >
        <div class="grid min-w-[105rem] flex-1 grid-cols-7 gap-2">
          <section
            v-for="group in groups"
            :key="group.status"
            class="min-w-0 space-y-2 rounded-lg border px-2 py-4 transition-colors"
            :class="
              overStatus === group.status ? 'border-primary bg-primary/5' : 'border-transparent'
            "
            :aria-label="`${group.status} tickets`"
            @dragenter="overLane($event, group.status)"
            @dragover="overLane($event, group.status)"
            @dragleave.self="leaveLane($event, group.status)"
            @drop="dropOnLane($event, group.status)"
          >
            <h2 class="flex items-center justify-between font-semibold text-highlighted">
              <span class="flex min-w-0 items-center gap-1">
                <UIcon
                  :name="ticketStatusIcon(group.status)"
                  class="size-4 shrink-0 text-muted"
                  :data-ticket-status-icon="group.status"
                  aria-hidden="true"
                />
                {{ group.status }}
              </span>
              <UBadge color="neutral" variant="subtle">{{ group.items.length }}</UBadge>
            </h2>
            <TicketBoardCard
              v-for="item in group.items"
              :key="item.ticket.id"
              :item="item"
              :changing="changing === item.ticket.id"
              :busy="!!changing"
              :highlighted="highlightedId === item.ticket.id"
              @drag-start="startDrag($event, item.ticket.id)"
              @drag-end="clearDrag"
              @change-status="moveStatus"
              @related-hover="hoveredTargetId = $event"
              @related-click="locateRelated"
              @filter="applyFilter"
            />
            <p
              v-if="!group.items.length"
              class="rounded-lg border border-dashed border-default p-2 text-sm text-muted"
            >
              No tickets in {{ group.status }}.
            </p>
          </section>
        </div>
      </div>
    </template>
  </div>
</template>
