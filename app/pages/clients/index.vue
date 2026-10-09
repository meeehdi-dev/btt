<script setup lang="ts">
import { trackAppApiFetch } from '~/composables/useAppDataInvalidation'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const showArchived = ref(false)
const clientsKey = computed(
  () => `app-api:clients:list:${showArchived.value ? 'archived' : 'active'}`,
)
const { data, pending, error, refresh } = await trackAppApiFetch(
  useApiFetch('/api/clients', {
    key: clientsKey,
    query: computed(() => ({ archived: showArchived.value ? 'true' : undefined })),
  }),
  { key: clientsKey, resources: ['clients', 'hierarchy', 'search'] },
)
const clients = computed(() => data.value?.clients ?? [])
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-2">
      <h1 class="text-2xl font-semibold text-highlighted">Clients</h1>
      <div class="flex items-center gap-2">
        <ArchiveFilterButton v-model="showArchived" />
        <UButton to="/clients/new" icon="lucide:plus" label="New client" />
      </div>
    </div>
    <UAlert
      v-if="error"
      role="alert"
      color="error"
      title="Could not load clients"
      :description="clientFailureMessage(error)"
    />
    <UButton
      v-if="error"
      variant="ghost"
      color="error"
      icon="lucide:refresh-cw"
      label="Retry"
      @click="refresh()"
    />
    <UCard v-if="pending"><p class="text-muted">Loading clients…</p></UCard>
    <UCard v-else-if="!error && !clients.length">
      <h2 class="font-medium text-highlighted">
        No {{ showArchived ? '' : 'active ' }}clients yet
      </h2>
      <p class="mt-2 text-muted">Create a client to start organizing work.</p>
    </UCard>
    <div v-else-if="!error" class="grid grid-cols-3 gap-2">
      <ClientCard v-for="item in clients" :key="item.id" :item="item" />
    </div>
  </div>
</template>
