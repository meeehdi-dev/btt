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
    <h1 class="sr-only">Projects</h1>
    <div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
      <ArchiveFilterButton v-model="showArchived" />
      <UButton to="/projects/new" icon="lucide:plus" label="New project" />
    </div>
    <UButton
      v-if="error"
      color="error"
      variant="ghost"
      icon="lucide:refresh-cw"
      label="Retry"
      @click="refresh()"
    />
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
        class="group relative rounded-lg border border-default bg-elevated p-5 transition hover:border-primary focus-within:border-primary"
      >
        <NuxtLink
          :to="`/projects/${item.project.id}${item.project.archivedAt ? '?archived=true' : ''}`"
          :aria-label="`Open project ${item.project.name}`"
          class="absolute inset-0 rounded-lg focus-visible:outline-2 focus-visible:outline-primary"
        />
        <div class="flex items-start justify-between gap-3">
          <span
            class="inline-flex items-center gap-2 font-medium text-highlighted group-hover:text-primary"
          >
            <span class="size-3 rounded-full" :style="{ backgroundColor: item.project.color }" />
            <EntityIcon kind="projects" />{{ item.project.name }}
          </span>
          <UBadge v-if="item.project.archivedAt" color="neutral" variant="subtle">Archived</UBadge>
        </div>
        <NuxtLink
          :to="`/clients/${item.project.clientId}`"
          class="relative z-10 mt-2 inline-flex items-center gap-1 text-sm text-muted hover:text-primary"
          ><EntityIcon kind="clients" />{{ item.clientName }}</NuxtLink
        >
      </div>
    </div>
  </div>
</template>
