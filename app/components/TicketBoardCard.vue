<script setup lang="ts">
import type { Ticket } from '../../server/db/schema'

type BoardTicket = Pick<
  Ticket,
  'id' | 'title' | 'description' | 'status' | 'estimateMinutes' | 'releaseId'
> & {
  archivedAt: string | null
}

defineProps<{
  item: {
    ticket: BoardTicket
    trackedMinutes: number
    clientId: string
    clientName: string
    projectId: string
    projectName: string
    releaseName: string
    relatedTickets: { id: string; title: string }[]
    externalLinks: { id: string; label: string; url: string }[]
  }
  changing: boolean
  busy: boolean
  canDrag: boolean
  highlighted: boolean
}>()
const emit = defineEmits<{
  'drag-start': [event: DragEvent]
  'drag-end': []
  'related-hover': [id: string | null]
  'related-click': [event: MouseEvent, id: string]
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
  <div
    :data-board-ticket-id="item.ticket.id"
    :aria-busy="changing"
    :draggable="canDrag && !item.ticket.archivedAt && !busy"
    class="rounded-lg border bg-elevated p-4 transition-colors"
    :class="[
      highlighted ? 'border-primary' : 'border-default',
      canDrag && !item.ticket.archivedAt && !busy ? 'cursor-grab active:cursor-grabbing' : '',
    ]"
    @pointerdown="pointerDown"
    @pointerup="startedOnControl = false"
    @pointercancel="startedOnControl = false"
    @dragstart="dragStart"
    @dragend="dragEnd"
  >
    <div
      class="flex min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap"
      aria-label="Ticket main information"
    >
      <NuxtLink
        :to="`/tickets/${item.ticket.id}${item.ticket.archivedAt ? '?archived=true' : ''}`"
        data-ticket-title-link
        class="inline-flex shrink-0 items-center gap-1 font-medium text-highlighted hover:text-primary"
        ><EntityIcon kind="tickets" /><span class="max-w-36 truncate" :title="item.ticket.title">{{
          item.ticket.title
        }}</span></NuxtLink
      >
      <TicketContextPopovers
        :related-tickets="item.relatedTickets"
        :external-links="item.externalLinks"
        @related-hover="emit('related-hover', $event)"
        @related-click="(event, id) => emit('related-click', event, id)"
      />
      <UBadge v-if="item.ticket.archivedAt" color="neutral">Archived</UBadge>
      <UBadge v-else-if="changing" color="primary" variant="subtle">Moving…</UBadge>
    </div>
    <div class="mt-1 flex min-w-0 items-center" aria-label="Ticket usage">
      <TicketTrackedUsage
        :minutes="item.trackedMinutes"
        :estimate-minutes="item.ticket.estimateMinutes"
      />
    </div>
    <p
      v-if="item.ticket.description"
      class="mt-2 flex min-w-0 items-center gap-1 text-sm text-muted"
      :title="item.ticket.description"
    >
      <UIcon name="lucide:align-left" class="size-4 shrink-0" aria-hidden="true" /><span
        class="truncate"
        >{{ item.ticket.description }}</span
      >
    </p>
    <div
      class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted"
      aria-label="Ticket parent relations"
    >
      <NuxtLink
        :to="`/clients/${item.clientId}`"
        class="inline-flex items-center gap-1 hover:text-primary"
        ><EntityIcon kind="clients" />{{ item.clientName }}</NuxtLink
      >
      <NuxtLink
        :to="`/projects/${item.projectId}`"
        class="inline-flex items-center gap-1 hover:text-primary"
        ><EntityIcon kind="projects" />{{ item.projectName }}</NuxtLink
      >
      <NuxtLink
        :to="`/releases/${item.ticket.releaseId}`"
        class="inline-flex items-center gap-1 hover:text-primary"
        ><EntityIcon kind="releases" />{{ item.releaseName }}</NuxtLink
      >
    </div>
  </div>
</template>
