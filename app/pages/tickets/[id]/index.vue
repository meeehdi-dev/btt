<script setup lang="ts">
import { trackAppApiFetch, useAppDataInvalidation } from '~/composables/useAppDataInvalidation'
import { ticketStatusIcon, ticketStatuses } from '#shared/ticket-status'
import { ticketLinkLabel } from '~/utils/ticket-link-label'
import { formatTicketEstimate, parseTicketEstimate } from '~/utils/ticket-estimate'

type TicketStatus = (typeof ticketStatuses)[number]
type MutationOutcome = 'saved' | 'partial' | 'failed' | null
type ReleaseItem = {
  label: string
  value: string
  releaseName: string
  projectId: string
  projectName: string
  clientId: string
  clientName: string
  releaseArchivedAt: Date | string | null
  projectArchivedAt: Date | string | null
  clientArchivedAt: Date | string | null
}

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const route = useRoute()
const id = route.params.id as string
const endpoint = `/api/tickets/${id}`
const showArchived = computed(() => route.query.archived === 'true')
const ticketKey = computed(
  () => `app-api:tickets:detail:${id}:${showArchived.value ? 'archived' : 'active'}`,
)
const { data, error } = await trackAppApiFetch(
  useApiFetch(`/api/tickets/${id}`, {
    key: ticketKey,
    query: computed(() => ({ archived: showArchived.value ? 'true' : undefined })),
  }),
  { key: ticketKey, resources: ['tickets', 'hierarchy', 'time-entries'] },
)
if (error.value && clientFailureStatus(error.value) === 404)
  throw createError({ statusCode: 404, statusMessage: 'Ticket not found' })
if (!data.value && !error.value)
  throw createError({ statusCode: 404, statusMessage: 'Ticket not found' })
const record = computed(() => data.value?.ticket)
const hierarchy = computed(() => data.value?.hierarchy)
const {
  data: choices,
  error: choicesError,
  refresh: refreshChoices,
} = await trackAppApiFetch(useApiFetch('/api/tickets', { key: 'app-api:tickets:list:active' }), {
  key: 'app-api:tickets:list:active',
  resources: ['tickets', 'hierarchy', 'time-entries', 'search'],
})
const {
  data: releaseChoices,
  error: releasesError,
  refresh: refreshReleases,
} = await trackAppApiFetch(useApiFetch('/api/releases', { key: 'app-api:releases:list:active' }), {
  key: 'app-api:releases:list:active',
  resources: ['releases', 'hierarchy', 'search'],
})

const statusDraft = ref<TicketStatus>(record.value?.status ?? ticketStatuses[0])
const descriptionDraft = ref(record.value?.description ?? '')
const descriptionFocused = ref(false)
const descriptionError = ref('')
const estimateDraft = ref(
  record.value?.estimateMinutes ? formatTicketEstimate(record.value.estimateMinutes) : '',
)
const estimateError = ref('')
const releaseDraft = ref(record.value?.releaseId ?? '')
const releasePickerOpen = ref(false)
const releaseSearchInput = useSelectSearchInput('Search releases…')

watch(
  () => record.value?.status,
  (value) => {
    if (value) statusDraft.value = value
  },
)
watch(
  () => record.value?.description,
  (value) => {
    if (!descriptionFocused.value) descriptionDraft.value = value ?? ''
  },
)
watch(
  () => record.value?.estimateMinutes,
  (value) => {
    estimateDraft.value = value ? formatTicketEstimate(value) : ''
    estimateError.value = ''
  },
)
watch(
  () => record.value?.releaseId,
  (value) => {
    if (value) releaseDraft.value = value
  },
)

const releaseItems = computed<ReleaseItem[]>(() => {
  const items: ReleaseItem[] = (releaseChoices.value?.releases ?? []).map((item) => ({
    label: `${item.projectName} · ${item.release.name}`,
    value: item.release.id,
    releaseName: item.release.name,
    projectId: item.release.projectId,
    projectName: item.projectName,
    clientId: item.clientId,
    clientName: item.clientName,
    releaseArchivedAt: item.release.archivedAt,
    projectArchivedAt: item.projectArchivedAt,
    clientArchivedAt: null,
  }))
  const currentId = record.value?.releaseId
  if (currentId && !items.some((item) => item.value === currentId) && hierarchy.value) {
    items.unshift({
      label: `${hierarchy.value.projectName} · ${hierarchy.value.releaseName}`,
      value: currentId,
      releaseName: hierarchy.value.releaseName,
      projectId: hierarchy.value.projectId,
      projectName: hierarchy.value.projectName,
      clientId: hierarchy.value.clientId,
      clientName: hierarchy.value.clientName,
      releaseArchivedAt: hierarchy.value.releaseArchivedAt,
      projectArchivedAt: hierarchy.value.projectArchivedAt,
      clientArchivedAt: hierarchy.value.clientArchivedAt,
    })
  }
  return items
})
const relatedTicketItems = computed(() =>
  (choices.value?.tickets ?? [])
    .filter(
      (item) =>
        item.ticket.id !== id && !data.value?.related.some((other) => other.id === item.ticket.id),
    )
    .map((item) => ({
      label: `${item.ticket.title} · ${item.releaseName}`,
      value: item.ticket.id,
    })),
)

const titleModalOpen = ref(false)
const titleDraft = ref('')
const titleError = ref('')
const linkModalOpen = ref(false)
const linkError = ref('')
const relationModalOpen = ref(false)
const relationError = ref('')
const relatedId = ref('')
const relatedTicketSearchInput = useSelectSearchInput('Search tickets…')
const relatedTicketPickerOpen = ref(false)
const label = ref('')
const url = ref('')

const { invalidateMutation } = useAppDataInvalidation()
const pending = ref(false)
const refreshBusy = ref(false)
const actionNeedsRefresh = ref(false)
const actionError = ref('')
const actionErrorTitle = ref('Could not update ticket')
const actionMessage = ref('')
const controlsDisabled = computed(
  () => pending.value || actionNeedsRefresh.value || Boolean(error.value),
)
const hasArchivedAncestor = computed(
  () =>
    Boolean(hierarchy.value?.releaseArchivedAt) ||
    Boolean(hierarchy.value?.projectArchivedAt) ||
    Boolean(hierarchy.value?.clientArchivedAt),
)

function applyTicketPatch(patch: {
  title?: string
  description?: string
  status?: TicketStatus
  estimateMinutes?: number | null
  releaseId?: string
}) {
  if (data.value) Object.assign(data.value.ticket, patch)
}

async function mutateTicket(
  run: (signal: AbortSignal) => Promise<unknown>,
  options: {
    errorTitle: string
    successMessage: string
    refresh?: boolean
    onWriteSuccess?: () => void
  },
): Promise<MutationOutcome> {
  if (controlsDisabled.value) return null
  pending.value = true
  actionError.value = ''
  actionErrorTitle.value = options.errorTitle
  actionMessage.value = 'Saving ticket changes.'
  try {
    const result = await runClientRequest(run)
    if (result._tag === 'Failure') {
      actionMessage.value = ''
      actionError.value = result.failure.userMessage
      return 'failed'
    }

    options.onWriteSuccess?.()
    const refreshed = await invalidateMutation('ticket', {
      refreshActive: options.refresh !== false,
    })
    if (refreshed._tag === 'Failure' && options.refresh !== false) {
      actionNeedsRefresh.value = true
      actionErrorTitle.value = 'Ticket updated; refresh failed'
      actionMessage.value = ''
      actionError.value = `The ticket was updated, but affected ticket data could not be refreshed. ${refreshed.failure.userMessage}`
      return 'partial'
    }
    actionMessage.value = options.successMessage
    return 'saved'
  } finally {
    pending.value = false
  }
}

async function retryTicket() {
  if (refreshBusy.value) return
  refreshBusy.value = true
  try {
    const result = await invalidateMutation('ticket')
    if (result._tag === 'Failure') {
      actionError.value = `Affected ticket data is still unavailable. ${result.failure.userMessage}`
      return
    }
    actionNeedsRefresh.value = false
    actionError.value = ''
    actionErrorTitle.value = 'Could not update ticket'
    actionMessage.value = 'Ticket details refreshed.'
  } finally {
    refreshBusy.value = false
  }
}

function openTitleModal() {
  titleDraft.value = record.value?.title ?? ''
  titleError.value = ''
  actionError.value = ''
  titleModalOpen.value = true
}

async function saveTitle() {
  const title = titleDraft.value.trim()
  if (!title || title.length > 200) {
    titleError.value = 'Enter a title of 1–200 characters.'
    return
  }
  titleError.value = ''
  if (title === record.value?.title) {
    titleModalOpen.value = false
    return
  }
  const outcome = await mutateTicket(
    (signal) => $fetch<unknown>(endpoint, { method: 'PATCH', body: { title }, signal }),
    {
      errorTitle: 'Could not update ticket title',
      successMessage: 'Ticket title saved.',
      onWriteSuccess: () => applyTicketPatch({ title }),
    },
  )
  if (outcome === 'failed') titleError.value = actionError.value
  if (outcome === 'saved' || outcome === 'partial') titleModalOpen.value = false
}

async function saveDescription() {
  descriptionFocused.value = false
  const description = descriptionDraft.value
  if (description.length > 10_000) {
    descriptionError.value = 'Description must be 10,000 characters or fewer.'
    return
  }
  if (description === record.value?.description || controlsDisabled.value) return
  descriptionError.value = ''
  const outcome = await mutateTicket(
    (signal) => $fetch<unknown>(endpoint, { method: 'PATCH', body: { description }, signal }),
    {
      errorTitle: 'Could not save description',
      successMessage: 'Description saved.',
      onWriteSuccess: () => applyTicketPatch({ description }),
    },
  )
  if (outcome === 'failed') descriptionError.value = actionError.value
}

async function changeStatus(value: unknown) {
  const status = ticketStatuses.find((item) => item === value)
  if (!status || status === record.value?.status) return
  if (controlsDisabled.value) {
    statusDraft.value = record.value?.status ?? ticketStatuses[0]
    return
  }
  statusDraft.value = status
  const outcome = await mutateTicket(
    (signal) => $fetch<unknown>(endpoint, { method: 'PATCH', body: { status }, signal }),
    {
      errorTitle: 'Could not change ticket status',
      successMessage: `Ticket status changed to ${status}.`,
      onWriteSuccess: () => applyTicketPatch({ status }),
    },
  )
  if (outcome === 'failed') statusDraft.value = record.value?.status ?? ticketStatuses[0]
}

async function changeEstimate() {
  if (controlsDisabled.value) return
  let estimateMinutes: number | null
  try {
    estimateMinutes = parseTicketEstimate(estimateDraft.value)
  } catch (cause) {
    estimateError.value = cause instanceof Error ? cause.message : 'Enter a valid estimate.'
    return
  }
  if (estimateMinutes === (record.value?.estimateMinutes ?? null)) {
    estimateDraft.value = estimateMinutes === null ? '' : formatTicketEstimate(estimateMinutes)
    estimateError.value = ''
    return
  }
  estimateError.value = ''
  const outcome = await mutateTicket(
    (signal) =>
      $fetch<unknown>(endpoint, {
        method: 'PATCH',
        body: { estimateMinutes },
        signal,
      }),
    {
      errorTitle: 'Could not save estimate',
      successMessage: 'Estimate saved.',
      onWriteSuccess: () => applyTicketPatch({ estimateMinutes }),
    },
  )
  if (outcome === 'failed') estimateError.value = actionError.value
}

async function changeRelease(value: unknown) {
  if (typeof value !== 'string' || value === record.value?.releaseId) return
  if (controlsDisabled.value) {
    releaseDraft.value = record.value?.releaseId ?? ''
    return
  }
  const selected = releaseItems.value.find((item) => item.value === value)
  if (!selected) return
  releaseDraft.value = value
  const outcome = await mutateTicket(
    (signal) =>
      $fetch<unknown>(endpoint, {
        method: 'PATCH',
        body: { releaseId: value },
        signal,
      }),
    {
      errorTitle: 'Could not change release',
      successMessage: 'Ticket release changed.',
      onWriteSuccess: () => {
        applyTicketPatch({ releaseId: value })
        if (data.value) {
          Object.assign(data.value.hierarchy, {
            releaseName: selected.releaseName,
            projectId: selected.projectId,
            projectName: selected.projectName,
            clientId: selected.clientId,
            clientName: selected.clientName,
            releaseArchivedAt: selected.releaseArchivedAt,
            projectArchivedAt: selected.projectArchivedAt,
            clientArchivedAt: selected.clientArchivedAt,
          })
        }
      },
    },
  )
  if (outcome === 'failed') releaseDraft.value = record.value?.releaseId ?? ''
}

function ticketDetailPath(archived: boolean) {
  const archivedContext = archived || hasArchivedAncestor.value
  return `/tickets/${id}${archivedContext ? '?archived=true' : ''}`
}

async function changeArchive(archived: boolean) {
  if (!record.value || Boolean(record.value.archivedAt) === archived) return
  const shouldRefresh = showArchived.value
  const outcome = await mutateTicket(
    (signal) => $fetch<unknown>(endpoint, { method: 'PATCH', body: { archived }, signal }),
    {
      errorTitle: archived ? 'Could not archive ticket' : 'Could not restore ticket',
      successMessage: archived ? 'Ticket archived.' : 'Ticket restored.',
      refresh: shouldRefresh,
    },
  )
  if (outcome === 'saved' || outcome === 'partial') await navigateTo(ticketDetailPath(archived))
}

async function permanentlyDelete() {
  if (!record.value?.archivedAt || controlsDisabled.value) return
  if (
    !confirm(
      'Permanently delete this archived ticket and its links/relations? Tickets with tracked time cannot be deleted.',
    )
  )
    return
  const outcome = await mutateTicket(
    (signal) => $fetch<unknown>(endpoint, { method: 'DELETE', signal }),
    {
      errorTitle: 'Could not delete ticket',
      successMessage: 'Ticket deleted.',
      refresh: false,
    },
  )
  if (outcome === 'saved') await navigateTo('/tickets')
}

function openLinkModal() {
  label.value = ''
  url.value = ''
  linkError.value = ''
  actionError.value = ''
  linkModalOpen.value = true
}

async function addLink() {
  const normalizedLabel = label.value.trim()
  const outcome = await mutateTicket(
    (signal) =>
      $fetch<unknown>(endpoint + '/links', {
        method: 'POST',
        body: { ...(normalizedLabel ? { label: normalizedLabel } : {}), url: url.value },
        signal,
      }),
    {
      errorTitle: 'Could not add external link',
      successMessage: 'External link added.',
    },
  )
  if (outcome === 'failed') linkError.value = actionError.value
  if (outcome === 'saved' || outcome === 'partial') {
    label.value = ''
    url.value = ''
    linkModalOpen.value = false
  }
}

function openRelationModal() {
  relatedId.value = ''
  relationError.value = ''
  actionError.value = ''
  relationModalOpen.value = true
}

function selectRelatedTicket(ticketId: string) {
  relatedId.value = ticketId
  relatedTicketPickerOpen.value = false
}

async function addRelation() {
  if (!relatedId.value) return
  const ticketId = relatedId.value
  const outcome = await mutateTicket(
    (signal) =>
      $fetch<unknown>(endpoint + '/relations', {
        method: 'POST',
        body: { ticketId },
        signal,
      }),
    {
      errorTitle: 'Could not link ticket',
      successMessage: 'Related ticket added.',
    },
  )
  if (outcome === 'failed') relationError.value = actionError.value
  if (outcome === 'saved' || outcome === 'partial') {
    relatedId.value = ''
    relationModalOpen.value = false
  }
}

async function removeLink(linkId: string) {
  await mutateTicket(
    (signal) => $fetch<unknown>(endpoint + '/links/' + linkId, { method: 'DELETE', signal }),
    { errorTitle: 'Could not remove external link', successMessage: 'External link removed.' },
  )
}

async function removeRelation(relationId: string) {
  await mutateTicket(
    (signal) =>
      $fetch<unknown>(endpoint + '/relations/' + relationId, { method: 'DELETE', signal }),
    { errorTitle: 'Could not unlink ticket', successMessage: 'Related ticket removed.' },
  )
}
</script>

<template>
  <div v-if="data" class="space-y-2">
    <div class="space-y-2">
      <div class="flex flex-wrap items-start justify-between gap-x-2 gap-y-2">
        <div class="min-w-0 flex-1">
          <HierarchyBreadcrumbs
            :ancestors="[
              {
                kind: 'clients',
                label: data.hierarchy.clientName,
                to: `/clients/${data.hierarchy.clientId}${data.hierarchy.clientArchivedAt ? '?archived=true' : ''}`,
              },
              {
                kind: 'projects',
                label: data.hierarchy.projectName,
                to: `/projects/${data.hierarchy.projectId}${data.hierarchy.clientArchivedAt || data.hierarchy.projectArchivedAt ? '?archived=true' : ''}`,
              },
              {
                kind: 'releases',
                label: data.hierarchy.releaseName,
                to: `/releases/${data.ticket.releaseId}${data.hierarchy.clientArchivedAt || data.hierarchy.projectArchivedAt || data.hierarchy.releaseArchivedAt ? '?archived=true' : ''}`,
              },
            ]"
            :current="{ kind: 'tickets', label: data.ticket.title }"
            :current-icon="ticketStatusIcon(data.ticket.status)"
            :current-status="data.ticket.status"
          >
            <template #current-suffix>
              <UTooltip text="Edit title">
                <UButton
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  icon="lucide:pencil"
                  aria-label="Edit ticket title"
                  :disabled="controlsDisabled"
                  @click="openTitleModal"
                />
              </UTooltip>
              <UBadge v-if="data.ticket.archivedAt" color="neutral">Archived</UBadge>
            </template>
          </HierarchyBreadcrumbs>
        </div>

        <div class="ml-auto flex flex-wrap items-center justify-end gap-2">
          <UButton
            v-if="!data.ticket.archivedAt"
            color="neutral"
            variant="outline"
            icon="lucide:archive"
            label="Archive ticket"
            :loading="pending && actionErrorTitle === 'Could not archive ticket'"
            :disabled="controlsDisabled"
            @click="changeArchive(true)"
          />
          <template v-else>
            <UButton
              color="neutral"
              variant="outline"
              icon="lucide:archive-restore"
              label="Restore ticket"
              :loading="pending && actionErrorTitle === 'Could not restore ticket'"
              :disabled="controlsDisabled"
              @click="changeArchive(false)"
            />
            <UButton
              color="error"
              variant="ghost"
              icon="lucide:trash-2"
              label="Permanently delete"
              :disabled="controlsDisabled"
              @click="permanentlyDelete"
            />
          </template>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-2" aria-label="Ticket fields">
        <UFormField label="Status" class="min-w-0">
          <USelect
            :model-value="statusDraft"
            :items="[...ticketStatuses]"
            class="w-full"
            :aria-label="`Ticket status for ${data.ticket.title}`"
            :disabled="controlsDisabled"
            :loading="pending && actionErrorTitle === 'Could not change ticket status'"
            @update:model-value="changeStatus"
          >
            <template #leading>
              <UIcon
                :name="ticketStatusIcon(data.ticket.status)"
                class="size-4 text-muted"
                :data-ticket-status-icon="data.ticket.status"
                aria-hidden="true"
              />
            </template>
          </USelect>
        </UFormField>
        <UFormField
          label="Estimate"
          hint="Optional"
          class="min-w-0"
          :error="estimateError || undefined"
        >
          <UInput
            v-model="estimateDraft"
            class="w-full"
            placeholder="e.g. 1hr 30m"
            :disabled="controlsDisabled"
            :aria-label="`Estimate for ${data.ticket.title}`"
            :aria-busy="(pending && actionErrorTitle === 'Could not save estimate') || undefined"
            @update:model-value="estimateError = ''"
            @blur="changeEstimate"
            @keydown.enter.prevent="changeEstimate"
          />
        </UFormField>
        <UFormField label="Release" class="min-w-0">
          <USelectMenu
            :model-value="releaseDraft"
            v-model:open="releasePickerOpen"
            value-key="value"
            :items="releaseItems"
            :search-input="releaseSearchInput"
            class="w-full"
            aria-label="Ticket release"
            :disabled="controlsDisabled || !!releasesError"
            :loading="pending && actionErrorTitle === 'Could not change release'"
            @update:model-value="changeRelease"
          />
          <div v-if="releasesError" class="mt-2 space-y-2">
            <UAlert
              role="alert"
              color="error"
              title="Could not load release choices"
              :description="clientFailureMessage(releasesError)"
            />
            <UButton
              color="neutral"
              variant="outline"
              size="xs"
              icon="lucide:refresh-cw"
              label="Retry loading releases"
              @click="refreshReleases()"
            />
          </div>
        </UFormField>
      </div>
    </div>

    <div v-if="error" class="space-y-2">
      <UAlert
        role="alert"
        color="error"
        title="Could not refresh ticket"
        :description="clientFailureMessage(error)"
      />
      <UButton
        v-if="!actionNeedsRefresh"
        color="neutral"
        variant="outline"
        icon="lucide:refresh-cw"
        label="Retry loading ticket details"
        :loading="refreshBusy"
        :disabled="refreshBusy"
        @click="retryTicket"
      />
    </div>
    <div
      v-if="actionError && !titleModalOpen && !linkModalOpen && !relationModalOpen"
      class="space-y-2"
    >
      <UAlert role="alert" color="error" :title="actionErrorTitle" :description="actionError" />
      <UButton
        v-if="actionNeedsRefresh"
        color="neutral"
        variant="outline"
        icon="lucide:refresh-cw"
        label="Retry loading ticket details"
        :loading="refreshBusy"
        :disabled="refreshBusy"
        @click="retryTicket"
      />
    </div>
    <p class="sr-only" role="status" aria-live="polite">{{ actionMessage }}</p>

    <UCard :ui="{ body: 'p-2' }">
      <UFormField
        label="Description"
        hint="Saves automatically when you leave the field"
        :error="descriptionError || undefined"
      >
        <UTextarea
          v-model="descriptionDraft"
          class="w-full"
          :rows="3"
          autoresize
          :maxrows="8"
          maxlength="10000"
          :disabled="controlsDisabled"
          :aria-label="`Description for ${data.ticket.title}`"
          @focus="descriptionFocused = true"
          @update:model-value="descriptionError = ''"
          @blur="saveDescription"
        />
      </UFormField>
    </UCard>

    <TicketTimeEntries
      :ticket-id="id"
      :estimate-minutes="data.ticket.estimateMinutes"
      :can-create="false"
    />

    <div class="grid grid-cols-2 gap-2">
      <UCard :ui="{ body: 'p-2' }">
        <div class="flex items-center justify-between gap-2">
          <h2 class="font-medium text-highlighted">External links</h2>
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            icon="lucide:plus"
            label="Add external link"
            :disabled="controlsDisabled"
            @click="openLinkModal"
          />
        </div>
        <ul v-if="data.links.length" class="mt-2 space-y-2">
          <li
            v-for="link in data.links"
            :key="link.id"
            class="flex min-w-0 items-center justify-between gap-2 rounded-md border border-muted bg-elevated/50 px-2 py-2"
          >
            <a
              :href="link.url"
              target="_blank"
              rel="noopener noreferrer"
              class="min-w-0 break-all text-primary underline"
              >{{ ticketLinkLabel(link.label, link.url) }}</a
            >
            <UTooltip :text="`Remove ${ticketLinkLabel(link.label, link.url)}`">
              <UButton
                :disabled="controlsDisabled"
                color="error"
                variant="ghost"
                icon="lucide:x"
                :aria-label="`Remove ${ticketLinkLabel(link.label, link.url)}`"
                @click="removeLink(link.id)"
              />
            </UTooltip>
          </li>
        </ul>
        <p v-else class="mt-2 text-sm text-muted">No external links yet.</p>
      </UCard>

      <UCard :ui="{ body: 'p-2' }">
        <div class="flex items-center justify-between gap-2">
          <h2 class="font-medium text-highlighted">Related tickets</h2>
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            icon="lucide:plus"
            label="Link ticket"
            :disabled="controlsDisabled"
            @click="openRelationModal"
          />
        </div>
        <UAlert
          v-if="choicesError && !relationModalOpen"
          class="mt-2"
          role="alert"
          color="error"
          title="Could not load ticket choices"
          :description="clientFailureMessage(choicesError)"
        />
        <UButton
          v-if="choicesError && !relationModalOpen"
          class="mt-2"
          color="neutral"
          variant="outline"
          size="sm"
          icon="lucide:refresh-cw"
          label="Retry loading ticket choices"
          @click="refreshChoices()"
        />
        <ul v-if="data.related.length" class="mt-2 space-y-2">
          <li
            v-for="other in data.related"
            :key="other.id"
            class="flex min-w-0 items-center justify-between gap-2 rounded-md border border-muted bg-elevated/50 px-2 py-2"
          >
            <NuxtLink
              :to="`/tickets/${other.id}${other.archivedAt ? '?archived=true' : ''}`"
              class="inline-flex min-w-0 items-center gap-1 truncate text-primary underline"
              ><UIcon
                :name="ticketStatusIcon(other.status)"
                class="inline-block size-4 shrink-0"
                :data-ticket-status-icon="other.status"
                aria-hidden="true"
              /><span class="truncate">{{ other.title }}</span></NuxtLink
            >
            <UTooltip :text="`Unlink ${other.title}`">
              <UButton
                :disabled="controlsDisabled"
                color="error"
                variant="ghost"
                icon="lucide:x"
                :aria-label="`Unlink ${other.title}`"
                @click="removeRelation(other.relationId)"
              />
            </UTooltip>
          </li>
        </ul>
        <p v-else-if="!choicesError" class="mt-2 text-sm text-muted">No related tickets yet.</p>
      </UCard>
    </div>

    <UModal
      v-model:open="titleModalOpen"
      title="Edit ticket title"
      description="Change only the title of this ticket."
      :dismissible="!pending"
      :ui="{ footer: 'justify-end' }"
    >
      <template #body>
        <form class="space-y-3" @submit.prevent="saveTitle">
          <UFormField label="Title" required :error="titleError || undefined">
            <UInput v-model="titleDraft" class="w-full" maxlength="200" autofocus />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton
              type="button"
              color="neutral"
              variant="outline"
              icon="lucide:x"
              label="Cancel"
              :disabled="pending"
              @click="titleModalOpen = false"
            />
            <UButton
              type="submit"
              icon="lucide:save"
              label="Save title"
              :loading="pending && actionErrorTitle === 'Could not update ticket title'"
              :disabled="controlsDisabled"
            />
          </div>
        </form>
      </template>
    </UModal>

    <UModal
      v-model:open="linkModalOpen"
      title="Add external link"
      description="Add a web link related to this ticket."
      :dismissible="!pending"
    >
      <template #body>
        <form class="space-y-3" @submit.prevent="addLink">
          <UAlert
            v-if="linkError"
            role="alert"
            color="error"
            title="Could not add external link"
            :description="linkError"
          />
          <UFormField label="Link label" hint="Optional">
            <UInput v-model="label" class="w-full" maxlength="200" />
          </UFormField>
          <UFormField label="URL" required>
            <UInput
              v-model="url"
              type="url"
              class="w-full"
              placeholder="https://example.com"
              required
            />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton
              type="button"
              color="neutral"
              variant="outline"
              icon="lucide:x"
              label="Cancel"
              :disabled="pending"
              @click="linkModalOpen = false"
            />
            <UButton
              type="submit"
              icon="lucide:plus"
              label="Add link"
              :loading="pending && actionErrorTitle === 'Could not add external link'"
              :disabled="controlsDisabled || !url.trim()"
            />
          </div>
        </form>
      </template>
    </UModal>

    <UModal
      v-model:open="relationModalOpen"
      title="Link a related ticket"
      description="Choose another ticket to relate to this one."
      :dismissible="!pending"
    >
      <template #body>
        <form class="space-y-3" @submit.prevent="addRelation">
          <UAlert
            v-if="choicesError"
            role="alert"
            color="error"
            title="Could not load ticket choices"
            :description="clientFailureMessage(choicesError)"
          />
          <UButton
            v-if="choicesError"
            color="neutral"
            variant="outline"
            size="sm"
            icon="lucide:refresh-cw"
            label="Retry loading ticket choices"
            @click="refreshChoices()"
          />
          <UAlert
            v-if="relationError"
            role="alert"
            color="error"
            title="Could not link ticket"
            :description="relationError"
          />
          <UFormField label="Ticket" required>
            <USelectMenu
              :model-value="relatedId"
              v-model:open="relatedTicketPickerOpen"
              value-key="value"
              :items="relatedTicketItems"
              :search-input="relatedTicketSearchInput"
              :disabled="controlsDisabled || !!choicesError"
              class="w-full"
              placeholder="Choose ticket"
              aria-label="Related ticket"
              @update:model-value="selectRelatedTicket"
            />
          </UFormField>
          <div class="flex justify-end gap-2">
            <UButton
              type="button"
              color="neutral"
              variant="outline"
              icon="lucide:x"
              label="Cancel"
              :disabled="pending"
              @click="relationModalOpen = false"
            />
            <UButton
              type="submit"
              icon="lucide:link-2"
              label="Link ticket"
              :loading="pending && actionErrorTitle === 'Could not link ticket'"
              :disabled="controlsDisabled || !relatedId || !!choicesError"
            />
          </div>
        </form>
      </template>
    </UModal>
  </div>
  <UCard v-else-if="error" class="space-y-2">
    <UAlert
      role="alert"
      color="error"
      :title="actionNeedsRefresh ? actionErrorTitle : 'Could not load ticket'"
      :description="actionNeedsRefresh && actionError ? actionError : clientFailureMessage(error)"
    />
    <UButton
      color="neutral"
      variant="outline"
      icon="lucide:refresh-cw"
      :label="actionNeedsRefresh ? 'Retry loading ticket details' : 'Retry loading ticket'"
      :loading="refreshBusy"
      :disabled="refreshBusy"
      @click="retryTicket"
    />
  </UCard>
</template>
