<script setup lang="ts">
import { trackAppApiFetch } from '~/composables/useAppDataInvalidation'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const id = route.params.id as string
const archived = route.query.archived === 'true'
const showArchived = ref(route.query.archived === 'true')
const projectKey = `app-api:projects:detail:${id}:${archived ? 'archived' : 'active'}`
const {
  data: projectData,
  error: projectError,
  refresh: refreshProject,
} = await trackAppApiFetch(
  useApiFetch(`/api/projects/${id}`, {
    key: projectKey,
    query: { archived: archived ? 'true' : undefined },
  }),
  { key: projectKey, resources: ['projects', 'hierarchy'] },
)
const project = computed(() => projectData.value)
const {
  data: releaseData,
  error: releaseError,
  refresh: refreshReleases,
} = await trackAppApiFetch(
  useApiFetch('/api/releases', {
    key: computed(() => `app-api:releases:list:${showArchived.value ? 'archived' : 'active'}`),
    query: computed(() => ({
      archived: showArchived.value ? 'true' : undefined,
    })),
  }),
  {
    key: computed(() => `app-api:releases:list:${showArchived.value ? 'archived' : 'active'}`),
    resources: ['releases', 'hierarchy', 'search'],
  },
)
const releases = computed(() =>
  (releaseData.value?.releases ?? []).filter((item) => item.release.projectId === id),
)

if (projectError.value && clientFailureStatus(projectError.value) === 404)
  throw createError({ statusCode: 404, statusMessage: 'Project not found' })
if (!project.value && !projectError.value)
  throw createError({ statusCode: 404, statusMessage: 'Project not found' })

async function retryReleases() {
  await runClientEffect(refreshEffect(refreshReleases, () => releaseError.value))
}

function releaseProgressPercent(doneTicketCount: number, ticketCount: number) {
  return ticketCount ? Math.round((doneTicketCount / ticketCount) * 100) : 0
}

function releaseProgressText(releaseName: string, doneTicketCount: number, ticketCount: number) {
  return `${releaseName}: ${doneTicketCount} of ${ticketCount} active tickets done, ${releaseProgressPercent(doneTicketCount, ticketCount)}% complete`
}
</script>

<template>
  <div v-if="project" class="space-y-4">
    <div class="flex items-end justify-between gap-2">
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
      <div class="flex items-center gap-2">
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
    <div v-if="projectError" class="space-y-2">
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
    <div v-if="releaseError" class="space-y-2">
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
    <UCard v-if="!releases.length && !releaseError">
      <h2 class="font-medium text-highlighted">
        No {{ showArchived ? '' : 'active ' }}releases yet
      </h2>
      <p class="mt-2 text-muted">Add a release to organize tickets later.</p>
    </UCard>
    <div v-else-if="releases.length" class="grid grid-cols-2 gap-2">
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
          <div data-release-card-heading class="flex min-w-0 items-center gap-2">
            <h2
              class="inline-flex min-w-0 items-center gap-1 font-medium text-highlighted"
              :title="item.release.name"
            >
              <EntityIcon kind="releases" /><span class="truncate">{{ item.release.name }}</span>
            </h2>
            <UBadge v-if="item.release.archivedAt" color="neutral" variant="subtle"
              >Archived</UBadge
            >
          </div>
        </template>
        <template #context>
          <div
            data-release-card-summary
            class="flex min-w-0 max-w-full flex-wrap items-center gap-2"
          >
            <TicketHierarchyBadges
              mode="links"
              truncate-labels
              class="pointer-events-auto relative z-10 max-w-full"
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
              class="flex h-6 shrink-0 items-center gap-1 rounded-md bg-default px-2 text-xs text-muted"
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
  <UCard v-else-if="projectError" class="space-y-2">
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
