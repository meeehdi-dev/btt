<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const route = useRoute()
const id = route.params.id as string
const endpoint: string = '/api/releases/' + id
const {
  data: release,
  error: releaseError,
  refresh: refreshRelease,
} = await useApiFetch(`/api/releases/${id}`, { query: { archived: 'true' } })
if (releaseError.value && clientFailureStatus(releaseError.value) === 404)
  throw createError({ statusCode: 404, statusMessage: 'Release not found' })
if (!release.value && !releaseError.value)
  throw createError({ statusCode: 404, statusMessage: 'Release not found' })
const name = ref(release.value?.release.name ?? '')
const targetDate = ref(release.value?.release.targetDate ?? '')
const archived = ref(Boolean(release.value?.release.archivedAt))
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
    await navigateTo(`/releases/${id}${archived.value ? '?archived=true' : ''}`)
  } finally {
    pending.value = false
  }
}
async function remove() {
  if (pending.value || !confirm('Permanently delete this archived release?')) return
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
  <div v-if="release" class="w-full space-y-6">
    <div>
      <NuxtLink
        :to="`/releases/${id}${archived ? '?archived=true' : ''}`"
        class="inline-flex items-center gap-1 text-sm text-primary"
        >← <EntityIcon kind="releases" />Release</NuxtLink
      >
      <h1 class="mt-3 flex items-center gap-2 text-3xl font-semibold text-highlighted">
        <EntityIcon kind="releases" />Edit release
      </h1>
    </div>
    <div v-if="releaseError" class="space-y-3">
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
      ><form class="space-y-5" @submit.prevent="save">
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
              :to="`/releases/${id}${archived ? '?archived=true' : ''}`"
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
  <UCard v-else-if="releaseError" class="space-y-3">
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
