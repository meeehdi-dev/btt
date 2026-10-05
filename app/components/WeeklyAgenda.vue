<script setup lang="ts">
import { ticketStatuses } from '#shared/ticket-status'
import { overlaps, slotMinutes, usageColor } from '#shared/time-entry'
import {
  creationRange,
  moveRange,
  pointerSlot,
  resizeRange,
  type MovePreview,
} from '~/utils/agenda-drag'
import { formatTicketEstimate } from '~/utils/ticket-estimate'
import { formatAgendaDate } from '~/utils/agenda-week'

type TicketStatus = (typeof ticketStatuses)[number]
type Row = {
  entry: {
    id: string
    date: string
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
type WeekPreview = MovePreview & { date: string }
type Gesture = {
  pointerId: number
  kind: 'create' | 'move' | 'top' | 'bottom'
  id: string | null
  date: string
  anchor: number
  startedX: number
  startedY: number
  moved: boolean
  offset: number
  original: { date: string; startMinute: number; durationMinutes: number } | null
  preview: WeekPreview | null
}

const props = defineProps<{
  dates: string[]
  currentDate: string
  currentMinute: number | null
  rows: Row[]
  occupied: Row[]
  trackedMinutesByDate: Record<string, number>
  start: number
  end: number
  workDayDurationMinutes: number
  locale: string
  busy?: boolean
  statusChangingId?: string | null
}>()
const emit = defineEmits<{
  filter: [kind: 'client' | 'project' | 'release' | 'ticket' | 'status', id: string]
  create: [date: string, startMinute: number, durationMinutes: number]
  change: [id: string, date: string, startMinute: number, durationMinutes: number]
  edit: [id: string]
  add: [date: string]
  'change-status': [id: string, status: TicketStatus]
}>()
const pixelsPerMinute = 1.8
const timeline = ref<HTMLElement | null>(null)
const desktop = ref(false)
let breakpoint: MediaQueryList | undefined
const alert = ref('')
const gesture = shallowRef<Gesture | null>(null)
const active = computed(() => gesture.value?.moved ?? false)
const bounds = computed(() => ({ start: props.start, end: props.end }))
const hours = computed(() =>
  Array.from(
    { length: Math.ceil((props.end - props.start) / 60) + 1 },
    (_, index) => props.start + index * 60,
  ).filter((minute) => minute <= props.end),
)
const columns = computed(() =>
  props.dates.map((date) => {
    const rows = props.rows.filter((row) => row.entry.date === date)
    const occupied = props.occupied.filter((row) => row.entry.date === date)
    return {
      date,
      rows,
      occupied,
      early: rows.filter(({ entry }) => entry.startMinute < props.start),
      late: rows.filter(({ entry }) => entry.startMinute >= props.end),
      within: rows.filter(
        ({ entry }) => entry.startMinute >= props.start && entry.startMinute < props.end,
      ),
      shown: new Set(rows.map(({ entry }) => entry.id)),
    }
  }),
)
function column(date: string) {
  return columns.value.find((item) => item.date === date)
}
const clock = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
function progressValue(date: string) {
  return Math.min(props.trackedMinutesByDate[date] ?? 0, props.workDayDurationMinutes)
}
function overtime(date: string) {
  return Math.max(0, (props.trackedMinutesByDate[date] ?? 0) - props.workDayDurationMinutes)
}
function progressText(date: string) {
  const tracked = props.trackedMinutesByDate[date] ?? 0
  const extra = overtime(date)
  return `Worked ${formatTicketEstimate(tracked)} of ${formatTicketEstimate(props.workDayDurationMinutes)} target${extra ? `; ${formatTicketEstimate(extra)} overtime` : ''}`
}
function progressSegments(date: string) {
  const tracked = props.trackedMinutesByDate[date] ?? 0
  if (tracked <= props.workDayDurationMinutes) return [{ value: tracked, color: 'info' as const }]
  const extra = Math.min(tracked - props.workDayDurationMinutes, props.workDayDurationMinutes)
  return [
    { value: props.workDayDurationMinutes - extra, color: 'info' as const },
    { value: extra, color: 'warning' as const },
  ]
}
const textClasses = {
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
} as const
function trackedTextClass(date: string) {
  return textClasses[
    usageColor(props.trackedMinutesByDate[date] ?? 0, props.workDayDurationMinutes)
  ]
}
function dayLabel(date: string) {
  return formatAgendaDate(date, props.locale)
}
function isCurrentDate(date: string) {
  return date === props.currentDate
}
function showNowMarker(date: string) {
  return (
    isCurrentDate(date) &&
    props.currentMinute !== null &&
    props.currentMinute >= props.start &&
    props.currentMinute < props.end
  )
}
function nowMarkerTop() {
  return `${((props.currentMinute ?? props.start) - props.start) * pixelsPerMinute}px`
}
function resetGesture() {
  const id = gesture.value?.pointerId
  if (id !== undefined && timeline.value?.hasPointerCapture(id))
    timeline.value.releasePointerCapture(id)
  gesture.value = null
}
function syncBreakpoint(event: MediaQueryListEvent) {
  desktop.value = event.matches
  if (!event.matches) resetGesture()
}
function onEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') resetGesture()
}
onMounted(() => {
  window.addEventListener('keydown', onEscape)
  breakpoint = window.matchMedia('(min-width: 1280px)')
  desktop.value = breakpoint.matches
  breakpoint.addEventListener('change', syncBreakpoint)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onEscape)
  breakpoint?.removeEventListener('change', syncBreakpoint)
  resetGesture()
})
watch(
  () => [props.dates, props.start, props.end, props.rows, props.occupied, props.busy],
  resetGesture,
)
function position(event: PointerEvent) {
  return event.clientY - (timeline.value?.getBoundingClientRect().top ?? 0)
}
function dateAt(event: PointerEvent): string | undefined {
  const target = event.target
  if (target instanceof Element) {
    const cell = target.closest<HTMLElement>('[data-week-date]')?.dataset.weekDate
    if (cell && props.dates.includes(cell)) return cell
  }
  const rect = timeline.value?.getBoundingClientRect()
  if (!rect || !props.dates.length) return undefined
  const index = Math.max(
    0,
    Math.min(
      props.dates.length - 1,
      Math.floor(((event.clientX - rect.left) / rect.width) * props.dates.length),
    ),
  )
  return props.dates[index]
}
function initialPointer(event: PointerEvent) {
  if (
    !desktop.value ||
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
  const date = dateAt(event)
  if (!date) return
  const wrapper = target.closest<HTMLElement>('[data-agenda-entry]')
  const row = wrapper
    ? props.occupied.find(({ entry }) => entry.id === wrapper.dataset.agendaEntry)
    : undefined
  const edge = target.closest<HTMLElement>('[data-drag-edge]')?.dataset.dragEdge
  const y = position(event)
  const minute = pointerSlot(y, (props.end - props.start) * pixelsPerMinute, bounds.value)
  const day = column(date)
  if (!day) return
  if (
    !row &&
    day.occupied.some(({ entry }) =>
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
    ? {
        date: row.entry.date,
        startMinute: row.entry.startMinute,
        durationMinutes: row.entry.durationMinutes,
      }
    : null
  const interval = row
    ? { startMinute: row.entry.startMinute, durationMinutes: row.entry.durationMinutes }
    : creationRange(
        minute,
        minute,
        day.occupied.map(({ entry }) => entry),
        bounds.value,
      )
  gesture.value = {
    pointerId: event.pointerId,
    kind,
    id: row?.entry.id ?? null,
    date,
    anchor: minute,
    startedX: event.clientX,
    startedY: event.clientY,
    moved: false,
    offset: row && wrapper ? event.clientY - wrapper.getBoundingClientRect().top : 0,
    original,
    preview: { ...interval, date, adjusted: false, valid: true },
  }
  timeline.value.setPointerCapture(event.pointerId)
  event.preventDefault()
}
function updatePointer(event: PointerEvent) {
  const current = gesture.value
  if (!current || current.pointerId !== event.pointerId) return
  const date = current.kind === 'move' ? (dateAt(event) ?? current.date) : current.date
  const day = column(date)
  if (!day) return
  const y = position(event)
  const height = (props.end - props.start) * pixelsPerMinute
  const intervals = day.occupied
    .filter(({ entry }) => entry.id !== current.id)
    .map(({ entry }) => entry)
  let preview: WeekPreview | null = null
  if (current.kind === 'create') {
    preview = {
      ...creationRange(
        current.anchor,
        pointerSlot(y, height, bounds.value),
        intervals,
        bounds.value,
      ),
      date: current.date,
      adjusted: false,
      valid: true,
    }
  } else if (current.kind === 'move' && current.original) {
    const rawStart = props.start + (y - current.offset) / pixelsPerMinute
    preview = {
      ...moveRange(
        rawStart,
        current.original.durationMinutes,
        intervals,
        bounds.value,
        pixelsPerMinute,
      ),
      date,
    }
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
        bounds.value,
      ),
      date: current.original.date,
      adjusted: false,
      valid: true,
    }
  }
  gesture.value = {
    ...current,
    moved:
      current.moved ||
      Math.hypot(event.clientX - current.startedX, event.clientY - current.startedY) >= 6,
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
  if (current.kind === 'create')
    emit('create', result.date, result.startMinute, result.durationMinutes)
  else if (
    current.id &&
    current.original &&
    (result.date !== current.original.date ||
      result.startMinute !== current.original.startMinute ||
      result.durationMinutes !== current.original.durationMinutes)
  )
    emit('change', current.id, result.date, result.startMinute, result.durationMinutes)
}
function timelineDoubleClick(event: MouseEvent) {
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
function previewStyle(preview: WeekPreview) {
  if (preview.valid) return blockStyle(preview)
  return {
    top: `${(preview.startMinute - props.start) * pixelsPerMinute}px`,
    height: `${preview.durationMinutes * pixelsPerMinute}px`,
  }
}
function hiddenRows(date: string) {
  const day = column(date)
  if (!day) return []
  return day.occupied.filter(
    ({ entry }) =>
      (!day.shown.has(entry.id) || entry.startMinute < props.start) &&
      entry.startMinute < props.end &&
      entry.startMinute + entry.durationMinutes > props.start,
  )
}
</script>

<template>
  <div class="space-y-4">
    <UAlert
      v-if="alert"
      color="error"
      title="Could not update time entry"
      :description="alert"
      role="alert"
    />
    <div class="hidden xl:grid xl:grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] xl:gap-1">
      <div aria-hidden="true" />
      <section
        v-for="date in dates"
        :key="`header-${date}`"
        class="min-w-0 space-y-1 rounded-t-md border border-default bg-elevated/50 p-2"
        :class="{ 'border-primary/60 bg-primary/10': isCurrentDate(date) }"
        :aria-label="dayLabel(date)"
      >
        <div class="flex min-w-0 items-center justify-between gap-1">
          <h2 class="flex min-w-0 flex-1 items-center gap-1 text-sm font-semibold text-highlighted">
            <time
              :datetime="date"
              :aria-current="isCurrentDate(date) ? 'date' : undefined"
              class="min-w-0 truncate"
              >{{ dayLabel(date) }}</time
            >
            <span
              v-if="isCurrentDate(date)"
              class="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
              >Today</span
            >
          </h2>
          <UTooltip :text="`Add time entry on ${dayLabel(date)}`">
            <UButton
              color="neutral"
              variant="ghost"
              icon="lucide:plus"
              :aria-label="`Add time entry on ${dayLabel(date)}`"
              size="xs"
              class="shrink-0"
              @click="emit('add', date)"
            />
          </UTooltip>
        </div>
        <div class="flex min-w-0 items-center gap-1 text-xs text-muted">
          <span class="shrink-0" :class="trackedTextClass(date)">{{
            formatTicketEstimate(trackedMinutesByDate[date] ?? 0)
          }}</span>
          <span class="shrink-0">/ {{ formatTicketEstimate(workDayDurationMinutes) }}</span>
          <div
            role="progressbar"
            :aria-label="`${dayLabel(date)} workday progress`"
            :aria-valuemin="0"
            :aria-valuemax="workDayDurationMinutes"
            :aria-valuenow="progressValue(date)"
            :aria-valuetext="progressText(date)"
            class="min-w-0 flex-1"
          >
            <UProgressGroup
              :items="progressSegments(date)"
              :max="workDayDurationMinutes"
              size="sm"
              class="min-w-0"
              aria-hidden="true"
            />
          </div>
        </div>
      </section>
      <div class="relative" :style="{ height: `${(end - start) * pixelsPerMinute}px` }">
        <span
          v-for="hour in hours"
          :key="hour"
          class="absolute right-1 text-xs text-muted"
          :style="{ top: `${(hour - start) * pixelsPerMinute}px` }"
          >{{ clock(hour) }}</span
        >
      </div>
      <div
        ref="timeline"
        class="relative col-span-7 grid grid-cols-7 border-y border-default select-none"
        :style="{ height: `${(end - start) * pixelsPerMinute}px` }"
        role="region"
        aria-label="Week timeline"
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
          class="pointer-events-none absolute inset-x-0 z-10 border-t border-default"
          :style="{ top: `${(hour - start) * pixelsPerMinute}px` }"
        />
        <div
          v-for="date in dates"
          :key="date"
          :data-week-date="date"
          class="relative min-w-0 border-r border-default first:border-l"
          :class="{ 'bg-primary/5': isCurrentDate(date) }"
        >
          <div
            v-if="showNowMarker(date)"
            data-current-time-marker
            class="pointer-events-none absolute inset-x-0 z-30 flex -translate-y-1/2 items-center"
            :style="{ top: nowMarkerTop() }"
            role="img"
            :aria-label="`Current time ${clock(currentMinute ?? start)}`"
          >
            <span class="size-2 shrink-0 rounded-full bg-error" />
            <span class="h-px flex-1 bg-error" />
          </div>
          <div
            v-for="row in column(date)?.within"
            :key="row.entry.id"
            :data-agenda-entry="row.entry.id"
            class="absolute inset-x-px z-0 py-px"
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
              class="absolute inset-x-0 top-0 z-20 h-2 cursor-n-resize"
              aria-hidden="true"
            />
            <div
              data-drag-edge="bottom"
              class="absolute inset-x-0 bottom-0 z-20 h-2 cursor-s-resize"
              aria-hidden="true"
            />
          </div>
          <template v-if="active">
            <div
              v-for="row in hiddenRows(date)"
              :key="`hidden-${row.entry.id}`"
              class="pointer-events-none absolute inset-x-px z-0 py-px opacity-40"
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
              v-if="gesture?.preview?.date === date"
              class="pointer-events-none absolute inset-x-px z-30 rounded-lg border-2 p-1 text-xs font-semibold"
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
      <template v-for="(date, dayIndex) in dates" :key="`early-${date}`">
        <div
          v-if="column(date)?.early.length"
          class="col-span-8 grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] gap-1 border-b border-default py-2"
        >
          <h3 class="col-span-8 text-xs font-medium text-muted">
            Before visible hours · {{ dayLabel(date) }}
          </h3>
          <TodayAgendaEntry
            v-for="row in column(date)?.early"
            :key="row.entry.id"
            :row="row"
            :style="{ gridColumnStart: dayIndex + 2 }"
            :status-busy="statusChangingId === row.ticketId"
            @filter="(kind, id) => emit('filter', kind, id)"
            @edit="emit('edit', row.entry.id)"
            @change-status="(id, status) => emit('change-status', id, status)"
          />
        </div>
        <div
          v-if="column(date)?.late.length"
          class="col-span-8 grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] gap-1 border-b border-default py-2"
        >
          <h3 class="col-span-8 text-xs font-medium text-muted">
            After visible hours · {{ dayLabel(date) }}
          </h3>
          <TodayAgendaEntry
            v-for="row in column(date)?.late"
            :key="row.entry.id"
            :row="row"
            :style="{ gridColumnStart: dayIndex + 2 }"
            :status-busy="statusChangingId === row.ticketId"
            @filter="(kind, id) => emit('filter', kind, id)"
            @edit="emit('edit', row.entry.id)"
            @change-status="(id, status) => emit('change-status', id, status)"
          />
        </div>
      </template>
    </div>

    <div class="space-y-4 xl:hidden">
      <section
        v-for="day in columns"
        :key="day.date"
        class="space-y-3 rounded-md border border-default bg-elevated/30 p-3"
        :class="{ 'border-primary/60 bg-primary/5': isCurrentDate(day.date) }"
        :aria-label="dayLabel(day.date)"
      >
        <div class="space-y-1">
          <div class="flex min-w-0 items-center justify-between gap-3">
            <h2 class="flex min-w-0 flex-1 items-center gap-1 font-semibold text-highlighted">
              <time
                :datetime="day.date"
                :aria-current="isCurrentDate(day.date) ? 'date' : undefined"
                class="min-w-0 truncate"
                >{{ dayLabel(day.date) }}</time
              >
              <span
                v-if="isCurrentDate(day.date)"
                class="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary"
                >Today</span
              >
            </h2>
            <UButton
              color="neutral"
              variant="outline"
              icon="lucide:plus"
              :aria-label="`Add time entry on ${dayLabel(day.date)}`"
              label="Add"
              size="sm"
              class="shrink-0"
              @click="emit('add', day.date)"
            />
          </div>
          <div class="flex min-w-0 items-center gap-1 text-sm text-muted">
            <span class="shrink-0" :class="trackedTextClass(day.date)">{{
              formatTicketEstimate(trackedMinutesByDate[day.date] ?? 0)
            }}</span>
            <span class="shrink-0">/ {{ formatTicketEstimate(workDayDurationMinutes) }}</span>
            <div
              role="progressbar"
              :aria-label="`${dayLabel(day.date)} workday progress`"
              :aria-valuemin="0"
              :aria-valuemax="workDayDurationMinutes"
              :aria-valuenow="progressValue(day.date)"
              :aria-valuetext="progressText(day.date)"
              class="min-w-0 flex-1"
            >
              <UProgressGroup
                :items="progressSegments(day.date)"
                :max="workDayDurationMinutes"
                size="sm"
                class="min-w-0"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
        <section
          v-if="day.early.length"
          class="space-y-2"
          :aria-label="`Before visible hours · ${dayLabel(day.date)}`"
        >
          <h3 class="text-xs font-medium text-muted">Before visible hours</h3>
          <TodayAgendaEntry
            v-for="row in day.early"
            :key="row.entry.id"
            :row="row"
            :status-busy="statusChangingId === row.ticketId"
            show-edit
            @filter="(kind, id) => emit('filter', kind, id)"
            @edit="emit('edit', row.entry.id)"
            @change-status="(id, status) => emit('change-status', id, status)"
          />
        </section>
        <ol class="space-y-2" :aria-label="`Work in visible hours · ${dayLabel(day.date)}`">
          <li v-for="row in day.within" :key="row.entry.id">
            <TodayAgendaEntry
              :row="row"
              :status-busy="statusChangingId === row.ticketId"
              show-edit
              @filter="(kind, id) => emit('filter', kind, id)"
              @edit="emit('edit', row.entry.id)"
              @change-status="(id, status) => emit('change-status', id, status)"
            />
          </li>
        </ol>
        <section
          v-if="day.late.length"
          class="space-y-2"
          :aria-label="`After visible hours · ${dayLabel(day.date)}`"
        >
          <h3 class="text-xs font-medium text-muted">After visible hours</h3>
          <TodayAgendaEntry
            v-for="row in day.late"
            :key="row.entry.id"
            :row="row"
            :status-busy="statusChangingId === row.ticketId"
            show-edit
            @filter="(kind, id) => emit('filter', kind, id)"
            @edit="emit('edit', row.entry.id)"
            @change-status="(id, status) => emit('change-status', id, status)"
          />
        </section>
        <p v-if="!day.rows.length" class="text-sm text-muted">No completed work on this day.</p>
      </section>
    </div>
  </div>
</template>
