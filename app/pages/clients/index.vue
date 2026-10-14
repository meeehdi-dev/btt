<script setup lang="ts">
import { modalFormShortcutContent } from '~/composables/modal-form-shortcuts'
import { trackAppApiFetch, useAppDataInvalidation } from '~/composables/useAppDataInvalidation'
import { useAppToast } from '~/composables/useAppToast'

definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { invalidateMutation } = useAppDataInvalidation()
const { reportWrite } = useAppToast()
const showArchived = ref(false)
const createOpen = ref(false)
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

async function clientCreated(id: string) {
  createOpen.value = false
  const refreshed = await invalidateMutation('client')
  reportWrite(refreshed, {
    title: 'Client created.',
    duration: 10_000,
    open: { label: 'Open client', to: `/clients/${id}` },
  })
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-2">
      <h1 class="text-2xl font-semibold text-highlighted">Clients</h1>
      <div class="flex items-center gap-2">
        <ArchiveFilterButton v-model="showArchived" />
        <UModal
          v-model:open="createOpen"
          title="New client"
          description="Create a client without leaving this page."
          :content="modalFormShortcutContent()"
        >
          <UButton icon="lucide:plus" label="New client" />
          <template #body>
            <ClientCreateForm @created="clientCreated" @cancel="createOpen = false" />
          </template>
        </UModal>
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
