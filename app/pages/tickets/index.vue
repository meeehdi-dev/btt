<script setup lang="ts">
import { ticketStatuses, nextStatus } from '#shared/ticket-status'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const route = useRoute()
const showArchived = ref(false)
const releaseId = computed(() =>
  typeof route.query.release === 'string' ? route.query.release : undefined,
)
const { data, pending, error, refresh } = await useFetch('/api/tickets', {
  query: computed(() => ({
    releaseId: releaseId.value,
    archived: showArchived.value ? 'true' : undefined,
  })),
})
const tickets = computed(() => data.value?.tickets ?? [])
const groups = computed(() =>
  ticketStatuses.map((status) => ({
    status,
    items: tickets.value.filter((item) => item.ticket.status === status),
  })),
)
const changing = ref<string | null>(null)
const actionError = ref('')
const hoveredTargetId = ref<string | null>(null)
const pinnedTargetId = ref<string | null>(null)
const highlightedId = computed(() => hoveredTargetId.value ?? pinnedTargetId.value)
const openStatuses = reactive(
  Object.fromEntries(ticketStatuses.map((status) => [status, false])) as Record<
    (typeof ticketStatuses)[number],
    boolean
  >,
)

async function locateRelated(event: MouseEvent, id: string) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  const target = tickets.value.find((item) => item.ticket.id === id)
  if (!target) {
    await navigateTo(`/tickets/${id}`) // A release-filtered target is outside this board.
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
  if (mobile && card) {
    // The expanded collapsible changes height during its opening animation.
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
  card?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
}

async function advance(id: string, status: string) {
  const next = nextStatus(status)
  if (!next) return
  changing.value = id
  actionError.value = ''
  try {
    await $fetch(`/api/tickets/${id}`, { method: 'PATCH', body: { status: next } })
    await refresh()
  } catch (cause) {
    actionError.value = cause instanceof Error ? cause.message : 'Unable to advance ticket.'
  } finally {
    changing.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm font-medium text-primary">Workspace</p>
        <h1 class="mt-2 flex items-center gap-2 text-3xl font-semibold text-highlighted">
          <EntityIcon kind="tickets" />Tickets
        </h1>
        <p class="mt-2 text-muted">
          Work grouped by status{{ releaseId ? ' for this release' : '' }}.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <ArchiveFilterButton v-model="showArchived" /><UButton
          :to="`/tickets/new${releaseId ? `?release=${releaseId}` : ''}`"
          icon="lucide:plus"
          label="New ticket"
        />
      </div>
    </div>
    <UAlert v-if="error || actionError" color="error" title="Could not load or update tickets">{{
      actionError || 'Retry loading the tickets.'
    }}</UAlert>
    <UButton v-if="error" color="neutral" variant="outline" label="Retry" @click="refresh()" />
    <UCard v-if="pending"><p class="text-muted">Loading tickets…</p></UCard>
    <template v-else-if="!error">
      <UCard v-if="!tickets.length">
        <h2 class="font-medium text-highlighted">
          No {{ showArchived ? '' : 'active ' }}tickets yet
        </h2>
        <p class="mt-2 text-muted">Create a ticket under a release to get started.</p>
      </UCard>
      <div
        class="hidden w-full max-w-full overflow-x-auto pb-3 md:block"
        role="region"
        aria-label="Ticket board"
        tabindex="0"
      >
        <div class="grid min-w-[105rem] grid-cols-7 gap-4">
          <section
            v-for="group in groups"
            :key="group.status"
            class="min-w-0 space-y-3"
            :aria-label="`${group.status} tickets`"
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
              :highlighted="highlightedId === item.ticket.id"
              @advance="advance(item.ticket.id, item.ticket.status)"
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
                  :highlighted="highlightedId === item.ticket.id"
                  @advance="advance(item.ticket.id, item.ticket.status)"
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
