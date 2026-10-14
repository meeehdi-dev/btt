<script setup lang="ts">
import { trackAppApiFetch } from '~/composables/useAppDataInvalidation'
import {
  ticketPriorityFromOption,
  ticketPriorityIcon,
  ticketPriorityOptions,
  type TicketPriorityOptionValue,
} from '#shared/ticket-priority'
import { parseTicketEstimate } from '~/utils/ticket-estimate'
import { ticketLinkLabel } from '~/utils/ticket-link-label'
import {
  modalFormShortcutContent,
  submitModalFormOnShortcut,
} from '~/composables/modal-form-shortcuts'

const props = withDefaults(defineProps<{ initialReleaseId?: string; cancelLabel?: string }>(), {
  initialReleaseId: '',
  cancelLabel: 'Cancel',
})
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
const {
  data: ticketData,
  error: ticketsError,
  refresh: refreshTickets,
} = await trackAppApiFetch(useApiFetch('/api/tickets', { key: 'app-api:tickets:list:active' }), {
  key: 'app-api:tickets:list:active',
  resources: ['tickets', 'hierarchy', 'time-entries', 'search'],
})
const tickets = computed(() => ticketData.value?.tickets ?? [])
const releaseSearchInput = useSelectSearchInput('Search releases…')
const releasePickerOpen = ref(false)
const relatedTicketSearchInput = useSelectSearchInput('Search tickets…')
const relatedTicketPickerOpen = ref(false)
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
const estimate = ref('')
const priorityOption = ref<TicketPriorityOptionValue>('none')
const selectedPriority = computed(() => ticketPriorityFromOption(priorityOption.value) ?? null)
const links = ref<{ label: string; url: string }[]>([])
const relatedTicketIds = ref<string[]>([])
const selectedRelation = ref('')
const linkModalOpen = ref(false)
const relationModalOpen = ref(false)
const linkDraftLabel = ref('')
const linkDraftUrl = ref('')
const linkError = ref('')
const relationError = ref('')
const pending = ref(false)
const errorMessage = ref('')
watch(pending, (value) => emit('pendingChange', value))

const selectedRelease = computed(() =>
  releases.value.find((item) => item.release.id === releaseId.value),
)
const availableRelations = computed(() =>
  tickets.value.filter((item) => !relatedTicketIds.value.includes(item.ticket.id)),
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
function selectRelatedTicket(id: string) {
  selectedRelation.value = id
  relatedTicketPickerOpen.value = false
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
function openRelationModal() {
  relationError.value = ''
  relationModalOpen.value = true
}
function addRelation() {
  if (
    selectedRelation.value &&
    availableRelations.value.some((item) => item.ticket.id === selectedRelation.value)
  )
    relatedTicketIds.value.push(selectedRelation.value)
  selectedRelation.value = ''
  relationModalOpen.value = false
}

async function submit() {
  if (!canSubmit.value) return
  pending.value = true
  errorMessage.value = ''
  try {
    let estimateMinutes: number | null
    try {
      estimateMinutes = parseTicketEstimate(estimate.value)
    } catch (cause) {
      errorMessage.value = cause instanceof Error ? cause.message : 'Enter a valid estimate.'
      return
    }
    const result = await runClientRequest((signal) =>
      $fetch<{ id: string }>('/api/tickets', {
        method: 'POST',
        body: {
          releaseId: releaseId.value,
          title: title.value.trim(),
          description: description.value,
          estimateMinutes,
          priority: selectedPriority.value,
          links: links.value.map(({ label, url }) => ({ ...(label ? { label } : {}), url })),
          relatedTicketIds: relatedTicketIds.value,
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

    <form class="space-y-3" @keydown.capture="submitModalFormOnShortcut" @submit.prevent="submit">
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
      <UFormField label="Estimate" hint="Optional · try 1hr 30m or 90 (minutes)">
        <UInput
          v-model="estimate"
          type="text"
          class="w-full"
          placeholder="1hr 30m"
          :disabled="pending"
        />
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

      <div class="space-y-2 border-t border-muted pt-3">
        <div class="flex items-center justify-between gap-2">
          <h2 class="font-medium text-highlighted">Related tickets</h2>
          <UButton
            type="button"
            color="neutral"
            variant="outline"
            size="sm"
            icon="lucide:plus"
            label="Link ticket"
            :disabled="pending || !!ticketsError || !availableRelations.length"
            @click="openRelationModal"
          />
        </div>
        <div v-if="ticketsError" class="space-y-2">
          <UAlert
            role="alert"
            color="error"
            title="Could not load related tickets"
            :description="`${clientFailureMessage(ticketsError)} You can still create this ticket without a relation.`"
          />
          <UButton
            color="neutral"
            variant="outline"
            icon="lucide:refresh-cw"
            label="Retry loading related tickets"
            @click="refreshTickets()"
          />
        </div>
        <ul v-if="relatedTicketIds.length" class="space-y-2">
          <li
            v-for="relatedId in relatedTicketIds"
            :key="relatedId"
            class="flex items-center justify-between gap-2 rounded-md border border-muted bg-elevated/50 px-2 py-1"
          >
            <span class="truncate text-sm">{{
              tickets.find((item) => item.ticket.id === relatedId)?.ticket.title
            }}</span>
            <UButton
              type="button"
              color="error"
              variant="ghost"
              icon="lucide:x"
              :aria-label="`Remove ${tickets.find((item) => item.ticket.id === relatedId)?.ticket.title}`"
              @click="relatedTicketIds = relatedTicketIds.filter((id) => id !== relatedId)"
            />
          </li>
        </ul>
        <p v-else-if="!ticketsError" class="text-sm text-muted">No related tickets added.</p>
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

  <UModal
    v-model:open="relationModalOpen"
    title="Link a related ticket"
    description="Choose another ticket to include when this ticket is created."
    :content="modalFormShortcutContent()"
    :dismissible="!pending"
  >
    <template #body>
      <form
        class="space-y-3"
        @keydown.capture="submitModalFormOnShortcut"
        @submit.prevent="addRelation"
      >
        <UAlert
          v-if="relationError"
          role="alert"
          color="error"
          title="Could not add related ticket"
          :description="relationError"
        />
        <UFormField label="Ticket" required>
          <USelectMenu
            :model-value="selectedRelation"
            v-model:open="relatedTicketPickerOpen"
            value-key="value"
            :items="
              availableRelations.map((item) => ({
                label: `${item.ticket.title} · ${item.releaseName}`,
                value: item.ticket.id,
              }))
            "
            :search-input="relatedTicketSearchInput"
            aria-label="Choose related ticket"
            class="w-full"
            placeholder="Choose ticket"
            :disabled="pending || !!ticketsError"
            @update:model-value="selectRelatedTicket"
          />
        </UFormField>
        <div class="flex justify-end gap-2">
          <UButton
            type="button"
            color="neutral"
            variant="ghost"
            icon="lucide:x"
            label="Cancel"
            :disabled="pending"
            @click="relationModalOpen = false"
          />
          <UButton
            type="submit"
            icon="lucide:link-2"
            label="Add related ticket"
            :disabled="pending || !selectedRelation || !!ticketsError"
            aria-keyshortcuts="Meta+Enter Control+Enter"
          />
        </div>
      </form>
    </template>
  </UModal>
</template>
