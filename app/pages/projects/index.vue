<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const showArchived = ref(false)
const { data, pending, error, refresh } = await useApiFetch('/api/projects', {
  query: computed(() => ({ archived: showArchived.value ? 'true' : undefined })),
})
const projects = computed(() => data.value?.projects ?? [])
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <h1 class="text-2xl font-semibold text-highlighted">Projects</h1>
      <div class="flex flex-col gap-2 sm:flex-row">
        <ArchiveFilterButton v-model="showArchived" />
        <UButton to="/projects/new" icon="lucide:plus" label="New project" />
      </div>
    </div>
    <UAlert
      v-if="error"
      role="alert"
      color="error"
      title="Could not load projects"
      :description="clientFailureMessage(error)"
    />
    <UButton
      v-if="error"
      color="error"
      variant="ghost"
      icon="lucide:refresh-cw"
      label="Retry"
      @click="refresh()"
    />
    <UCard v-if="pending"><p class="text-muted">Loading projects…</p></UCard>
    <UCard v-else-if="!error && !projects.length"
      ><h2 class="font-medium text-highlighted">
        No {{ showArchived ? '' : 'active ' }}projects yet
      </h2>
      <p class="mt-2 text-muted">Create a project from a client.</p></UCard
    >
    <div v-else-if="!error" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <ProjectCard v-for="item in projects" :key="item.project.id" :item="item" />
    </div>
  </div>
</template>
