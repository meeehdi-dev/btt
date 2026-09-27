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
const doneTicketCount = computed(
  () => tickets.value.filter((item) => item.ticket.status === 'Done').length,
)
const doneConfirmationOpen = ref(false)
const donePending = ref(false)
const doneError = ref('')
if (error.value || !releaseData.value)
  throw createError({ status: 404, statusText: 'Release not found' })

async function requestMarkDone() {
  doneError.value = ''
  if (tickets.value.length === 0 || doneTicketCount.value < tickets.value.length) {
    doneConfirmationOpen.value = true
    return
  }
  await markDone()
}

async function markDone() {
  if (!release.value || donePending.value) return
  donePending.value = true
  doneError.value = ''
  try {
    await $fetch(`/api/releases/${id}`, { method: 'PATCH', body: { archived: true } })
    await navigateTo(`/projects/${release.value.projectId}`)
  } catch (cause) {
    doneError.value = cause instanceof Error ? cause.message : 'Unable to mark release as done.'
  } finally {
    donePending.value = false
  }
}
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
          :disabled="!!ticketsError"
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
      color="error"
      title="Could not mark release as done"
    >
      {{ doneError }}
    </UAlert>
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
        <div data-release-ticket-header class="pointer-events-none">
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
        <div
          data-release-ticket-context
          class="pointer-events-auto relative z-10 mt-2 flex min-w-0 items-center gap-1 overflow-x-auto"
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
          <UBadge size="md" color="neutral" variant="soft" class="shrink-0 !text-muted">
            <UIcon name="lucide:circle-dot" class="size-4" aria-hidden="true" />
            {{ item.ticket.status }}
          </UBadge>
          <TicketContextPopovers
            class="shrink-0"
            :related-tickets="item.relatedTickets"
            :external-links="item.externalLinks"
          />
        </div>
      </article>
    </div>
  </div>
</template>
