<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const {
  data: projectData,
  pending: projectsPending,
  error: projectsError,
} = await useFetch('/api/projects')
const projects = computed(() => projectData.value?.projects ?? [])
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

const canSubmit = computed(() =>
  projects.value.some((project) => project.project.id === projectId.value),
)

async function submit() {
  pending.value = true
  errorMessage.value = ''
  try {
    const release = await $fetch<{ id: string }>('/api/releases', {
      method: 'POST',
      body: { projectId: projectId.value, name: name.value, targetDate: targetDate.value || null },
    })
    await navigateTo(`/releases/${release.id}`)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to create release.'
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6">
    <div>
      <NuxtLink to="/projects" class="text-sm text-primary">← Projects</NuxtLink>
      <h1 class="mt-3 text-3xl font-semibold text-highlighted">New release</h1>
    </div>
    <UAlert v-if="projectsError" color="error" title="Could not load projects">
      Try again or return to the projects page before creating a release.
    </UAlert>
    <UCard v-else-if="projectsPending">
      <p class="text-muted">Loading available projects…</p>
    </UCard>
    <UCard v-else-if="!projects.length">
      <h2 class="font-medium text-highlighted">Create a project first</h2>
      <p class="mt-2 text-muted">Releases must belong to an active project.</p>
      <UButton class="mt-4" to="/projects/new" label="Create project" />
    </UCard>
    <UCard v-else>
      <form class="space-y-5" @submit.prevent="submit">
        <UFormField label="Project" required>
          <USelect
            v-model="projectId"
            :items="
              projects.map((project) => ({
                label: `${project.clientName} · ${project.project.name}`,
                value: project.project.id,
              }))
            "
            class="w-full"
            placeholder="Choose a project"
          />
        </UFormField>
        <UFormField label="Name" required>
          <UInput v-model="name" class="w-full" placeholder="Q4 launch" />
        </UFormField>
        <UFormField label="Target date" hint="Optional">
          <UInput v-model="targetDate" type="date" class="w-full" />
        </UFormField>
        <UAlert v-if="errorMessage" color="error" title="Could not create release">{{
          errorMessage
        }}</UAlert>
        <div class="flex justify-end gap-3">
          <UButton to="/projects" color="neutral" variant="ghost" label="Cancel" />
          <UButton type="submit" :disabled="!canSubmit" :loading="pending" label="Create release" />
        </div>
      </form>
    </UCard>
  </div>
</template>
