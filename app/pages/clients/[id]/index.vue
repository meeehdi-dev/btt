<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const id = route.params.id as string
const archived = route.query.archived === 'true'
const { data: clientData, error: clientError } = await useFetch(`/api/clients/${id}`, {
  query: { archived: archived ? 'true' : undefined },
})
const client = computed(() => clientData.value!)
const { data: projectData } = await useFetch('/api/projects', { query: { archived: 'true' } })
const projects = computed(() =>
  (projectData.value?.projects ?? []).filter((item) => item.project.clientId === id),
)

if (clientError.value || !client.value) {
  throw createError({ status: 404, statusText: 'Client not found' })
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <NuxtLink to="/clients" class="inline-flex items-center gap-1 text-sm text-primary"
            ><EntityIcon kind="clients" />Clients</NuxtLink
          >
          <UIcon name="lucide:chevron-right" class="size-4 text-muted" aria-hidden="true" />
          <div class="flex min-w-0 flex-wrap items-center gap-3">
            <span
              class="size-4 shrink-0 rounded-full border border-default"
              :style="{ backgroundColor: client.color }"
            />
            <h1 class="flex items-center gap-2 text-3xl font-semibold text-highlighted">
              <EntityIcon kind="clients" />{{ client.name }}
            </h1>
            <UBadge v-if="client.archivedAt" color="neutral" variant="subtle">Archived</UBadge>
          </div>
        </div>
      </div>
      <div class="flex flex-col gap-2 sm:flex-row">
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
    <UCard v-if="!projects.length">
      <h2 class="font-medium text-highlighted">No projects yet</h2>
      <p class="mt-2 text-muted">Add a project to start planning releases.</p>
    </UCard>
    <div v-else class="grid gap-4 sm:grid-cols-2">
      <ProjectCard v-for="item in projects" :key="item.project.id" :item="item" />
    </div>
  </div>
</template>
