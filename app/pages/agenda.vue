<script setup lang="ts">
import { Effect } from 'effect'
import { CalendarDate, getLocalTimeZone, parseDate, Time, today } from '@internationalized/date'
import { formatTicketEstimate } from '~/utils/ticket-estimate'
import { formatAgendaDate, formatAgendaWeekRange } from '~/utils/agenda-week'
import { getWeekDates } from '#shared/agenda-week'
import { entityIcons } from '~/utils/entity-icons'
import { ticketStatuses } from '#shared/ticket-status'
import {
  useHierarchyFilters,
  type HierarchyFilterSource,
  type HierarchyFilterState,
} from '~/composables/useHierarchyFilters'
import { validDate } from '#shared/time-entry'

type TicketStatus = (typeof ticketStatuses)[number]

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
useHead({ title: 'Agenda' })
const route = useRoute()
function routeDate() {
  const requested = route.query.date
  return typeof requested === 'string' && validDate(requested) ? parseDate(requested) : null
}
const date = shallowRef<CalendarDate | null>(routeDate())
const pickerOpen = ref(false)
const editDatePickerOpen = ref(false)
const addOpen = ref(false)
const day = computed(() => date.value?.toString() ?? '')
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
const currentDateTimeLabel = computed(() => {
  if (!currentTime.value || currentMinute.value === null) return ''
  const currentDateLabel = new Intl.DateTimeFormat(locale.value, {
    month: 'numeric',
    day: 'numeric',
  }).format(currentTime.value)
  return `${currentDateLabel}, ${formatClock(currentMinute.value)}`
})
const {
  data: settings,
  error: settingsError,
  refresh: refreshSettings,
} = await useApiFetch('/api/settings')
const weekDates = computed(() =>
  day.value ? (getWeekDates(day.value, settings.value?.startOfWeekDay ?? 1) ?? []) : [],
)
const weekStart = computed(() => weekDates.value[0] ?? '')
const isCurrentPeriod = computed(() => {
  const current = currentDate.value
  return current !== '' && weekDates.value.includes(current)
})
const weekRangeLabel = computed(() =>
  weekDates.value.length === 7
    ? formatAgendaWeekRange(weekDates.value[0]!, weekDates.value[6]!, locale.value)
    : 'Loading week…',
)
const {
  data: weekAgenda,
  pending: weekPending,
  error: weekError,
  refresh: refreshWeek,
} = await useApiFetch('/api/agenda/week', {
  query: computed(() => ({ startDate: weekStart.value })),
  immediate: Boolean(date.value),
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
const activeEntries = computed(() => weekAgenda.value?.entries ?? [])
const filters = reactive<HierarchyFilterState>({
  client: '',
  project: '',
  release: '',
  ticket: '',
})
const hasHierarchyFilters = computed(() => Object.values(filters).some(Boolean))
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
  })),
])
const {
  options: hierarchyOptions,
  applyFilter: applyHierarchyFilter,
  clearFilters: clearHierarchyFilters,
  searchInputs: hierarchySearchInputs,
} = useHierarchyFilters(filterSources, filters)
const filtered = computed(() =>
  activeEntries.value.filter(
    (row) =>
      (!filters.client || row.clientId === filters.client) &&
      (!filters.project || row.projectId === filters.project) &&
      (!filters.release || row.releaseId === filters.release) &&
      (!filters.ticket || row.ticketId === filters.ticket),
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
async function retryAgendaReads() {
  const result = await runClientEffect(
    Effect.all([
      refreshEffect(refreshWeek, () => weekError.value),
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
function refreshAgendaData() {
  return runClientEffect(
    Effect.all([
      refreshEffect(refreshWeek, () => weekError.value),
      refreshEffect(refreshTickets, () => ticketsError.value),
    ]),
  )
}
watch(weekStart, (startDate) => {
  editingOpen.value = false
  addOpen.value = false
  dragError.value = ''
  if (startDate) void refreshWeek()
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
    const refreshed = await runClientEffect(refreshEffect(refreshWeek, () => weekError.value))
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
    const refreshed = await runClientEffect(refreshEffect(refreshWeek, () => weekError.value))
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
function beginDragCreate(dateString: string, startMinute: number, durationMinutes: number) {
  if (pageActionNeedsRefresh.value) return
  addDate.value = parseDate(dateString)
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
      const refreshed = await runClientEffect(refreshEffect(refreshWeek, () => weekError.value))
      if (refreshed._tag === 'Failure') {
        pageActionNeedsRefresh.value = true
        dragError.value += ` The agenda also could not be refreshed. ${refreshed.failure.userMessage}`
      }
      return
    }
    const refreshed = await runClientEffect(refreshEffect(refreshWeek, () => weekError.value))
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
  date.value = routeDate() ?? today(getLocalTimeZone())
}
onMounted(() => {
  locale.value = navigator.language
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
function changeWeek(offset: number) {
  date.value = date.value?.add({ days: offset * 7 }) ?? null
}
function goToCurrentWeek() {
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
  try {
    const endpoint: string = '/api/tickets/' + id
    const result = await runClientRequest<unknown>((signal) =>
      $fetch<unknown>(endpoint, { method: 'PATCH', body: { status: destination }, signal }),
    )
    if (result._tag === 'Failure') {
      statusMessage.value = ''
      statusErrorBase.value = result.failure.userMessage
      statusError.value = statusErrorBase.value
      const refreshed = await refreshAgendaData()
      if (refreshed._tag === 'Failure') {
        pageActionNeedsRefresh.value = true
        statusErrorNeedsRefresh.value = true
        statusError.value += ` Agenda could not refresh its data. ${refreshed.failure.userMessage}`
      }
      return
    }
    const refreshed = await refreshAgendaData()
    if (refreshed._tag === 'Failure') {
      pageActionNeedsRefresh.value = true
      statusWriteNeedsRefresh.value = true
      statusMessage.value = ''
      statusError.value = `Ticket updated, but Agenda could not refresh its data. ${refreshed.failure.userMessage}`
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
    const refreshed = await runClientEffect(refreshEffect(refreshWeek, () => weekError.value))
    if (refreshed._tag === 'Failure') {
      pageActionNeedsRefresh.value = true
      pageActionErrorTitle.value = 'Work added; agenda refresh failed'
      pageActionError.value = `Your time entry was saved, but the agenda could not be refreshed. ${refreshed.failure.userMessage}`
    }
  } finally {
    busy.value = false
  }
}
const target = computed(() => settings.value?.workDayDurationMinutes ?? 480)
</script>
<template>
  <div class="flex flex-col gap-2">
    <h1 class="sr-only">Agenda</h1>
    <div class="flex h-8 min-w-0 items-center gap-2">
      <div
        class="flex h-8 shrink-0 items-center gap-1"
        role="group"
        aria-label="Choose agenda week"
      >
        <UTooltip text="Previous week">
          <UButton
            size="md"
            color="neutral"
            variant="outline"
            icon="lucide:chevron-left"
            aria-label="Previous week"
            @click="changeWeek(-1)"
          />
        </UTooltip>
        <UPopover v-model:open="pickerOpen">
          <UButton
            size="md"
            color="neutral"
            variant="outline"
            icon="lucide:calendar-days"
            class="min-w-[14rem] shrink-0"
            :aria-label="`Agenda week: ${weekRangeLabel}`"
          >
            <span>{{ weekRangeLabel || 'Loading week…' }}</span>
          </UButton>
          <template #content>
            <UCalendar
              v-model="date"
              prevent-deselect
              class="p-2"
              @update:model-value="pickerOpen = false"
            />
          </template>
        </UPopover>
        <UTooltip text="Next week">
          <UButton
            size="md"
            color="neutral"
            variant="outline"
            icon="lucide:chevron-right"
            aria-label="Next week"
            @click="changeWeek(1)"
          />
        </UTooltip>
        <UButton
          size="md"
          :color="isCurrentPeriod ? 'primary' : 'neutral'"
          :variant="isCurrentPeriod ? 'soft' : 'ghost'"
          icon="lucide:calendar-check"
          :aria-label="`Go to current week${currentDateTimeLabel ? `, ${currentDateTimeLabel}` : ''}`"
          :aria-current="isCurrentPeriod ? 'true' : undefined"
          @click="goToCurrentWeek"
        >
          <time
            v-if="currentTime"
            class="tabular-nums whitespace-nowrap"
            :datetime="currentTime.toISOString()"
            >{{ currentDateTimeLabel }}</time
          >
          <span v-else aria-hidden="true" class="tabular-nums whitespace-nowrap">--/--, --:--</span>
        </UButton>
      </div>
      <USeparator
        data-testid="agenda-toolbar-separator"
        orientation="vertical"
        decorative
        class="h-6 shrink-0"
      />
      <div
        class="flex h-8 min-w-0 flex-1 items-center gap-1 rounded-md px-0.5"
        role="group"
        aria-label="Agenda filters"
      >
        <div class="grid h-full min-w-0 flex-1 grid-cols-4 gap-1">
          <div v-for="kind in ['client', 'project', 'release', 'ticket'] as const" :key="kind">
            <USelectMenu
              :model-value="filters[kind] || null"
              size="md"
              value-key="value"
              :items="hierarchyOptions(kind)"
              :disabled="!hierarchyOptions(kind).length"
              :search-input="hierarchySearchInputs[kind]"
              :clear="{ 'aria-label': `Clear ${kind} filter` }"
              :placeholder="`All ${kind}s`"
              class="w-full"
              :aria-label="`Filter ${kind}`"
              @update:model-value="applyHierarchyFilter(kind, $event ?? '')"
            >
              <template #leading>
                <UTooltip :text="`Filter ${kind}`">
                  <UIcon
                    :name="
                      entityIcons[`${kind}s` as 'clients' | 'projects' | 'releases' | 'tickets']
                    "
                    class="size-4"
                    :aria-label="`Filter ${kind}`"
                  />
                </UTooltip>
              </template>
            </USelectMenu>
          </div>
        </div>
        <UTooltip text="Clear all filters">
          <UButton
            size="md"
            color="neutral"
            variant="ghost"
            icon="lucide:filter-x"
            aria-label="Clear filters"
            @click="clearHierarchyFilters"
          />
        </UTooltip>
      </div>
    </div>
    <p v-if="!filterSources.length && !ticketsError" class="text-sm text-muted">
      No entries or active tickets available for filtering.
    </p>
    <UModal
      v-model:open="addOpen"
      title="Add completed work"
      description="Record completed work in 30-minute slots without overlapping other entries."
      scrollable
    >
      <template #body>
        <form class="space-y-3" @submit.prevent="add">
          <p class="text-sm text-muted">
            Work date: {{ addDate ? formatAgendaDate(addDate.toString(), locale) : 'Not selected' }}
          </p>
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
            @click="retryAgendaReads()"
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
            <div class="grid grid-cols-2 gap-2">
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
            <div class="flex items-center gap-2">
              <UButton
                type="submit"
                icon="lucide:save"
                label="Save time entry"
                :loading="busy"
                :disabled="!addDate || !ticketId || pageActionNeedsRefresh"
              /><UButton
                color="neutral"
                variant="ghost"
                icon="lucide:x"
                label="Cancel"
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
        <form class="space-y-3" @submit.prevent="saveEdit">
          <div class="grid grid-cols-3 gap-2">
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
          <div class="flex items-center gap-2">
            <UButton
              type="submit"
              icon="lucide:save"
              label="Save correction"
              :loading="busy && !deletingEdit"
              :disabled="busy"
            />
            <UButton
              type="button"
              color="neutral"
              variant="ghost"
              icon="lucide:x"
              label="Cancel"
              :disabled="busy"
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
              class="ml-auto"
              @click="deleteEdit"
            />
          </div>
        </form>
      </template>
    </UModal>
    <UAlert
      v-if="weekError || settingsError"
      role="alert"
      color="error"
      title="Could not load all Agenda data"
      :description="clientFailureMessage(weekError || settingsError)"
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
      v-if="weekError && !pageActionNeedsRefresh"
      color="neutral"
      variant="outline"
      icon="lucide:refresh-cw"
      label="Retry loading agenda"
      @click="retryAgendaReads()"
    />
    <UButton
      v-if="settingsError && !pageActionNeedsRefresh"
      color="neutral"
      variant="outline"
      icon="lucide:refresh-cw"
      label="Retry loading settings"
      @click="retryAgendaReads()"
    />
    <UButton
      v-if="ticketsError && !addOpen && !pageActionNeedsRefresh"
      color="neutral"
      variant="outline"
      icon="lucide:refresh-cw"
      label="Retry loading tickets"
      @click="retryAgendaReads()"
    />
    <UButton
      v-if="pageActionNeedsRefresh"
      color="neutral"
      variant="outline"
      icon="lucide:refresh-cw"
      label="Retry refreshing agenda data"
      @click="retryAgendaReads()"
    />
    <UCard v-if="!day || (weekPending && !weekAgenda)" data-testid="agenda-week-shell" class="mt-2">
      <p class="text-muted">Loading agenda…</p>
    </UCard>
    <template v-else-if="!weekError">
      <UCard data-testid="agenda-week-shell" class="mt-2">
        <h2 class="sr-only">{{ weekRangeLabel }} agenda</h2>
        <UAlert
          v-if="dragError"
          color="error"
          :title="dragErrorTitle"
          :description="dragError"
          role="alert"
          class="mb-2"
        />
        <p v-if="!filtered.length && hasHierarchyFilters" class="mb-2 text-sm text-muted">
          No work matches these filters.
        </p>
        <WeeklyAgenda
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
          @filter="applyHierarchyFilter"
          @create="beginDragCreate"
          @change="changeEntry"
          @edit="beginEdit"
          @change-status="changeTicketStatus"
        />
      </UCard>
    </template>
  </div>
</template>
