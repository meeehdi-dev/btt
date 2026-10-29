<script setup lang="ts">
import { vModalAutofocus } from '~/utils/modal-autofocus'
import { trackAppApiFetch, useAppDataInvalidation } from '~/composables/useAppDataInvalidation'
import { useAppToast } from '~/composables/useAppToast'
import { defaultAgendaSettings, validAgendaSettings } from '#shared/agenda'
import { localizedWeekdays } from '~/utils/agenda-week'
import {
  modalFormShortcutContent,
  submitModalFormOnShortcut,
} from '~/composables/modal-form-shortcuts'

const open = defineModel<boolean>('open', { required: true })
const { invalidateMutation } = useAppDataInvalidation()
const { reportWrite } = useAppToast()
const { data, error, execute } = await trackAppApiFetch(
  useApiFetch('/api/settings', { key: 'app-api:settings', immediate: false }),
  { key: 'app-api:settings', resources: ['settings', 'agenda'] },
)
const start = ref<number>(defaultAgendaSettings.visibleStartMinute)
const end = ref<number>(defaultAgendaSettings.visibleEndMinute)
const target = ref<number>(defaultAgendaSettings.workDayDurationMinutes)
const startOfWeekDay = ref<number>(defaultAgendaSettings.startOfWeekDay)
const locale = ref('en')
onMounted(() => {
  locale.value = navigator.language
  void loadSettings()
})
const weekDayChoices = computed(() => localizedWeekdays(locale.value))
watch(
  data,
  (settings) => {
    if (!settings) return
    start.value = settings.visibleStartMinute
    end.value = settings.visibleEndMinute
    target.value = settings.workDayDurationMinutes
    startOfWeekDay.value = settings.startOfWeekDay
  },
  { immediate: true },
)
const choices = Array.from({ length: 49 }, (_, index) => ({
  label: `${String(Math.floor(index / 2)).padStart(2, '0')}:${index % 2 ? '30' : '00'}`,
  value: index * 30,
}))
const durations = choices.slice(1)
const settingsLoading = ref(true)
const saving = ref(false)
const message = ref('')
const messageTitle = ref('Could not save settings')
const saved = ref(false)
const refreshNeedsRetry = ref(false)

async function loadSettings() {
  settingsLoading.value = true
  try {
    await execute()
  } finally {
    settingsLoading.value = false
  }
}

async function retrySettings() {
  const result = await invalidateMutation('settings')
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
    startOfWeekDay: startOfWeekDay.value,
  }
  if (!validAgendaSettings(input)) {
    message.value =
      'Start must precede end; use 30-minute steps, a target between 30 minutes and 24 hours, and a valid week start day.'
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
    const refreshed = await invalidateMutation('settings')
    reportWrite(refreshed, { title: 'Settings saved.' })
    if (refreshed._tag === 'Failure') {
      refreshNeedsRetry.value = true
      messageTitle.value = 'Settings saved; refresh failed'
      message.value = `Your settings were saved, but settings and Agenda data could not be refreshed. ${refreshed.failure.userMessage}`
      return
    }
    saved.value = true
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Workspace settings"
    description="Configure the Agenda's visible hours and workday preferences."
    :content="modalFormShortcutContent()"
    :unmount-on-hide="false"
  >
    <template #body>
      <p v-if="settingsLoading" role="status" class="text-sm text-muted">Loading settings…</p>
      <div v-else-if="error || refreshNeedsRetry" class="space-y-2">
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
        <div class="flex justify-end">
          <UButton
            color="neutral"
            variant="outline"
            icon="lucide:refresh-cw"
            label="Retry loading settings"
            @click="retrySettings()"
          />
        </div>
      </div>
      <form
        v-else
        v-modal-autofocus="open"
        class="space-y-3"
        @keydown.capture="submitModalFormOnShortcut"
        @submit.prevent="save"
      >
        <UFormField label="Visible start">
          <USelect
            v-model="start"
            data-modal-autofocus
            :items="choices.slice(0, -1)"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Visible end">
          <USelect v-model="end" :items="choices.slice(1)" class="w-full" />
        </UFormField>
        <UFormField label="Workday target">
          <USelect v-model="target" :items="durations" class="w-full" />
        </UFormField>
        <UFormField label="Week starts on">
          <USelect v-model="startOfWeekDay" :items="weekDayChoices" class="w-full" />
        </UFormField>
        <UAlert
          v-if="message"
          role="alert"
          color="error"
          :description="message"
          :title="messageTitle"
        />
        <p v-if="saved" role="status" class="text-sm text-success">Settings saved.</p>
        <div class="flex justify-end">
          <UButton
            type="submit"
            icon="lucide:save"
            label="Save settings"
            :loading="saving"
            aria-keyshortcuts="Meta+Enter Control+Enter"
          />
        </div>
      </form>
    </template>
  </UModal>
</template>
