<script setup lang="ts">
import { vModalAutofocus } from '~/utils/modal-autofocus'
import { trackAppApiFetch } from '~/composables/useAppDataInvalidation'
import {
  ticketPriorityFromOption,
  ticketPriorityIcon,
  ticketPriorityOptions,
  type TicketPriorityOptionValue,
} from '#shared/ticket-priority'
import { ticketLinkLabel } from '~/utils/ticket-link-label'
import {
  modalFormShortcutContent,
  submitModalFormOnShortcut,
} from '~/composables/modal-form-shortcuts'

const props = withDefaults(
  defineProps<{ initialReleaseId?: string; cancelLabel?: string; active?: boolean }>(),
  {
    active: true,
    initialReleaseId: '',
    cancelLabel: 'Cancel',
  },
)
const emit = defineEmits<{
  created: [id: string]
  cancel: []
  createPrerequisite: []
  pendingChange: [pending: boolean]
}>()

const {
  data: releaseData,
  pending: releasesPending,
  error: releasesError,
  refresh: refreshReleases,
} = await trackAppApiFetch(useApiFetch('/api/releases', { key: 'app-api:releases:list:active' }), {
  key: 'app-api:releases:list:active',
  resources: ['releases', 'hierarchy', 'search'],
})
const releases = computed(() => releaseData.value?.releases ?? [])
const releaseSearchInput = useSelectSearchInput('Search releases…')
const releasePickerOpen = ref(false)
const releaseId = ref(props.initialReleaseId)
watch(
  [releases, () => props.initialReleaseId],
  ([available, initialId]) => {
    if (initialId && available.some((item) => item.release.id === initialId)) {
      releaseId.value = initialId
      return
    }
    if (!available.some((item) => item.release.id === releaseId.value)) releaseId.value = ''
  },
  { immediate: true },
)
const title = ref('')
const description = ref('')
const priorityOption = ref<TicketPriorityOptionValue>('none')
const selectedPriority = computed(() => ticketPriorityFromOption(priorityOption.value) ?? null)
const links = ref<{ label: string; url: string }[]>([])
const linkModalOpen = ref(false)
const linkDraftLabel = ref('')
const linkDraftUrl = ref('')
const linkError = ref('')
const pending = ref(false)
const errorMessage = ref('')
watch(pending, (value) => emit('pendingChange', value))

const selectedRelease = computed(() =>
  releases.value.find((item) => item.release.id === releaseId.value),
)
const canSubmit = computed(
  () =>
    releases.value.some((item) => item.release.id === releaseId.value) &&
    title.value.trim().length > 0,
)

function selectRelease(id: string) {
  releaseId.value = id
  releasePickerOpen.value = false
}
function openLinkModal() {
  linkDraftLabel.value = ''
  linkDraftUrl.value = ''
  linkError.value = ''
  linkModalOpen.value = true
}
function saveDraftLink() {
  try {
    const url = new URL(linkDraftUrl.value)
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Enter a valid web URL.')
    links.value.push({ label: linkDraftLabel.value.trim(), url: linkDraftUrl.value.trim() })
    linkModalOpen.value = false
  } catch {
    linkError.value = 'Enter a valid http or https URL.'
  }
}

async function submit() {
  if (!canSubmit.value) return
  pending.value = true
  errorMessage.value = ''
  try {
    const result = await runClientRequest((signal) =>
      $fetch<{ id: string }>('/api/tickets', {
        method: 'POST',
        body: {
          releaseId: releaseId.value,
          title: title.value.trim(),
          description: description.value,
          priority: selectedPriority.value,
          links: links.value.map(({ label, url }) => ({ ...(label ? { label } : {}), url })),
        },
        signal,
      }),
    )
    if (result._tag === 'Failure') {
      errorMessage.value = result.failure.userMessage
      return
    }
    emit('created', result.value.id)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="space-y-3">
    <UAlert
      v-if="releasesError"
      role="alert"
      color="error"
      title="Could not load releases"
      :description="clientFailureMessage(releasesError)"
    />
    <UButton
      v-if="releasesError"
      color="neutral"
      variant="outline"
      icon="lucide:refresh-cw"
      label="Retry loading releases"
      @click="refreshReleases()"
    />
    <UCard v-else-if="releasesPending"><p class="text-muted">Loading releases…</p></UCard>

    <form
      v-modal-autofocus="props.active"
      class="space-y-3"
      @keydown.capture="submitModalFormOnShortcut"
      @submit.prevent="submit"
    >
      <UFormField v-if="releases.length" label="Release" required>
        <USelectMenu
          :model-value="releaseId"
          v-model:open="releasePickerOpen"
          value-key="value"
          :items="
            releases.map((item) => ({
              label: `${item.projectName} · ${item.release.name}`,
              value: item.release.id,
            }))
          "
          :search-input="releaseSearchInput"
          aria-label="Release"
          class="w-full"
          placeholder="Choose a release"
          :disabled="pending"
          @update:model-value="selectRelease"
        />
      </UFormField>
      <div v-else-if="!releasesPending && !releasesError" class="space-y-2">
        <UAlert
          color="warning"
          title="Create a release first"
          description="Tickets must belong to an active release. Your ticket draft will be kept while you create one."
        />
        <UButton
          type="button"
          icon="lucide:plus"
          label="Create a release"
          :disabled="pending"
          @click="emit('createPrerequisite')"
        />
      </div>
      <UFormField label="Title" required>
        <UInput
          v-model="title"
          data-modal-autofocus
          class="w-full"
          maxlength="200"
          placeholder="Implement feature"
          required
          :disabled="pending"
        />
      </UFormField>
      <UFormField label="Description" hint="Optional">
        <UTextarea v-model="description" class="w-full" :disabled="pending" />
      </UFormField>
      <UFormField label="Priority" hint="Optional">
        <USelect
          v-model="priorityOption"
          :items="ticketPriorityOptions"
          value-key="value"
          class="w-full"
          aria-label="Ticket priority"
          :disabled="pending"
        >
          <template #leading>
            <UIcon
              :name="ticketPriorityIcon(selectedPriority)"
              class="size-4 text-muted"
              aria-hidden="true"
            />
          </template>
        </USelect>
      </UFormField>

      <div class="space-y-2 border-t border-muted pt-3">
        <div class="flex items-center justify-between gap-2">
          <h2 class="font-medium text-highlighted">External links</h2>
          <UButton
            type="button"
            color="neutral"
            variant="outline"
            size="sm"
            icon="lucide:plus"
            label="Add link"
            :disabled="pending"
            @click="openLinkModal"
          />
        </div>
        <ul v-if="links.length" class="space-y-2">
          <li
            v-for="(link, index) in links"
            :key="`${link.url}-${index}`"
            class="flex min-w-0 items-center justify-between gap-2 rounded-md border border-muted bg-elevated/50 px-2 py-1"
          >
            <span class="min-w-0 truncate text-sm">{{
              link.label || ticketLinkLabel(null, link.url)
            }}</span>
            <UButton
              type="button"
              color="error"
              variant="ghost"
              icon="lucide:x"
              :aria-label="`Remove link ${index + 1}`"
              @click="links.splice(index, 1)"
            />
          </li>
        </ul>
        <p v-else class="text-sm text-muted">No external links added.</p>
      </div>

      <UAlert v-if="errorMessage" role="alert" color="error" title="Could not create ticket">
        {{ errorMessage }}
      </UAlert>
      <div class="flex justify-end gap-2">
        <UButton
          type="button"
          color="neutral"
          variant="ghost"
          icon="lucide:x"
          :label="props.cancelLabel"
          :disabled="pending"
          @click="emit('cancel')"
        />
        <UButton
          type="submit"
          :disabled="!canSubmit || pending"
          :loading="pending"
          aria-keyshortcuts="Meta+Enter Control+Enter"
          icon="lucide:plus"
          label="Create ticket"
        />
      </div>
    </form>
  </div>

  <UModal
    v-model:open="linkModalOpen"
    title="Add external link"
    description="Stage a web link to include when this ticket is created."
    :content="modalFormShortcutContent()"
    :dismissible="!pending"
  >
    <template #body>
      <form
        class="space-y-3"
        @keydown.capture="submitModalFormOnShortcut"
        v-modal-autofocus
        @submit.prevent="saveDraftLink"
      >
        <UAlert
          v-if="linkError"
          role="alert"
          color="error"
          title="Could not add external link"
          :description="linkError"
        />
        <UFormField label="Link label" hint="Optional">
          <UInput v-model="linkDraftLabel" class="w-full" maxlength="200" :disabled="pending" />
        </UFormField>
        <UFormField label="URL" required>
          <UInput
            v-model="linkDraftUrl"
            data-modal-autofocus
            type="url"
            class="w-full"
            placeholder="https://example.com"
            required
            :disabled="pending"
          />
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton
            type="button"
            color="neutral"
            variant="ghost"
            icon="lucide:x"
            label="Cancel"
            @click="linkModalOpen = false"
          />
          <UButton
            type="submit"
            icon="lucide:plus"
            label="Add link"
            :disabled="pending"
            aria-keyshortcuts="Meta+Enter Control+Enter"
          />
        </div>
      </form>
    </template>
  </UModal>
</template>
