<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const route = useRoute()
const id = route.params.id as string
const archived = route.query.archived === 'true'
const { data: releaseData, error } = await useFetch(`/api/releases/${id}`, {
  query: { archived: archived ? 'true' : undefined },
})
const release = computed(() => releaseData.value?.release)
const projectName = computed(() => releaseData.value?.projectName ?? '')
const { data: ticketData, error: ticketsError } = await useFetch('/api/tickets', {
  query: { releaseId: id },
})
const tickets = computed(() => ticketData.value?.tickets ?? [])
if (error.value || !releaseData.value)
  throw createError({ status: 404, statusText: 'Release not found' })
</script>
<template>
  <div v-if="release" class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <NuxtLink
          :to="`/projects/${release.projectId}${releaseData?.clientArchivedAt || releaseData?.projectArchivedAt ? '?archived=true' : ''}`"
          class="inline-flex items-center gap-1 text-sm text-primary"
          >← <EntityIcon kind="projects" />{{ projectName }}</NuxtLink
        >
        <div class="mt-3 flex items-center gap-3">
          <h1 class="flex items-center gap-2 text-3xl font-semibold text-highlighted">
            <EntityIcon kind="releases" />{{ release.name }}
          </h1>
          <UBadge v-if="release.archivedAt" color="neutral" variant="subtle">Archived</UBadge>
        </div>
        <div class="mt-2">
          <ReleaseTargetDate :target-date="release.targetDate" />
        </div>
      </div>
      <div class="flex gap-2">
        <UButton
          v-if="
            !release.archivedAt && !releaseData?.projectArchivedAt && !releaseData?.clientArchivedAt
          "
          :to="`/tickets/new?release=${id}`"
          icon="lucide:plus"
          label="New ticket"
        /><UButton
          v-if="!releaseData?.projectArchivedAt && !releaseData?.clientArchivedAt"
          :to="`/releases/${id}/edit${release.archivedAt ? '?archived=true' : ''}`"
          color="neutral"
          variant="outline"
          label="Edit"
        />
      </div>
    </div>
    <UAlert v-if="ticketsError" color="error" title="Could not load tickets"
      >Refresh the page to try again.</UAlert
    >
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
    <div v-else class="grid gap-3 sm:grid-cols-2">
      <NuxtLink
        v-for="item in tickets"
        :key="item.ticket.id"
        :to="`/tickets/${item.ticket.id}`"
        class="rounded-lg border border-default bg-elevated p-4 hover:border-primary"
        ><h2 class="inline-flex items-center gap-1 font-medium text-highlighted">
          <EntityIcon kind="tickets" />{{ item.ticket.title }}
        </h2>
        <p class="mt-2 text-sm text-muted">
          {{ item.ticket.status
          }}<template v-if="item.ticket.estimateMinutes">
            · <TicketEstimate :minutes="item.ticket.estimateMinutes"
          /></template></p
      ></NuxtLink>
    </div>
    <UButton
      :to="`/tickets?release=${id}`"
      color="neutral"
      variant="outline"
      label="View grouped tickets"
    />
  </div>
</template>
