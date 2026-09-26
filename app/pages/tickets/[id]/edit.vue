<script setup lang="ts">
import { ticketStatuses } from '#shared/ticket-status'
import { formatTicketEstimate, parseTicketEstimate } from '~/utils/ticket-estimate'
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const route = useRoute()
const id = route.params.id as string
const { data } = await useFetch(`/api/tickets/${id}`, { query: { archived: 'true' } })
if (!data.value) throw createError({ status: 404, statusText: 'Ticket not found' })
const { data: releasesData, error: releasesError } = await useFetch('/api/releases')
const title = ref(data.value.ticket.title)
const description = ref(data.value.ticket.description)
const releaseId = ref(data.value.ticket.releaseId)
const status = ref(data.value.ticket.status)
const estimate = ref(
  data.value.ticket.estimateMinutes ? formatTicketEstimate(data.value.ticket.estimateMinutes) : '',
)
const archived = ref(Boolean(data.value.ticket.archivedAt))
const pending = ref(false)
const errorMessage = ref('')
async function save() {
  pending.value = true
  errorMessage.value = ''
  try {
    await $fetch(`/api/tickets/${id}`, {
      method: 'PATCH',
      body: {
        releaseId: releaseId.value,
        title: title.value,
        description: description.value,
        status: status.value,
        estimateMinutes: parseTicketEstimate(estimate.value),
        archived: archived.value,
      },
    })
    await navigateTo(`/tickets/${id}${archived.value ? '?archived=true' : ''}`)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to save ticket.'
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
    await $fetch(`/api/tickets/${id}`, { method: 'DELETE' })
    await navigateTo('/tickets')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to delete ticket.'
  } finally {
    pending.value = false
  }
}
</script>
<template>
  <div class="w-full space-y-6">
    <div>
      <NuxtLink
        :to="`/tickets/${id}${archived ? '?archived=true' : ''}`"
        class="inline-flex items-center gap-1 text-sm text-primary"
        >← <EntityIcon kind="tickets" />Ticket</NuxtLink
      >
      <h1 class="mt-3 flex items-center gap-2 text-3xl font-semibold text-highlighted">
        <EntityIcon kind="tickets" />Edit ticket
      </h1>
    </div>
    <UCard
      ><form class="space-y-5" @submit.prevent="save">
        <UAlert v-if="releasesError" color="error" title="Could not load releases"
          >You can retry this page before changing release.</UAlert
        >
        <UFormField label="Release" required
          ><USelect
            v-model="releaseId"
            :items="
              (releasesData?.releases ?? []).map((item) => ({
                label: `${item.projectName} · ${item.release.name}`,
                value: item.release.id,
              }))
            "
            class="w-full"
            :disabled="!!releasesError || !releasesData?.releases.length"
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
        <UAlert v-if="errorMessage" color="error" title="Could not save changes">{{
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
</template>
