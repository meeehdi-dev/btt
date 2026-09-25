<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const id = route.params.id as string
const { data: client } = await useFetch(`/api/clients/${id}`, { query: { archived: 'true' } })
if (!client.value) throw createError({ status: 404, statusText: 'Client not found' })
const name = ref(client.value.name)
const color = ref(client.value.color)
const archived = ref(Boolean(client.value.archivedAt))
const pending = ref(false)
const errorMessage = ref('')

async function save() {
  pending.value = true
  errorMessage.value = ''
  try {
    await $fetch(`/api/clients/${id}`, {
      method: 'PATCH',
      body: { name: name.value, color: color.value, archived: archived.value },
    })
    await navigateTo(`/clients/${id}${archived.value ? '?archived=true' : ''}`)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to save client.'
  } finally {
    pending.value = false
  }
}

async function remove() {
  if (!confirm('Permanently delete this archived client?')) return
  try {
    await $fetch(`/api/clients/${id}`, { method: 'DELETE' })
    await navigateTo('/clients')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to delete client.'
  }
}
</script>

<template>
  <div class="w-full space-y-6">
    <div>
      <NuxtLink
        :to="`/clients/${id}${archived ? '?archived=true' : ''}`"
        class="inline-flex items-center gap-1 text-sm text-primary"
        >← <EntityIcon kind="clients" />Client</NuxtLink
      >
      <h1 class="mt-3 flex items-center gap-2 text-3xl font-semibold text-highlighted">
        <EntityIcon kind="clients" />Edit client
      </h1>
    </div>
    <UCard>
      <form class="space-y-5" @submit.prevent="save">
        <UFormField label="Name" required
          ><UInput v-model="name" class="w-full" autofocus
        /></UFormField>
        <UFormField label="Color" required>
          <ColorSelector v-model="color" />
        </UFormField>
        <UCheckbox v-model="archived" label="Archived" />
        <UAlert v-if="errorMessage" color="error" title="Could not save changes">{{
          errorMessage
        }}</UAlert>
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
              :to="`/clients/${id}${archived ? '?archived=true' : ''}`"
              color="neutral"
              variant="ghost"
              label="Cancel"
            /><UButton type="submit" :loading="pending" label="Save changes" />
          </div>
        </div>
      </form>
    </UCard>
  </div>
</template>
