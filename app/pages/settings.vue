<script setup lang="ts">
import { defaultAgendaSettings, validAgendaSettings } from '#shared/agenda'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const { data, error, refresh } = await useApiFetch('/api/settings')
const start = ref<number>(defaultAgendaSettings.visibleStartMinute)
const end = ref<number>(defaultAgendaSettings.visibleEndMinute)
const target = ref<number>(defaultAgendaSettings.workDayDurationMinutes)
watch(
  data,
  (settings) => {
    if (!settings) return
    start.value = settings.visibleStartMinute
    end.value = settings.visibleEndMinute
    target.value = settings.workDayDurationMinutes
  },
  { immediate: true },
)
const choices = Array.from({ length: 49 }, (_, index) => ({
  label: `${String(Math.floor(index / 2)).padStart(2, '0')}:${index % 2 ? '30' : '00'}`,
  value: index * 30,
}))
const durations = choices.slice(1)
const saving = ref(false)
const message = ref('')
const messageTitle = ref('Could not save settings')
const saved = ref(false)
const refreshNeedsRetry = ref(false)
async function retrySettings() {
  const result = await runClientEffect(refreshEffect(refresh, () => error.value))
  if (result._tag === 'Success' && messageTitle.value === 'Settings saved; refresh failed') {
    refreshNeedsRetry.value = false
    message.value = ''
    saved.value = true
  }
}
async function save() {
  message.value = ''
  messageTitle.value = 'Could not save settings'
  saved.value = false
  const input = {
    visibleStartMinute: start.value,
    visibleEndMinute: end.value,
    workDayDurationMinutes: target.value,
  }
  if (!validAgendaSettings(input)) {
    message.value =
      'Start must precede end; use 30-minute steps and a target between 30 minutes and 24 hours.'
    return
  }
  saving.value = true
  try {
    const result = await runClientRequest((signal) =>
      $fetch<unknown>('/api/settings', { method: 'PATCH', body: input, signal }),
    )
    if (result._tag === 'Failure') {
      message.value = result.failure.userMessage
      return
    }
    const refreshed = await runClientEffect(refreshEffect(refresh, () => error.value))
    if (refreshed._tag === 'Failure') {
      refreshNeedsRetry.value = true
      messageTitle.value = 'Settings saved; refresh failed'
      message.value = `Your settings were saved, but the current view could not be refreshed. ${refreshed.failure.userMessage}`
      return
    }
    saved.value = true
  } finally {
    saving.value = false
  }
}
</script>
<template>
  <div class="mx-auto max-w-xl space-y-4">
    <h1 class="sr-only">Workspace settings</h1>
    <div v-if="error || refreshNeedsRetry" class="space-y-2">
      <UAlert
        v-if="message"
        role="alert"
        color="error"
        :title="messageTitle"
        :description="message"
      />
      <UAlert
        v-if="error"
        role="alert"
        color="error"
        title="Could not load settings"
        :description="clientFailureMessage(error)"
      />
      <UButton
        color="neutral"
        variant="outline"
        icon="lucide:refresh-cw"
        label="Retry loading settings"
        @click="retrySettings()"
      />
    </div>
    <UCard v-else
      ><form class="space-y-4" @submit.prevent="save">
        <UFormField label="Visible start"
          ><USelect v-model="start" :items="choices.slice(0, -1)" class="w-full"
        /></UFormField>
        <UFormField label="Visible end"
          ><USelect v-model="end" :items="choices.slice(1)" class="w-full"
        /></UFormField>
        <UFormField label="Workday target"
          ><USelect v-model="target" :items="durations" class="w-full"
        /></UFormField>
        <UAlert
          v-if="message"
          role="alert"
          color="error"
          :description="message"
          :title="messageTitle"
        />
        <p v-if="saved" role="status" class="text-sm text-success">Settings saved.</p>
        <UButton type="submit" icon="lucide:save" label="Save settings" :loading="saving" /></form
    ></UCard>
  </div>
</template>
