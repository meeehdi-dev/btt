<script setup lang="ts">
import type { Ticket } from '../../server/db/schema'
import { nextStatus } from '#shared/ticket-status'

type BoardTicket = Pick<Ticket, 'id' | 'title' | 'status' | 'estimateMinutes' | 'releaseId'> & {
  archivedAt: string | null
}

defineProps<{
  item: {
    ticket: BoardTicket
    clientId: string
    clientName: string
    projectId: string
    projectName: string
    releaseName: string
    relatedTickets: { id: string; title: string }[]
  }
  changing: boolean
  busy: boolean
  canDrag: boolean
  highlighted: boolean
}>()
const emit = defineEmits<{
  advance: []
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
    <div class="flex items-start justify-between gap-2">
      <NuxtLink
        :to="`/tickets/${item.ticket.id}${item.ticket.archivedAt ? '?archived=true' : ''}`"
        data-ticket-title-link
        class="inline-flex min-w-0 items-center gap-1 font-medium text-highlighted hover:text-primary"
        ><EntityIcon kind="tickets" /><span class="min-w-0 break-words">{{
          item.ticket.title
        }}</span></NuxtLink
      >
      <div
        v-if="item.relatedTickets.length"
        class="flex max-w-[50%] shrink-0 flex-wrap justify-end gap-1"
        aria-label="Related tickets"
      >
        <a
          v-for="related in item.relatedTickets"
          :key="related.id"
          :href="`/tickets/${related.id}`"
          :aria-label="`Related ticket: ${related.title}`"
          :title="`Related ticket: ${related.title}`"
          class="inline-flex size-7 items-center justify-center rounded text-muted hover:bg-accented hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
          @mouseenter="$emit('related-hover', related.id)"
          @mouseleave="$emit('related-hover', null)"
          @focus="$emit('related-hover', related.id)"
          @blur="$emit('related-hover', null)"
          @click="$emit('related-click', $event, related.id)"
          ><EntityIcon kind="related"
        /></a>
      </div>
    </div>
    <div class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
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
    <div
      v-if="
        item.ticket.estimateMinutes ||
        item.ticket.archivedAt ||
        changing ||
        nextStatus(item.ticket.status)
      "
      class="mt-3 flex flex-wrap items-center justify-between gap-2"
    >
      <TicketEstimate v-if="item.ticket.estimateMinutes" :minutes="item.ticket.estimateMinutes" />
      <UBadge v-if="item.ticket.archivedAt" color="neutral">Archived</UBadge>
      <template v-else>
        <UBadge v-if="changing" color="primary" variant="subtle">Moving…</UBadge>
        <UButton
          v-if="nextStatus(item.ticket.status)"
          data-next-status-control
          size="xs"
          color="neutral"
          variant="outline"
          icon="lucide:arrow-right"
          :loading="changing"
          :disabled="busy"
          :aria-label="`Move ${item.ticket.title} to ${nextStatus(item.ticket.status)}`"
          :title="`Move ${item.ticket.title} to ${nextStatus(item.ticket.status)}`"
          @click="$emit('advance')"
        />
      </template>
    </div>
  </div>
</template>
