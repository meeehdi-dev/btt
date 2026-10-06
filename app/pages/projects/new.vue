<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const route = useRoute()
const {
  data: clientData,
  pending: clientsPending,
  error: clientsError,
  refresh: refreshClients,
} = await useApiFetch('/api/clients')
const clients = computed(() => clientData.value?.clients ?? [])
const clientSearchInput = useSelectSearchInput('Search clients…')
const clientPickerOpen = ref(false)
const clientId = ref(typeof route.query.client === 'string' ? route.query.client : '')
const name = ref('')
const color = ref('#3b82f6')
const pending = ref(false)
const errorMessage = ref('')

watch(
  [clients, clientsPending],
  ([available, loading]) => {
    if (!loading && !available.some((client) => client.id === clientId.value)) clientId.value = ''
  },
  { immediate: true },
)

const selectedClient = computed(() => clients.value.find((client) => client.id === clientId.value))
function selectClient(id: string) {
  clientId.value = id
  clientPickerOpen.value = false
}
const canSubmit = computed(() => clients.value.some((client) => client.id === clientId.value))
const cancelTo = computed(() =>
  selectedClient.value ? `/clients/${selectedClient.value.id}` : '/clients',
)

async function submit() {
  pending.value = true
  errorMessage.value = ''
  try {
    const result = await runClientRequest((signal) =>
      $fetch<{ id: string }>('/api/projects', {
        method: 'POST',
        body: { clientId: clientId.value, name: name.value, color: color.value },
        signal,
      }),
    )
    if (result._tag === 'Failure') {
      errorMessage.value = result.failure.userMessage
      return
    }
    await navigateTo(`/projects/${result.value.id}`)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="w-full space-y-4">
    <div>
      <HierarchyBreadcrumbs
        v-if="selectedClient"
        :ancestors="[
          {
            kind: 'clients',
            label: selectedClient.name,
            to: `/clients/${selectedClient.id}`,
          },
        ]"
        :current="{ kind: 'projects', label: 'New project' }"
      />
      <template v-else>
        <NuxtLink to="/clients" class="inline-flex items-center gap-1 text-sm text-primary"
          >← <EntityIcon kind="clients" />Clients</NuxtLink
        >
        <h1 class="mt-2 flex items-center gap-2 text-3xl font-semibold text-highlighted">
          <EntityIcon kind="projects" />New project
        </h1>
      </template>
    </div>
    <div v-if="clientsError" class="space-y-2">
      <UAlert
        role="alert"
        color="error"
        title="Could not load clients"
        :description="clientFailureMessage(clientsError)"
      />
      <UButton
        color="neutral"
        variant="outline"
        icon="lucide:refresh-cw"
        label="Retry loading clients"
        @click="refreshClients()"
      />
    </div>
    <UCard v-else-if="clientsPending">
      <p class="text-muted">Loading available clients…</p>
    </UCard>
    <UCard v-else-if="!clients.length">
      <h2 class="font-medium text-highlighted">Create a client first</h2>
      <p class="mt-2 text-muted">Projects must belong to an active client.</p>
      <UButton class="mt-2" to="/clients/new" icon="lucide:plus" label="Create client" />
    </UCard>
    <UCard v-else>
      <form class="space-y-3" @submit.prevent="submit">
        <UFormField label="Client" required>
          <USelectMenu
            :model-value="clientId"
            v-model:open="clientPickerOpen"
            value-key="value"
            :items="clients.map((client) => ({ label: client.name, value: client.id }))"
            :search-input="clientSearchInput"
            aria-label="Client"
            class="w-full"
            placeholder="Choose a client"
            @update:model-value="selectClient"
          />
        </UFormField>
        <UFormField label="Name" required>
          <UInput v-model="name" class="w-full" placeholder="Website redesign" />
        </UFormField>
        <UFormField label="Color" required>
          <ColorSelector v-model="color" />
        </UFormField>
        <UAlert v-if="errorMessage" role="alert" color="error" title="Could not create project">{{
          errorMessage
        }}</UAlert>
        <div class="flex justify-end gap-2">
          <UButton :to="cancelTo" color="neutral" variant="ghost" icon="lucide:x" label="Cancel" />
          <UButton
            type="submit"
            :disabled="!canSubmit"
            :loading="pending"
            icon="lucide:plus"
            label="Create project"
          />
        </div>
      </form>
    </UCard>
  </div>
</template>
