<script setup lang="ts">
import { defaultAgendaSettings, validAgendaSettings } from '#shared/agenda'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const { data, error, refresh } = await useFetch('/api/settings')
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
const saved = ref(false)
async function save() {
  message.value = ''
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
    await $fetch('/api/settings', { method: 'PATCH', body: input })
    await refresh()
    saved.value = true
  } catch (cause) {
    message.value = cause instanceof Error ? cause.message : 'Could not save settings.'
  } finally {
    saving.value = false
  }
}
</script>
<template>
  <div class="max-w-2xl space-y-6">
    <div>
      <p class="text-sm font-medium text-primary">Settings</p>
      <h1 class="mt-2 flex items-center gap-2 text-3xl font-semibold text-highlighted">
        <EntityIcon kind="settings" />Workspace settings
      </h1>
      <p class="mt-3 text-muted">
        Visible hours control the Today display, not which work you can record.
      </p>
    </div>
    <UAlert v-if="error" color="error" title="Could not load settings" />
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
          color="error"
          :description="message"
          title="Could not save settings"
        />
        <p v-if="saved" role="status" class="text-sm text-success">Settings saved.</p>
        <UButton type="submit" label="Save settings" :loading="saving" /></form
    ></UCard>
  </div>
</template>
