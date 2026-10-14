<script setup lang="ts">
import { modalFormShortcutContent } from '~/composables/modal-form-shortcuts'
import { trackAppApiFetch } from '~/composables/useAppDataInvalidation'
import { useEntityDetailContext } from '~/composables/useEntityDetailContext'
import { inlineNameField, useInlineEntityFields } from '~/composables/useInlineEntityFields'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { id, archived } = useEntityDetailContext()
const endpoint = `/api/clients/${id}`
const clientKey = computed(
  () => `app-api:clients:detail:${id}:${archived.value ? 'archived' : 'active'}`,
)
const {
  data: clientData,
  error: clientError,
  refresh: refreshClient,
} = await trackAppApiFetch(
  useApiFetch(`/api/clients/${id}`, {
    key: clientKey,
    query: computed(() => ({ archived: archived.value ? 'true' : undefined })),
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
const nameDraft = ref(client.value?.name ?? '')
const colorDraft = ref(client.value?.color ?? '#64748b')
const inlineFields = useInlineEntityFields({
  resource: 'client',
  entityName: 'client',
  getEntity: () => client.value,
  endpoint: () => endpoint,
  fields: {
    name: inlineNameField<NonNullable<typeof client.value>>(
      nameDraft,
      (entity) => entity.name,
      'Client name saved.',
    ),
    color: {
      draft: colorDraft,
      read: (entity) => entity.color,
      toPatch: (value) => ({ color: value }),
      successTitle: 'Client color saved.',
    },
  },
  applyPatch: (patch) => {
    if (clientData.value) Object.assign(clientData.value, patch)
  },
  archivePath: (shouldArchive) => `/clients/${id}${shouldArchive ? '?archived=true' : ''}`,
})
const {
  actionNeedsRefresh,
  changeArchive,
  fieldErrors,
  invalidateMutation,
  lifecycleError,
  pendingField,
  reportWrite,
  retryRefresh,
  saveField,
} = inlineFields
const nameColorFieldState = computed(() => ({
  entityLabel: 'Client' as const,
  errors: fieldErrors.value,
  pendingField: pendingField.value,
  blocked: actionNeedsRefresh.value,
}))
const projectCreateOpen = ref(false)
let colorSaveTimer: ReturnType<typeof setTimeout> | undefined

if (clientError.value && clientFailureStatus(clientError.value) === 404)
  throw createError({ statusCode: 404, statusMessage: 'Client not found' })
if (!client.value && !clientError.value)
  throw createError({ statusCode: 404, statusMessage: 'Client not found' })

watch(colorDraft, (value) => {
  if (!client.value || value === client.value.color || actionNeedsRefresh.value) return
  if (colorSaveTimer) clearTimeout(colorSaveTimer)
  colorSaveTimer = setTimeout(() => void saveField('color', value), 250)
})
onBeforeUnmount(() => {
  if (colorSaveTimer) clearTimeout(colorSaveTimer)
})

async function remove() {
  if (
    !client.value?.archivedAt ||
    pendingField.value ||
    actionNeedsRefresh.value ||
    !confirm('Permanently delete this archived client?')
  )
    return
  pendingField.value = 'delete'
  lifecycleError.value = ''
  try {
    const result = await runClientRequest<unknown>((signal) =>
      $fetch<unknown>(endpoint, { method: 'DELETE', signal }),
    )
    if (result._tag === 'Failure') {
      lifecycleError.value = result.failure.userMessage
      return
    }
    const refreshed = await invalidateMutation('client', { refreshActive: false })
    reportWrite(refreshed, { title: 'Client deleted.' })
    await navigateTo('/clients')
  } finally {
    pendingField.value = null
  }
}

async function projectCreated(projectId: string) {
  projectCreateOpen.value = false
  const refreshed = await invalidateMutation('project')
  reportWrite(refreshed, {
    title: 'Project created.',
    duration: 10_000,
    open: { label: 'Open project', to: `/projects/${projectId}` },
  })
}

async function retryProjectList() {
  await runClientEffect(refreshEffect(refreshProjects, () => projectsError.value))
}
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
          v-if="!client.archivedAt"
          color="neutral"
          variant="outline"
          icon="lucide:archive"
          label="Archive client"
          :loading="pendingField === 'archive'"
          :disabled="!!pendingField || actionNeedsRefresh"
          @click="changeArchive(true)"
        />
        <template v-else>
          <UButton
            color="neutral"
            variant="outline"
            icon="lucide:archive-restore"
            label="Restore client"
            :loading="pendingField === 'archive'"
            :disabled="!!pendingField || actionNeedsRefresh"
            @click="changeArchive(false)"
          />
          <UButton
            color="error"
            variant="ghost"
            icon="lucide:trash-2"
            label="Permanently delete"
            :loading="pendingField === 'delete'"
            :disabled="!!pendingField || actionNeedsRefresh"
            @click="remove"
          />
        </template>
        <UModal
          v-model:open="projectCreateOpen"
          title="New project"
          description="Create a project under a client. You can change the selected client."
          :content="modalFormShortcutContent()"
        >
          <UButton icon="lucide:plus" label="New project" />
          <template #body>
            <ProjectCreateForm
              :initial-client-id="id"
              @created="projectCreated"
              @cancel="projectCreateOpen = false"
            />
          </template>
        </UModal>
      </div>
    </div>

    <HierarchyNameColorDetailSections
      v-model:name="nameDraft"
      v-model:color="colorDraft"
      :state="nameColorFieldState"
      @save-name="saveField('name', nameDraft)"
    >
      <template #feedback>
        <div v-if="lifecycleError || actionNeedsRefresh" class="space-y-2">
          <UAlert
            v-if="lifecycleError"
            role="alert"
            color="error"
            :title="actionNeedsRefresh ? 'Client saved; refresh failed' : 'Could not update client'"
            :description="lifecycleError"
          />
          <UButton
            v-if="actionNeedsRefresh"
            color="neutral"
            variant="outline"
            icon="lucide:refresh-cw"
            label="Retry loading client data"
            :loading="pendingField === 'refresh'"
            :disabled="!!pendingField"
            @click="retryRefresh"
          />
        </div>
        <div v-if="clientError && !actionNeedsRefresh" class="space-y-2">
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
      </template>
      <template #items>
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
            @click="retryProjectList"
          />
        </div>
        <UCard v-else-if="!projects.length">
          <h2 class="font-medium text-highlighted">No projects yet</h2>
          <p class="mt-2 text-muted">Add a project to start planning releases.</p>
        </UCard>
        <div v-else class="grid grid-cols-2 gap-2">
          <ProjectCard v-for="item in projects" :key="item.project.id" :item="item" />
        </div>
      </template>
    </HierarchyNameColorDetailSections>
  </div>
  <UCard v-else-if="clientError" class="space-y-2">
    <UAlert
      role="alert"
      color="error"
      :title="actionNeedsRefresh ? 'Client saved; refresh failed' : 'Could not load client'"
      :description="actionNeedsRefresh ? lifecycleError : clientFailureMessage(clientError)"
    />
    <UButton
      color="neutral"
      variant="outline"
      icon="lucide:refresh-cw"
      :label="actionNeedsRefresh ? 'Retry loading client data' : 'Retry loading client'"
      :loading="pendingField === 'refresh'"
      :disabled="!!pendingField"
      @click="actionNeedsRefresh ? retryRefresh() : refreshClient()"
    />
  </UCard>
</template>
