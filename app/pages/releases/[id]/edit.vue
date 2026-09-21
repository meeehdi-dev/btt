<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
const route = useRoute()
const id = route.params.id as string
const { data: release } = await useFetch(`/api/releases/${id}`, { query: { archived: 'true' } })
if (!release.value) throw createError({ status: 404, statusText: 'Release not found' })
const name = ref(release.value.release.name)
const targetDate = ref(release.value.release.targetDate ?? '')
const archived = ref(Boolean(release.value.release.archivedAt))
const pending = ref(false)
const errorMessage = ref('')
async function save() {
  pending.value = true
  errorMessage.value = ''
  try {
    await $fetch(`/api/releases/${id}`, {
      method: 'PATCH',
      body: { name: name.value, targetDate: targetDate.value || null, archived: archived.value },
    })
    await navigateTo(`/releases/${id}${archived.value ? '?archived=true' : ''}`)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to save release.'
  } finally {
    pending.value = false
  }
}
async function remove() {
  if (!confirm('Permanently delete this archived release?')) return
  try {
    await $fetch(`/api/releases/${id}`, { method: 'DELETE' })
    await navigateTo('/projects')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to delete release.'
  }
}
</script>
<template>
  <div class="mx-auto max-w-2xl space-y-6">
    <div>
      <NuxtLink
        :to="`/releases/${id}${archived ? '?archived=true' : ''}`"
        class="text-sm text-primary"
        >← Release</NuxtLink
      >
      <h1 class="mt-3 text-3xl font-semibold text-highlighted">Edit release</h1>
    </div>
    <UCard
      ><form class="space-y-5" @submit.prevent="save">
        <UFormField label="Name" required><UInput v-model="name" class="w-full" /></UFormField
        ><UFormField label="Target date" hint="Optional"
          ><UInput v-model="targetDate" type="date" class="w-full" /></UFormField
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
              :to="`/releases/${id}${archived ? '?archived=true' : ''}`"
              color="neutral"
              variant="ghost"
              label="Cancel"
            /><UButton type="submit" :loading="pending" label="Save changes" />
          </div>
        </div></form
    ></UCard>
  </div>
</template>
