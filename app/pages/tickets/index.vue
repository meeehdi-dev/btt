<script setup lang="ts">
import { ticketStatuses } from '#shared/ticket-status'
import { useHierarchyFilters, type HierarchyFilterSource } from '~/composables/useHierarchyFilters'
import { entityIcons } from '~/utils/entity-icons'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const route = useRoute()
const showArchived = ref(false)
const releaseId = computed(() =>
  typeof route.query.release === 'string' ? route.query.release : undefined,
)
const { data, pending, error, refresh } = await useApiFetch('/api/tickets', {
  query: computed(() => ({
    releaseId: releaseId.value,
    archived: showArchived.value ? 'true' : undefined,
  })),
})
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
  clearFilters,
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
type TicketStatus = (typeof ticketStatuses)[number]
const changing = ref<string | null>(null)
const actionError = ref('')
const actionNeedsRefresh = ref(false)
const actionErrorTitle = ref('Could not update ticket')
const statusMessage = ref('')
const failedMove = ref<{ id: string; status: TicketStatus } | null>(null)
const board = ref<HTMLElement | null>(null)
const desktopDragEnabled = ref(false)
let dragBreakpoint: MediaQueryList | undefined
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

function syncDragBreakpoint(event: MediaQueryListEvent) {
  desktopDragEnabled.value = event.matches
  if (!event.matches) clearDrag()
}
onMounted(() => {
  dragBreakpoint = window.matchMedia('(min-width: 768px)')
  desktopDragEnabled.value = dragBreakpoint.matches
  dragBreakpoint.addEventListener('change', syncDragBreakpoint)
})

watch([releaseId, showArchived], () => {
  clearDrag()
  clearFilters()
})
watch(filters, clearDrag)
watch(tickets, () => {
  if (
    draggingId.value &&
    !tickets.value.some(({ ticket }) => ticket.id === draggingId.value && !ticket.archivedAt)
  )
    clearDrag()
})
onBeforeUnmount(() => {
  dragBreakpoint?.removeEventListener('change', syncDragBreakpoint)
  clearDrag()
})

async function retryTickets() {
  const result = await runClientEffect(refreshEffect(refresh, () => error.value))
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
  if (
    !desktopDragEnabled.value ||
    changing.value ||
    !source ||
    source.ticket.archivedAt ||
    !event.dataTransfer
  ) {
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
const openStatuses = reactive(
  Object.fromEntries(ticketStatuses.map((status) => [status, false])) as Record<
    (typeof ticketStatuses)[number],
    boolean
  >,
)

async function waitForCardAnimation(card: HTMLElement) {
  const animations: Animation[] = []
  for (let node = card.parentElement; node && node !== document.body; node = node.parentElement) {
    animations.push(
      ...node
        .getAnimations({ subtree: false })
        .filter((animation) => animation.playState === 'running'),
    )
  }
  await Promise.allSettled(animations.map((animation) => animation.finished))
}

async function locateRelated(event: MouseEvent, id: string) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  const target = visibleTickets.value.find((item) => item.ticket.id === id)
  if (!target) {
    await navigateTo(`/tickets/${id}`) // A release- or filter-hidden target is outside this board.
    return
  }
  pinnedTargetId.value = id
  const mobile = window.matchMedia('(max-width: 767px)').matches
  if (mobile) openStatuses[target.ticket.status] = true
  await nextTick()
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  )
  const card = [...document.querySelectorAll<HTMLElement>('[data-board-ticket-id]')].find(
    (node) => node.dataset.boardTicketId === id && node.getClientRects().length > 0,
  )
  // The expanded collapsible changes height during its opening animation.
  if (mobile && card) await waitForCardAnimation(card)
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
    const refreshResult = await runClientEffect(refreshEffect(refresh, () => error.value))
    if (refreshResult._tag === 'Failure') {
      actionNeedsRefresh.value = true
      actionErrorTitle.value = 'Ticket updated; board refresh failed'
      actionError.value = `Ticket saved, but the board could not refresh. ${refreshResult.failure.userMessage}`
      return
    }
    statusMessage.value = `Moved ${source.ticket.title} to ${destination}.`
    refreshed = true
  } finally {
    changing.value = null
  }
  if (refreshed && restoreFocus) {
    const mobile = window.matchMedia('(max-width: 767px)').matches
    if (mobile) openStatuses[destination] = true
    await nextTick()
    // Wait for the destination collapsible before restoring focus to its arrow or title.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    )
    const card = [...document.querySelectorAll<HTMLElement>('[data-board-ticket-id]')].find(
      (node) => node.dataset.boardTicketId === id && node.getClientRects().length > 0,
    )
    if (mobile && card) await waitForCardAnimation(card)
    card?.querySelector<HTMLElement>('[data-ticket-title-link]')?.focus()
  }
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="sr-only">Tickets</h1>
    <div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
      <ArchiveFilterButton v-model="showArchived" />
      <UButton
        :to="`/tickets/new${releaseId ? `?release=${releaseId}` : ''}`"
        icon="lucide:plus"
        label="New ticket"
      />
    </div>
    <UCard :ui="{ body: 'p-2 sm:p-2' }">
      <div class="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div class="grid min-w-0 flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
        </div>
        <UTooltip text="Clear all filters"
          ><UButton
            color="neutral"
            variant="ghost"
            icon="lucide:filter-x"
            aria-label="Clear filters"
            class="self-end"
            @click="clearFilters"
        /></UTooltip>
      </div>
    </UCard>
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
        class="hidden w-full max-w-full overflow-x-auto pb-3 md:block"
        role="region"
        aria-label="Ticket board"
        tabindex="0"
        @dragover.capture="updateEdgeScroll"
        @dragleave.self="leaveBoard"
      >
        <div class="grid min-w-[105rem] grid-cols-7 gap-4">
          <section
            v-for="group in groups"
            :key="group.status"
            class="min-w-0 space-y-3 rounded-lg border px-2 py-8 transition-colors"
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
              {{ group.status }}
              <UBadge color="neutral" variant="subtle">{{ group.items.length }}</UBadge>
            </h2>
            <TicketBoardCard
              v-for="item in group.items"
              :key="item.ticket.id"
              :item="item"
              :changing="changing === item.ticket.id"
              :busy="!!changing"
              :can-drag="desktopDragEnabled"
              :highlighted="highlightedId === item.ticket.id"
              @drag-start="startDrag($event, item.ticket.id)"
              @drag-end="clearDrag"
              @related-hover="hoveredTargetId = $event"
              @related-click="locateRelated"
            />
            <p
              v-if="!group.items.length"
              class="rounded-lg border border-dashed border-default p-4 text-sm text-muted"
            >
              No tickets in {{ group.status }}.
            </p>
          </section>
        </div>
      </div>
      <div class="space-y-3 md:hidden" aria-label="Ticket statuses">
        <section
          v-for="group in groups"
          :key="group.status"
          :aria-label="`${group.status} tickets`"
        >
          <UCollapsible
            v-model:open="openStatuses[group.status]"
            class="rounded-lg border border-default bg-elevated p-3"
          >
            <UButton
              block
              color="neutral"
              variant="ghost"
              class="group w-full"
              :aria-label="`${group.status}: ${group.items.length} tickets`"
              :label="group.status"
            >
              <template #trailing
                ><UBadge color="neutral" variant="subtle">{{ group.items.length }}</UBadge
                ><UIcon
                  name="lucide:chevron-down"
                  class="size-4 group-data-[state=open]:rotate-180"
                  aria-hidden="true"
              /></template>
            </UButton>
            <template #content>
              <div class="space-y-3 pt-3">
                <TicketBoardCard
                  v-for="item in group.items"
                  :key="item.ticket.id"
                  :item="item"
                  :changing="changing === item.ticket.id"
                  :busy="!!changing"
                  :can-drag="desktopDragEnabled"
                  :highlighted="highlightedId === item.ticket.id"
                  @drag-start="startDrag($event, item.ticket.id)"
                  @drag-end="clearDrag"
                  @related-hover="hoveredTargetId = $event"
                  @related-click="locateRelated"
                />
                <p v-if="!group.items.length" class="text-sm text-muted">
                  No tickets in {{ group.status }}.
                </p>
              </div>
            </template>
          </UCollapsible>
        </section>
      </div>
    </template>
  </div>
</template>
