<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const route = useRoute()
const id = route.params.id as string
const { data: project } = await useFetch(`/api/projects/${id}`, { query: { archived: 'true' } })
if (!project.value) throw createError({ status: 404, statusText: 'Project not found' })
const name = ref(project.value.project.name)
const color = ref(project.value.project.color)
const archived = ref(Boolean(project.value.project.archivedAt))
const pending = ref(false)
const errorMessage = ref('')
async function save() {
  pending.value = true
  errorMessage.value = ''
  try {
    await $fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      body: { name: name.value, color: color.value, archived: archived.value },
    })
    await navigateTo(`/projects/${id}${archived.value ? '?archived=true' : ''}`)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to save project.'
  } finally {
    pending.value = false
  }
}
async function remove() {
  if (!confirm('Permanently delete this archived project?')) return
  try {
    await $fetch(`/api/projects/${id}`, { method: 'DELETE' })
    await navigateTo('/projects')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to delete project.'
  }
}
</script>
<template>
  <div class="mx-auto max-w-2xl space-y-6">
    <div>
      <NuxtLink
        :to="`/projects/${id}${archived ? '?archived=true' : ''}`"
        class="text-sm text-primary"
        >← Project</NuxtLink
      >
      <h1 class="mt-3 text-3xl font-semibold text-highlighted">Edit project</h1>
    </div>
    <UCard
      ><form class="space-y-5" @submit.prevent="save">
        <UFormField label="Name" required><UInput v-model="name" class="w-full" /></UFormField
        ><UFormField label="Color" required><ColorSelector v-model="color" /></UFormField
        ><UCheckbox v-model="archived" label="Archived" /><UAlert
          v-if="errorMessage"
          color="error"
          title="Could not save changes"
          >{{ errorMessage }}</UAlert
        >
        <div class="flex flex-wrap justify-between gap-3">
          <UButton
            v-if="archived"
            color="error"
            variant="ghost"
            label="Permanently delete"
            @click="remove"
          />
          <div class="ml-auto flex gap-3">
            <UButton
              :to="`/projects/${id}${archived ? '?archived=true' : ''}`"
              color="neutral"
              variant="ghost"
              label="Cancel"
            /><UButton type="submit" :loading="pending" label="Save changes" />
          </div>
        </div></form
    ></UCard>
  </div>
</template>
