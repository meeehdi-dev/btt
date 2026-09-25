<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const showArchived = ref(false)
const { data, pending, error, refresh } = await useFetch('/api/projects', {
  query: computed(() => ({ archived: showArchived.value ? 'true' : undefined })),
})
const projects = computed(() => data.value?.projects ?? [])
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-medium text-primary">Workspace</p>
        <h1 class="mt-2 flex items-center gap-2 text-3xl font-semibold text-highlighted">
          <EntityIcon kind="projects" />Projects
        </h1>
        <p class="mt-3 max-w-2xl text-muted">Projects group releases into deliverable work.</p>
      </div>
      <div class="flex items-center gap-2">
        <ArchiveFilterButton v-model="showArchived" />
        <UButton to="/projects/new" icon="lucide:plus" label="New project" />
      </div>
    </div>
    <UButton v-if="error" color="error" variant="ghost" label="Retry" @click="refresh()" />
    <UCard v-if="pending"><p class="text-muted">Loading projects…</p></UCard>
    <UCard v-else-if="!projects.length"
      ><h2 class="font-medium text-highlighted">
        No {{ showArchived ? '' : 'active ' }}projects yet
      </h2>
      <p class="mt-2 text-muted">Create a project from a client.</p></UCard
    >
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="item in projects"
        :key="item.project.id"
        class="rounded-lg border border-default bg-elevated p-5"
      >
        <div class="flex items-start justify-between gap-3">
          <NuxtLink
            :to="`/projects/${item.project.id}${item.project.archivedAt ? '?archived=true' : ''}`"
            class="inline-flex items-center gap-2 font-medium text-highlighted hover:text-primary"
          >
            <span class="size-3 rounded-full" :style="{ backgroundColor: item.project.color }" />
            <EntityIcon kind="projects" />{{ item.project.name }}
          </NuxtLink>
          <UBadge v-if="item.project.archivedAt" color="neutral" variant="subtle">Archived</UBadge>
        </div>
        <NuxtLink
          :to="`/clients/${item.project.clientId}`"
          class="mt-2 inline-flex items-center gap-1 text-sm text-muted hover:text-primary"
          ><EntityIcon kind="clients" />{{ item.clientName }}</NuxtLink
        >
      </div>
    </div>
  </div>
</template>
