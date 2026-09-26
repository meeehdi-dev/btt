<script setup lang="ts">
import { CalendarDate, getLocalTimeZone, parseDate, Time, today } from '@internationalized/date'
import { formatTicketEstimate } from '~/utils/ticket-estimate'
import { usageColor } from '#shared/time-entry'

const props = defineProps<{
  ticketId: string
  title: string
  estimateMinutes: number | null
  canCreate: boolean
}>()
const { data, refresh, error } = await useFetch('/api/time-entries', {
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
const minutes = computed(() => data.value?.trackedMinutes ?? 0)
const percentage = computed(() =>
  props.estimateMinutes ? Math.floor((minutes.value / props.estimateMinutes) * 100) : null,
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
async function save() {
  busy.value = true
  actionError.value = ''
  try {
    if (!date.value) throw new Error('Choose a work date.')
    const body = {
      ticketId: props.ticketId,
      date: date.value.toString(),
      startMinute: startTime.value.hour * 60 + startTime.value.minute,
      durationMinutes: duration.value,
      description: description.value,
    }
    if (editingId.value)
      await $fetch(`/api/time-entries/${editingId.value}`, { method: 'PATCH', body })
    else await $fetch('/api/time-entries', { method: 'POST', body })
    await refresh()
    reset()
  } catch (cause) {
    actionError.value = cause instanceof Error ? cause.message : 'Could not save time entry.'
  } finally {
    busy.value = false
  }
}
async function remove(id: string) {
  if (!confirm('Delete this time entry?')) return
  busy.value = true
  actionError.value = ''
  try {
    await $fetch(`/api/time-entries/${id}`, { method: 'DELETE' })
    await refresh()
    if (editingId.value === id) reset()
  } catch (cause) {
    actionError.value = cause instanceof Error ? cause.message : 'Could not delete time entry.'
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <UCard>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="font-medium text-highlighted">Tracked time</h2>
      <div class="flex flex-wrap items-center gap-2">
        <span :aria-label="`Tracked: ${formatTicketEstimate(minutes)}`">{{
          formatTicketEstimate(minutes)
        }}</span>
        <UBadge
          v-if="percentage !== null"
          :color="usageColor(minutes, estimateMinutes!)"
          :aria-label="`Estimate usage: ${percentage}%`"
          >{{ percentage }}%</UBadge
        >
      </div>
    </div>
    <UAlert v-if="error" class="mt-3" color="error" title="Could not load time entries" />
    <ul v-else-if="data?.entries.length" class="mt-4 space-y-3">
      <li
        v-for="entry in data.entries"
        :key="entry.id"
        class="flex flex-wrap items-start justify-between gap-3 rounded-md border border-default p-3"
      >
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span
              >{{ entry.date }} · {{ clock(entry.startMinute) }}–{{
                clock(entry.startMinute + entry.durationMinutes)
              }}
              · {{ formatTicketEstimate(entry.durationMinutes) }}</span
            >
            <NuxtLink :to="`/tickets/${ticketId}?archived=true`" class="text-primary underline">{{
              title
            }}</NuxtLink>
          </div>
          <p v-if="entry.description" class="mt-1 whitespace-pre-wrap break-words text-muted">
            {{ entry.description }}
          </p>
        </div>
        <div class="flex gap-1">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="busy"
            :aria-label="`Edit time entry ${entry.date} ${clock(entry.startMinute)}`"
            label="Edit"
            @click="beginEdit(entry)"
          />
          <UButton
            color="error"
            variant="ghost"
            :disabled="busy"
            :aria-label="`Delete time entry ${entry.date} ${clock(entry.startMinute)}`"
            label="Delete"
            @click="remove(entry.id)"
          />
        </div>
      </li>
    </ul>
    <p v-else class="mt-3 text-muted">No tracked time yet.</p>
    <form v-if="canCreate || editingId" class="mt-5 space-y-3" @submit.prevent="save">
      <h3 class="font-medium">{{ editingId ? 'Correct time entry' : 'Add completed work' }}</h3>
      <p class="text-sm text-muted">
        30-minute slots; entries may end at midnight but cannot overlap your other work.
      </p>
      <div class="grid gap-3 sm:grid-cols-3">
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
        color="error"
        title="Could not save time entry"
        :description="actionError"
      />
      <div class="flex gap-2">
        <UButton
          type="submit"
          :loading="busy"
          :label="editingId ? 'Save correction' : 'Add time entry'"
        /><UButton v-if="editingId" color="neutral" variant="ghost" label="Cancel" @click="reset" />
      </div>
    </form>
    <UAlert
      v-else-if="actionError"
      class="mt-3"
      color="error"
      title="Could not delete time entry"
      :description="actionError"
    />
  </UCard>
</template>
