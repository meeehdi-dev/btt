<script setup lang="ts">
import { trackAppApiFetch } from '~/composables/useAppDataInvalidation'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const id = route.params.id as string
const archived = route.query.archived === 'true'
const clientKey = `app-api:clients:detail:${id}:${archived ? 'archived' : 'active'}`
const {
  data: clientData,
  error: clientError,
  refresh: refreshClient,
} = await trackAppApiFetch(
  useApiFetch(`/api/clients/${id}`, {
    key: clientKey,
    query: { archived: archived ? 'true' : undefined },
  }),
  { key: clientKey, resources: ['clients', 'hierarchy'] },
)
const client = computed(() => clientData.value)
const {
  data: projectData,
  error: projectsError,
  refresh: refreshProjects,
} = await trackAppApiFetch(
  useApiFetch('/api/projects', {
    key: 'app-api:projects:list:archived',
    query: { archived: 'true' },
  }),
  { key: 'app-api:projects:list:archived', resources: ['projects', 'hierarchy'] },
)
const projects = computed(() =>
  (projectData.value?.projects ?? []).filter((item) => item.project.clientId === id),
)

if (clientError.value && clientFailureStatus(clientError.value) === 404)
  throw createError({ statusCode: 404, statusMessage: 'Client not found' })
if (!client.value && !clientError.value)
  throw createError({ statusCode: 404, statusMessage: 'Client not found' })
</script>

<template>
  <div v-if="client" class="space-y-4">
    <div class="flex items-end justify-between gap-2">
      <div class="flex min-w-0 flex-wrap items-center gap-2">
        <span
          class="size-4 shrink-0 rounded-full border border-default"
          :style="{ backgroundColor: client.color }"
        />
        <h1 class="flex items-center gap-2 text-3xl font-semibold text-highlighted">
          <EntityIcon kind="clients" />{{ client.name }}
        </h1>
        <UBadge v-if="client.archivedAt" color="neutral" variant="subtle">Archived</UBadge>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          :to="`/clients/${id}/edit${client.archivedAt ? '?archived=true' : ''}`"
          color="neutral"
          variant="outline"
          icon="lucide:pencil"
          label="Edit client"
        />
        <UButton :to="`/projects/new?client=${id}`" icon="lucide:plus" label="New project" />
      </div>
    </div>
    <div v-if="clientError" class="space-y-2">
      <UAlert
        role="alert"
        color="error"
        title="Could not refresh client"
        :description="clientFailureMessage(clientError)"
      />
      <UButton
        color="neutral"
        variant="outline"
        icon="lucide:refresh-cw"
        label="Retry loading client"
        @click="refreshClient()"
      />
    </div>
    <div v-if="projectsError" class="space-y-2">
      <UAlert
        role="alert"
        color="error"
        title="Could not load projects"
        :description="clientFailureMessage(projectsError)"
      />
      <UButton
        color="neutral"
        variant="outline"
        icon="lucide:refresh-cw"
        label="Retry loading projects"
        @click="refreshProjects()"
      />
    </div>
    <UCard v-else-if="!projects.length">
      <h2 class="font-medium text-highlighted">No projects yet</h2>
      <p class="mt-2 text-muted">Add a project to start planning releases.</p>
    </UCard>
    <div v-else class="grid grid-cols-2 gap-2">
      <ProjectCard v-for="item in projects" :key="item.project.id" :item="item" />
    </div>
  </div>
  <UCard v-else-if="clientError" class="space-y-2">
    <UAlert
      role="alert"
      color="error"
      title="Could not load client"
      :description="clientFailureMessage(clientError)"
    />
    <UButton
      color="neutral"
      variant="outline"
      icon="lucide:refresh-cw"
      label="Retry loading client"
      @click="refreshClient()"
    />
  </UCard>
</template>
