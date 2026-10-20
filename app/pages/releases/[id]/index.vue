<script setup lang="ts">
import { modalFormShortcutContent } from '~/composables/modal-form-shortcuts'
import { trackAppApiFetch } from '~/composables/useAppDataInvalidation'
import { useEntityDetailContext } from '~/composables/useEntityDetailContext'
import { inlineNameField, useInlineEntityFields } from '~/composables/useInlineEntityFields'
import { ticketStatusIcon, ticketStatuses } from '#shared/ticket-status'

type TicketStatus = (typeof ticketStatuses)[number]

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const { id, archived } = useEntityDetailContext()
const endpoint: string = '/api/releases/' + id
const releaseKey = computed(
  () => `app-api:releases:detail:${id}:${archived.value ? 'archived' : 'active'}`,
)
const {
  data: releaseData,
  error,
  refresh: refreshRelease,
} = await trackAppApiFetch(
  useApiFetch(`/api/releases/${id}`, {
    key: releaseKey,
    query: computed(() => ({ archived: archived.value ? 'true' : undefined })),
  }),
  { key: releaseKey, resources: ['releases', 'hierarchy'] },
)
const release = computed(() => releaseData.value?.release)
const nameDraft = ref(release.value?.name ?? '')
const targetDateDraft = ref(release.value?.targetDate ?? '')
const inlineFields = useInlineEntityFields({
  resource: 'release',
  entityName: 'release',
  getEntity: () => release.value,
  endpoint: () => endpoint,
  fields: {
    name: inlineNameField<NonNullable<typeof release.value>>(
      nameDraft,
      (entity) => entity.name,
      'Release name saved.',
    ),
    targetDate: {
      draft: targetDateDraft,
      read: (entity) => entity.targetDate ?? '',
      toPatch: (value) => ({ targetDate: value || null }),
      successTitle: 'Release target date saved.',
    },
  },
  applyPatch: (patch) => {
    if (releaseData.value) Object.assign(releaseData.value.release, patch)
  },
  archivePath: (shouldArchive) =>
    `/releases/${id}${shouldArchive || Boolean(releaseData.value?.projectArchivedAt) || Boolean(releaseData.value?.clientArchivedAt) ? '?archived=true' : ''}`,
})
const {
  actionNeedsRefresh: entityActionNeedsRefresh,
  changeArchive,
  fieldErrors,
  invalidateMutation,
  lifecycleError: entityActionError,
  pendingField: entityPending,
  reportWrite,
  retryRefresh: retryReleaseData,
  saveField: saveReleaseField,
} = inlineFields
const {
  data: ticketData,
  error: ticketsError,
  refresh: refreshTickets,
} = await trackAppApiFetch(
  useApiFetch('/api/tickets', {
    key: `app-api:tickets:release:${id}:active`,
    query: { releaseId: id },
  }),
  {
    key: `app-api:tickets:release:${id}:active`,
    resources: ['tickets', 'hierarchy', 'time-entries'],
  },
)
const tickets = computed(() => ticketData.value?.tickets ?? [])
const doneTickets = computed(() => tickets.value.filter((item) => item.ticket.status === 'Done'))
const ticketGroups = computed(() =>
  [
    { key: 'unfinished', items: tickets.value.filter((item) => item.ticket.status !== 'Done') },
    { key: 'done', items: doneTickets.value },
  ].filter((group) => group.items.length),
)
const doneTicketCount = computed(() => doneTickets.value.length)
const doneConfirmationOpen = ref(false)
const donePending = ref(false)
const doneError = ref('')
const ticketStatusChangingId = ref<string | null>(null)
const ticketStatusNeedsRefresh = ref(false)
const ticketStatusRefreshBusy = ref(false)
const ticketStatusError = ref('')
const ticketStatusErrorTitle = ref('Could not change ticket status')
const ticketStatusMessage = ref('')
if (error.value && clientFailureStatus(error.value) === 404)
  throw createError({ statusCode: 404, statusMessage: 'Release not found' })
if (!releaseData.value && !error.value)
  throw createError({ statusCode: 404, statusMessage: 'Release not found' })

async function removeRelease() {
  if (
    !release.value?.archivedAt ||
    entityPending.value ||
    entityActionNeedsRefresh.value ||
    !confirm('Permanently delete this archived release?')
  )
    return
  const parentProjectPath = `/projects/${release.value.projectId}${releaseData.value?.projectArchivedAt || releaseData.value?.clientArchivedAt ? '?archived=true' : ''}`
  entityPending.value = 'delete'
  entityActionError.value = ''
  try {
    const result = await runClientRequest<unknown>((signal) =>
      $fetch<unknown>(endpoint, { method: 'DELETE', signal }),
    )
    if (result._tag === 'Failure') {
      entityActionError.value = result.failure.userMessage
      return
    }
    const refreshed = await invalidateMutation('release', { refreshActive: false })
    reportWrite(refreshed, { title: 'Release deleted.' })
    await navigateTo(parentProjectPath)
  } finally {
    entityPending.value = null
  }
}

async function refreshTicketStatusData() {
  return runClientEffect(refreshEffect(refreshTickets, () => ticketsError.value))
}

async function retryTicketStatusRefresh() {
  if (!ticketStatusNeedsRefresh.value || ticketStatusRefreshBusy.value) return
  ticketStatusRefreshBusy.value = true
  try {
    const result = await invalidateMutation('ticket')
    if (result._tag === 'Failure') {
      ticketStatusError.value = `Release ticket data is still unavailable. ${result.failure.userMessage}`
      return
    }
    ticketStatusNeedsRefresh.value = false
    ticketStatusError.value = ''
    ticketStatusErrorTitle.value = 'Could not change ticket status'
    ticketStatusMessage.value = 'Release ticket data refreshed.'
  } finally {
    ticketStatusRefreshBusy.value = false
  }
}

async function changeTicketStatus(ticketId: string, destination: unknown) {
  const status = ticketStatuses.find((value) => value === destination)
  if (
    !status ||
    ticketStatusChangingId.value ||
    donePending.value ||
    ticketStatusNeedsRefresh.value ||
    ticketsError.value
  )
    return
  const source = tickets.value.find((item) => item.ticket.id === ticketId)
  if (!source || source.ticket.archivedAt || source.ticket.status === status) return

  ticketStatusChangingId.value = ticketId
  ticketStatusError.value = ''
  ticketStatusErrorTitle.value = 'Could not change ticket status'
  ticketStatusMessage.value = `Changing ${source.ticket.title} to ${status}.`
  try {
    const statusEndpoint: string = '/api/tickets/' + ticketId
    const result = await runClientRequest<unknown>((signal) =>
      $fetch<unknown>(statusEndpoint, { method: 'PATCH', body: { status }, signal }),
    )
    if (result._tag === 'Failure') {
      ticketStatusMessage.value = ''
      ticketStatusError.value = result.failure.userMessage
      const refreshed = await refreshTicketStatusData()
      if (refreshed._tag === 'Failure') {
        ticketStatusNeedsRefresh.value = true
        ticketStatusError.value += ` Release ticket data could not be refreshed. ${refreshed.failure.userMessage}`
      }
      return
    }

    const refreshed = await invalidateMutation('ticket')
    reportWrite(refreshed, { title: `Ticket status changed to ${status}.` })
    if (refreshed._tag === 'Failure') {
      ticketStatusNeedsRefresh.value = true
      ticketStatusErrorTitle.value = 'Ticket updated; release refresh failed'
      ticketStatusMessage.value = ''
      ticketStatusError.value = `Ticket status changed to ${status}, but affected ticket and release data could not be refreshed. ${refreshed.failure.userMessage}`
      return
    }
    ticketStatusMessage.value = `Changed ${source.ticket.title} to ${status}.`
  } finally {
    ticketStatusChangingId.value = null
  }
}

async function requestMarkDone() {
  if (ticketStatusChangingId.value || ticketStatusNeedsRefresh.value) return
  doneError.value = ''
  if (tickets.value.length === 0 || doneTicketCount.value < tickets.value.length) {
    doneConfirmationOpen.value = true
    return
  }
  await markDone()
}

async function markDone() {
  if (
    !release.value ||
    donePending.value ||
    ticketStatusChangingId.value ||
    ticketStatusNeedsRefresh.value
  )
    return
  const projectPath = `/projects/${release.value.projectId}`
  donePending.value = true
  doneError.value = ''
  try {
    const result = await runClientRequest<unknown>((signal) =>
      $fetch<unknown>(endpoint, { method: 'PATCH', body: { archived: true }, signal }),
    )
    if (result._tag === 'Failure') {
      doneError.value = result.failure.userMessage
      return
    }
    const refreshed = await invalidateMutation('release', { refreshActive: false })
    reportWrite(refreshed, { title: 'Release completed.' })
    await navigateTo(projectPath)
  } finally {
    donePending.value = false
  }
}
</script>
<template>
  <div v-if="release" class="space-y-4">
    <div class="flex items-end justify-between gap-2">
      <div>
        <HierarchyBreadcrumbs
          :ancestors="[
            {
              kind: 'clients',
              label: releaseData?.clientName ?? '',
              to: `/clients/${releaseData?.clientId ?? ''}${releaseData?.clientArchivedAt ? '?archived=true' : ''}`,
            },
            {
              kind: 'projects',
              label: releaseData?.projectName ?? '',
              to: `/projects/${release.projectId}${releaseData?.clientArchivedAt || releaseData?.projectArchivedAt ? '?archived=true' : ''}`,
            },
          ]"
          :current="{ kind: 'releases', label: release.name }"
        >
          <template #current-suffix>
            <UBadge v-if="release.archivedAt" color="neutral" variant="subtle">Archived</UBadge>
          </template>
        </HierarchyBreadcrumbs>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          v-if="!release.archivedAt"
          color="neutral"
          variant="outline"
          icon="lucide:archive"
          label="Archive release"
          :loading="entityPending === 'archive'"
          :disabled="!!entityPending || entityActionNeedsRefresh"
          @click="changeArchive(true)"
        />
        <template v-else>
          <UButton
            color="neutral"
            variant="outline"
            icon="lucide:archive-restore"
            label="Restore release"
            :loading="entityPending === 'archive'"
            :disabled="!!entityPending || entityActionNeedsRefresh"
            @click="changeArchive(false)"
          />
          <UButton
            color="error"
            variant="ghost"
            icon="lucide:trash-2"
            label="Permanently delete"
            :loading="entityPending === 'delete'"
            :disabled="!!entityPending || entityActionNeedsRefresh"
            @click="removeRelease"
          />
        </template>
        <UButton
          v-if="
            !release.archivedAt && !releaseData?.projectArchivedAt && !releaseData?.clientArchivedAt
          "
          color="success"
          variant="soft"
          icon="lucide:check"
          label="Mark release as done"
          :loading="donePending"
          :disabled="!!ticketsError || !!ticketStatusChangingId || ticketStatusNeedsRefresh"
          @click="requestMarkDone"
        />
        <TicketCreateModal
          v-if="
            !release.archivedAt && !releaseData?.projectArchivedAt && !releaseData?.clientArchivedAt
          "
          :initial-release-id="id"
        />
      </div>
    </div>
    <HierarchyDetailSections>
      <template #fields>
        <UFormField label="Release name" required :error="fieldErrors.name || undefined">
          <UInput
            v-model="nameDraft"
            class="w-full"
            maxlength="200"
            :disabled="!!entityPending || entityActionNeedsRefresh"
            :aria-busy="entityPending === 'name' || undefined"
            @blur="saveReleaseField('name', nameDraft)"
            @keydown.enter.prevent="saveReleaseField('name', nameDraft)"
          />
        </UFormField>
        <UFormField
          label="Target date"
          hint="Optional"
          :error="fieldErrors.targetDate || undefined"
        >
          <UInput
            v-model="targetDateDraft"
            type="date"
            class="w-full"
            :disabled="!!entityPending || entityActionNeedsRefresh"
            :aria-busy="entityPending === 'targetDate' || undefined"
            @change="saveReleaseField('targetDate', targetDateDraft)"
            @blur="saveReleaseField('targetDate', targetDateDraft)"
          />
          <ReleaseTargetDate v-if="release.targetDate" :target-date="release.targetDate" />
        </UFormField>
      </template>
      <template #feedback>
        <div v-if="entityActionError || entityActionNeedsRefresh" class="space-y-2">
          <UAlert
            v-if="entityActionError"
            role="alert"
            color="error"
            :title="
              entityActionNeedsRefresh
                ? 'Release saved; refresh failed'
                : 'Could not update release'
            "
            :description="entityActionError"
          />
          <UButton
            v-if="entityActionNeedsRefresh"
            color="neutral"
            variant="outline"
            icon="lucide:refresh-cw"
            label="Retry loading release data"
            :loading="entityPending === 'refresh'"
            :disabled="!!entityPending"
            @click="retryReleaseData"
          />
        </div>
        <div v-if="error && !entityActionNeedsRefresh" class="space-y-2">
          <UAlert
            role="alert"
            color="error"
            title="Could not refresh release"
            :description="clientFailureMessage(error)"
          />
          <UButton
            color="neutral"
            variant="outline"
            icon="lucide:refresh-cw"
            label="Retry loading release"
            @click="refreshRelease()"
          />
        </div>
      </template>
      <template #actions>
        <UModal
          v-model:open="doneConfirmationOpen"
          title="Mark release as done?"
          :description="
            tickets.length === 0
              ? 'This release has no tickets yet. Marking it as done will archive it.'
              : 'Some tickets in this release are not done yet.'
          "
          :content="modalFormShortcutContent()"
        >
          <template #body>
            <div class="space-y-3">
              <UAlert
                v-if="doneError"
                role="alert"
                color="error"
                title="Could not mark release as done"
                :description="doneError"
              />
              <UAlert
                color="warning"
                :title="
                  tickets.length === 0 ? 'This release has no tickets' : 'Not all tickets are done'
                "
                :description="
                  tickets.length === 0
                    ? 'Marking this release as done will archive it.'
                    : `${doneTicketCount} of ${tickets.length} tickets are done. Marking this release as done will archive it.`
                "
              />
              <div class="flex justify-end gap-2">
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="lucide:x"
                  label="Cancel"
                  @click="doneConfirmationOpen = false"
                />
                <UButton
                  color="success"
                  variant="soft"
                  icon="lucide:check"
                  label="Mark release as done"
                  :loading="donePending"
                  @click="markDone"
                />
              </div>
            </div>
          </template>
        </UModal>
        <UAlert
          v-if="doneError && !doneConfirmationOpen"
          role="alert"
          color="error"
          title="Could not mark release as done"
        >
          {{ doneError }}
        </UAlert>
        <p class="sr-only" role="status" aria-live="polite">{{ ticketStatusMessage }}</p>
      </template>
      <template #items>
        <div v-if="ticketStatusError" class="space-y-2">
          <UAlert
            role="alert"
            color="error"
            :title="ticketStatusErrorTitle"
            :description="ticketStatusError"
          />
          <UButton
            v-if="ticketStatusNeedsRefresh"
            color="neutral"
            variant="outline"
            icon="lucide:refresh-cw"
            label="Retry release ticket refresh"
            :loading="ticketStatusRefreshBusy"
            :disabled="ticketStatusRefreshBusy"
            @click="retryTicketStatusRefresh"
          />
        </div>
        <div v-if="ticketsError && !ticketStatusNeedsRefresh" class="space-y-2">
          <UAlert
            role="alert"
            color="error"
            title="Could not load tickets"
            :description="clientFailureMessage(ticketsError)"
          />
          <UButton
            color="neutral"
            variant="outline"
            icon="lucide:refresh-cw"
            label="Retry loading tickets"
            @click="refreshTickets()"
          />
        </div>
        <UCard v-if="!tickets.length && !ticketsError"
          ><h2 class="font-medium text-highlighted">No tickets yet</h2>
          <p class="mt-2 text-muted">
            {{
              release.archivedAt
                ? 'Archived releases hide their tickets until restored.'
                : 'Add the first ticket for this release.'
            }}
          </p></UCard
        >
        <div v-else-if="!ticketsError" class="space-y-2">
          <div v-for="group in ticketGroups" :key="group.key" class="space-y-2">
            <USeparator
              v-if="group.key === 'done'"
              label="Done"
              :decorative="false"
              aria-label="Done"
              :ui="{ container: 'text-muted' }"
            />
            <div :data-release-ticket-group="group.key" class="grid grid-cols-2 gap-2">
              <EntityCard
                v-for="item in group.items"
                :key="item.ticket.id"
                as="article"
                class="min-w-0"
                :data-release-ticket-id="item.ticket.id"
              >
                <template #navigation>
                  <NuxtLink
                    :to="`/tickets/${item.ticket.id}`"
                    :aria-label="`Open ticket ${item.ticket.title}`"
                    class="absolute inset-0 z-0 rounded-lg focus-visible:outline-2 focus-visible:outline-primary"
                  />
                </template>
                <template #heading>
                  <div data-release-ticket-header class="min-w-0">
                    <TicketWorkItem
                      mode="ticket-summary"
                      :title="item.ticket.title"
                      :status="item.ticket.status"
                      :title-hint="item.ticket.title"
                      :tracked-minutes="item.trackedMinutes"
                      :estimate-minutes="item.ticket.estimateMinutes"
                      heading-tag="h2"
                      usage-placement="header"
                      :show-percentage="false"
                      header-class="flex min-w-0 items-center gap-2 overflow-x-auto whitespace-nowrap"
                      title-class="inline-flex min-w-0 items-center gap-1 font-medium text-highlighted"
                      title-text-class="truncate"
                      header-usage-class="shrink-0"
                    />
                  </div>
                </template>
                <template #context>
                  <div
                    data-release-ticket-context
                    class="pointer-events-auto relative z-10 flex min-w-0 flex-wrap items-center gap-1"
                    aria-label="Ticket context"
                  >
                    <TicketHierarchyBadges
                      mode="links"
                      truncate-labels
                      class="min-w-0 max-w-full"
                      :items="[
                        {
                          kind: 'client',
                          id: item.clientId,
                          name: item.clientName,
                          to: `/clients/${item.clientId}`,
                        },
                        {
                          kind: 'project',
                          id: item.projectId,
                          name: item.projectName,
                          to: `/projects/${item.projectId}`,
                        },
                        {
                          kind: 'release',
                          id: item.ticket.releaseId,
                          name: item.releaseName,
                          to: `/releases/${item.ticket.releaseId}`,
                        },
                      ]"
                      aria-label="Ticket hierarchy"
                    />
                    <USelect
                      :model-value="item.ticket.status"
                      :items="[...ticketStatuses]"
                      size="xs"
                      color="neutral"
                      variant="soft"
                      :trailing="true"
                      :trailing-icon="''"
                      :ui="{ content: 'min-w-28' }"
                      class="w-max shrink-0 !bg-default !text-muted !text-xs"
                      :aria-label="`Ticket status for ${item.ticket.title}`"
                      :aria-busy="ticketStatusChangingId === item.ticket.id || undefined"
                      :disabled="
                        !!ticketStatusChangingId ||
                        donePending ||
                        ticketStatusNeedsRefresh ||
                        !!ticketsError
                      "
                      :loading="ticketStatusChangingId === item.ticket.id"
                      @update:model-value="changeTicketStatus(item.ticket.id, $event)"
                    >
                      <template #leading>
                        <UIcon
                          :name="ticketStatusIcon(item.ticket.status)"
                          class="size-4 text-muted"
                          :data-ticket-status-icon="item.ticket.status"
                          aria-hidden="true"
                        />
                      </template>
                    </USelect>
                    <TicketContextPopovers
                      class="shrink-0"
                      :related-tickets="item.relatedTickets"
                      :external-links="item.externalLinks"
                    />
                  </div>
                </template>
              </EntityCard>
            </div>
          </div>
        </div>
      </template>
    </HierarchyDetailSections>
  </div>
  <UCard v-else-if="error" class="space-y-2">
    <UAlert
      role="alert"
      color="error"
      :title="entityActionNeedsRefresh ? 'Release saved; refresh failed' : 'Could not load release'"
      :description="entityActionNeedsRefresh ? entityActionError : clientFailureMessage(error)"
    />
    <UButton
      color="neutral"
      variant="outline"
      icon="lucide:refresh-cw"
      :label="entityActionNeedsRefresh ? 'Retry loading release data' : 'Retry loading release'"
      :loading="entityPending === 'refresh'"
      :disabled="!!entityPending"
      @click="entityActionNeedsRefresh ? retryReleaseData() : refreshRelease()"
    />
  </UCard>
</template>
