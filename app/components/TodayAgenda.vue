<script setup lang="ts">
import { ticketStatuses } from '#shared/ticket-status'
import {
  creationRange,
  moveRange,
  pointerSlot,
  resizeRange,
  type MovePreview,
} from '~/utils/agenda-drag'
import { overlaps, slotMinutes } from '#shared/time-entry'

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
const props = defineProps<{
  date: string
  currentDate: string
  currentMinute: number | null
  rows: Row[]
  occupied: Row[]
  start: number
  end: number
  busy?: boolean
  statusChangingId?: string | null
}>()
const pixelsPerMinute = 2.25
const emit = defineEmits<{
  filter: [kind: 'client' | 'project' | 'release' | 'ticket' | 'status', id: string]
  create: [startMinute: number, durationMinutes: number]
  change: [id: string, startMinute: number, durationMinutes: number]
  edit: [id: string]
  'change-status': [id: string, status: TicketStatus]
}>()
const clock = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
const hours = computed(() =>
  Array.from(
    { length: Math.ceil((props.end - props.start) / 60) + 1 },
    (_, index) => props.start + index * 60,
  ).filter((minute) => minute <= props.end),
)
const showNowMarker = computed(
  () =>
    props.date === props.currentDate &&
    props.currentMinute !== null &&
    props.currentMinute >= props.start &&
    props.currentMinute < props.end,
)
const nowMarkerTop = computed(
  () => `${((props.currentMinute ?? props.start) - props.start) * pixelsPerMinute}px`,
)
const early = computed(() => props.rows.filter(({ entry }) => entry.startMinute < props.start))
const late = computed(() => props.rows.filter(({ entry }) => entry.startMinute >= props.end))
const within = computed(() =>
  props.rows.filter(
    ({ entry }) => entry.startMinute >= props.start && entry.startMinute < props.end,
  ),
)
const shown = computed(() => new Set(props.rows.map(({ entry }) => entry.id)))
const hidden = computed(() =>
  props.occupied.filter(
    ({ entry }) =>
      (!shown.value.has(entry.id) || entry.startMinute < props.start) &&
      entry.startMinute < props.end &&
      entry.startMinute + entry.durationMinutes > props.start,
  ),
)
const allIntervals = computed(() => props.occupied.map(({ entry }) => entry))
const timeline = ref<HTMLElement | null>(null)
const alert = ref('')
type AgendaPreview = MovePreview

type Gesture = {
  pointerId: number
  kind: 'create' | 'move' | 'top' | 'bottom'
  id: string | null
  anchor: number
  startedY: number
  moved: boolean
  offset: number
  original: { startMinute: number; durationMinutes: number } | null
  preview: AgendaPreview | null
}
const gesture = shallowRef<Gesture | null>(null)
const active = computed(() => gesture.value?.moved ?? false)
const windowBounds = computed(() => ({ start: props.start, end: props.end }))
function resetGesture() {
  const id = gesture.value?.pointerId
  if (id !== undefined && timeline.value?.hasPointerCapture(id))
    timeline.value.releasePointerCapture(id)
  gesture.value = null
}
function onEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') resetGesture()
}
onMounted(() => window.addEventListener('keydown', onEscape))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onEscape)
  resetGesture()
})
watch(() => [props.start, props.end, props.occupied, props.rows, props.busy], resetGesture)
function position(event: PointerEvent): number {
  return event.clientY - (timeline.value?.getBoundingClientRect().top ?? 0)
}
function initialPointer(event: PointerEvent) {
  if (
    props.busy ||
    gesture.value ||
    event.button !== 0 ||
    event.pointerType !== 'mouse' ||
    !timeline.value
  )
    return
  const target = event.target
  if (!(target instanceof Element)) return
  if (target.closest('a,button,input,select,textarea,[role="button"],[role="combobox"]')) return
  const wrapper = target.closest<HTMLElement>('[data-agenda-entry]')
  const row = wrapper
    ? props.occupied.find(({ entry }) => entry.id === wrapper.dataset.agendaEntry)
    : undefined
  const edge = target.closest<HTMLElement>('[data-drag-edge]')?.dataset.dragEdge
  const y = position(event)
  const minute = pointerSlot(y, (props.end - props.start) * pixelsPerMinute, windowBounds.value)
  if (
    !row &&
    allIntervals.value.some((entry) =>
      overlaps(entry, { startMinute: minute, durationMinutes: slotMinutes }),
    )
  )
    return
  if (
    row &&
    (row.entry.startMinute < props.start ||
      row.entry.startMinute + row.entry.durationMinutes > props.end)
  )
    return
  const kind: Gesture['kind'] = row
    ? edge === 'top' || edge === 'bottom'
      ? edge
      : 'move'
    : 'create'
  const original = row
    ? { startMinute: row.entry.startMinute, durationMinutes: row.entry.durationMinutes }
    : null
  gesture.value = {
    pointerId: event.pointerId,
    kind,
    id: row?.entry.id ?? null,
    anchor: minute,
    startedY: event.clientY,
    moved: false,
    offset: row && wrapper ? event.clientY - wrapper.getBoundingClientRect().top : 0,
    original,
    preview:
      row && original
        ? { ...original, adjusted: false, valid: true }
        : {
            ...creationRange(minute, minute, allIntervals.value, windowBounds.value),
            adjusted: false,
            valid: true,
          },
  }
  timeline.value.setPointerCapture(event.pointerId)
  event.preventDefault()
}
function updatePointer(event: PointerEvent) {
  const current = gesture.value
  if (!current || current.pointerId !== event.pointerId) return
  const y = position(event)
  const height = (props.end - props.start) * pixelsPerMinute
  const intervals = props.occupied
    .filter(({ entry }) => entry.id !== current.id)
    .map(({ entry }) => entry)
  let preview: Gesture['preview'] = null
  if (current.kind === 'create') {
    preview = {
      ...creationRange(
        current.anchor,
        pointerSlot(y, height, windowBounds.value),
        intervals,
        windowBounds.value,
      ),
      adjusted: false,
      valid: true,
    }
  } else if (current.kind === 'move' && current.original) {
    const rawStart = props.start + (y - current.offset) / pixelsPerMinute
    preview = moveRange(
      rawStart,
      current.original.durationMinutes,
      intervals,
      windowBounds.value,
      pixelsPerMinute,
    )
  } else if (current.original) {
    const boundary = Math.max(
      props.start,
      Math.min(
        props.end,
        props.start + Math.round(y / (slotMinutes * pixelsPerMinute)) * slotMinutes,
      ),
    )
    preview = {
      ...resizeRange(
        current.original,
        current.kind as 'top' | 'bottom',
        boundary,
        intervals,
        windowBounds.value,
      ),
      adjusted: false,
      valid: true,
    }
  }
  gesture.value = {
    ...current,
    moved: current.moved || Math.abs(event.clientY - current.startedY) >= 6,
    preview,
  }
}
function finishPointer(event: PointerEvent) {
  const current = gesture.value
  if (!current || current.pointerId !== event.pointerId) return
  updatePointer(event)
  const result = gesture.value?.preview
  const moved = gesture.value?.moved
  resetGesture()
  if (current.kind === 'create' && !moved) return
  if (!result?.valid) {
    alert.value =
      'This time slot conflicts with another entry or the visible hours. The entry was not moved.'
    return
  }
  alert.value = ''
  if (current.kind === 'create') emit('create', result.startMinute, result.durationMinutes)
  else if (
    current.id &&
    current.original &&
    (result.startMinute !== current.original.startMinute ||
      result.durationMinutes !== current.original.durationMinutes)
  )
    emit('change', current.id, result.startMinute, result.durationMinutes)
}
function timelineDoubleClick(event: MouseEvent) {
  // Pointer capture can retarget the second click to the timeline after it is released.
  // Resolve the actual hit element so links and badge buttons still act normally.
  const hit = document.elementFromPoint(event.clientX, event.clientY)
  if (!hit || hit.closest('a,button,input,select,textarea,[role="button"],[role="combobox"]'))
    return
  const id = hit.closest<HTMLElement>('[data-agenda-entry]')?.dataset.agendaEntry
  if (id) emit('edit', id)
}
function blockStyle(entry: { startMinute: number; durationMinutes: number }) {
  const first = Math.max(props.start, entry.startMinute)
  const last = Math.min(props.end, entry.startMinute + entry.durationMinutes)
  return {
    top: `${(first - props.start) * pixelsPerMinute}px`,
    height: `${Math.max(0, last - first) * pixelsPerMinute}px`,
  }
}
function previewStyle(preview: AgendaPreview) {
  if (preview.valid) return blockStyle(preview)
  return {
    top: `${(preview.startMinute - props.start) * pixelsPerMinute}px`,
    height: `${preview.durationMinutes * pixelsPerMinute}px`,
  }
}
</script>
<template>
  <div class="space-y-3">
    <UAlert
      v-if="alert"
      color="error"
      title="Could not move time entry"
      :description="alert"
      role="alert"
    />
    <section v-if="early.length" aria-label="Before visible hours" class="space-y-2">
      <h3 class="font-medium">Before visible hours</h3>
      <TodayAgendaEntry
        v-for="row in early"
        :key="row.entry.id"
        :row="row"
        :status-busy="statusChangingId === row.ticketId"
        @filter="(kind, id) => emit('filter', kind, id)"
        @edit="emit('edit', row.entry.id)"
        @change-status="(id, status) => emit('change-status', id, status)"
      />
    </section>
    <div class="grid grid-cols-[4rem_minmax(0,1fr)]" role="region" aria-label="Day timeline">
      <div class="relative" :style="{ height: `${(end - start) * pixelsPerMinute}px` }">
        <span
          v-for="hour in hours"
          :key="hour"
          class="absolute right-2 text-xs text-muted"
          :class="{ '-translate-y-full': hour === end }"
          :style="{ top: `${(hour - start) * pixelsPerMinute}px` }"
          >{{ clock(hour) }}</span
        >
      </div>
      <div
        ref="timeline"
        class="relative border-l border-default select-none"
        :style="{ height: `${(end - start) * pixelsPerMinute}px` }"
        @pointerdown="initialPointer"
        @pointermove="updatePointer"
        @pointerup="finishPointer"
        @pointercancel="resetGesture"
        @lostpointercapture="resetGesture"
        @dblclick="timelineDoubleClick"
      >
        <div
          v-for="hour in hours"
          :key="hour"
          class="pointer-events-none absolute w-full border-t border-default"
          :style="{ top: `${(hour - start) * pixelsPerMinute}px` }"
        />
        <div
          v-if="showNowMarker"
          data-current-time-marker
          class="pointer-events-none absolute inset-x-0 z-30 flex -translate-y-1/2 items-center"
          :style="{ top: nowMarkerTop }"
          role="img"
          :aria-label="`Current time ${clock(currentMinute ?? start)}`"
        >
          <span class="size-2 shrink-0 rounded-full bg-error" />
          <span class="h-px flex-1 bg-error" />
        </div>
        <div
          v-for="row in within"
          :key="row.entry.id"
          :data-agenda-entry="row.entry.id"
          class="absolute inset-x-2 py-px"
          :class="{ 'opacity-40': active && gesture?.id === row.entry.id }"
          :style="blockStyle(row.entry)"
        >
          <TodayAgendaEntry
            :row="row"
            compact-timeline
            :status-busy="statusChangingId === row.ticketId"
            @filter="(kind, id) => emit('filter', kind, id)"
            @edit="emit('edit', row.entry.id)"
            @change-status="(id, status) => emit('change-status', id, status)"
          />
          <div
            data-drag-edge="top"
            class="absolute inset-x-0 top-0 h-2 cursor-n-resize"
            aria-hidden="true"
          />
          <div
            data-drag-edge="bottom"
            class="absolute inset-x-0 bottom-0 h-2 cursor-s-resize"
            aria-hidden="true"
          />
        </div>
        <template v-if="active">
          <div
            v-for="row in hidden"
            :key="row.entry.id"
            class="pointer-events-none absolute inset-x-2 py-px opacity-40"
            :style="blockStyle(row.entry)"
          >
            <TodayAgendaEntry
              :row="row"
              compact-timeline
              :status-busy="statusChangingId === row.ticketId"
              @filter="(kind, id) => emit('filter', kind, id)"
              @change-status="(id, status) => emit('change-status', id, status)"
            />
          </div>
          <div
            v-if="gesture?.preview"
            class="pointer-events-none absolute inset-x-2 z-20 rounded-lg border-2 p-2 text-xs font-semibold"
            :class="
              gesture.preview.valid
                ? 'border-primary bg-primary/20 text-highlighted'
                : 'border-error bg-error/20 text-error'
            "
            :style="previewStyle(gesture.preview)"
            role="status"
          >
            <template v-if="gesture.preview.valid"
              >{{ clock(gesture.preview.startMinute) }}–{{
                clock(gesture.preview.startMinute + gesture.preview.durationMinutes)
              }}</template
            >
            <template v-else>Conflict</template>
          </div>
        </template>
      </div>
    </div>
    <section v-if="late.length" aria-label="After visible hours" class="space-y-2">
      <h3 class="font-medium">After visible hours</h3>
      <TodayAgendaEntry
        v-for="row in late"
        :key="row.entry.id"
        :row="row"
        :status-busy="statusChangingId === row.ticketId"
        @filter="(kind, id) => emit('filter', kind, id)"
        @edit="emit('edit', row.entry.id)"
        @change-status="(id, status) => emit('change-status', id, status)"
      />
    </section>
  </div>
</template>
