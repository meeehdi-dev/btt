<script setup lang="ts">
import { compareReleases } from '~/utils/release-date'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const id = route.params.id as string
const archived = route.query.archived === 'true'
const showArchived = ref(route.query.archived === 'true')
const donePending = ref<string | null>(null)
const doneReleaseIds = ref(new Set<string>())
const doneError = ref('')
const doneErrorTitle = ref('Could not mark release as done')
const releasesNeedRefresh = ref(false)
const {
  data: projectData,
  error: projectError,
  refresh: refreshProject,
} = await useApiFetch(`/api/projects/${id}`, {
  query: { archived: archived ? 'true' : undefined },
})
const project = computed(() => projectData.value)
const {
  data: releaseData,
  error: releaseError,
  refresh: refreshReleases,
} = await useApiFetch('/api/releases', {
  query: computed(() => ({
    archived: showArchived.value ? 'true' : undefined,
  })),
})
const releases = computed(() =>
  (releaseData.value?.releases ?? [])
    .filter((item) => item.release.projectId === id)
    .filter((item) => showArchived.value || !doneReleaseIds.value.has(item.release.id))
    .toSorted((a, b) => compareReleases(a.release, b.release)),
)

if (projectError.value && clientFailureStatus(projectError.value) === 404)
  throw createError({ statusCode: 404, statusMessage: 'Project not found' })
if (!project.value && !projectError.value)
  throw createError({ statusCode: 404, statusMessage: 'Project not found' })

async function retryReleases() {
  const result = await runClientEffect(refreshEffect(refreshReleases, () => releaseError.value))
  if (result._tag === 'Success') {
    releasesNeedRefresh.value = false
    if (doneErrorTitle.value === 'Release marked done; refresh failed') doneError.value = ''
    doneErrorTitle.value = 'Could not mark release as done'
  }
}

function releaseProgressPercent(doneTicketCount: number, ticketCount: number) {
  return ticketCount ? Math.round((doneTicketCount / ticketCount) * 100) : 0
}

function releaseProgressText(releaseName: string, doneTicketCount: number, ticketCount: number) {
  return `${releaseName}: ${doneTicketCount} of ${ticketCount} active tickets done, ${releaseProgressPercent(doneTicketCount, ticketCount)}% complete`
}

async function markDone(releaseId: string) {
  donePending.value = releaseId
  doneError.value = ''
  doneErrorTitle.value = 'Could not mark release as done'
  try {
    const result = await runClientRequest<unknown>((signal) =>
      $fetch<unknown>(`/api/releases/${releaseId}`, {
        method: 'PATCH',
        body: { archived: true },
        signal,
      }),
    )
    if (result._tag === 'Failure') {
      doneError.value = result.failure.userMessage
      return
    }
    doneReleaseIds.value = new Set([...doneReleaseIds.value, releaseId])
    const refreshed = await runClientEffect(
      refreshEffect(refreshReleases, () => releaseError.value),
    )
    if (refreshed._tag === 'Failure') {
      releasesNeedRefresh.value = true
      doneErrorTitle.value = 'Release marked done; refresh failed'
      doneError.value = `The release was marked done, but the release list could not be refreshed. ${refreshed.failure.userMessage}`
    }
  } finally {
    donePending.value = null
  }
}
</script>

<template>
  <div v-if="project" class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <HierarchyBreadcrumbs
          :ancestors="[
            {
              kind: 'clients',
              label: project.clientName,
              to: `/clients/${project.project.clientId}${project.clientArchivedAt ? '?archived=true' : ''}`,
            },
          ]"
          :current="{ kind: 'projects', label: project.project.name }"
        >
          <template #current-prefix>
            <span
              class="size-4 shrink-0 rounded-full"
              :style="{ backgroundColor: project.project.color }"
            />
          </template>
          <template #current-suffix>
            <UBadge v-if="project.project.archivedAt" color="neutral" variant="subtle"
              >Archived</UBadge
            >
          </template>
        </HierarchyBreadcrumbs>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row">
        <ArchiveFilterButton v-model="showArchived" />
        <UButton
          v-if="!project.clientArchivedAt"
          :to="`/projects/${id}/edit${project.project.archivedAt ? '?archived=true' : ''}`"
          color="neutral"
          variant="outline"
          icon="lucide:pencil"
          label="Edit project"
        />
        <UButton
          v-if="!project.clientArchivedAt && !project.project.archivedAt"
          :to="`/releases/new?project=${id}`"
          icon="lucide:plus"
          label="New release"
        />
      </div>
    </div>
    <div v-if="projectError" class="space-y-3">
      <UAlert
        role="alert"
        color="error"
        title="Could not refresh project"
        :description="clientFailureMessage(projectError)"
      />
      <UButton
        color="neutral"
        variant="outline"
        icon="lucide:refresh-cw"
        label="Retry loading project"
        @click="refreshProject()"
      />
    </div>
    <div v-if="releaseError || releasesNeedRefresh" class="space-y-3">
      <UAlert
        v-if="releaseError"
        role="alert"
        color="error"
        title="Could not load releases"
        :description="clientFailureMessage(releaseError)"
      />
      <UButton
        color="neutral"
        variant="outline"
        icon="lucide:refresh-cw"
        label="Retry loading releases"
        @click="retryReleases()"
      />
    </div>
    <UAlert v-if="doneError" role="alert" color="error" :title="doneErrorTitle">
      {{ doneError }}
    </UAlert>
    <UCard v-if="!releases.length && !releaseError && !releasesNeedRefresh">
      <h2 class="font-medium text-highlighted">
        No {{ showArchived ? '' : 'active ' }}releases yet
      </h2>
      <p class="mt-2 text-muted">Add a release to organize tickets later.</p>
    </UCard>
    <div v-else-if="releases.length" class="grid gap-4 sm:grid-cols-2">
      <EntityCard
        v-for="item in releases"
        :key="item.release.id"
        :data-release-card-id="item.release.id"
        class="cursor-pointer"
      >
        <template #navigation>
          <NuxtLink
            :to="`/releases/${item.release.id}${item.release.archivedAt ? '?archived=true' : ''}`"
            :aria-label="`Open release ${item.release.name}`"
            class="absolute inset-0 z-0 rounded-lg focus-visible:outline-2 focus-visible:outline-primary"
          />
        </template>
        <template #heading>
          <div data-release-card-heading class="flex min-w-0 items-center gap-3">
            <h2
              class="inline-flex min-w-0 items-center gap-1 font-medium text-highlighted"
              :title="item.release.name"
            >
              <EntityIcon kind="releases" /><span class="truncate">{{ item.release.name }}</span>
            </h2>
            <UBadge v-if="item.release.archivedAt" color="neutral" variant="subtle"
              >Archived</UBadge
            >
            <UTooltip v-else text="Mark done">
              <UButton
                square
                color="success"
                variant="soft"
                icon="lucide:check"
                :loading="donePending === item.release.id"
                aria-label="Mark release as done"
                class="pointer-events-auto relative z-10 shrink-0 cursor-pointer"
                @click.stop="markDone(item.release.id)"
              />
            </UTooltip>
          </div>
        </template>
        <template #context>
          <div
            data-release-card-summary
            class="flex w-max min-w-0 max-w-full items-center gap-2 overflow-x-auto whitespace-nowrap"
          >
            <TicketHierarchyBadges
              mode="links"
              truncate-labels
              class="pointer-events-auto relative z-10 w-max shrink-0"
              :items="[
                {
                  kind: 'client',
                  id: project.project.clientId,
                  name: project.clientName,
                  to: `/clients/${project.project.clientId}${project.clientArchivedAt ? '?archived=true' : ''}`,
                },
                {
                  kind: 'project',
                  id: project.project.id,
                  name: project.project.name,
                  to: `/projects/${project.project.id}${project.project.archivedAt ? '?archived=true' : ''}`,
                },
              ]"
              aria-label="Release hierarchy"
            />
            <div
              v-if="
                !project.project.archivedAt && !project.clientArchivedAt && !item.release.archivedAt
              "
              data-release-card-metrics
              class="flex h-6 shrink-0 items-center gap-1 rounded-md bg-default px-1.5 text-xs text-muted"
            >
              <EntityIcon kind="tickets" data-release-card-ticket-icon />
              <span data-release-card-counts
                >{{ item.doneTicketCount }} / {{ item.ticketCount }}</span
              >
              <ProgressRing
                data-release-card-progress
                :value="item.doneTicketCount"
                :max="item.ticketCount"
                :label="`${item.release.name} completion`"
                :value-text="
                  releaseProgressText(item.release.name, item.doneTicketCount, item.ticketCount)
                "
              />
            </div>
          </div>
        </template>
      </EntityCard>
    </div>
  </div>
  <UCard v-else-if="projectError" class="space-y-3">
    <UAlert
      role="alert"
      color="error"
      title="Could not load project"
      :description="clientFailureMessage(projectError)"
    />
    <UButton
      color="neutral"
      variant="outline"
      icon="lucide:refresh-cw"
      label="Retry loading project"
      @click="refreshProject()"
    />
  </UCard>
</template>
