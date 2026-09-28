<script setup lang="ts">
import { ticketStatuses } from '#shared/ticket-status'

type TicketStatus = (typeof ticketStatuses)[number]

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const route = useRoute()
const id = route.params.id as string
const endpoint: string = '/api/releases/' + id
const archived = route.query.archived === 'true'
const {
  data: releaseData,
  error,
  refresh: refreshRelease,
} = await useApiFetch(`/api/releases/${id}`, {
  query: { archived: archived ? 'true' : undefined },
})
const release = computed(() => releaseData.value?.release)
const {
  data: ticketData,
  error: ticketsError,
  refresh: refreshTickets,
} = await useApiFetch('/api/tickets', {
  query: { releaseId: id },
})
const tickets = computed(() => ticketData.value?.tickets ?? [])
const doneTicketCount = computed(
  () => tickets.value.filter((item) => item.ticket.status === 'Done').length,
)
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

async function refreshTicketStatusData() {
  return runClientEffect(refreshEffect(refreshTickets, () => ticketsError.value))
}

async function retryTicketStatusRefresh() {
  if (!ticketStatusNeedsRefresh.value || ticketStatusRefreshBusy.value) return
  ticketStatusRefreshBusy.value = true
  try {
    const result = await refreshTicketStatusData()
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

    const refreshed = await refreshTicketStatusData()
    if (refreshed._tag === 'Failure') {
      ticketStatusNeedsRefresh.value = true
      ticketStatusErrorTitle.value = 'Ticket updated; release refresh failed'
      ticketStatusMessage.value = ''
      ticketStatusError.value = `Ticket status changed to ${status}, but the release ticket data could not be refreshed. ${refreshed.failure.userMessage}`
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
    await navigateTo(`/projects/${release.value.projectId}`)
  } finally {
    donePending.value = false
  }
}
</script>
<template>
  <div v-if="release" class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
        <div class="mt-2">
          <ReleaseTargetDate :target-date="release.targetDate" />
        </div>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row">
        <UButton
          v-if="!releaseData?.projectArchivedAt && !releaseData?.clientArchivedAt"
          :to="`/releases/${id}/edit${release.archivedAt ? '?archived=true' : ''}`"
          color="neutral"
          variant="outline"
          icon="lucide:pencil"
          label="Edit release"
        />
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
        <UButton
          v-if="
            !release.archivedAt && !releaseData?.projectArchivedAt && !releaseData?.clientArchivedAt
          "
          :to="`/tickets/new?release=${id}`"
          icon="lucide:plus"
          label="New ticket"
        />
      </div>
    </div>
    <div v-if="error" class="space-y-3">
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
    <UModal
      v-model:open="doneConfirmationOpen"
      title="Mark release as done?"
      :description="
        tickets.length === 0
          ? 'This release has no tickets yet. Marking it as done will archive it.'
          : 'Some tickets in this release are not done yet.'
      "
    >
      <template #body>
        <div class="space-y-4">
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
          <div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <UButton
              color="neutral"
              variant="ghost"
              icon="lucide:x"
              label="Cancel"
              class="w-full sm:w-auto"
              @click="doneConfirmationOpen = false"
            />
            <UButton
              color="success"
              variant="soft"
              icon="lucide:check"
              label="Mark release as done"
              :loading="donePending"
              class="w-full sm:w-auto"
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
    <div v-if="ticketsError && !ticketStatusNeedsRefresh" class="space-y-3">
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
    <div v-else-if="!ticketsError" class="grid gap-3 sm:grid-cols-2">
      <EntityCard
        v-for="item in tickets"
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
            class="pointer-events-auto relative z-10 flex min-w-0 items-center gap-1 overflow-x-auto"
            aria-label="Ticket context"
          >
            <TicketHierarchyBadges
              mode="links"
              truncate-labels
              class="w-max shrink-0"
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
                <UIcon name="lucide:circle-dot" class="size-4 text-muted" aria-hidden="true" />
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
  <UCard v-else-if="error" class="space-y-3">
    <UAlert
      role="alert"
      color="error"
      title="Could not load release"
      :description="clientFailureMessage(error)"
    />
    <UButton
      color="neutral"
      variant="outline"
      icon="lucide:refresh-cw"
      label="Retry loading release"
      @click="refreshRelease()"
    />
  </UCard>
</template>
