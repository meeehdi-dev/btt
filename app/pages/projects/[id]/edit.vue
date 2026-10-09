<script setup lang="ts">
import { trackAppApiFetch, useAppDataInvalidation } from '~/composables/useAppDataInvalidation'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const route = useRoute()
const id = route.params.id as string
const endpoint: string = '/api/projects/' + id
const { invalidateMutation } = useAppDataInvalidation()
const projectKey = `app-api:projects:detail:${id}:archived`
const {
  data: project,
  error: projectError,
  refresh: refreshProject,
} = await trackAppApiFetch(
  useApiFetch(`/api/projects/${id}`, {
    key: projectKey,
    query: { archived: 'true' },
  }),
  { key: projectKey, resources: ['projects', 'hierarchy'] },
)
if (projectError.value && clientFailureStatus(projectError.value) === 404)
  throw createError({ statusCode: 404, statusMessage: 'Project not found' })
if (!project.value && !projectError.value)
  throw createError({ statusCode: 404, statusMessage: 'Project not found' })
const name = ref(project.value?.project.name ?? '')
const color = ref(project.value?.project.color ?? '#3b82f6')
const archived = ref(Boolean(project.value?.project.archivedAt))
const parentClientPath = computed(() =>
  project.value
    ? `/clients/${project.value.project.clientId}${project.value.clientArchivedAt ? '?archived=true' : ''}`
    : '/clients',
)
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
    await invalidateMutation('project')
    await navigateTo(`/projects/${id}${archived.value ? '?archived=true' : ''}`)
  } finally {
    pending.value = false
  }
}
async function remove() {
  if (pending.value || !confirm('Permanently delete this archived project?')) return
  const clientPath = parentClientPath.value
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
    await invalidateMutation('project')
    await navigateTo(clientPath)
  } finally {
    pending.value = false
  }
}
</script>
<template>
  <div v-if="project" class="w-full space-y-4">
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
    <UCard
      ><form class="space-y-3" @submit.prevent="save">
        <UFormField label="Name" required><UInput v-model="name" class="w-full" /></UFormField
        ><UFormField label="Color" required><ColorSelector v-model="color" /></UFormField
        ><UCheckbox v-model="archived" label="Archived" /><UAlert
          v-if="errorMessage"
          role="alert"
          color="error"
          title="Could not save changes"
          >{{ errorMessage }}</UAlert
        >
        <div class="flex items-center justify-between gap-2">
          <UButton
            v-if="archived"
            color="error"
            variant="ghost"
            icon="lucide:trash-2"
            label="Permanently delete"
            @click="remove"
          />
          <div class="ml-auto flex items-center gap-2">
            <UButton
              :to="`/projects/${id}${archived ? '?archived=true' : ''}`"
              color="neutral"
              variant="ghost"
              icon="lucide:x"
              label="Cancel"
            /><UButton type="submit" :loading="pending" icon="lucide:save" label="Save changes" />
          </div>
        </div></form
    ></UCard>
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
