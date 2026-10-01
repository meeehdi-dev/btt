<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const {
  data: projectData,
  pending: projectsPending,
  error: projectsError,
  refresh: refreshProjects,
} = await useApiFetch('/api/projects')
const projects = computed(() => projectData.value?.projects ?? [])
const projectSearchInput = useSelectSearchInput('Search projects…')
const projectPickerOpen = ref(false)
const projectId = ref(typeof route.query.project === 'string' ? route.query.project : '')
const name = ref('')
const targetDate = ref('')
const pending = ref(false)
const errorMessage = ref('')

watch(
  projects,
  (available) => {
    if (!available.some((project) => project.project.id === projectId.value)) projectId.value = ''
  },
  { immediate: true },
)

const selectedProject = computed(() =>
  projects.value.find((project) => project.project.id === projectId.value),
)
function selectProject(id: string) {
  projectId.value = id
  projectPickerOpen.value = false
}
const canSubmit = computed(() =>
  projects.value.some((project) => project.project.id === projectId.value),
)
const cancelTo = computed(() =>
  selectedProject.value
    ? `/projects/${selectedProject.value.project.id}${selectedProject.value.project.archivedAt || selectedProject.value.clientArchivedAt ? '?archived=true' : ''}`
    : '/clients',
)

async function submit() {
  pending.value = true
  errorMessage.value = ''
  try {
    const result = await runClientRequest((signal) =>
      $fetch<{ id: string }>('/api/releases', {
        method: 'POST',
        body: {
          projectId: projectId.value,
          name: name.value,
          targetDate: targetDate.value || null,
        },
        signal,
      }),
    )
    if (result._tag === 'Failure') {
      errorMessage.value = result.failure.userMessage
      return
    }
    await navigateTo(`/releases/${result.value.id}`)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="w-full space-y-6">
    <div>
      <HierarchyBreadcrumbs
        v-if="selectedProject"
        :ancestors="[
          {
            kind: 'clients',
            label: selectedProject.clientName,
            to: `/clients/${selectedProject.project.clientId}${selectedProject.clientArchivedAt ? '?archived=true' : ''}`,
          },
          {
            kind: 'projects',
            label: selectedProject.project.name,
            to: `/projects/${selectedProject.project.id}${selectedProject.project.archivedAt || selectedProject.clientArchivedAt ? '?archived=true' : ''}`,
          },
        ]"
        :current="{ kind: 'releases', label: 'New release' }"
      />
      <template v-else>
        <NuxtLink to="/clients" class="inline-flex items-center gap-1 text-sm text-primary"
          >← <EntityIcon kind="clients" />Clients</NuxtLink
        >
        <h1 class="mt-3 flex items-center gap-2 text-3xl font-semibold text-highlighted">
          <EntityIcon kind="releases" />New release
        </h1>
      </template>
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
    <UCard v-else-if="projectsPending">
      <p class="text-muted">Loading available projects…</p>
    </UCard>
    <UCard v-else-if="!projects.length">
      <h2 class="font-medium text-highlighted">Create a project first</h2>
      <p class="mt-2 text-muted">Releases must belong to an active project.</p>
      <UButton class="mt-4" to="/clients" icon="lucide:users" label="Go to clients" />
    </UCard>
    <UCard v-else>
      <form class="space-y-5" @submit.prevent="submit">
        <UFormField label="Project" required>
          <USelectMenu
            :model-value="projectId"
            v-model:open="projectPickerOpen"
            value-key="value"
            :items="
              projects.map((project) => ({
                label: `${project.clientName} · ${project.project.name}`,
                value: project.project.id,
              }))
            "
            :search-input="projectSearchInput"
            aria-label="Project"
            class="w-full"
            placeholder="Choose a project"
            @update:model-value="selectProject"
          />
        </UFormField>
        <UFormField label="Name" required>
          <UInput v-model="name" class="w-full" placeholder="Q4 launch" />
        </UFormField>
        <UFormField label="Target date" hint="Optional">
          <UInput v-model="targetDate" type="date" class="w-full" />
        </UFormField>
        <UAlert v-if="errorMessage" role="alert" color="error" title="Could not create release">{{
          errorMessage
        }}</UAlert>
        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <UButton :to="cancelTo" color="neutral" variant="ghost" icon="lucide:x" label="Cancel" />
          <UButton
            type="submit"
            :disabled="!canSubmit"
            :loading="pending"
            icon="lucide:plus"
            label="Create release"
          />
        </div>
      </form>
    </UCard>
  </div>
</template>
