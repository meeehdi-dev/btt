<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const route = useRoute()
const id = route.params.id as string
const archived = route.query.archived === 'true'
const { data: releaseData, error } = await useFetch(`/api/releases/${id}`, {
  query: { archived: archived ? 'true' : undefined },
})
const release = computed(() => releaseData.value?.release)
const projectName = computed(() => releaseData.value?.projectName ?? '')
if (error.value || !releaseData.value)
  throw createError({ status: 404, statusText: 'Release not found' })
</script>
<template>
  <div v-if="release" class="space-y-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <NuxtLink :to="`/projects/${release.projectId}`" class="text-sm text-primary"
          >← {{ projectName }}</NuxtLink
        >
        <div class="mt-3 flex items-center gap-3">
          <h1 class="text-3xl font-semibold text-highlighted">{{ release.name }}</h1>
          <UBadge v-if="release.archivedAt" color="neutral" variant="subtle">Archived</UBadge>
        </div>
        <div class="mt-2">
          <ReleaseTargetDate :target-date="release.targetDate" />
        </div>
      </div>
      <UButton
        :to="`/releases/${id}/edit${release.archivedAt ? '?archived=true' : ''}`"
        color="neutral"
        variant="outline"
        label="Edit"
      />
    </div>
    <UCard
      ><h2 class="font-medium text-highlighted">Ready for tickets</h2>
      <p class="mt-2 text-muted">Tickets will be connected to releases in M3.</p></UCard
    >
  </div>
</template>
