<script setup lang="ts">
import { CalendarDate, getLocalTimeZone, parseDate, Time, today } from '@internationalized/date'
import { formatTicketEstimate } from '~/utils/ticket-estimate'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const date = shallowRef<CalendarDate | null>(null)
const pickerOpen = ref(false)
const addOpen = ref(false)
const day = computed(() => date.value?.toString() ?? '')
const {
  data: agenda,
  pending,
  error,
  refresh,
} = await useFetch('/api/agenda', {
  query: computed(() => ({ date: day.value })),
  immediate: false,
  watch: false,
})
const { data: settings, error: settingsError } = await useFetch('/api/settings')
const { data: ticketsData, error: ticketsError } = await useFetch('/api/tickets')
const tickets = computed(() => ticketsData.value?.tickets ?? [])
const entries = computed(() => agenda.value?.entries ?? [])
type FilterKind = 'client' | 'project' | 'release' | 'ticket' | 'status'
const filters = reactive<Record<FilterKind, string>>({
  client: '',
  project: '',
  release: '',
  ticket: '',
  status: '',
})
const filterSources = computed(() => [
  ...entries.value.map((row) => ({
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
function options(kind: FilterKind) {
  const seen = new Map<string, string>()
  for (const row of filterSources.value) {
    if (kind !== 'client' && filters.client && row.clientId !== filters.client) continue
    if (
      ['release', 'ticket'].includes(kind) &&
      filters.project &&
      row.projectId !== filters.project
    )
      continue
    if (kind === 'ticket' && filters.release && row.releaseId !== filters.release) continue
    const id = kind === 'status' ? row.status : row[`${kind}Id`]
    const label = kind === 'status' ? row.status : row[`${kind}Name`]
    seen.set(id, label)
  }
  return [...seen].map(([value, label]) => ({ value, label }))
}
function applyFilter(kind: FilterKind, id: string) {
  if (kind !== 'status') {
    const row = filterSources.value.find((item) =>
      kind === 'client'
        ? item.clientId === id
        : kind === 'project'
          ? item.projectId === id
          : kind === 'release'
            ? item.releaseId === id
            : item.ticketId === id,
    )
    if (row && kind !== 'client') filters.client = row.clientId
    if (row && (kind === 'release' || kind === 'ticket')) filters.project = row.projectId
    if (row && kind === 'ticket') filters.release = row.releaseId
  }
  filters[kind] = id
  if (kind === 'client') {
    filters.project = ''
    filters.release = ''
    filters.ticket = ''
  }
  if (kind === 'project') {
    filters.release = ''
    filters.ticket = ''
  }
  if (kind === 'release') filters.ticket = ''
}
function clearFilters() {
  for (const key of Object.keys(filters) as FilterKind[]) filters[key] = ''
}
const filtered = computed(() =>
  entries.value.filter(
    (row) =>
      (!filters.client || row.clientId === filters.client) &&
      (!filters.project || row.projectId === filters.project) &&
      (!filters.release || row.releaseId === filters.release) &&
      (!filters.ticket || row.ticketId === filters.ticket) &&
      (!filters.status || row.status === filters.status),
  ),
)
const filteredMinutes = computed(() =>
  filtered.value.reduce((sum, row) => sum + row.entry.durationMinutes, 0),
)
const ticketId = ref('')
const startTime = shallowRef(new Time(9, 0))
const duration = ref(30)
const description = ref('')
const busy = ref(false)
const actionError = ref('')
const dragError = ref('')
const editingId = ref<string | null>(null)
const editingOpen = ref(false)
const editingTime = shallowRef(new Time(9, 0))
const editingDuration = ref(30)
const editingDescription = ref('')
const editingError = ref('')
watch(day, () => {
  editingOpen.value = false
  addOpen.value = false
  dragError.value = ''
})
function beginEdit(id: string) {
  const row = entries.value.find(({ entry }) => entry.id === id)
  if (!row) return
  editingId.value = id
  editingTime.value = new Time(Math.floor(row.entry.startMinute / 60), row.entry.startMinute % 60)
  editingDuration.value = row.entry.durationMinutes
  editingDescription.value = row.entry.description
  editingError.value = ''
  editingOpen.value = true
}
async function saveEdit() {
  if (!editingId.value) return
  busy.value = true
  editingError.value = ''
  try {
    await $fetch(`/api/time-entries/${editingId.value}`, {
      method: 'PATCH',
      body: {
        startMinute: editingTime.value.hour * 60 + editingTime.value.minute,
        durationMinutes: editingDuration.value,
        description: editingDescription.value,
      },
    })
    await refresh()
    editingOpen.value = false
  } catch (cause) {
    editingError.value = cause instanceof Error ? cause.message : 'Could not correct time entry.'
    await refresh()
  } finally {
    busy.value = false
  }
}
function beginDragCreate(startMinute: number, durationMinutes: number) {
  startTime.value = new Time(Math.floor(startMinute / 60), startMinute % 60)
  duration.value = durationMinutes
  actionError.value = ''
  addOpen.value = true
}
async function changeEntry(id: string, startMinute: number, durationMinutes: number) {
  busy.value = true
  dragError.value = ''
  try {
    await $fetch(`/api/time-entries/${id}`, {
      method: 'PATCH',
      body: { startMinute, durationMinutes },
    })
    await refresh()
  } catch (cause) {
    dragError.value = cause instanceof Error ? cause.message : 'Could not move time entry.'
    await refresh()
  } finally {
    busy.value = false
  }
}
const durations = Array.from({ length: 48 }, (_, index) => ({
  label: formatTicketEstimate((index + 1) * 30),
  value: (index + 1) * 30,
}))
onMounted(() => {
  date.value = today(getLocalTimeZone())
})
watch(day, (value) => {
  if (value) void refresh()
})
function changeDay(offset: number) {
  date.value = date.value?.add({ days: offset }) ?? null
}
function resetToday() {
  date.value = today(getLocalTimeZone())
}
async function add() {
  if (!day.value || !tickets.value.some(({ ticket }) => ticket.id === ticketId.value)) return
  busy.value = true
  actionError.value = ''
  try {
    await $fetch('/api/time-entries', {
      method: 'POST',
      body: {
        ticketId: ticketId.value,
        date: day.value,
        startMinute: startTime.value.hour * 60 + startTime.value.minute,
        durationMinutes: duration.value,
        description: description.value,
      },
    })
    await refresh()
    description.value = ''
    addOpen.value = false
  } catch (cause) {
    actionError.value = cause instanceof Error ? cause.message : 'Could not add completed work.'
  } finally {
    busy.value = false
  }
}
const tracked = computed(() => agenda.value?.trackedMinutes ?? 0)
const target = computed(() => settings.value?.workDayDurationMinutes ?? 480)
const progress = computed(() => Math.min(100, (tracked.value / target.value) * 100))
</script>
<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <p class="text-sm font-medium text-primary">Today</p>
        <h1 class="mt-2 flex items-center gap-2 text-3xl font-semibold text-highlighted">
          <EntityIcon kind="today" />Your day agenda
        </h1>
        <p class="mt-2 text-muted">Completed work across all your tickets.</p>
      </div>
      <UButton
        to="/settings"
        color="neutral"
        variant="outline"
        icon="lucide:settings"
        label="Agenda settings"
      />
    </div>
    <div class="flex flex-wrap items-center gap-2" aria-label="Choose agenda day">
      <UButton
        color="neutral"
        variant="outline"
        icon="lucide:chevron-left"
        aria-label="Previous day"
        @click="changeDay(-1)"
      />
      <UPopover v-model:open="pickerOpen">
        <UButton
          color="neutral"
          variant="outline"
          icon="lucide:calendar-days"
          :label="day || 'Loading day…'"
          :aria-label="`Agenda date: ${day}`"
        />
        <template #content
          ><UCalendar
            v-model="date"
            prevent-deselect
            class="p-2"
            @update:model-value="pickerOpen = false"
        /></template>
      </UPopover>
      <UButton
        color="neutral"
        variant="outline"
        icon="lucide:chevron-right"
        aria-label="Next day"
        @click="changeDay(1)"
      />
      <UButton color="neutral" variant="ghost" label="Today" @click="resetToday" />
      <UModal
        v-model:open="addOpen"
        title="Add completed work"
        description="Record completed work in 30-minute slots without overlapping other entries."
        scrollable
      >
        <UButton icon="lucide:plus" label="Add time entry" />
        <template #body>
          <form class="space-y-4" @submit.prevent="add">
            <p class="text-sm text-muted">Work date: {{ day }}</p>
            <UAlert v-if="ticketsError" color="error" title="Could not load tickets" />
            <template v-else-if="tickets.length">
              <UFormField label="Ticket" required
                ><USelect
                  v-model="ticketId"
                  :items="
                    tickets.map((item) => ({
                      label: `${item.clientName} · ${item.projectName} · ${item.releaseName} · ${item.ticket.title}`,
                      value: item.ticket.id,
                    }))
                  "
                  placeholder="Choose an active ticket"
                  class="w-full"
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
                color="error"
                title="Could not add work"
                :description="actionError"
              />
              <div class="flex gap-2">
                <UButton
                  type="submit"
                  label="Save time entry"
                  :loading="busy"
                  :disabled="!day || !ticketId"
                /><UButton
                  color="neutral"
                  variant="ghost"
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
        description="Change the time or description on this day without dragging. For another date, use the ticket detail editor."
        scrollable
      >
        <template #body>
          <form class="space-y-4" @submit.prevent="saveEdit">
            <p class="text-sm text-muted">Work date: {{ day }}</p>
            <div class="grid gap-3 sm:grid-cols-2">
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
              color="error"
              title="Could not correct work"
              :description="editingError"
            />
            <div class="flex gap-2">
              <UButton type="submit" label="Save correction" :loading="busy" />
              <UButton
                color="neutral"
                variant="ghost"
                label="Cancel"
                @click="editingOpen = false"
              />
            </div>
          </form>
        </template>
      </UModal>
    </div>
    <UAlert v-if="error || settingsError" color="error" title="Could not load your agenda" />
    <UButton
      v-if="error"
      color="neutral"
      variant="outline"
      label="Retry loading"
      @click="refresh()"
    />
    <UCard v-if="!day || (pending && !agenda)"><p class="text-muted">Loading agenda…</p></UCard>
    <template v-else-if="!error">
      <div class="flex max-w-sm items-center gap-3 text-sm text-muted" aria-label="Workday summary">
        <UIcon name="lucide:clock-3" class="size-4 shrink-0" aria-hidden="true" />
        <span
          class="whitespace-nowrap"
          :aria-label="`Worked ${formatTicketEstimate(tracked)} of ${formatTicketEstimate(target)} target`"
          >{{ formatTicketEstimate(tracked) }} / {{ formatTicketEstimate(target) }}</span
        >
        <progress
          class="h-2 min-w-16 flex-1 accent-primary"
          :value="progress"
          max="100"
          :aria-label="`Workday progress ${Math.floor((tracked / target) * 100)}%`"
        />
        <span v-if="tracked > target" class="whitespace-nowrap text-warning"
          >+{{ formatTicketEstimate(tracked - target) }}</span
        >
      </div>
      <UCard class="space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2 class="font-semibold">Filter work</h2>
          <UButton color="neutral" variant="ghost" label="Clear filters" @click="clearFilters" />
        </div>
        <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <UFormField
            v-for="kind in ['client', 'project', 'release', 'ticket', 'status'] as const"
            :key="kind"
            :label="`Filter ${kind}`"
          >
            <USelectMenu
              :model-value="filters[kind] || null"
              value-key="value"
              :items="options(kind)"
              :disabled="!options(kind).length"
              :search-input="false"
              :clear="{ 'aria-label': `Clear ${kind} filter` }"
              :placeholder="kind === 'status' ? 'All statuses' : `All ${kind}s`"
              class="w-full"
              :aria-label="`Filter ${kind}`"
              @update:model-value="applyFilter(kind, $event ?? '')"
            />
          </UFormField>
        </div>
        <p v-if="!filterSources.length && !ticketsError" class="text-sm text-muted">
          No entries or active tickets available for filtering.
        </p>
        <p v-if="Object.values(filters).some(Boolean)" role="status" class="text-sm text-muted">
          Showing {{ filtered.length }} entries ({{ formatTicketEstimate(filteredMinutes) }}) of
          {{ formatTicketEstimate(tracked) }} total.
        </p>
      </UCard>
      <UCard>
        <h2 class="mb-3 font-semibold">{{ day }} agenda</h2>
        <UAlert
          v-if="dragError"
          color="error"
          title="Could not update time entry"
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
        <p v-else-if="!entries.length" class="mb-3 text-sm text-muted">
          No completed work on this day. Use Add time entry to record work.
        </p>
        <TodayAgenda
          :rows="filtered"
          :occupied="entries"
          :start="settings?.visibleStartMinute ?? 480"
          :end="settings?.visibleEndMinute ?? 1200"
          :busy="busy || pending"
          @filter="applyFilter"
          @create="beginDragCreate"
          @change="changeEntry"
          @edit="beginEdit"
        />
      </UCard>
    </template>
  </div>
</template>
