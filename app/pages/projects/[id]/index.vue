<script setup lang="ts">
import { modalFormShortcutContent } from '~/composables/modal-form-shortcuts'
import { trackAppApiFetch } from '~/composables/useAppDataInvalidation'
import { useEntityDetailContext } from '~/composables/useEntityDetailContext'
import { inlineNameField, useInlineEntityFields } from '~/composables/useInlineEntityFields'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { id, archived } = useEntityDetailContext()
const showArchived = ref(archived.value)
const projectKey = computed(
  () => `app-api:projects:detail:${id}:${archived.value ? 'archived' : 'active'}`,
)
const releaseCreateOpen = ref(false)
const {
  data: projectData,
  error: projectError,
  refresh: refreshProject,
} = await trackAppApiFetch(
  useApiFetch(`/api/projects/${id}`, {
    key: projectKey,
    query: computed(() => ({ archived: archived.value ? 'true' : undefined })),
  }),
  { key: projectKey, resources: ['projects', 'hierarchy'] },
)
const project = computed(() => projectData.value)
const nameDraft = ref(project.value?.project.name ?? '')
const colorDraft = ref(project.value?.project.color ?? '#3b82f6')
const inlineFields = useInlineEntityFields({
  resource: 'project',
  entityName: 'project',
  getEntity: () => project.value,
  endpoint: () => `/api/projects/${id}`,
  fields: {
    name: inlineNameField<NonNullable<typeof project.value>>(
      nameDraft,
      (entity) => entity.project.name,
      'Project name saved.',
    ),
    color: {
      draft: colorDraft,
      read: (entity) => entity.project.color,
      toPatch: (value) => ({ color: value }),
      successTitle: 'Project color saved.',
    },
  },
  applyPatch: (patch) => {
    if (projectData.value) Object.assign(projectData.value.project, patch)
  },
  archivePath: (shouldArchive) =>
    `/projects/${id}${shouldArchive || Boolean(project.value?.clientArchivedAt) ? '?archived=true' : ''}`,
  afterArchive: (shouldArchive) => {
    showArchived.value = shouldArchive || Boolean(project.value?.clientArchivedAt)
  },
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
  entityLabel: 'Project' as const,
  errors: fieldErrors.value,
  pendingField: pendingField.value,
  blocked: actionNeedsRefresh.value,
}))
let colorSaveTimer: ReturnType<typeof setTimeout> | undefined
watch(colorDraft, (value) => {
  if (!project.value || value === project.value.project.color || actionNeedsRefresh.value) return
  if (colorSaveTimer) clearTimeout(colorSaveTimer)
  colorSaveTimer = setTimeout(() => void saveField('color', value), 250)
})
watch(archived, (value) => (showArchived.value = value))
onBeforeUnmount(() => {
  if (colorSaveTimer) clearTimeout(colorSaveTimer)
})
const {
  data: releaseData,
  error: releaseError,
  refresh: refreshReleases,
} = await trackAppApiFetch(
  useApiFetch('/api/releases', {
    key: computed(() => `app-api:releases:list:${showArchived.value ? 'archived' : 'active'}`),
    query: computed(() => ({
      archived: showArchived.value ? 'true' : undefined,
    })),
  }),
  {
    key: computed(() => `app-api:releases:list:${showArchived.value ? 'archived' : 'active'}`),
    resources: ['releases', 'hierarchy', 'search'],
  },
)
const releases = computed(() =>
  (releaseData.value?.releases ?? []).filter((item) => item.release.projectId === id),
)

if (projectError.value && clientFailureStatus(projectError.value) === 404)
  throw createError({ statusCode: 404, statusMessage: 'Project not found' })
if (!project.value && !projectError.value)
  throw createError({ statusCode: 404, statusMessage: 'Project not found' })

async function remove() {
  if (
    !project.value?.project.archivedAt ||
    pendingField.value ||
    actionNeedsRefresh.value ||
    !confirm('Permanently delete this archived project?')
  )
    return
  const clientPath = `/clients/${project.value.project.clientId}${project.value.clientArchivedAt ? '?archived=true' : ''}`
  pendingField.value = 'delete'
  lifecycleError.value = ''
  try {
    const result = await runClientRequest<unknown>((signal) =>
      $fetch<unknown>(`/api/projects/${id}`, { method: 'DELETE', signal }),
    )
    if (result._tag === 'Failure') {
      lifecycleError.value = result.failure.userMessage
      return
    }
    const refreshed = await invalidateMutation('project', { refreshActive: false })
    reportWrite(refreshed, { title: 'Project deleted.' })
    await navigateTo(clientPath)
  } finally {
    pendingField.value = null
  }
}
async function releaseCreated(releaseId: string) {
  releaseCreateOpen.value = false
  const refreshed = await invalidateMutation('release')
  reportWrite(refreshed, {
    title: 'Release created.',
    duration: 10_000,
    open: { label: 'Open release', to: `/releases/${releaseId}` },
  })
}

async function retryReleases() {
  await runClientEffect(refreshEffect(refreshReleases, () => releaseError.value))
}

function releaseProgressPercent(doneTicketCount: number, ticketCount: number) {
  return ticketCount ? Math.round((doneTicketCount / ticketCount) * 100) : 0
}

function releaseProgressText(releaseName: string, doneTicketCount: number, ticketCount: number) {
  return `${releaseName}: ${doneTicketCount} of ${ticketCount} active tickets done, ${releaseProgressPercent(doneTicketCount, ticketCount)}% complete`
}
</script>

<template>
  <div v-if="project" class="space-y-4">
    <div class="flex items-end justify-between gap-2">
      <div>
        <HierarchyBreadcrumbs
          :ancestors="[
            {
              kind: 'clients',
              label: project.clientName,
              to: `/clients/${project.project.clientId}${project.clientArchivedAt ? '?archived=true' : ''}`,
            },
          ]"
          :current="{ kind: 'projects', label: project.project.name }"
        >
          <template #current-prefix>
            <span
              class="size-4 shrink-0 rounded-full"
              :style="{ backgroundColor: project.project.color }"
            />
          </template>
          <template #current-suffix>
            <UBadge v-if="project.project.archivedAt" color="neutral" variant="subtle"
              >Archived</UBadge
            >
          </template>
        </HierarchyBreadcrumbs>
      </div>
      <div class="flex items-center gap-2">
        <ArchiveFilterButton v-model="showArchived" />
        <UButton
          v-if="!project.project.archivedAt"
          color="neutral"
          variant="outline"
          icon="lucide:archive"
          label="Archive project"
          :loading="pendingField === 'archive'"
          :disabled="!!pendingField || actionNeedsRefresh"
          @click="changeArchive(true)"
        />
        <template v-else>
          <UButton
            color="neutral"
            variant="outline"
            icon="lucide:archive-restore"
            label="Restore project"
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
          v-if="!project.clientArchivedAt && !project.project.archivedAt"
          v-model:open="releaseCreateOpen"
          title="New release"
          description="Create a release under a project. You can change the selected project."
          :content="modalFormShortcutContent()"
        >
          <UButton icon="lucide:plus" label="New release" />
          <template #body>
            <ReleaseCreateForm
              :initial-project-id="id"
              @created="releaseCreated"
              @cancel="releaseCreateOpen = false"
              @create-parent="navigateTo('/clients')"
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
            :title="
              actionNeedsRefresh ? 'Project saved; refresh failed' : 'Could not update project'
            "
            :description="lifecycleError"
          />
          <UButton
            v-if="actionNeedsRefresh"
            color="neutral"
            variant="outline"
            icon="lucide:refresh-cw"
            label="Retry loading project data"
            :loading="pendingField === 'refresh'"
            :disabled="!!pendingField"
            @click="retryRefresh"
          />
        </div>
        <div v-if="projectError && !actionNeedsRefresh" class="space-y-2">
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
      </template>
      <template #items>
        <div v-if="releaseError" class="space-y-2">
          <UAlert
            v-if="releaseError"
            role="alert"
            color="error"
            title="Could not load releases"
            :description="clientFailureMessage(releaseError)"
          />
          <UButton
            color="neutral"
            variant="outline"
            icon="lucide:refresh-cw"
            label="Retry loading releases"
            @click="retryReleases()"
          />
        </div>
        <UCard v-if="!releases.length && !releaseError">
          <h2 class="font-medium text-highlighted">
            No {{ showArchived ? '' : 'active ' }}releases yet
          </h2>
          <p class="mt-2 text-muted">Add a release to organize tickets later.</p>
        </UCard>
        <div v-else-if="releases.length" class="grid grid-cols-2 gap-2">
          <EntityCard
            v-for="item in releases"
            :key="item.release.id"
            :data-release-card-id="item.release.id"
            class="cursor-pointer"
          >
            <template #navigation>
              <NuxtLink
                :to="`/releases/${item.release.id}${item.release.archivedAt ? '?archived=true' : ''}`"
                :aria-label="`Open release ${item.release.name}`"
                class="absolute inset-0 z-0 rounded-lg focus-visible:outline-2 focus-visible:outline-primary"
              />
            </template>
            <template #heading>
              <div data-release-card-heading class="flex min-w-0 items-center gap-2">
                <h2
                  class="inline-flex min-w-0 items-center gap-1 font-medium text-highlighted"
                  :title="item.release.name"
                >
                  <EntityIcon kind="releases" /><span class="truncate">{{
                    item.release.name
                  }}</span>
                </h2>
                <UBadge v-if="item.release.archivedAt" color="neutral" variant="subtle"
                  >Archived</UBadge
                >
              </div>
            </template>
            <template #context>
              <div
                data-release-card-summary
                class="flex min-w-0 max-w-full flex-wrap items-center gap-2"
              >
                <TicketHierarchyBadges
                  mode="links"
                  truncate-labels
                  class="pointer-events-auto relative z-10 max-w-full"
                  :items="[
                    {
                      kind: 'client',
                      id: project.project.clientId,
                      name: project.clientName,
                      to: `/clients/${project.project.clientId}${project.clientArchivedAt ? '?archived=true' : ''}`,
                    },
                    {
                      kind: 'project',
                      id: project.project.id,
                      name: project.project.name,
                      to: `/projects/${project.project.id}${project.project.archivedAt ? '?archived=true' : ''}`,
                    },
                  ]"
                  aria-label="Release hierarchy"
                />
                <div
                  v-if="
                    !project.project.archivedAt &&
                    !project.clientArchivedAt &&
                    !item.release.archivedAt
                  "
                  data-release-card-metrics
                  class="flex h-6 shrink-0 items-center gap-1 rounded-md bg-default px-2 text-xs text-muted"
                >
                  <EntityIcon kind="tickets" data-release-card-ticket-icon />
                  <span data-release-card-counts
                    >{{ item.doneTicketCount }} / {{ item.ticketCount }}</span
                  >
                  <ProgressRing
                    data-release-card-progress
                    :value="item.doneTicketCount"
                    :max="item.ticketCount"
                    :label="`${item.release.name} completion`"
                    :value-text="
                      releaseProgressText(item.release.name, item.doneTicketCount, item.ticketCount)
                    "
                  />
                </div>
              </div>
            </template>
          </EntityCard>
        </div>
      </template>
    </HierarchyNameColorDetailSections>
  </div>
  <UCard v-else-if="projectError" class="space-y-2">
    <UAlert
      role="alert"
      color="error"
      :title="actionNeedsRefresh ? 'Project saved; refresh failed' : 'Could not load project'"
      :description="actionNeedsRefresh ? lifecycleError : clientFailureMessage(projectError)"
    />
    <UButton
      color="neutral"
      variant="outline"
      icon="lucide:refresh-cw"
      :label="actionNeedsRefresh ? 'Retry loading project data' : 'Retry loading project'"
      :loading="pendingField === 'refresh'"
      :disabled="!!pendingField"
      @click="actionNeedsRefresh ? retryRefresh() : refreshProject()"
    />
  </UCard>
</template>
