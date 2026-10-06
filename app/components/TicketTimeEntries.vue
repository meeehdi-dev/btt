<script setup lang="ts">
import { CalendarDate, getLocalTimeZone, parseDate, Time, today } from '@internationalized/date'
import { formatTicketEstimate } from '~/utils/ticket-estimate'
import { usageColor } from '#shared/time-entry'

const props = defineProps<{
  ticketId: string
  estimateMinutes: number | null
  canCreate: boolean
}>()
const { data, refresh, error } = await useApiFetch('/api/time-entries', {
  query: { ticketId: props.ticketId },
})
const date = shallowRef<CalendarDate | null>(null)
const datePickerOpen = ref(false)
onMounted(() => {
  if (!date.value) date.value = today(getLocalTimeZone())
})
const startTime = shallowRef(new Time(9, 0))
const duration = ref(30)
const description = ref('')
const editingId = ref<string | null>(null)
const busy = ref(false)
const actionError = ref('')
const actionNeedsRefresh = ref(false)
const actionErrorTitle = ref('Could not save time entry')
const minutes = computed(() => data.value?.trackedMinutes ?? 0)
const percentage = computed(() =>
  props.estimateMinutes ? Math.floor((minutes.value / props.estimateMinutes) * 100) : null,
)
const textClasses = {
  info: 'text-info',
  success: 'text-success',
  warning: 'text-warning',
  error: 'text-error',
} as const
const trackedTextClass = computed(() =>
  props.estimateMinutes
    ? textClasses[usageColor(minutes.value, props.estimateMinutes)]
    : 'text-default',
)
const durations = Array.from({ length: 48 }, (_, i) => ({
  label: formatTicketEstimate((i + 1) * 30),
  value: (i + 1) * 30,
}))
function clock(minute: number) {
  return `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
}
function beginEdit(entry: {
  id: string
  date: string
  startMinute: number
  durationMinutes: number
  description: string
}) {
  editingId.value = entry.id
  date.value = parseDate(entry.date)
  startTime.value = new Time(Math.floor(entry.startMinute / 60), entry.startMinute % 60)
  duration.value = entry.durationMinutes
  description.value = entry.description
  actionError.value = ''
}
function reset() {
  editingId.value = null
  date.value = today(getLocalTimeZone())
  startTime.value = new Time(9, 0)
  duration.value = 30
  description.value = ''
}
async function retryEntries() {
  const result = await runClientEffect(refreshEffect(refresh, () => error.value))
  if (result._tag === 'Success' && actionNeedsRefresh.value) {
    actionNeedsRefresh.value = false
    actionError.value = ''
    actionErrorTitle.value = 'Could not save time entry'
  }
}
async function save() {
  if (actionNeedsRefresh.value) return
  if (!date.value) {
    actionErrorTitle.value = 'Choose a work date'
    actionError.value = 'Choose a work date.'
    return
  }
  busy.value = true
  actionError.value = ''
  actionErrorTitle.value = 'Could not save time entry'
  try {
    const body = {
      ticketId: props.ticketId,
      date: date.value.toString(),
      startMinute: startTime.value.hour * 60 + startTime.value.minute,
      durationMinutes: duration.value,
      description: description.value,
    }
    const endpoint: string = editingId.value
      ? '/api/time-entries/' + editingId.value
      : '/api/time-entries'
    const result = await runClientRequest<unknown>((signal) =>
      $fetch<unknown>(endpoint, {
        method: editingId.value ? 'PATCH' : 'POST',
        body,
        signal,
      }),
    )
    if (result._tag === 'Failure') {
      actionError.value = result.failure.userMessage
      return
    }
    reset()
    const refreshed = await runClientEffect(refreshEffect(refresh, () => error.value))
    if (refreshed._tag === 'Failure') {
      actionNeedsRefresh.value = true
      actionErrorTitle.value = 'Time entry saved; refresh failed'
      actionError.value = `The time entry was saved, but tracked time could not be refreshed. ${refreshed.failure.userMessage}`
    }
  } finally {
    busy.value = false
  }
}
async function remove(id: string) {
  if (busy.value || actionNeedsRefresh.value || !confirm('Delete this time entry?')) return
  busy.value = true
  actionError.value = ''
  actionErrorTitle.value = 'Could not delete time entry'
  try {
    const endpoint: string = '/api/time-entries/' + id
    const result = await runClientRequest<unknown>((signal) =>
      $fetch<unknown>(endpoint, { method: 'DELETE', signal }),
    )
    if (result._tag === 'Failure') {
      actionError.value = result.failure.userMessage
      return
    }
    if (editingId.value === id) reset()
    const refreshed = await runClientEffect(refreshEffect(refresh, () => error.value))
    if (refreshed._tag === 'Failure') {
      actionNeedsRefresh.value = true
      actionErrorTitle.value = 'Time entry deleted; refresh failed'
      actionError.value = `The time entry was deleted, but tracked time could not be refreshed. ${refreshed.failure.userMessage}`
    }
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <UCard :ui="{ body: 'p-2' }">
    <div
      v-if="data && !error && !actionNeedsRefresh"
      class="flex flex-wrap items-center justify-between gap-2"
    >
      <h2 class="font-medium text-highlighted">Tracked time</h2>
      <div class="flex flex-wrap items-center gap-2 text-sm">
        <span
          :aria-label="`Tracked: ${formatTicketEstimate(minutes)}${estimateMinutes ? ` of ${formatTicketEstimate(estimateMinutes)}` : ''}`"
          class="inline-flex items-center gap-1"
          ><span :class="trackedTextClass" class="font-medium">{{
            formatTicketEstimate(minutes)
          }}</span
          ><span v-if="estimateMinutes" class="text-muted"
            >/ {{ formatTicketEstimate(estimateMinutes) }}</span
          ></span
        >
        <UBadge
          v-if="percentage !== null"
          :color="usageColor(minutes, estimateMinutes!)"
          :aria-label="`Estimate usage: ${percentage}%`"
          >{{ percentage }}%</UBadge
        >
      </div>
    </div>
    <UAlert
      v-if="error"
      class="mt-2"
      role="alert"
      color="error"
      title="Could not load time entries"
      :description="clientFailureMessage(error)"
    />
    <UButton
      v-if="error || actionNeedsRefresh"
      class="mt-2"
      color="neutral"
      variant="outline"
      icon="lucide:refresh-cw"
      label="Retry loading time entries"
      @click="retryEntries()"
    />
    <ul v-else-if="data?.entries.length" class="mt-2 space-y-2">
      <li
        v-for="entry in data.entries"
        :key="entry.id"
        class="flex min-w-0 items-start justify-between gap-2 rounded-md border border-muted bg-elevated/50 p-2"
      >
        <div class="min-w-0 flex-1">
          <p class="flex flex-wrap items-center gap-x-2 text-sm font-medium text-highlighted">
            <span>{{ entry.date }}</span>
            <span class="text-muted" aria-hidden="true">·</span>
            <span
              >{{ clock(entry.startMinute) }}–{{ clock(entry.startMinute + entry.durationMinutes) }}
            </span>
            <span class="text-muted">{{ formatTicketEstimate(entry.durationMinutes) }}</span>
          </p>
          <p
            v-if="entry.description"
            class="mt-1 whitespace-pre-wrap break-words text-sm text-muted"
          >
            {{ entry.description }}
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-1">
          <UTooltip :text="`Edit time entry ${entry.date} ${clock(entry.startMinute)}`">
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              :disabled="busy"
              :aria-label="`Edit time entry ${entry.date} ${clock(entry.startMinute)}`"
              icon="lucide:pencil"
              @click="beginEdit(entry)"
            />
          </UTooltip>
          <UTooltip :text="`Delete time entry ${entry.date} ${clock(entry.startMinute)}`">
            <UButton
              color="error"
              variant="ghost"
              size="sm"
              :disabled="busy"
              :aria-label="`Delete time entry ${entry.date} ${clock(entry.startMinute)}`"
              icon="lucide:trash-2"
              @click="remove(entry.id)"
            />
          </UTooltip>
        </div>
      </li>
    </ul>
    <p v-else-if="!error && !actionNeedsRefresh && data" class="mt-2 text-muted">
      No tracked time yet.
    </p>
    <form
      v-if="(canCreate || editingId) && !actionNeedsRefresh"
      class="mt-2 space-y-2"
      @submit.prevent="save"
    >
      <h3 class="font-medium">{{ editingId ? 'Correct time entry' : 'Add completed work' }}</h3>
      <p class="text-sm text-muted">
        30-minute slots; entries may end at midnight but cannot overlap your other work.
      </p>
      <div class="grid grid-cols-3 gap-2">
        <UFormField label="Work date" required>
          <UPopover v-model:open="datePickerOpen">
            <UButton
              color="neutral"
              variant="outline"
              icon="lucide:calendar-days"
              class="w-full justify-start"
              :label="date?.toString() ?? 'Choose date'"
              :aria-label="`Work date: ${date?.toString() ?? 'Choose date'}`"
            />
            <template #content>
              <UCalendar
                v-model="date"
                prevent-deselect
                class="p-2"
                @update:model-value="datePickerOpen = false"
              />
            </template>
          </UPopover>
        </UFormField>
        <UFormField label="Start time" required>
          <UInputTime
            v-model="startTime"
            :hour-cycle="24"
            :step="{ minute: 30 }"
            step-snapping
            class="w-full"
            aria-label="Start time"
          />
        </UFormField>
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
          :loading="busy"
          :icon="editingId ? 'lucide:save' : 'lucide:plus'"
          :label="editingId ? 'Save correction' : 'Add time entry'"
        /><UButton
          v-if="editingId"
          color="neutral"
          variant="ghost"
          icon="lucide:x"
          label="Cancel"
          @click="reset"
        />
      </div>
    </form>
    <UAlert
      v-else-if="actionError"
      class="mt-2"
      role="alert"
      color="error"
      :title="actionErrorTitle"
      :description="actionError"
    />
  </UCard>
</template>
