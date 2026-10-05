<script setup lang="ts">
import { Effect } from 'effect'
import { CalendarDate, getLocalTimeZone, parseDate, Time, today } from '@internationalized/date'
import { formatTicketEstimate } from '~/utils/ticket-estimate'
import {
  formatAgendaDate,
  formatAgendaWeekRange,
  formatAgendaWeekRangeShort,
} from '~/utils/agenda-week'
import { getWeekDates } from '#shared/agenda-week'
import { entityIcons } from '~/utils/entity-icons'
import { ticketStatuses } from '#shared/ticket-status'
import {
  useHierarchyFilters,
  type FilterSearchInput,
  type HierarchyFilterKind,
  type HierarchyFilterSource,
} from '~/composables/useHierarchyFilters'
import { usageColor, validDate } from '#shared/time-entry'

type TicketStatus = (typeof ticketStatuses)[number]
type WeekStartsOn = 0 | 1 | 2 | 3 | 4 | 5 | 6

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const route = useRoute()
const date = shallowRef<CalendarDate | null>(null)
const pickerOpen = ref(false)
const editDatePickerOpen = ref(false)
const addDatePickerOpen = ref(false)
const addOpen = ref(false)
const addSource = ref<'page' | 'date' | 'drag'>('page')
const day = computed(() => date.value?.toString() ?? '')
const view = ref<'day' | 'week'>('day')
const agendaViewStorageKey = 'nxmr:agenda-view'
const locale = ref('en')
const currentTime = shallowRef<Date | null>(null)
const currentDate = computed(() => {
  const value = currentTime.value
  return value
    ? new CalendarDate(value.getFullYear(), value.getMonth() + 1, value.getDate()).toString()
    : ''
})
const currentMinute = computed(() =>
  currentTime.value ? currentTime.value.getHours() * 60 + currentTime.value.getMinutes() : null,
)
function formatClock(minute: number) {
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
}
const currentTimeLabel = computed(() =>
  currentMinute.value === null ? '' : `Now ${formatClock(currentMinute.value)}`,
)
const isToday = computed(
  () => day.value === (currentDate.value || today(getLocalTimeZone()).toString()),
)
const {
  data: agenda,
  pending,
  error,
  refresh,
} = await useApiFetch('/api/agenda', {
  query: computed(() => ({ date: day.value })),
  immediate: false,
  watch: false,
})
const {
  data: settings,
  error: settingsError,
  refresh: refreshSettings,
} = await useApiFetch('/api/settings')
const calendarWeekStartsOn = computed<WeekStartsOn>(() => {
  const startOfWeekDay = settings.value?.startOfWeekDay
  return startOfWeekDay !== undefined && startOfWeekDay >= 0 && startOfWeekDay <= 6
    ? (startOfWeekDay as WeekStartsOn)
    : 1
})
const weekDates = computed(() =>
  day.value ? (getWeekDates(day.value, settings.value?.startOfWeekDay ?? 1) ?? []) : [],
)
const weekStart = computed(() => weekDates.value[0] ?? '')
const canChooseWeekAddDate = computed(
  () => view.value === 'week' && addSource.value === 'page' && weekDates.value.length === 7,
)
const addWeekMinValue = computed(() =>
  canChooseWeekAddDate.value ? parseDate(weekDates.value[0]!) : undefined,
)
const addWeekMaxValue = computed(() =>
  canChooseWeekAddDate.value ? parseDate(weekDates.value[6]!) : undefined,
)
const isCurrentPeriod = computed(() => {
  const current = currentDate.value || today(getLocalTimeZone()).toString()
  return view.value === 'week' ? weekDates.value.includes(current) : day.value === current
})
const weekRangeLabel = computed(() =>
  weekDates.value.length === 7
    ? formatAgendaWeekRange(weekDates.value[0]!, weekDates.value[6]!, locale.value)
    : 'Loading week…',
)
const weekRangeShortLabel = computed(() =>
  weekDates.value.length === 7
    ? formatAgendaWeekRangeShort(weekDates.value[0]!, weekDates.value[6]!, locale.value)
    : 'Loading week…',
)
const {
  data: weekAgenda,
  pending: weekPending,
  error: weekError,
  refresh: refreshWeek,
} = await useApiFetch('/api/agenda/week', {
  query: computed(() => ({ startDate: weekStart.value })),
  immediate: false,
  watch: false,
})
const {
  data: ticketsData,
  error: ticketsError,
  refresh: refreshTickets,
} = await useApiFetch('/api/tickets')
const tickets = computed(() => ticketsData.value?.tickets ?? [])
const eligibleTickets = computed(() =>
  tickets.value.filter(({ ticket }) => ticket.status !== 'Done'),
)
const ticketSearchInput = useSelectSearchInput('Search tickets…')
const ticketPickerOpen = ref(false)
const entries = computed(() => agenda.value?.entries ?? [])
const activeEntries = computed(() =>
  view.value === 'week' ? (weekAgenda.value?.entries ?? []) : entries.value,
)
const activeAgendaError = computed(() => (view.value === 'week' ? weekError.value : error.value))
const activeAgendaPending = computed(() =>
  view.value === 'week' ? weekPending.value : pending.value,
)
async function refreshActiveAgenda() {
  return view.value === 'week' ? refreshWeek() : refresh()
}
function activeAgendaFailure() {
  return activeAgendaError.value
}
type FilterKind = HierarchyFilterKind | 'status'
const filters = reactive<Record<FilterKind, string>>({
  client: '',
  project: '',
  release: '',
  ticket: '',
  status: '',
})
const filterSources = computed<HierarchyFilterSource[]>(() => [
  ...activeEntries.value.map((row) => ({
    clientId: row.clientId,
    clientName: row.clientName,
    projectId: row.projectId,
    projectName: row.projectName,
    releaseId: row.releaseId,
    releaseName: row.releaseName,
    ticketId: row.ticketId,
    ticketName: row.ticketTitle,
    status: row.status,
  })),
  ...tickets.value.map((item) => ({
    clientId: item.clientId,
    clientName: item.clientName,
    projectId: item.projectId,
    projectName: item.projectName,
    releaseId: item.ticket.releaseId,
    releaseName: item.releaseName,
    ticketId: item.ticket.id,
    ticketName: item.ticket.title,
    status: item.ticket.status,
  })),
])
const {
  options: hierarchyOptions,
  applyFilter: applyHierarchyFilter,
  clearFilters: clearHierarchyFilters,
  searchInputs: hierarchySearchInputs,
} = useHierarchyFilters(filterSources, filters)
const filterSearchInputs = computed<Record<FilterKind, FilterSearchInput>>(() => ({
  ...hierarchySearchInputs.value,
  status: {
    placeholder: 'Search statuses…',
    icon: 'lucide:search',
    autofocus: hierarchySearchInputs.value.client.autofocus,
  },
}))
function options(kind: FilterKind) {
  if (kind !== 'status') return hierarchyOptions(kind)
  const seen = new Map<string, string>()
  for (const row of filterSources.value) {
    if (filters.client && row.clientId !== filters.client) continue
    if (row.status) seen.set(row.status, row.status)
  }
  return [...seen].map(([value, label]) => ({ value, label }))
}
function applyFilter(kind: FilterKind, id: string) {
  if (kind === 'status') filters.status = id
  else applyHierarchyFilter(kind, id)
}
function clearFilters() {
  clearHierarchyFilters()
  filters.status = ''
}
const filtered = computed(() =>
  activeEntries.value.filter(
    (row) =>
      (!filters.client || row.clientId === filters.client) &&
      (!filters.project || row.projectId === filters.project) &&
      (!filters.release || row.releaseId === filters.release) &&
      (!filters.ticket || row.ticketId === filters.ticket) &&
      (!filters.status || row.status === filters.status),
  ),
)
const ticketId = ref('')
const startTime = shallowRef(new Time(9, 0))
const duration = ref(30)
const description = ref('')
const busy = ref(false)
const actionError = ref('')
const actionErrorTitle = ref('Could not add work')
const pageActionError = ref('')
const pageActionNeedsRefresh = ref(false)
const pageActionErrorTitle = ref('Could not complete action')
const dragError = ref('')
const dragErrorBase = ref('')
const dragErrorTitle = ref('Could not update time entry')
const statusChangingId = ref<string | null>(null)
const statusError = ref('')
const statusErrorBase = ref('')
const statusErrorNeedsRefresh = ref(false)
const statusWriteNeedsRefresh = ref(false)
const statusMessage = ref('')
const editingId = ref<string | null>(null)
const editingOpen = ref(false)
const editingDate = shallowRef<CalendarDate | null>(null)
const editingTime = shallowRef(new Time(9, 0))
const addDate = shallowRef<CalendarDate | null>(null)
const editingDuration = ref(30)
const editingDescription = ref('')
const editingError = ref('')
const editingErrorTitle = ref('Could not update time entry')
const deletingEdit = ref(false)
function selectEntryTicket(id: string) {
  ticketId.value = id
  ticketPickerOpen.value = false
}
async function retryTodayReads() {
  const result = await runClientEffect(
    Effect.all([
      refreshEffect(refreshActiveAgenda, activeAgendaFailure),
      refreshEffect(refreshSettings, () => settingsError.value),
      refreshEffect(refreshTickets, () => ticketsError.value),
    ]),
  )
  if (result._tag === 'Success') {
    pageActionNeedsRefresh.value = false
    pageActionError.value = ''
    if (dragErrorBase.value) {
      dragError.value = dragErrorBase.value
      dragErrorBase.value = ''
    } else if (dragErrorTitle.value === 'Time entry moved; refresh failed') {
      dragError.value = ''
      dragErrorTitle.value = 'Could not update time entry'
    }
    if (statusWriteNeedsRefresh.value) {
      statusError.value = ''
      statusWriteNeedsRefresh.value = false
    } else if (statusErrorNeedsRefresh.value) {
      statusError.value = statusErrorBase.value
      statusErrorNeedsRefresh.value = false
    }
  }
}
watch([day, view, weekStart], ([value, currentView, startDate]) => {
  editingOpen.value = false
  addOpen.value = false
  dragError.value = ''
  if (!value) return
  if (currentView === 'week' && startDate) void refreshWeek()
  else if (currentView === 'day') void refresh()
})
function beginEdit(id: string) {
  const row = activeEntries.value.find(({ entry }) => entry.id === id)
  if (!row) return
  editingId.value = id
  editingDate.value = parseDate(row.entry.date)
  editingTime.value = new Time(Math.floor(row.entry.startMinute / 60), row.entry.startMinute % 60)
  editingDuration.value = row.entry.durationMinutes
  editingDescription.value = row.entry.description
  editingError.value = ''
  editingOpen.value = true
}
async function saveEdit() {
  if (!editingId.value || !editingDate.value || busy.value || pageActionNeedsRefresh.value) return
  busy.value = true
  editingError.value = ''
  editingErrorTitle.value = 'Could not update time entry'
  try {
    const endpoint: string = '/api/time-entries/' + editingId.value
    const result = await runClientRequest<unknown>((signal) =>
      $fetch<unknown>(endpoint, {
        method: 'PATCH',
        body: {
          date: editingDate.value!.toString(),
          startMinute: editingTime.value.hour * 60 + editingTime.value.minute,
          durationMinutes: editingDuration.value,
          description: editingDescription.value,
        },
        signal,
      }),
    )
    if (result._tag === 'Failure') {
      editingError.value = result.failure.userMessage
      return
    }
    editingOpen.value = false
    const refreshed = await runClientEffect(refreshEffect(refreshActiveAgenda, activeAgendaFailure))
    if (refreshed._tag === 'Failure') {
      pageActionNeedsRefresh.value = true
      pageActionErrorTitle.value = 'Time entry corrected; refresh failed'
      pageActionError.value = `Your correction was saved, but the agenda could not be refreshed. ${refreshed.failure.userMessage}`
    }
  } finally {
    busy.value = false
  }
}
async function deleteEdit() {
  if (
    !editingId.value ||
    busy.value ||
    pageActionNeedsRefresh.value ||
    !confirm('Delete this time entry?')
  )
    return
  busy.value = true
  deletingEdit.value = true
  editingError.value = ''
  editingErrorTitle.value = 'Could not delete time entry'
  try {
    const endpoint: string = '/api/time-entries/' + editingId.value
    const result = await runClientRequest<unknown>((signal) =>
      $fetch<unknown>(endpoint, { method: 'DELETE', signal }),
    )
    if (result._tag === 'Failure') {
      editingError.value = result.failure.userMessage
      return
    }
    editingOpen.value = false
    editingId.value = null
    const refreshed = await runClientEffect(refreshEffect(refreshActiveAgenda, activeAgendaFailure))
    if (refreshed._tag === 'Failure') {
      pageActionNeedsRefresh.value = true
      pageActionErrorTitle.value = 'Time entry deleted; refresh failed'
      pageActionError.value = `The time entry was deleted, but the agenda could not be refreshed. ${refreshed.failure.userMessage}`
    }
  } finally {
    deletingEdit.value = false
    busy.value = false
  }
}
function beginAdd(dateString = day.value, source: 'page' | 'date' = 'page') {
  if (!dateString || !validDate(dateString) || pageActionNeedsRefresh.value) return
  addDate.value = parseDate(dateString)
  addSource.value = source
  addDatePickerOpen.value = false
  actionError.value = ''
  addOpen.value = true
}
function beginDateAdd(dateString: string) {
  beginAdd(dateString, 'date')
}
function beginDragCreate(dateString: string, startMinute: number, durationMinutes: number) {
  if (pageActionNeedsRefresh.value) return
  addDate.value = parseDate(dateString)
  addSource.value = 'drag'
  addDatePickerOpen.value = false
  startTime.value = new Time(Math.floor(startMinute / 60), startMinute % 60)
  duration.value = durationMinutes
  actionError.value = ''
  addOpen.value = true
}
async function changeEntry(
  id: string,
  dateString: string,
  startMinute: number,
  durationMinutes: number,
) {
  if (busy.value || pageActionNeedsRefresh.value) return
  busy.value = true
  dragError.value = ''
  dragErrorBase.value = ''
  dragErrorTitle.value = 'Could not update time entry'
  try {
    const endpoint: string = '/api/time-entries/' + id
    const result = await runClientRequest<unknown>((signal) =>
      $fetch<unknown>(endpoint, {
        method: 'PATCH',
        body: { date: dateString, startMinute, durationMinutes },
        signal,
      }),
    )
    if (result._tag === 'Failure') {
      dragErrorBase.value = result.failure.userMessage
      dragError.value = dragErrorBase.value
      const refreshed = await runClientEffect(
        refreshEffect(refreshActiveAgenda, activeAgendaFailure),
      )
      if (refreshed._tag === 'Failure') {
        pageActionNeedsRefresh.value = true
        dragError.value += ` The agenda also could not be refreshed. ${refreshed.failure.userMessage}`
      }
      return
    }
    const refreshed = await runClientEffect(refreshEffect(refreshActiveAgenda, activeAgendaFailure))
    if (refreshed._tag === 'Failure') {
      pageActionNeedsRefresh.value = true
      dragErrorTitle.value = 'Time entry moved; refresh failed'
      dragError.value = `The time entry was moved, but the agenda could not be refreshed. ${refreshed.failure.userMessage}`
    }
  } finally {
    busy.value = false
  }
}
const durations = Array.from({ length: 48 }, (_, index) => ({
  label: formatTicketEstimate((index + 1) * 30),
  value: (index + 1) * 30,
}))
let clockTimer: number | undefined
function syncCurrentTime() {
  currentTime.value = new Date()
  if (clockTimer !== undefined) window.clearTimeout(clockTimer)
  if (document.visibilityState === 'hidden') return
  const delay = 60_000 - (Date.now() % 60_000) + 10
  clockTimer = window.setTimeout(syncCurrentTime, delay)
}
function syncRouteDate() {
  const requested = route.query.date
  date.value =
    typeof requested === 'string' && validDate(requested)
      ? parseDate(requested)
      : today(getLocalTimeZone())
}
function readAgendaViewPreference(): 'day' | 'week' {
  try {
    const stored = window.localStorage.getItem(agendaViewStorageKey)
    if (stored === 'day' || stored === 'week') return stored
    if (stored !== null) window.localStorage.removeItem(agendaViewStorageKey)
  } catch {
    // Keep Day as the safe default when browser storage is unavailable.
  }
  return 'day'
}
watch(view, (currentView) => {
  if (!import.meta.client) return
  try {
    window.localStorage.setItem(agendaViewStorageKey, currentView)
  } catch {
    // The current view remains usable for this visit if browser storage is unavailable.
  }
})
onMounted(() => {
  locale.value = navigator.language
  view.value = readAgendaViewPreference()
  syncRouteDate()
  syncCurrentTime()
  document.addEventListener('visibilitychange', syncCurrentTime)
  window.addEventListener('focus', syncCurrentTime)
})
onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', syncCurrentTime)
  window.removeEventListener('focus', syncCurrentTime)
  if (clockTimer !== undefined) window.clearTimeout(clockTimer)
})
watch(() => route.query.date, syncRouteDate)
function changeDay(offset: number) {
  date.value = date.value?.add({ days: offset }) ?? null
}
function changePeriod(offset: number) {
  changeDay(offset * (view.value === 'week' ? 7 : 1))
}
function resetToday() {
  date.value = today(getLocalTimeZone())
}
async function changeTicketStatus(id: string, destination: TicketStatus) {
  if (statusChangingId.value || pageActionNeedsRefresh.value) return
  const source = tickets.value.find(({ ticket }) => ticket.id === id)
  if (
    !source ||
    source.ticket.archivedAt ||
    source.ticket.status === destination ||
    !ticketStatuses.includes(destination)
  )
    return
  statusChangingId.value = id
  statusError.value = ''
  statusErrorBase.value = ''
  statusErrorNeedsRefresh.value = false
  statusWriteNeedsRefresh.value = false
  statusMessage.value = `Changing ${source.ticket.title} to ${destination}.`
  const refreshTodayData = () =>
    runClientEffect(
      Effect.all([
        refreshEffect(refreshActiveAgenda, activeAgendaFailure),
        refreshEffect(refreshTickets, () => ticketsError.value),
      ]),
    )
  try {
    const endpoint: string = '/api/tickets/' + id
    const result = await runClientRequest<unknown>((signal) =>
      $fetch<unknown>(endpoint, { method: 'PATCH', body: { status: destination }, signal }),
    )
    if (result._tag === 'Failure') {
      statusMessage.value = ''
      statusErrorBase.value = result.failure.userMessage
      statusError.value = statusErrorBase.value
      const refreshed = await refreshTodayData()
      if (refreshed._tag === 'Failure') {
        pageActionNeedsRefresh.value = true
        statusErrorNeedsRefresh.value = true
        statusError.value += ` Today could not refresh its agenda or ticket data. ${refreshed.failure.userMessage}`
      }
      return
    }
    const refreshed = await refreshTodayData()
    if (refreshed._tag === 'Failure') {
      pageActionNeedsRefresh.value = true
      statusWriteNeedsRefresh.value = true
      statusMessage.value = ''
      statusError.value = `Ticket updated, but Today could not refresh its agenda or ticket data. ${refreshed.failure.userMessage}`
      return
    }
    statusMessage.value = `Changed ${source.ticket.title} to ${destination}.`
  } finally {
    statusChangingId.value = null
  }
}
async function add() {
  if (
    pageActionNeedsRefresh.value ||
    !addDate.value ||
    !eligibleTickets.value.some(({ ticket }) => ticket.id === ticketId.value)
  )
    return
  if (canChooseWeekAddDate.value && !weekDates.value.includes(addDate.value.toString())) {
    actionError.value = 'Choose a date within the displayed week.'
    return
  }
  busy.value = true
  actionError.value = ''
  actionErrorTitle.value = 'Could not add work'
  try {
    const result = await runClientRequest<unknown>((signal) =>
      $fetch<unknown>('/api/time-entries', {
        method: 'POST',
        body: {
          ticketId: ticketId.value,
          date: addDate.value!.toString(),
          startMinute: startTime.value.hour * 60 + startTime.value.minute,
          durationMinutes: duration.value,
          description: description.value,
        },
        signal,
      }),
    )
    if (result._tag === 'Failure') {
      actionError.value = result.failure.userMessage
      return
    }
    description.value = ''
    addOpen.value = false
    const refreshed = await runClientEffect(refreshEffect(refreshActiveAgenda, activeAgendaFailure))
    if (refreshed._tag === 'Failure') {
      pageActionNeedsRefresh.value = true
      pageActionErrorTitle.value = 'Work added; agenda refresh failed'
      pageActionError.value = `Your time entry was saved, but the agenda could not be refreshed. ${refreshed.failure.userMessage}`
    }
  } finally {
    busy.value = false
  }
}
const tracked = computed(() => agenda.value?.trackedMinutes ?? 0)
const target = computed(() => settings.value?.workDayDurationMinutes ?? 480)
const overtime = computed(() => Math.max(0, tracked.value - target.value))
const overtimeSegment = computed(() => Math.min(overtime.value, target.value))
const progressValue = computed(() => Math.min(tracked.value, target.value))
const progressSegments = computed(() =>
  tracked.value <= target.value
    ? [{ value: tracked.value, color: 'info' as const }]
    : [
        { value: target.value - overtimeSegment.value, color: 'info' as const },
        { value: overtimeSegment.value, color: 'warning' as const },
      ],
)
const progressValueText = computed(
  () =>
    `Worked ${formatTicketEstimate(tracked.value)} of ${formatTicketEstimate(target.value)} target${overtime.value ? `; ${formatTicketEstimate(overtime.value)} overtime` : ''}`,
)
const textClasses = {
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
} as const
const trackedTextClass = computed(() => textClasses[usageColor(tracked.value, target.value)])
</script>
<template>
  <div class="space-y-6">
    <h1 class="sr-only">{{ view === 'week' ? 'This week' : 'Today' }}</h1>
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div
        class="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 sm:flex"
        :aria-label="view === 'week' ? 'Choose agenda week' : 'Choose agenda day'"
      >
        <UTooltip text="Previous day">
          <UButton
            color="neutral"
            variant="outline"
            icon="lucide:chevron-left"
            :aria-label="view === 'week' ? 'Previous week' : 'Previous day'"
            @click="changePeriod(-1)"
          />
        </UTooltip>
        <UPopover v-model:open="pickerOpen">
          <UButton
            color="neutral"
            variant="outline"
            icon="lucide:calendar-days"
            class="min-w-0"
            :aria-label="view === 'week' ? `Agenda week: ${weekRangeLabel}` : `Agenda date: ${day}`"
          >
            <template v-if="view === 'week'">
              <span class="sm:hidden">{{ weekRangeShortLabel }}</span>
              <span class="hidden sm:inline">{{ weekRangeLabel }}</span>
            </template>
            <template v-else>{{ day || 'Loading day…' }}</template>
          </UButton>
          <template #content
            ><UCalendar
              v-model="date"
              prevent-deselect
              class="p-2"
              @update:model-value="pickerOpen = false"
          /></template>
        </UPopover>
        <UTooltip text="Next day">
          <UButton
            color="neutral"
            variant="outline"
            icon="lucide:chevron-right"
            :aria-label="view === 'week' ? 'Next week' : 'Next day'"
            @click="changePeriod(1)"
          />
        </UTooltip>
        <div
          class="flex rounded-md border border-default p-0.5"
          role="group"
          aria-label="Agenda view"
        >
          <UButton
            size="sm"
            :color="view === 'day' ? 'primary' : 'neutral'"
            :variant="view === 'day' ? 'soft' : 'ghost'"
            :aria-pressed="view === 'day'"
            label="Day"
            @click="view = 'day'"
          />
          <UButton
            size="sm"
            :color="view === 'week' ? 'primary' : 'neutral'"
            :variant="view === 'week' ? 'soft' : 'ghost'"
            :aria-pressed="view === 'week'"
            label="Week"
            @click="view = 'week'"
          />
        </div>
        <UButton
          :color="isCurrentPeriod ? 'primary' : 'neutral'"
          :variant="isCurrentPeriod ? 'soft' : 'ghost'"
          icon="lucide:calendar-check"
          :label="view === 'week' ? 'This week' : 'Today'"
          :aria-current="isCurrentPeriod ? (view === 'day' ? 'date' : 'true') : undefined"
          @click="resetToday"
        />
        <span
          v-if="isCurrentPeriod && currentTimeLabel"
          class="col-span-4 inline-flex items-center justify-center gap-1.5 rounded-md bg-elevated px-2 py-1 text-sm text-muted sm:col-span-1 sm:justify-start"
        >
          <UIcon name="lucide:clock-3" class="size-4" aria-hidden="true" />
          <time :datetime="currentTime?.toISOString()">{{ currentTimeLabel }}</time>
        </span>
      </div>
      <div
        v-if="view === 'day' && !activeAgendaError && !settingsError && agenda"
        class="flex min-w-44 w-full items-center gap-3 text-sm text-muted md:flex-1 lg:max-w-[50%]"
        aria-label="Workday summary"
      >
        <UIcon name="lucide:clock-3" class="size-4 shrink-0" aria-hidden="true" />
        <span class="whitespace-nowrap" :aria-label="progressValueText"
          ><span :class="trackedTextClass">{{ formatTicketEstimate(tracked) }}</span>
          <span class="text-muted">/ {{ formatTicketEstimate(target) }}</span></span
        >
        <div
          role="progressbar"
          aria-label="Workday progress"
          :aria-valuemin="0"
          :aria-valuemax="target"
          :aria-valuenow="progressValue"
          :aria-valuetext="progressValueText"
          class="min-w-16 flex-1"
        >
          <UProgressGroup
            :items="progressSegments"
            :max="target"
            size="md"
            class="min-w-16 flex-1"
            aria-hidden="true"
          />
        </div>
      </div>
      <UModal
        v-model:open="addOpen"
        title="Add completed work"
        description="Record completed work in 30-minute slots without overlapping other entries."
        scrollable
      >
        <UButton
          icon="lucide:plus"
          label="Add time entry"
          :disabled="pageActionNeedsRefresh || !day"
          @click="beginAdd(day, 'page')"
        />
        <template #body>
          <form class="space-y-4" @submit.prevent="add">
            <p v-if="!canChooseWeekAddDate" class="text-sm text-muted">
              Work date:
              {{ addDate ? formatAgendaDate(addDate.toString(), locale) : 'Choose a date' }}
            </p>
            <UFormField v-else label="Work date" required>
              <UPopover v-model:open="addDatePickerOpen">
                <UButton
                  color="neutral"
                  variant="outline"
                  icon="lucide:calendar-days"
                  class="w-full justify-start"
                  :label="addDate ? formatAgendaDate(addDate.toString(), locale) : 'Choose date'"
                  :aria-label="`Work date: ${addDate?.toString() ?? 'Choose date'}`"
                />
                <template #content>
                  <UCalendar
                    v-model="addDate"
                    :min-value="addWeekMinValue"
                    :max-value="addWeekMaxValue"
                    :week-starts-on="calendarWeekStartsOn"
                    prevent-deselect
                    class="p-2"
                    @update:model-value="addDatePickerOpen = false"
                  />
                </template>
              </UPopover>
            </UFormField>
            <UAlert
              v-if="ticketsError"
              role="alert"
              color="error"
              title="Could not load tickets"
              :description="clientFailureMessage(ticketsError)"
            />
            <UButton
              v-if="ticketsError"
              color="neutral"
              variant="outline"
              icon="lucide:refresh-cw"
              label="Retry loading tickets"
              @click="retryTodayReads()"
            />
            <template v-else-if="eligibleTickets.length">
              <UFormField label="Ticket" required
                ><USelectMenu
                  :model-value="ticketId"
                  v-model:open="ticketPickerOpen"
                  value-key="value"
                  :items="
                    eligibleTickets.map((item) => ({
                      label: `${item.clientName} · ${item.projectName} · ${item.releaseName} · ${item.ticket.title}`,
                      value: item.ticket.id,
                    }))
                  "
                  :search-input="ticketSearchInput"
                  aria-label="Ticket"
                  placeholder="Choose an active ticket"
                  class="w-full"
                  @update:model-value="selectEntryTicket"
              /></UFormField>
              <div class="grid gap-3 sm:grid-cols-2">
                <UFormField label="Start time" required
                  ><UInputTime
                    v-model="startTime"
                    :hour-cycle="24"
                    :step="{ minute: 30 }"
                    step-snapping
                    class="w-full"
                    aria-label="Start time"
                /></UFormField>
                <UFormField label="Duration" required
                  ><USelect v-model="duration" :items="durations" class="w-full"
                /></UFormField>
              </div>
              <UFormField label="Work description"
                ><UTextarea v-model="description" class="w-full"
              /></UFormField>
              <UAlert
                v-if="actionError"
                role="alert"
                color="error"
                :title="actionErrorTitle"
                :description="actionError"
              />
              <div class="flex flex-col gap-2 sm:flex-row">
                <UButton
                  type="submit"
                  icon="lucide:save"
                  label="Save time entry"
                  :loading="busy"
                  :disabled="!addDate || !ticketId || pageActionNeedsRefresh"
                  class="w-full sm:w-auto"
                /><UButton
                  color="neutral"
                  variant="ghost"
                  icon="lucide:x"
                  label="Cancel"
                  class="w-full sm:w-auto"
                  @click="addOpen = false"
                />
              </div>
            </template>
            <p v-else class="text-sm text-muted">
              No active tickets.
              <NuxtLink to="/tickets/new" class="text-primary underline">Create a ticket</NuxtLink>
              before logging work.
            </p>
          </form>
        </template>
      </UModal>
      <UModal
        v-model:open="editingOpen"
        title="Correct time entry"
        description="Correct the work date, time, duration, or description without dragging."
        scrollable
      >
        <template #body>
          <form class="space-y-4" @submit.prevent="saveEdit">
            <div class="grid gap-3 sm:grid-cols-3">
              <UFormField label="Work date" required>
                <UPopover v-model:open="editDatePickerOpen">
                  <UButton
                    color="neutral"
                    variant="outline"
                    icon="lucide:calendar-days"
                    class="w-full justify-start"
                    :label="
                      editingDate ? formatAgendaDate(editingDate.toString(), locale) : 'Choose date'
                    "
                    :aria-label="`Work date: ${editingDate?.toString() ?? 'Choose date'}`"
                  />
                  <template #content>
                    <UCalendar
                      v-model="editingDate"
                      prevent-deselect
                      class="p-2"
                      @update:model-value="editDatePickerOpen = false"
                    />
                  </template>
                </UPopover>
              </UFormField>
              <UFormField label="Start time" required>
                <UInputTime
                  v-model="editingTime"
                  :hour-cycle="24"
                  :step="{ minute: 30 }"
                  step-snapping
                  class="w-full"
                  aria-label="Correction start time"
                />
              </UFormField>
              <UFormField label="Duration" required>
                <USelect v-model="editingDuration" :items="durations" class="w-full" />
              </UFormField>
            </div>
            <UFormField label="Work description">
              <UTextarea v-model="editingDescription" class="w-full" />
            </UFormField>
            <UAlert
              v-if="editingError"
              role="alert"
              color="error"
              :title="editingErrorTitle"
              :description="editingError"
            />
            <div class="flex flex-col gap-2 sm:flex-row">
              <UButton
                type="submit"
                icon="lucide:save"
                label="Save correction"
                :loading="busy && !deletingEdit"
                :disabled="busy"
                class="w-full sm:w-auto"
              />
              <UButton
                type="button"
                color="neutral"
                variant="ghost"
                icon="lucide:x"
                label="Cancel"
                :disabled="busy"
                class="w-full sm:w-auto"
                @click="editingOpen = false"
              />
              <UButton
                type="button"
                color="error"
                variant="soft"
                icon="lucide:trash-2"
                label="Delete time entry"
                :loading="deletingEdit"
                :disabled="busy"
                class="w-full sm:ml-auto sm:w-auto"
                @click="deleteEdit"
              />
            </div>
          </form>
        </template>
      </UModal>
    </div>
    <UAlert
      v-if="activeAgendaError || settingsError"
      role="alert"
      color="error"
      title="Could not load all Today data"
      :description="clientFailureMessage(activeAgendaError || settingsError)"
    />
    <UAlert
      v-if="pageActionError"
      role="alert"
      color="error"
      :title="pageActionErrorTitle"
      :description="pageActionError"
    />
    <UAlert
      v-if="statusError"
      role="alert"
      color="error"
      title="Could not change ticket status"
      :description="statusError"
    />
    <p class="sr-only" role="status" aria-live="polite">{{ statusMessage }}</p>
    <UButton
      v-if="activeAgendaError && !pageActionNeedsRefresh"
      color="neutral"
      variant="outline"
      icon="lucide:refresh-cw"
      label="Retry loading agenda"
      @click="retryTodayReads()"
    />
    <UButton
      v-if="settingsError && !pageActionNeedsRefresh"
      color="neutral"
      variant="outline"
      icon="lucide:refresh-cw"
      label="Retry loading settings"
      @click="retryTodayReads()"
    />
    <UButton
      v-if="ticketsError && !addOpen && !pageActionNeedsRefresh"
      color="neutral"
      variant="outline"
      icon="lucide:refresh-cw"
      label="Retry loading tickets"
      @click="retryTodayReads()"
    />
    <UButton
      v-if="pageActionNeedsRefresh"
      color="neutral"
      variant="outline"
      icon="lucide:refresh-cw"
      label="Retry refreshing Today data"
      @click="retryTodayReads()"
    />
    <UCard v-if="!day || (activeAgendaPending && !(view === 'week' ? weekAgenda : agenda))">
      <p class="text-muted">Loading agenda…</p>
    </UCard>
    <template v-else-if="!activeAgendaError">
      <UCard :ui="{ body: 'p-2 sm:p-2' }">
        <div class="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div class="grid min-w-0 flex-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <div
              v-for="kind in ['client', 'project', 'release', 'ticket', 'status'] as const"
              :key="kind"
            >
              <USelectMenu
                :model-value="filters[kind] || null"
                value-key="value"
                :items="options(kind)"
                :disabled="!options(kind).length"
                :search-input="filterSearchInputs[kind]"
                :clear="{ 'aria-label': `Clear ${kind} filter` }"
                :placeholder="kind === 'status' ? 'All statuses' : `All ${kind}s`"
                class="w-full"
                :aria-label="`Filter ${kind}`"
                @update:model-value="applyFilter(kind, $event ?? '')"
              >
                <template #leading
                  ><UTooltip :text="`Filter ${kind}`"
                    ><UIcon
                      :name="
                        kind === 'status'
                          ? 'lucide:circle-dot'
                          : entityIcons[
                              `${kind}s` as 'clients' | 'projects' | 'releases' | 'tickets'
                            ]
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
        <p v-if="!filterSources.length && !ticketsError" class="text-sm text-muted">
          No entries or active tickets available for filtering.
        </p>
      </UCard>
      <UCard>
        <h2 class="sr-only">{{ view === 'week' ? weekRangeLabel : day }} agenda</h2>
        <UAlert
          v-if="dragError"
          color="error"
          :title="dragErrorTitle"
          :description="dragError"
          role="alert"
          class="mb-3"
        />
        <p
          v-if="!filtered.length && Object.values(filters).some(Boolean)"
          class="mb-3 text-sm text-muted"
        >
          No work matches these filters.
        </p>
        <TodayAgenda
          v-if="view === 'day'"
          :date="day"
          :current-date="currentDate"
          :current-minute="currentMinute"
          :rows="filtered"
          :occupied="entries"
          :start="settings?.visibleStartMinute ?? 480"
          :end="settings?.visibleEndMinute ?? 1200"
          :busy="busy || pending || pageActionNeedsRefresh"
          :status-changing-id="statusChangingId"
          @filter="applyFilter"
          @create="(start, minutes) => beginDragCreate(day, start, minutes)"
          @change="(id, start, minutes) => changeEntry(id, day, start, minutes)"
          @edit="beginEdit"
          @change-status="changeTicketStatus"
        />
        <WeeklyAgenda
          v-else
          :dates="weekDates"
          :current-date="currentDate"
          :current-minute="currentMinute"
          :rows="filtered"
          :occupied="weekAgenda?.entries ?? []"
          :tracked-minutes-by-date="weekAgenda?.trackedMinutesByDate ?? {}"
          :start="settings?.visibleStartMinute ?? 480"
          :end="settings?.visibleEndMinute ?? 1200"
          :work-day-duration-minutes="target"
          :locale="locale"
          :busy="busy || weekPending || pageActionNeedsRefresh"
          :status-changing-id="statusChangingId"
          @filter="applyFilter"
          @create="beginDragCreate"
          @change="changeEntry"
          @edit="beginEdit"
          @add="beginDateAdd"
          @change-status="changeTicketStatus"
        />
      </UCard>
    </template>
  </div>
</template>
