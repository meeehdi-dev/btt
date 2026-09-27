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
const { data: projectData, error: projectError } = await useFetch(`/api/projects/${id}`, {
  query: { archived: archived ? 'true' : undefined },
})
const project = computed(() => projectData.value!)
const { data: releaseData, error: releaseError } = await useFetch('/api/releases', {
  query: computed(() => ({ archived: showArchived.value ? 'true' : undefined })),
})
const releases = computed(() =>
  (releaseData.value?.releases ?? [])
    .filter((item) => item.release.projectId === id)
    .filter((item) => showArchived.value || !doneReleaseIds.value.has(item.release.id))
    .toSorted((a, b) => compareReleases(a.release, b.release)),
)

if (projectError.value || !project.value)
  throw createError({ status: 404, statusText: 'Project not found' })

function releaseProgressPercent(doneTicketCount: number, ticketCount: number) {
  return ticketCount ? Math.round((doneTicketCount / ticketCount) * 100) : 0
}

function releaseProgressText(releaseName: string, doneTicketCount: number, ticketCount: number) {
  return `${releaseName}: ${doneTicketCount} of ${ticketCount} active tickets done, ${releaseProgressPercent(doneTicketCount, ticketCount)}% complete`
}

async function markDone(releaseId: string) {
  donePending.value = releaseId
  doneError.value = ''
  try {
    await $fetch(`/api/releases/${releaseId}`, { method: 'PATCH', body: { archived: true } })
    doneReleaseIds.value = new Set([...doneReleaseIds.value, releaseId])
    const refreshed = await $fetch('/api/releases', {
      query: { archived: showArchived.value ? 'true' : undefined },
    })
    releaseData.value = refreshed
  } catch (error) {
    doneError.value = error instanceof Error ? error.message : 'Unable to mark release as done.'
  } finally {
    donePending.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <NuxtLink
            :to="`/clients/${project.project.clientId}${project.clientArchivedAt ? '?archived=true' : ''}`"
            class="inline-flex items-center gap-1 text-sm text-primary"
            ><EntityIcon kind="clients" />{{ project.clientName }}</NuxtLink
          >
          <UIcon name="lucide:chevron-right" class="size-4 text-muted" aria-hidden="true" />
          <div class="flex min-w-0 flex-wrap items-center gap-3">
            <span
              class="size-4 shrink-0 rounded-full"
              :style="{ backgroundColor: project.project.color }"
            />
            <h1 class="flex items-center gap-2 text-3xl font-semibold text-highlighted">
              <EntityIcon kind="projects" />{{ project.project.name }}
            </h1>
            <UBadge v-if="project.project.archivedAt" color="neutral" variant="subtle"
              >Archived</UBadge
            >
          </div>
        </div>
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
    <UAlert v-if="releaseError" color="error" title="Could not load releases">
      Refresh the page to try again.
    </UAlert>
    <UAlert v-if="doneError" color="error" title="Could not mark release as done">
      {{ doneError }}
    </UAlert>
    <UCard v-if="!releases.length && !releaseError">
      <h2 class="font-medium text-highlighted">
        No {{ showArchived ? '' : 'active ' }}releases yet
      </h2>
      <p class="mt-2 text-muted">Add a release to organize tickets later.</p>
    </UCard>
    <div v-else-if="releases.length" class="grid gap-4 sm:grid-cols-2">
      <div
        v-for="item in releases"
        :key="item.release.id"
        :data-release-card-id="item.release.id"
        class="group relative cursor-pointer rounded-lg border border-default bg-elevated p-5 transition hover:border-primary focus-within:border-primary"
      >
        <NuxtLink
          :to="`/releases/${item.release.id}${item.release.archivedAt ? '?archived=true' : ''}`"
          :aria-label="`Open release ${item.release.name}`"
          class="absolute inset-0 rounded-lg focus-visible:outline-2 focus-visible:outline-primary"
        />
        <div class="pointer-events-none relative z-10">
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
                class="pointer-events-auto shrink-0 cursor-pointer"
                @click.stop="markDone(item.release.id)"
              />
            </UTooltip>
          </div>
          <div
            data-release-card-summary
            class="mt-2 flex min-w-0 items-center gap-2 overflow-x-auto"
          >
            <TicketHierarchyBadges
              mode="links"
              truncate-labels
              class="pointer-events-auto w-max shrink-0"
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
            <p
              v-if="
                !project.project.archivedAt && !project.clientArchivedAt && !item.release.archivedAt
              "
              data-release-card-counts
              class="flex shrink-0 items-center gap-1 text-xs text-muted"
            >
              <EntityIcon kind="tickets" />
              {{ item.doneTicketCount }} / {{ item.ticketCount }} done
            </p>
          </div>
          <div
            v-if="
              !project.project.archivedAt && !project.clientArchivedAt && !item.release.archivedAt
            "
            data-release-card-progress
            class="mt-1 flex items-center gap-2"
          >
            <UProgress
              class="min-w-0 flex-1"
              :model-value="item.doneTicketCount"
              :max="Math.max(item.ticketCount, 1)"
              color="success"
              size="sm"
              :get-value-label="() => `${item.release.name} completion`"
              :get-value-text="
                () => releaseProgressText(item.release.name, item.doneTicketCount, item.ticketCount)
              "
            />
            <span class="shrink-0 text-xs text-muted"
              >{{ releaseProgressPercent(item.doneTicketCount, item.ticketCount) }}%</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
