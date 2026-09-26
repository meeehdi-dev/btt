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
        <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <NuxtLink
            :to="`/projects/${release.projectId}${releaseData?.clientArchivedAt || releaseData?.projectArchivedAt ? '?archived=true' : ''}`"
            class="inline-flex items-center gap-1 text-sm text-primary"
            ><EntityIcon kind="projects" />{{ projectName }}</NuxtLink
          >
          <UIcon name="lucide:chevron-right" class="size-4 text-muted" aria-hidden="true" />
          <div class="flex min-w-0 flex-wrap items-center gap-3">
            <h1 class="flex items-center gap-2 text-3xl font-semibold text-highlighted">
              <EntityIcon kind="releases" />{{ release.name }}
            </h1>
            <UBadge v-if="release.archivedAt" color="neutral" variant="subtle">Archived</UBadge>
          </div>
        </div>
        <div class="mt-2">
          <ReleaseTargetDate :target-date="release.targetDate" />
        </div>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row">
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
          icon="lucide:pencil"
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
      <article
        v-for="item in tickets"
        :key="item.ticket.id"
        :data-release-ticket-id="item.ticket.id"
        class="group relative rounded-lg border border-default bg-elevated p-4 transition hover:border-primary focus-within:border-primary"
      >
        <NuxtLink
          :to="`/tickets/${item.ticket.id}`"
          :aria-label="`Open ticket ${item.ticket.title}`"
          class="absolute inset-0 rounded-lg focus-visible:outline-2 focus-visible:outline-primary"
        />
        <div class="pointer-events-none">
          <div class="flex min-w-0 items-start justify-between gap-3">
            <h2 class="inline-flex min-w-0 items-center gap-1 font-medium text-highlighted">
              <EntityIcon kind="tickets" /><span class="truncate">{{ item.ticket.title }}</span>
            </h2>
            <UBadge color="neutral" variant="subtle">{{ item.ticket.status }}</UBadge>
          </div>
          <p
            v-if="item.ticket.description"
            class="mt-2 flex items-center gap-1 truncate text-sm text-muted"
          >
            <UIcon name="lucide:align-left" class="size-4 shrink-0" aria-hidden="true" /><span
              class="truncate"
              >{{ item.ticket.description }}</span
            >
          </p>
          <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <TicketTrackedUsage
              :minutes="item.trackedMinutes"
              :estimate-minutes="item.ticket.estimateMinutes"
            />
          </div>
        </div>
        <div class="pointer-events-none relative z-10 mt-2 flex justify-end">
          <TicketContextPopovers
            class="pointer-events-auto"
            :related-tickets="item.relatedTickets"
            :external-links="item.externalLinks"
          />
        </div>
      </article>
    </div>
  </div>
</template>
