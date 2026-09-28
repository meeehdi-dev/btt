<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const route = useRoute()
const id = route.params.id as string
const endpoint: string = '/api/projects/' + id
const {
  data: project,
  error: projectError,
  refresh: refreshProject,
} = await useApiFetch(`/api/projects/${id}`, { query: { archived: 'true' } })
if (projectError.value && clientFailureStatus(projectError.value) === 404)
  throw createError({ statusCode: 404, statusMessage: 'Project not found' })
if (!project.value && !projectError.value)
  throw createError({ statusCode: 404, statusMessage: 'Project not found' })
const name = ref(project.value?.project.name ?? '')
const color = ref(project.value?.project.color ?? '#3b82f6')
const archived = ref(Boolean(project.value?.project.archivedAt))
const pending = ref(false)
const errorMessage = ref('')
async function save() {
  pending.value = true
  errorMessage.value = ''
  try {
    const result = await runClientRequest((signal) =>
      $fetch<unknown>(endpoint, {
        method: 'PATCH',
        body: { name: name.value, color: color.value, archived: archived.value },
        signal,
      }),
    )
    if (result._tag === 'Failure') {
      errorMessage.value = result.failure.userMessage
      return
    }
    await navigateTo(`/projects/${id}${archived.value ? '?archived=true' : ''}`)
  } finally {
    pending.value = false
  }
}
async function remove() {
  if (pending.value || !confirm('Permanently delete this archived project?')) return
  pending.value = true
  errorMessage.value = ''
  try {
    const result = await runClientRequest((signal) =>
      $fetch<unknown>(endpoint, { method: 'DELETE', signal }),
    )
    if (result._tag === 'Failure') {
      errorMessage.value = result.failure.userMessage
      return
    }
    await navigateTo('/projects')
  } finally {
    pending.value = false
  }
}
</script>
<template>
  <div v-if="project" class="w-full space-y-6">
    <HierarchyBreadcrumbs
      :ancestors="[
        {
          kind: 'clients',
          label: project.clientName,
          to: `/clients/${project.project.clientId}${project.clientArchivedAt ? '?archived=true' : ''}`,
        },
        {
          kind: 'projects',
          label: project.project.name,
          to: `/projects/${id}${project.project.archivedAt || project.clientArchivedAt ? '?archived=true' : ''}`,
        },
      ]"
      :current="{ kind: 'projects', label: 'Edit project' }"
    />
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
    <UCard
      ><form class="space-y-5" @submit.prevent="save">
        <UFormField label="Name" required><UInput v-model="name" class="w-full" /></UFormField
        ><UFormField label="Color" required><ColorSelector v-model="color" /></UFormField
        ><UCheckbox v-model="archived" label="Archived" /><UAlert
          v-if="errorMessage"
          role="alert"
          color="error"
          title="Could not save changes"
          >{{ errorMessage }}</UAlert
        >
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <UButton
            v-if="archived"
            color="error"
            variant="ghost"
            icon="lucide:trash-2"
            label="Permanently delete"
            class="w-full sm:w-auto"
            @click="remove"
          />
          <div class="flex flex-col gap-2 sm:ml-auto sm:flex-row">
            <UButton
              :to="`/projects/${id}${archived ? '?archived=true' : ''}`"
              color="neutral"
              variant="ghost"
              icon="lucide:x"
              label="Cancel"
              class="w-full sm:w-auto"
            /><UButton
              type="submit"
              :loading="pending"
              icon="lucide:save"
              label="Save changes"
              class="w-full sm:w-auto"
            />
          </div>
        </div></form
    ></UCard>
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
