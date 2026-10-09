<script setup lang="ts">
import { trackAppApiFetch, useAppDataInvalidation } from '~/composables/useAppDataInvalidation'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const route = useRoute()
const id = route.params.id as string
const endpoint: string = '/api/releases/' + id
const { invalidateMutation } = useAppDataInvalidation()
const releaseKey = `app-api:releases:detail:${id}:archived`
const {
  data: release,
  error: releaseError,
  refresh: refreshRelease,
} = await trackAppApiFetch(
  useApiFetch(`/api/releases/${id}`, { key: releaseKey, query: { archived: 'true' } }),
  { key: releaseKey, resources: ['releases', 'hierarchy'] },
)
if (releaseError.value && clientFailureStatus(releaseError.value) === 404)
  throw createError({ statusCode: 404, statusMessage: 'Release not found' })
if (!release.value && !releaseError.value)
  throw createError({ statusCode: 404, statusMessage: 'Release not found' })
const name = ref(release.value?.release.name ?? '')
const targetDate = ref(release.value?.release.targetDate ?? '')
const archived = ref(Boolean(release.value?.release.archivedAt))
const parentProjectPath = computed(() =>
  release.value
    ? `/projects/${release.value.release.projectId}${release.value.projectArchivedAt || release.value.clientArchivedAt ? '?archived=true' : ''}`
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
        body: { name: name.value, targetDate: targetDate.value || null, archived: archived.value },
        signal,
      }),
    )
    if (result._tag === 'Failure') {
      errorMessage.value = result.failure.userMessage
      return
    }
    await invalidateMutation('release')
    await navigateTo(`/releases/${id}${archived.value ? '?archived=true' : ''}`)
  } finally {
    pending.value = false
  }
}
async function remove() {
  if (pending.value || !confirm('Permanently delete this archived release?')) return
  const projectPath = parentProjectPath.value
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
    await invalidateMutation('release')
    await navigateTo(projectPath)
  } finally {
    pending.value = false
  }
}
</script>
<template>
  <div v-if="release" class="w-full space-y-4">
    <HierarchyBreadcrumbs
      :ancestors="[
        {
          kind: 'clients',
          label: release.clientName,
          to: `/clients/${release.clientId}${release.clientArchivedAt ? '?archived=true' : ''}`,
        },
        {
          kind: 'projects',
          label: release.projectName,
          to: `/projects/${release.release.projectId}${release.projectArchivedAt || release.clientArchivedAt ? '?archived=true' : ''}`,
        },
        {
          kind: 'releases',
          label: release.release.name,
          to: `/releases/${id}${release.release.archivedAt || release.projectArchivedAt || release.clientArchivedAt ? '?archived=true' : ''}`,
        },
      ]"
      :current="{ kind: 'releases', label: 'Edit release' }"
    />
    <div v-if="releaseError" class="space-y-2">
      <UAlert
        role="alert"
        color="error"
        title="Could not refresh release"
        :description="clientFailureMessage(releaseError)"
      />
      <UButton
        color="neutral"
        variant="outline"
        icon="lucide:refresh-cw"
        label="Retry loading release"
        @click="refreshRelease()"
      />
    </div>
    <UCard
      ><form class="space-y-3" @submit.prevent="save">
        <UFormField label="Name" required><UInput v-model="name" class="w-full" /></UFormField
        ><UFormField label="Target date" hint="Optional"
          ><UInput v-model="targetDate" type="date" class="w-full" /></UFormField
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
              :to="`/releases/${id}${archived ? '?archived=true' : ''}`"
              color="neutral"
              variant="ghost"
              icon="lucide:x"
              label="Cancel"
            /><UButton type="submit" :loading="pending" icon="lucide:save" label="Save changes" />
          </div>
        </div></form
    ></UCard>
  </div>
  <UCard v-else-if="releaseError" class="space-y-2">
    <UAlert
      role="alert"
      color="error"
      title="Could not load release"
      :description="clientFailureMessage(releaseError)"
    />
    <UButton
      color="neutral"
      variant="outline"
      icon="lucide:refresh-cw"
      label="Retry loading release"
      @click="refreshRelease()"
    />
  </UCard>
</template>
