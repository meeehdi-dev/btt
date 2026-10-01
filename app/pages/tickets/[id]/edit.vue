<script setup lang="ts">
import { ticketStatuses } from '#shared/ticket-status'
import { formatTicketEstimate, parseTicketEstimate } from '~/utils/ticket-estimate'
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const route = useRoute()
const id = route.params.id as string
const endpoint: string = '/api/tickets/' + id
const {
  data,
  error: ticketError,
  refresh: refreshTicket,
} = await useApiFetch(`/api/tickets/${id}`, { query: { archived: 'true' } })
if (ticketError.value && clientFailureStatus(ticketError.value) === 404)
  throw createError({ statusCode: 404, statusMessage: 'Ticket not found' })
if (!data.value && !ticketError.value)
  throw createError({ statusCode: 404, statusMessage: 'Ticket not found' })
const {
  data: releasesData,
  error: releasesError,
  refresh: refreshReleases,
} = await useApiFetch('/api/releases')
const releaseSearchInput = useSelectSearchInput('Search releases…')
const releasePickerOpen = ref(false)
const title = ref(data.value?.ticket.title ?? '')
const description = ref(data.value?.ticket.description ?? '')
const releaseId = ref(data.value?.ticket.releaseId ?? '')
const status = ref(data.value?.ticket.status ?? ticketStatuses[0])
const estimate = ref(
  data.value?.ticket.estimateMinutes ? formatTicketEstimate(data.value.ticket.estimateMinutes) : '',
)
const archived = ref(Boolean(data.value?.ticket.archivedAt))
function selectRelease(selectedReleaseId: string) {
  releaseId.value = selectedReleaseId
  releasePickerOpen.value = false
}
const pending = ref(false)
const errorMessage = ref('')
async function save() {
  pending.value = true
  errorMessage.value = ''
  try {
    const result = await runClientRequest((signal) =>
      $fetch<unknown>(endpoint, {
        method: 'PATCH',
        body: {
          releaseId: releaseId.value,
          title: title.value,
          description: description.value,
          status: status.value,
          estimateMinutes: parseTicketEstimate(estimate.value),
          archived: archived.value,
        },
        signal,
      }),
    )
    if (result._tag === 'Failure') {
      errorMessage.value = result.failure.userMessage
      return
    }
    await navigateTo(`/tickets/${id}${archived.value ? '?archived=true' : ''}`)
  } finally {
    pending.value = false
  }
}
async function remove() {
  if (
    !confirm(
      'Permanently delete this archived ticket and its links/relations? Tickets with tracked time cannot be deleted.',
    )
  )
    return
  pending.value = true
  errorMessage.value = ''
  try {
    const result = await runClientRequest((signal) =>
      $fetch<unknown>(endpoint, { method: 'DELETE', signal }),
    )
    if (result._tag === 'Failure') {
      errorMessage.value = result.failure.userMessage
      return
    }
    await navigateTo('/tickets')
  } finally {
    pending.value = false
  }
}
</script>
<template>
  <div v-if="data" class="w-full space-y-6">
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
          to: `/projects/${data.hierarchy.projectId}${data.hierarchy.projectArchivedAt || data.hierarchy.clientArchivedAt ? '?archived=true' : ''}`,
        },
        {
          kind: 'releases',
          label: data.hierarchy.releaseName,
          to: `/releases/${data.ticket.releaseId}${data.hierarchy.releaseArchivedAt || data.hierarchy.projectArchivedAt || data.hierarchy.clientArchivedAt ? '?archived=true' : ''}`,
        },
        {
          kind: 'tickets',
          label: data.ticket.title,
          to: `/tickets/${id}${data.ticket.archivedAt || data.hierarchy.releaseArchivedAt || data.hierarchy.projectArchivedAt || data.hierarchy.clientArchivedAt ? '?archived=true' : ''}`,
        },
      ]"
      :current="{ kind: 'tickets', label: 'Edit ticket' }"
    />
    <div v-if="ticketError" class="space-y-3">
      <UAlert
        role="alert"
        color="error"
        title="Could not refresh ticket"
        :description="clientFailureMessage(ticketError)"
      />
      <UButton
        color="neutral"
        variant="outline"
        icon="lucide:refresh-cw"
        label="Retry loading ticket"
        @click="refreshTicket()"
      />
    </div>
    <UCard
      ><form class="space-y-5" @submit.prevent="save">
        <div v-if="releasesError" class="space-y-2">
          <UAlert
            role="alert"
            color="error"
            title="Could not load releases"
            :description="clientFailureMessage(releasesError)"
          />
          <UButton
            color="neutral"
            variant="outline"
            icon="lucide:refresh-cw"
            label="Retry loading releases"
            @click="refreshReleases()"
          />
        </div>
        <UFormField label="Release" required
          ><USelectMenu
            :model-value="releaseId"
            v-model:open="releasePickerOpen"
            value-key="value"
            :items="
              (releasesData?.releases ?? []).map((item) => ({
                label: `${item.projectName} · ${item.release.name}`,
                value: item.release.id,
              }))
            "
            :search-input="releaseSearchInput"
            aria-label="Release"
            class="w-full"
            :disabled="!!releasesError || !releasesData?.releases.length"
            @update:model-value="selectRelease"
        /></UFormField>
        <UFormField label="Title" required><UInput v-model="title" class="w-full" /></UFormField>
        <UFormField label="Description"
          ><UTextarea v-model="description" class="w-full"
        /></UFormField>
        <UFormField label="Status"
          ><USelect
            v-model="status"
            :items="ticketStatuses.map((value) => ({ label: value, value }))"
            class="w-full"
        /></UFormField>
        <UFormField label="Estimate" hint="Optional · try 1hr 30m or 90 (minutes)"
          ><UInput v-model="estimate" type="text" class="w-full" placeholder="1hr 30m"
        /></UFormField>
        <UCheckbox v-model="archived" label="Archived" />
        <UAlert v-if="errorMessage" role="alert" color="error" title="Could not save changes">{{
          errorMessage
        }}</UAlert>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <UButton
            v-if="archived"
            color="error"
            variant="ghost"
            :disabled="pending"
            icon="lucide:trash-2"
            label="Permanently delete"
            class="w-full sm:w-auto"
            @click="remove"
          />
          <div class="flex flex-col gap-2 sm:ml-auto sm:flex-row">
            <UButton
              :to="`/tickets/${id}${archived ? '?archived=true' : ''}`"
              color="neutral"
              variant="ghost"
              icon="lucide:x"
              label="Cancel"
              class="w-full sm:w-auto"
            /><UButton
              type="submit"
              :loading="pending"
              :disabled="!!releasesError || !releasesData?.releases.length"
              icon="lucide:save"
              label="Save changes"
              class="w-full sm:w-auto"
            />
          </div>
        </div></form
    ></UCard>
  </div>
  <UCard v-else-if="ticketError" class="space-y-3">
    <UAlert
      role="alert"
      color="error"
      title="Could not load ticket"
      :description="clientFailureMessage(ticketError)"
    />
    <UButton
      color="neutral"
      variant="outline"
      icon="lucide:refresh-cw"
      label="Retry loading ticket"
      @click="refreshTicket()"
    />
  </UCard>
</template>
